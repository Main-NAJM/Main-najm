import { useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { APP_NAME } from '@/lib/constants';
import { TextInput } from '@/components/ui';

type Mode = 'signin' | 'signup';

export default function Login() {
  const { signIn, signUp, resetPassword, useLocalAccount, firebaseAvailable } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setInfo(null);
    if (!email.trim() || !password) {
      setError('أدخل البريد الإلكتروني وكلمة المرور.');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setError('كلمة المرور يجب أن تكون ٦ أحرف على الأقل.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signin') await signIn(email, password);
      else await signUp(name, email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر إتمام العملية.');
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError('أدخل بريدك الإلكتروني أولاً ثم اضغط «نسيت كلمة المرور».');
      return;
    }
    try {
      await resetPassword(email);
      setInfo('أُرسل رابط إعادة تعيين كلمة المرور إلى بريدك.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر إرسال الرابط.');
    }
  };

  return (
    <div className="auth">
      <div className="auth__card">
        <img className="auth__logo" src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="" />
        <h1 className="auth__title">{APP_NAME}</h1>
        <p className="auth__sub">إدارة الطلبيات والمواعيد والتكاليف والديون في مكان واحد</p>

        {firebaseAvailable ? (
          <>
            <div className="auth__tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signin'}
                className={`auth__tab${mode === 'signin' ? ' is-active' : ''}`}
                onClick={() => {
                  setMode('signin');
                  setError(null);
                }}
              >
                تسجيل الدخول
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signup'}
                className={`auth__tab${mode === 'signup' ? ' is-active' : ''}`}
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
              >
                حساب جديد
              </button>
            </div>

            {error ? <div className="auth__error">{error}</div> : null}
            {info ? <div className="notice notice--info">{info}</div> : null}

            <form onSubmit={submit} noValidate>
              {mode === 'signup' ? (
                <TextInput label="اسم صاحب العمل" value={name} onChange={setName} placeholder="مثال: أبو علي" />
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

            {mode === 'signin' ? (
              <div style={{ textAlign: 'center' }}>
                <button type="button" className="auth__link" onClick={forgot}>
                  نسيت كلمة المرور؟
                </button>
              </div>
            ) : null}

            <div className="auth__divider">أو</div>
          </>
        ) : (
          <div className="notice notice--info">
            إعدادات Firebase غير مضبوطة بعد، لذلك يعمل التطبيق الآن بالتخزين المحلي على هذا
            الجهاز. راجع ملف README لإضافة مشروع Firebase ومزامنة البيانات بين الأجهزة.
          </div>
        )}

        <button type="button" className="btn btn--ghost btn--block" onClick={useLocalAccount}>
          المتابعة بدون حساب (على هذا الجهاز)
        </button>
        <p className="small muted mt-8" style={{ textAlign: 'center' }}>
          في الوضع المحلي تُحفظ البيانات داخل المتصفّح فقط ولا تتزامن بين الأجهزة.
        </p>
      </div>
    </div>
  );
}
