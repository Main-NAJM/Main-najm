import { useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { APP_NAME } from '@/lib/constants';
import { TextInput } from '@/components/ui';

type Mode = 'signin' | 'signup' | 'phone';

/** معرّف عنصر reCAPTCHA غير المرئي الذي يشترطه الدخول برقم الهاتف. */
const RECAPTCHA_ID = 'recaptcha-container';

const TABS: { id: Mode; label: string }[] = [
  { id: 'signin', label: 'دخول' },
  { id: 'signup', label: 'حساب جديد' },
  { id: 'phone', label: 'بالهاتف' },
];

export default function Login() {
  const {
    signIn,
    signUp,
    resetPassword,
    signInWithGoogle,
    sendPhoneCode,
    confirmPhoneCode,
    cancelPhoneSignIn,
    useLocalAccount,
    firebaseAvailable,
  } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setInfo(null);
    if (next !== 'phone' && codeSent) {
      cancelPhoneSignIn();
      setCodeSent(false);
      setCode('');
    }
  };

  const run = async (action: () => Promise<void>, fallbackError: string) => {
    setError(null);
    setBusy(true);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : fallbackError);
    } finally {
      setBusy(false);
    }
  };

  const submitEmail = async (event: FormEvent) => {
    event.preventDefault();
    setInfo(null);
    if (!email.trim() || !password) {
      setError('أدخل البريد الإلكتروني وكلمة المرور.');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setError('كلمة المرور يجب أن تكون ٦ أحرف على الأقل.');
      return;
    }
    await run(
      () => (mode === 'signin' ? signIn(email, password) : signUp(name, email, password)),
      'تعذّر إتمام العملية.',
    );
  };

  const submitPhone = async (event: FormEvent) => {
    event.preventDefault();
    setInfo(null);
    if (!codeSent) {
      if (!phone.trim()) {
        setError('أدخل رقم هاتفك.');
        return;
      }
      await run(async () => {
        await sendPhoneCode(phone, RECAPTCHA_ID);
        setCodeSent(true);
        setInfo('أُرسل رمز التحقّق برسالة نصّية إلى هاتفك.');
      }, 'تعذّر إرسال رمز التحقّق.');
      return;
    }
    if (code.trim().length < 6) {
      setError('أدخل رمز التحقّق المكوّن من ٦ أرقام.');
      return;
    }
    await run(() => confirmPhoneCode(code), 'تعذّر تأكيد الرمز.');
  };

  const changeNumber = () => {
    cancelPhoneSignIn();
    setCodeSent(false);
    setCode('');
    setInfo(null);
    setError(null);
  };

  const forgot = async () => {
    setInfo(null);
    if (!email.trim()) {
      setError('أدخل بريدك الإلكتروني أولاً ثم اضغط «نسيت كلمة المرور».');
      return;
    }
    await run(async () => {
      await resetPassword(email);
      setInfo('أُرسل رابط إعادة تعيين كلمة المرور إلى بريدك.');
    }, 'تعذّر إرسال الرابط.');
  };

  return (
    <div className="auth">
      <div className="auth__card">
        <img className="auth__logo" src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="" />
        <h1 className="auth__title">{APP_NAME}</h1>
        <p className="auth__sub">إدارة الطلبيات والمواعيد والتكاليف والديون في مكان واحد</p>

        {firebaseAvailable ? (
          <>
            <div className="auth__tabs auth__tabs--three" role="tablist">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={mode === tab.id}
                  className={`auth__tab${mode === tab.id ? ' is-active' : ''}`}
                  onClick={() => switchMode(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {error ? <div className="auth__error">{error}</div> : null}
            {info ? <div className="notice notice--info">{info}</div> : null}

            {mode === 'phone' ? (
              <form onSubmit={submitPhone} noValidate>
                <TextInput
                  label="رقم الهاتف"
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={setPhone}
                  placeholder="0673232932"
                  hint="محلياً 0673232932 أو دولياً 00213673232932"
                  disabled={codeSent}
                />
                {codeSent ? (
                  <TextInput
                    label="رمز التحقّق"
                    type="text"
                    inputMode="numeric"
                    value={code}
                    onChange={setCode}
                    placeholder="123456"
                    hint="الرمز المرسل برسالة نصّية"
                  />
                ) : null}
                <button type="submit" className="btn btn--block mt-8" disabled={busy}>
                  {busy ? 'جارٍ…' : codeSent ? 'تأكيد الرمز والدخول' : 'إرسال رمز التحقّق'}
                </button>
                {codeSent ? (
                  <div style={{ textAlign: 'center' }}>
                    <button type="button" className="auth__link" onClick={changeNumber}>
                      تغيير الرقم أو إعادة الإرسال
                    </button>
                  </div>
                ) : null}
              </form>
            ) : (
              <form onSubmit={submitEmail} noValidate>
                {mode === 'signup' ? (
                  <TextInput
                    label="اسم صاحب العمل"
                    value={name}
                    onChange={setName}
                    placeholder="مثال: أبو علي"
                  />
                ) : null}
                <TextInput
                  label="البريد الإلكتروني"
                  type="email"
                  inputMode="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="name@example.com"
                />
                <TextInput
                  label="كلمة المرور"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  hint={mode === 'signup' ? '٦ أحرف على الأقل' : undefined}
                />
                <button type="submit" className="btn btn--block mt-8" disabled={busy}>
                  {busy ? 'جارٍ…' : mode === 'signin' ? 'دخول' : 'إنشاء الحساب'}
                </button>
              </form>
            )}

            {mode === 'signin' ? (
              <div style={{ textAlign: 'center' }}>
                <button type="button" className="auth__link" onClick={forgot}>
                  نسيت كلمة المرور؟
                </button>
              </div>
            ) : null}

            <div className="auth__divider">أو</div>

            <button
              type="button"
              className="btn btn--ghost btn--block auth__google"
              onClick={() => {
                void run(signInWithGoogle, 'تعذّر الدخول بحساب Google.');
              }}
              disabled={busy}
            >
              <svg viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                <path
                  fill="#4285F4"
                  d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
                />
                <path
                  fill="#34A853"
                  d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
                />
                <path
                  fill="#FBBC05"
                  d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
                />
                <path
                  fill="#EA4335"
                  d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
                />
              </svg>
              المتابعة بحساب Google
            </button>
          </>
        ) : (
          <div className="notice notice--info">
            إعدادات Firebase غير مضبوطة بعد، لذلك يعمل التطبيق الآن بالتخزين المحلي على هذا
            الجهاز. راجع ملف README لإضافة مشروع Firebase ومزامنة البيانات بين الأجهزة.
          </div>
        )}

        <button type="button" className="btn btn--ghost btn--block mt-8" onClick={useLocalAccount}>
          المتابعة بدون حساب (على هذا الجهاز)
        </button>
        <p className="small muted mt-8" style={{ textAlign: 'center' }}>
          في الوضع المحلي تُحفظ البيانات داخل المتصفّح فقط ولا تتزامن بين الأجهزة.
        </p>

        {/* عنصر reCAPTCHA غير المرئي — يشترطه Firebase قبل إرسال رسالة التحقّق. */}
        <div id={RECAPTCHA_ID} />
      </div>
    </div>
  );
}
