/**
 * تهيئة Firebase.
 *
 * إذا لم تُضبط متغيّرات البيئة (ملف .env.local) يعمل التطبيق في «الوضع المحلي»
 * ويحفظ كل البيانات في متصفّح الجهاز، بحيث يمكن تجربته قبل إعداد Firebase.
 */
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';

const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: env.VITE_FIREBASE_APP_ID as string | undefined,
};

const required: (keyof typeof firebaseConfig)[] = [
  'apiKey',
  'authDomain',
  'projectId',
  'appId',
];

export const isFirebaseConfigured: boolean = required.every((key) => {
  const value = firebaseConfig[key];
  return typeof value === 'string' && value.length > 0 && !value.startsWith('your-');
});

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig as Required<typeof firebaseConfig>);
  authInstance = getAuth(app);
  // ذاكرة تخزين دائمة حتى يعمل التطبيق دون اتصال بالإنترنت.
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
}

export const firebaseApp = app;
export const auth = authInstance;
export const db = dbInstance;

/** رسائل أخطاء Firebase Auth بالعربية. */
export const authErrorMessage = (code: string): string => {
  const messages: Record<string, string> = {
    'auth/invalid-email': 'صيغة البريد الإلكتروني غير صحيحة.',
    'auth/user-disabled': 'هذا الحساب موقوف.',
    'auth/user-not-found': 'لا يوجد حساب بهذا البريد.',
    'auth/wrong-password': 'كلمة المرور غير صحيحة.',
    'auth/invalid-credential': 'البريد أو كلمة المرور غير صحيحة.',
    'auth/email-already-in-use': 'هذا البريد مسجّل مسبقاً.',
    'auth/weak-password': 'كلمة المرور ضعيفة، استخدم ٦ أحرف على الأقل.',
    'auth/too-many-requests': 'محاولات كثيرة، انتظر قليلاً ثم أعد المحاولة.',
    'auth/network-request-failed': 'تعذّر الاتصال بالشبكة.',
    'auth/operation-not-allowed': 'طريقة الدخول هذه غير مفعّلة في مشروع Firebase.',
    // الدخول بحساب Google
    'auth/popup-closed-by-user': 'أُغلقت نافذة Google قبل إتمام الدخول.',
    'auth/cancelled-popup-request': 'أُلغيت محاولة الدخول السابقة.',
    'auth/popup-blocked': 'منع المتصفّح نافذة Google، اسمح بالنوافذ المنبثقة وأعد المحاولة.',
    'auth/account-exists-with-different-credential':
      'هذا البريد مسجّل بطريقة دخول أخرى، ادخل بها أولاً.',
    'auth/unauthorized-domain': 'هذا النطاق غير مصرّح به في إعدادات Firebase Authentication.',
    // الدخول برقم الهاتف
    'auth/invalid-phone-number': 'رقم الهاتف غير صحيح، اكتبه بصيغة +213XXXXXXXXX.',
    'auth/missing-phone-number': 'أدخل رقم الهاتف.',
    'auth/invalid-verification-code': 'رمز التحقّق غير صحيح.',
    'auth/code-expired': 'انتهت صلاحية الرمز، اطلب رمزاً جديداً.',
    'auth/missing-verification-code': 'أدخل رمز التحقّق المرسل إليك.',
    'auth/captcha-check-failed': 'فشل التحقّق من reCAPTCHA، أعد المحاولة.',
    'auth/quota-exceeded': 'تجاوزت حصّة الرسائل اليومية، حاول لاحقاً.',
    'auth/billing-not-enabled': 'الدخول بالهاتف يحتاج تفعيل الفوترة في مشروع Firebase.',
  };
  return messages[code] ?? 'حدث خطأ غير متوقّع، أعد المحاولة.';
};
