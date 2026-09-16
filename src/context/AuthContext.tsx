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
import {
  clearSession,
  getAccount,
  getSession,
  listAccounts,
  patchAccount,
  registerAccount,
  signInAccount,
  type LocalAccount,
  type RegisterInput,
} from '@/data/accounts';
import { normalizePhone } from '@/lib/phone';
import type { AppUser, Craft, PricingBasis, UserType } from '@/lib/types';

const LOCAL_MODE_KEY = 'herfah-pro:v1:local-mode';

export { normalizePhone };

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  /** true إذا كان التطبيق يعمل بدون Firebase (تخزين على الجهاز فقط). */
  localMode: boolean;
  firebaseAvailable: boolean;
  /** الحسابات المسجّلة على هذا الجهاز — تُعرض في شاشة الدخول. */
  accounts: LocalAccount[];
  /** إنشاء حساب على الجهاز بالهاتف أو البريد مع المهنة. */
  registerLocal: (input: RegisterInput) => Promise<void>;
  /** دخول بحساب مسجّل على الجهاز. */
  signInLocal: (ident: string, password: string) => Promise<void>;
  /** تحديث اسم الحساب ومهنته حين تتغيّر من الإعدادات. */
  updateLocalAccount: (patch: {
    displayName?: string;
    userType?: UserType;
    craft?: Craft;
    customCraft?: string;
    customMaterial?: string;
    customBasis?: PricingBasis;
  }) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  /** دخول بحساب Google — نافذة منبثقة مع رجوع إلى إعادة التوجيه إن مُنعت. */
  signInWithGoogle: () => Promise<void>;
  /** إرسال رمز التحقّق إلى رقم الهاتف. containerId عنصر reCAPTCHA غير المرئي. */
  sendPhoneCode: (phoneNumber: string, containerId: string) => Promise<void>;
  /** إتمام الدخول بالرمز المرسل إلى الهاتف. */
  confirmPhoneCode: (code: string) => Promise<void>;
  /** إلغاء عملية دخول الهاتف الجارية وتنظيف reCAPTCHA. */
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
  isAnonymous: user.isAnonymous,
  isLocal: false,
});

/** جلسة «بدون حساب»: مستخدم واحد ثابت لهذا الجهاز. */
const guestUser = (): AppUser => ({
  uid: getLocalUid(),
  email: null,
  displayName: null,
  phoneNumber: null,
  isAnonymous: false,
  isLocal: true,
  isGuest: true,
});

const accountUser = (account: LocalAccount): AppUser => ({
  uid: account.uid,
  email: account.kind === 'email' ? account.ident : null,
  displayName: account.displayName || null,
  phoneNumber: account.kind === 'phone' ? account.ident : null,
  isAnonymous: false,
  isLocal: true,
  isGuest: false,
  userType: account.userType,
  craft: account.craft,
  customCraft: account.customCraft,
  customMaterial: account.customMaterial,
  customBasis: account.customBasis,
});

/** المستخدم المحلي عند الإقلاع: صاحب الجلسة المحفوظة، أو لا أحد. */
const restoreLocalUser = (): AppUser | null => {
  const uid = getSession();
  if (!uid) return null;
  const account = getAccount(uid);
  return account ? accountUser(account) : null;
};

const GUEST_KEY = 'herfah-pro:v1:guest';

