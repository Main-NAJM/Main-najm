import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  updateProfile,
  type ConfirmationResult,
  type User,
} from 'firebase/auth';
import { auth, authErrorMessage, isFirebaseConfigured } from '@/lib/firebase';
import { getLocalUid } from '@/data/localStore';
import type { AppUser } from '@/lib/types';

const LOCAL_MODE_KEY = 'albacha:v1:local-mode';
const DEFAULT_COUNTRY_CODE = '+213'; // الجزائر

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  localMode: boolean;
  firebaseAvailable: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  sendPhoneCode: (phoneNumber: string, containerId: string) => Promise<void>;
  confirmPhoneCode: (code: string) => Promise<void>;
  cancelPhoneSignIn: () => void;
  useLocalAccount: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const toAppUser = (user: User): AppUser => ({
  uid: user.uid,
  email: user.email,
  displayName: user.displayName,
  phoneNumber: user.phoneNumber,
  isLocal: false,
});

const localUser = (): AppUser => ({
  uid: getLocalUid(),
  email: null,
  displayName: null,
  phoneNumber: null,
  isLocal: true,
});

const readLocalModeFlag = (): boolean => {
  try {
    return window.localStorage.getItem(LOCAL_MODE_KEY) === '1';
  } catch {
    return false;
  }
};

const writeLocalModeFlag = (on: boolean): void => {
  try {
    if (on) window.localStorage.setItem(LOCAL_MODE_KEY, '1');
    else window.localStorage.removeItem(LOCAL_MODE_KEY);
  } catch {
    /* التخزين غير متاح */
  }
};

/** توحيد رقم الهاتف إلى الصيغة الدولية: 0673… و 00213673… و +213 673… */
export const normalizePhone = (input: string): string | null => {
  const compact = input.replace(/[\s()-]/g, '');
  if (!compact) return null;

  let value = compact;
  if (value.startsWith('00')) value = `+${value.slice(2)}`;
  else if (value.startsWith('0')) value = `${DEFAULT_COUNTRY_CODE}${value.slice(1)}`;
  else if (!value.startsWith('+')) value = `${DEFAULT_COUNTRY_CODE}${value}`;

  return /^\+\d{8,15}$/.test(value) ? value : null;
};

const wrapError = (error: unknown): Error => {
  const code = (error as { code?: string })?.code;
  if (typeof code === 'string') return new Error(authErrorMessage(code));
  return error instanceof Error ? error : new Error('حدث خطأ غير متوقّع.');
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [localMode, setLocalMode] = useState<boolean>(
    () => !isFirebaseConfigured || readLocalModeFlag(),
  );
  const [user, setUser] = useState<AppUser | null>(() =>
    !isFirebaseConfigured || readLocalModeFlag() ? localUser() : null,
  );
  const [loading, setLoading] = useState<boolean>(
    () => isFirebaseConfigured && !readLocalModeFlag(),
  );

  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);

  // إكمال دخول Google بعد العودة من إعادة التوجيه.
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return;
    getRedirectResult(auth).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth || localMode) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setUser(fbUser ? toAppUser(fbUser) : null);
      setLoading(false);
    });
    return unsubscribe;
  }, [localMode]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error('لم تُضبط إعدادات Firebase.');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      writeLocalModeFlag(false);
      setLocalMode(false);
    } catch (error) {
      throw wrapError(error);
    }
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    if (!auth) throw new Error('لم تُضبط إعدادات Firebase.');
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const trimmed = name.trim();
      if (trimmed) await updateProfile(credential.user, { displayName: trimmed });
      writeLocalModeFlag(false);
      setLocalMode(false);
    } catch (error) {
      throw wrapError(error);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!auth) throw new Error('لم تُضبط إعدادات Firebase.');
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (error) {
      throw wrapError(error);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!auth) throw new Error('لم تُضبط إعدادات Firebase.');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
      writeLocalModeFlag(false);
      setLocalMode(false);
    } catch (error) {
      const code = (error as { code?: string })?.code;
      // بعض المتصفّحات (والتطبيق المثبّت على iOS) تمنع النوافذ المنبثقة.
      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/operation-not-supported-in-this-environment'
      ) {
        writeLocalModeFlag(false);
        setLocalMode(false);
        await signInWithRedirect(auth, provider);
        return;
      }
      throw wrapError(error);
    }
  }, []);

  const clearRecaptcha = useCallback(() => {
    try {
      recaptchaRef.current?.clear();
    } catch {
      /* أُزيل مسبقاً */
    }
    recaptchaRef.current = null;
  }, []);

  const sendPhoneCode = useCallback(
    async (phoneNumber: string, containerId: string) => {
      if (!auth) throw new Error('لم تُضبط إعدادات Firebase.');
      const normalized = normalizePhone(phoneNumber);
      if (!normalized) throw new Error(authErrorMessage('auth/invalid-phone-number'));
      try {
        clearRecaptcha();
        const verifier = new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
        recaptchaRef.current = verifier;
        confirmationRef.current = await signInWithPhoneNumber(auth, normalized, verifier);
      } catch (error) {
        clearRecaptcha();
        confirmationRef.current = null;
        throw wrapError(error);
      }
    },
    [clearRecaptcha],
  );

  const confirmPhoneCode = useCallback(
    async (code: string) => {
      const confirmation = confirmationRef.current;
      if (!confirmation) throw new Error('اطلب رمز التحقّق أولاً.');
      try {
        await confirmation.confirm(code.trim());
        confirmationRef.current = null;
        clearRecaptcha();
        writeLocalModeFlag(false);
        setLocalMode(false);
      } catch (error) {
        throw wrapError(error);
      }
    },
    [clearRecaptcha],
  );

  const cancelPhoneSignIn = useCallback(() => {
    confirmationRef.current = null;
    clearRecaptcha();
  }, [clearRecaptcha]);

  useEffect(() => () => clearRecaptcha(), [clearRecaptcha]);

  const useLocalAccount = useCallback(() => {
    writeLocalModeFlag(true);
    setLocalMode(true);
    setUser(localUser());
    setLoading(false);
  }, []);

  const signOut = useCallback(async () => {
    writeLocalModeFlag(false);
    cancelPhoneSignIn();
    if (isFirebaseConfigured && auth) {
      await fbSignOut(auth).catch(() => undefined);
      setLocalMode(false);
      setUser(null);
    } else {
      setUser(localUser());
    }
  }, [cancelPhoneSignIn]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      localMode,
      firebaseAvailable: isFirebaseConfigured,
      signIn,
      signUp,
      resetPassword,
      signInWithGoogle,
      sendPhoneCode,
      confirmPhoneCode,
      cancelPhoneSignIn,
      useLocalAccount,
      signOut,
    }),
    [
      user,
      loading,
      localMode,
      signIn,
      signUp,
      resetPassword,
      signInWithGoogle,
      sendPhoneCode,
      confirmPhoneCode,
      cancelPhoneSignIn,
      useLocalAccount,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth يجب أن يُستخدم داخل AuthProvider.');
  return context;
};
