import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth, authErrorMessage, isFirebaseConfigured } from '@/lib/firebase';
import { getLocalUid } from '@/data/localStore';
import type { AppUser } from '@/lib/types';

const LOCAL_MODE_KEY = 'herfah-pro:v1:local-mode';

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  /** true إذا كان التطبيق يعمل بدون Firebase (تخزين على الجهاز فقط). */
  localMode: boolean;
  firebaseAvailable: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  useLocalAccount: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const toAppUser = (user: User): AppUser => ({
  uid: user.uid,
  email: user.email,
  displayName: user.displayName,
  isAnonymous: user.isAnonymous,
  isLocal: false,
});

const localUser = (): AppUser => ({
  uid: getLocalUid(),
  email: null,
  displayName: null,
  isAnonymous: false,
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
    /* التخزين غير متاح، الوضع يبقى لهذه الجلسة فقط */
  }
};

const wrapError = (error: unknown): Error => {
  const code = (error as { code?: string })?.code;
  if (typeof code === 'string') return new Error(authErrorMessage(code));
  return error instanceof Error ? error : new Error('حدث خطأ غير متوقّع.');
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // بدون إعدادات Firebase يعمل التطبيق محلياً مباشرة.
  const [localMode, setLocalMode] = useState<boolean>(
    () => !isFirebaseConfigured || readLocalModeFlag(),
  );
  const [user, setUser] = useState<AppUser | null>(() =>
    !isFirebaseConfigured || readLocalModeFlag() ? localUser() : null,
  );
  const [loading, setLoading] = useState<boolean>(
    () => isFirebaseConfigured && !readLocalModeFlag(),
  );

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

  const useLocalAccount = useCallback(() => {
    writeLocalModeFlag(true);
    setLocalMode(true);
    setUser(localUser());
    setLoading(false);
  }, []);

  const signOut = useCallback(async () => {
    writeLocalModeFlag(false);
    if (isFirebaseConfigured && auth) {
      await fbSignOut(auth).catch(() => undefined);
      setLocalMode(false);
      setUser(null);
    } else {
      // بدون Firebase لا يوجد خروج فعلي؛ يبقى الحساب المحلي.
      setUser(localUser());
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      localMode,
      firebaseAvailable: isFirebaseConfigured,
      signIn,
      signUp,
      resetPassword,
      useLocalAccount,
      signOut,
    }),
    [user, loading, localMode, signIn, signUp, resetPassword, useLocalAccount, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth يجب أن يُستخدم داخل AuthProvider.');
  return context;
};