const readFlag = (key: string): boolean => {
  try {
    return window.localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
};

const writeFlag = (key: string, on: boolean): void => {
  try {
    if (on) window.localStorage.setItem(key, '1');
    else window.localStorage.removeItem(key);
  } catch {
    /* التخزين غير متاح، الوضع يبقى لهذه الجلسة فقط */
  }
};

const readLocalModeFlag = (): boolean => readFlag(LOCAL_MODE_KEY);
const writeLocalModeFlag = (on: boolean): void => {
  writeFlag(LOCAL_MODE_KEY, on);
};

const wrapError = (error: unknown): Error => {
  const code = (error as { code?: string })?.code;
  if (typeof code === 'string') return new Error(authErrorMessage(code));
  return error instanceof Error ? error : new Error('حدث خطأ غير متوقّع.');
};

/** حالة الإقلاع المحلية: حساب الجلسة، أو جلسة ضيف، أو لا أحد (فتُعرض شاشة الدخول). */
const initialLocalUser = (): AppUser | null =>
  restoreLocalUser() ?? (readFlag(GUEST_KEY) ? guestUser() : null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // بدون إعدادات Firebase يعمل التطبيق محلياً مباشرة.
  const [localMode, setLocalMode] = useState<boolean>(
    () => !isFirebaseConfigured || readLocalModeFlag(),
  );
  const [user, setUser] = useState<AppUser | null>(() =>
    !isFirebaseConfigured || readLocalModeFlag() ? initialLocalUser() : null,
  );
  const [loading, setLoading] = useState<boolean>(
    () => isFirebaseConfigured && !readLocalModeFlag(),
  );
  const [accounts, setAccounts] = useState<LocalAccount[]>(() => {
    try {
      return listAccounts();
    } catch {
      return [];
    }
  });

  // عمليات دخول الهاتف الجارية: متحقّق reCAPTCHA ونتيجة إرسال الرمز.
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);

  // إكمال الدخول بحساب Google عند العودة من إعادة التوجيه.
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
      if (trimmed) {
        await updateProfile(credential.user, { displayName: trimmed });
        setUser(toAppUser({ ...credential.user, displayName: trimmed } as User));
      }
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
      // بعض المتصفّحات (ومنها التطبيق المثبّت على iOS) تمنع النوافذ المنبثقة.
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
      /* المتحقّق أُزيل مسبقاً */
    }
    recaptchaRef.current = null;
  }, []);

  const sendPhoneCode = useCallback(
    async (phoneNumber: string, containerId: string) => {
      if (!auth) throw new Error('لم تُضبط إعدادات Firebase.');
      const normalized = normalizePhone(phoneNumber);
      if (!normalized) throw new Error(authErrorMessage('auth/invalid-phone-number'));
      try {
        // يُعاد إنشاء المتحقّق في كل محاولة، فاستعمال متحقّق مستهلَك يفشل.
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

  const registerLocal = useCallback(async (input: RegisterInput) => {
    const account = await registerAccount(input);
    writeFlag(GUEST_KEY, false);
    writeLocalModeFlag(true);
    setLocalMode(true);
    setAccounts(listAccounts());
    setUser(accountUser(account));
    setLoading(false);
  }, []);

  const signInLocal = useCallback(async (ident: string, password: string) => {
    const account = await signInAccount(ident, password);
    writeFlag(GUEST_KEY, false);
    writeLocalModeFlag(true);
    setLocalMode(true);
    setAccounts(listAccounts());
    setUser(accountUser(account));
    setLoading(false);
  }, []);

  // مُحدّث الحساب يكتب في التخزين، فلا يُشغَّل داخل مُحدِّث حالة (يُستدعى مرّتين في
  // StrictMode). يقرأ المستخدم الحالي من مرجع يتبع الحالة.
  const userRef = useRef<AppUser | null>(user);
  userRef.current = user;

  const updateLocalAccount = useCallback<AuthContextValue['updateLocalAccount']>((patch) => {
    const current = userRef.current;
    if (!current || !current.isLocal || current.isGuest) return;
    const updated = patchAccount(current.uid, patch);
    if (!updated) return;
    setAccounts(listAccounts());
    setUser(accountUser(updated));
  }, []);

  const useLocalAccount = useCallback(() => {
    writeFlag(GUEST_KEY, true);
    writeLocalModeFlag(true);
    setLocalMode(true);
    setUser(guestUser());
    setLoading(false);
  }, []);

  // تنظيف reCAPTCHA عند مغادرة الشاشة.
  useEffect(() => () => clearRecaptcha(), [clearRecaptcha]);

  const signOut = useCallback(async () => {
    cancelPhoneSignIn();
    // الخروج المحلي يُنهي الجلسة ويعيد شاشة الدخول، والبيانات تبقى محفوظة للحساب.
    clearSession();
    writeFlag(GUEST_KEY, false);
    setAccounts(listAccounts());
    if (isFirebaseConfigured && auth) {
      writeLocalModeFlag(false);
      await fbSignOut(auth).catch(() => undefined);
      setLocalMode(false);
    }
    setUser(null);
    setLoading(false);
  }, [cancelPhoneSignIn]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      localMode,
      firebaseAvailable: isFirebaseConfigured,
      accounts,
      registerLocal,
      signInLocal,
      updateLocalAccount,
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
      accounts,
      registerLocal,
      signInLocal,
      updateLocalAccount,
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
