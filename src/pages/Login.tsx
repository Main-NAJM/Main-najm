import { useMemo, useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { APP_NAME } from '@/lib/constants';
import { formatPhone } from '@/lib/phone';
import { TRADE_CHOICES, tradeChoice } from '@/lib/trades';
import { TextInput } from '@/components/ui';
import type { Craft, UserType } from '@/lib/types';

/** معرّف عنصر reCAPTCHA غير المرئي الذي يشترطه الدخول برقم الهاتف. */
const RECAPTCHA_ID = 'recaptcha-container';

type View = 'signin' | 'signup' | 'cloud';

export default function Login() {
  const {
    accounts,
    registerLocal,
    signInLocal,
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

  const [view, setView] = useState<View>(() => (accounts.length > 0 ? 'signin' : 'signup'));
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const go = (next: View) => {
    setView(next);
    setError(null);
    setInfo(null);
  };

  const run = async (action: () => Promise<void>, fallback: string) => {
    setError(null);
    setBusy(true);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : fallback);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth__card">
        <img className="auth__logo" src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="" />
        <h1 className="auth__title">{APP_NAME}</h1>
        <p className="auth__sub">إدارة الطلبيات والمواعيد والتكاليف والديون في مكان واحد</p>

        <div className="auth__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'signin'}
            className={`auth__tab${view === 'signin' ? ' is-active' : ''}`}
            onClick={() => {
              go('signin');
            }}
          >
            دخول
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'signup'}
            className={`auth__tab${view === 'signup' ? ' is-active' : ''}`}
            onClick={() => {
              go('signup');
            }}
          >
            حساب جديد
          </button>
        </div>

        {error ? <div className="auth__error">{error}</div> : null}
        {info ? <div className="notice notice--info">{info}</div> : null}

        {view === 'signin' ? (
          <SignInForm
            accounts={accounts}
            busy={busy}
            onSubmit={(ident, password) =>
              run(() => signInLocal(ident, password), 'تعذّر الدخول.')
            }
            onNoAccount={() => {
              go('signup');
            }}
          />
        ) : null}

        {view === 'signup' ? (
          <SignUpFlow
            busy={busy}
            onSubmit={(input) => run(() => registerLocal(input), 'تعذّر إنشاء الحساب.')}
          />
        ) : null}

        {view === 'cloud' && firebaseAvailable ? (
          <CloudForms
            busy={busy}
            run={run}
            setInfo={setInfo}
            setError={setError}
            signIn={signIn}
            signUp={signUp}
            resetPassword={resetPassword}
            signInWithGoogle={signInWithGoogle}
            sendPhoneCode={sendPhoneCode}
            confirmPhoneCode={confirmPhoneCode}
            cancelPhoneSignIn={cancelPhoneSignIn}
          />
        ) : null}

        <div className="auth__foot">
          {firebaseAvailable ? (
            <button
              type="button"
              className="auth__link"
              onClick={() => {
                go(view === 'cloud' ? 'signin' : 'cloud');
              }}
            >
              {view === 'cloud' ? 'الرجوع إلى حساب الجهاز' : 'الدخول بحساب سحابي (مزامنة بين الأجهزة)'}
            </button>
          ) : null}
          <button type="button" className="auth__link" onClick={useLocalAccount}>
            المتابعة بدون حساب
          </button>
        </div>

        <p className="auth__note">
          {firebaseAvailable
            ? 'حساب الجهاز يحفظ بياناتك على هذا الهاتف وحده. للمزامنة بين الأجهزة استعمل الحساب السحابي.'
            : 'الحساب والبيانات محفوظة على هذا الجهاز ولا تُرسل إلى أي مكان. احتفظ بنسخة احتياطية من الإعدادات.'}
        </p>

        {/* عنصر reCAPTCHA غير المرئي — يشترطه Firebase قبل إرسال رسالة التحقّق. */}
        <div id={RECAPTCHA_ID} />
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- الدخول */

function SignInForm({
  accounts,
  busy,
  onSubmit,
  onNoAccount,
}: {
  accounts: { uid: string; ident: string; kind: string; displayName: string; craft: Craft }[];
  busy: boolean;
  onSubmit: (ident: string, password: string) => Promise<void>;
  onNoAccount: () => void;
}) {
  const [ident, setIdent] = useState(() => accounts[0]?.ident ?? '');
  const [password, setPassword] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void onSubmit(ident, password);
  };

  return (
    <form onSubmit={submit} noValidate>
      {accounts.length > 0 ? (
        <div className="auth__accounts">
          {accounts.map((account) => (
            <button
              key={account.uid}
              type="button"
              className={`auth__account${ident === account.ident ? ' is-active' : ''}`}
              onClick={() => {
                setIdent(account.ident);
              }}
            >
              <span className="auth__account-name">{account.displayName || 'حساب'}</span>
              <span className="auth__account-ident">
                {account.kind === 'phone' ? formatPhone(account.ident) : account.ident}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      <TextInput
        label="رقم الهاتف أو البريد الإلكتروني"
        value={ident}
        onChange={setIdent}
        placeholder="0673232932"
        hint="نفس ما سجّلت به"
        dir="ltr"
      />
      <TextInput label="كلمة المرور" type="password" value={password} onChange={setPassword} />
      <button type="submit" className="btn btn--block mt-8" disabled={busy}>
        {busy ? 'جارٍ…' : 'دخول'}
      </button>

      {accounts.length === 0 ? (
        <p className="auth__note">
          لا يوجد حساب على هذا الجهاز بعد.{' '}
          <button type="button" className="auth__link" onClick={onNoAccount}>
            أنشئ حساباً الآن
          </button>
        </p>
      ) : null}
    </form>
  );
}

/* ---------------------------------------------------------- حساب جديد */

interface SignUpValues {
  name: string;
  ident: string;
  password: string;
  userType: UserType;
  craft: Craft;
}

function SignUpFlow({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (input: SignUpValues) => Promise<void>;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [ident, setIdent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [userType, setUserType] = useState<UserType>('craftsman');
  const [craft, setCraft] = useState<Craft>('carpenter');
  const [stepError, setStepError] = useState<string | null>(null);

  const chosen = useMemo(() => tradeChoice(userType, craft), [userType, craft]);

  const next = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setStepError('اكتب اسمك أو اسم ورشتك.');
      return;
    }
    if (!ident.trim()) {
      setStepError('أدخل رقم هاتفك أو بريدك الإلكتروني.');
      return;
    }
    if (password.length < 4) {
      setStepError('كلمة المرور يجب أن تكون ٤ خانات على الأقل.');
      return;
    }
    if (password !== confirm) {
      setStepError('كلمتا المرور غير متطابقتين.');
      return;
    }
    setStepError(null);
    setStep(2);
  };

  const finish = (event: FormEvent) => {
    event.preventDefault();
    void onSubmit({ name, ident, password, userType, craft });
  };

  return (
    <>
      <ol className="auth__steps" aria-label="خطوات إنشاء الحساب">
        <li className={step === 1 ? 'is-active' : 'is-done'}>حسابك</li>
        <li className={step === 2 ? 'is-active' : ''}>مهنتك</li>
      </ol>

      {stepError ? <div className="auth__error">{stepError}</div> : null}

      {step === 1 ? (
        <form onSubmit={next} noValidate>
          <TextInput
            label="الاسم أو اسم الورشة"
            value={name}
            onChange={setName}
            placeholder="مثال: نجارة أبو علي"
          />
          <TextInput
            label="رقم الهاتف أو البريد الإلكتروني"
            value={ident}
            onChange={setIdent}
            placeholder="0673232932"
            hint="يكفي أحدهما — وهو ما تدخل به لاحقاً"
            dir="ltr"
          />
          <TextInput
            label="كلمة المرور"
            type="password"
            value={password}
            onChange={setPassword}
            hint="٤ خانات على الأقل"
          />
          <TextInput
            label="تأكيد كلمة المرور"
            type="password"
            value={confirm}
            onChange={setConfirm}
          />
          <button type="submit" className="btn btn--block mt-8">
            التالي: اختيار المهنة
          </button>
        </form>
      ) : (
        <form onSubmit={finish} noValidate>
          <div className="trade-switch" role="group" aria-label="نوع العمل">
            <button
              type="button"
              className={`trade-switch__btn${userType === 'craftsman' ? ' is-active' : ''}`}
              onClick={() => {
                setUserType('craftsman');
              }}
            >
              حرفي
            </button>
            <button
              type="button"
              className={`trade-switch__btn${userType === 'merchant' ? ' is-active' : ''}`}
              onClick={() => {
                setUserType('merchant');
              }}
            >
              تاجر
            </button>
          </div>

          <p className="trade-q">{userType === 'merchant' ? 'بماذا تتاجر؟' : 'ما حرفتك؟'}</p>

          <div className="trade-grid">
            {TRADE_CHOICES.map((choice) => {
              // نفس أيقونة المادة للحرفي والتاجر: الأربع متمايزة، والعنوان يوضّح الباقي.
              const Icon = choice.Icon;
              const active = craft === choice.craft;
              return (
                <button
                  key={choice.craft}
                  type="button"
                  className={`trade-card${active ? ' is-active' : ''}`}
                  aria-pressed={active}
                  onClick={() => {
                    setCraft(choice.craft);
                  }}
                >
                  <Icon className="trade-card__icon" width={26} height={26} />
                  <span className="trade-card__label">
                    {userType === 'merchant' ? choice.merchantLabel : choice.craftLabel}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="trade-preview">
            <span className="trade-preview__head">سيفتح التطبيق على</span>
            <ul>
              {chosen.prepares.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          <button type="submit" className="btn btn--block mt-8" disabled={busy}>
            {busy ? 'جارٍ…' : 'إنشاء الحساب وفتح التطبيق'}
          </button>
          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              className="auth__link"
              onClick={() => {
                setStep(1);
              }}
            >
              رجوع
            </button>
          </div>
        </form>
      )}
    </>
  );
}

/* ------------------------------------------------ الحساب السحابي (Firebase) */

type Runner = (action: () => Promise<void>, fallback: string) => Promise<void>;

function CloudForms({
  busy,
  run,
  setInfo,
  setError,
  signIn,
  signUp,
  resetPassword,
  signInWithGoogle,
  sendPhoneCode,
  confirmPhoneCode,
  cancelPhoneSignIn,
}: {
  busy: boolean;
  run: Runner;
  setInfo: (value: string | null) => void;
  setError: (value: string | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  sendPhoneCode: (phone: string, containerId: string) => Promise<void>;
  confirmPhoneCode: (code: string) => Promise<void>;
  cancelPhoneSignIn: () => void;
}) {
  const [mode, setMode] = useState<'email' | 'phone'>('email');
  const [isNew, setIsNew] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  const submitEmail = (event: FormEvent) => {
    event.preventDefault();
    setInfo(null);
    if (!email.trim() || !password) {
      setError('أدخل البريد الإلكتروني وكلمة المرور.');
      return;
    }
    if (isNew && password.length < 6) {
      setError('كلمة المرور يجب أن تكون ٦ أحرف على الأقل.');
      return;
    }
    void run(
      () => (isNew ? signUp(name, email, password) : signIn(email, password)),
      'تعذّر إتمام العملية.',
    );
  };

  const submitPhone = (event: FormEvent) => {
    event.preventDefault();
    setInfo(null);
    if (!codeSent) {
      if (!phone.trim()) {
        setError('أدخل رقم هاتفك.');
        return;
      }
      void run(async () => {
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
    void run(() => confirmPhoneCode(code), 'تعذّر تأكيد الرمز.');
  };

  return (
    <>
      <div className="auth__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'email'}
          className={`auth__tab${mode === 'email' ? ' is-active' : ''}`}
          onClick={() => {
            setMode('email');
          }}
        >
          بالبريد
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'phone'}
          className={`auth__tab${mode === 'phone' ? ' is-active' : ''}`}
          onClick={() => {
            setMode('phone');
            if (codeSent) {
              cancelPhoneSignIn();
              setCodeSent(false);
              setCode('');
            }
          }}
        >
          بالهاتف
        </button>
      </div>

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
            dir="ltr"
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
              <button
                type="button"
                className="auth__link"
                onClick={() => {
                  cancelPhoneSignIn();
                  setCodeSent(false);
                  setCode('');
                  setInfo(null);
                  setError(null);
                }}
              >
                تغيير الرقم أو إعادة الإرسال
              </button>
            </div>
          ) : null}
        </form>
      ) : (
        <form onSubmit={submitEmail} noValidate>
          {isNew ? (
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
            dir="ltr"
          />
          <TextInput
            label="كلمة المرور"
            type="password"
            value={password}
            onChange={setPassword}
            hint={isNew ? '٦ أحرف على الأقل' : undefined}
          />
          <button type="submit" className="btn btn--block mt-8" disabled={busy}>
            {busy ? 'جارٍ…' : isNew ? 'إنشاء الحساب السحابي' : 'دخول'}
          </button>
          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              className="auth__link"
              onClick={() => {
                setIsNew((value) => !value);
                setError(null);
              }}
            >
              {isNew ? 'لديّ حساب سحابي' : 'إنشاء حساب سحابي جديد'}
            </button>
            {!isNew ? (
              <button
                type="button"
                className="auth__link"
                onClick={() => {
                  setInfo(null);
                  if (!email.trim()) {
                    setError('أدخل بريدك الإلكتروني أولاً.');
                    return;
                  }
                  void run(async () => {
                    await resetPassword(email);
                    setInfo('أُرسل رابط إعادة تعيين كلمة المرور إلى بريدك.');
                  }, 'تعذّر إرسال الرابط.');
                }}
              >
                نسيت كلمة المرور؟
              </button>
            ) : null}
          </div>
        </form>
      )}

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
  );
}
