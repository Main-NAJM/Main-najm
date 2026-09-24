import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { APP_NAME, PRICING_BASES } from '@/lib/constants';
import { formatPhone } from '@/lib/phone';
import { TRADE_CHOICES, tradeChoice } from '@/lib/trades';
import { Select, TextInput } from '@/components/ui';
/** معرّف عنصر reCAPTCHA غير المرئي الذي يشترطه الدخول برقم الهاتف. */
const RECAPTCHA_ID = 'recaptcha-container';
export default function Login() {
    const { accounts, registerLocal, signInLocal, signIn, signUp, resetPassword, signInWithGoogle, sendPhoneCode, confirmPhoneCode, cancelPhoneSignIn, useLocalAccount, firebaseAvailable, } = useAuth();
    const [view, setView] = useState(() => (accounts.length > 0 ? 'signin' : 'signup'));
    const [error, setError] = useState(null);
    const [info, setInfo] = useState(null);
    const [busy, setBusy] = useState(false);
    const go = (next) => {
        setView(next);
        setError(null);
        setInfo(null);
    };
    const run = async (action, fallback) => {
        setError(null);
        setBusy(true);
        try {
            await action();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : fallback);
        }
        finally {
            setBusy(false);
        }
    };
    return (_jsx("div", { className: "auth", children: _jsxs("div", { className: "auth__card", children: [_jsx("img", { className: "auth__logo", src: `${import.meta.env.BASE_URL}icons/icon-192.png`, alt: "" }), _jsx("h1", { className: "auth__title", children: APP_NAME }), _jsx("p", { className: "auth__sub", children: "\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0637\u0644\u0628\u064A\u0627\u062A \u0648\u0627\u0644\u0645\u0648\u0627\u0639\u064A\u062F \u0648\u0627\u0644\u062A\u0643\u0627\u0644\u064A\u0641 \u0648\u0627\u0644\u062F\u064A\u0648\u0646 \u0641\u064A \u0645\u0643\u0627\u0646 \u0648\u0627\u062D\u062F" }), _jsxs("div", { className: "auth__tabs", role: "tablist", children: [_jsx("button", { type: "button", role: "tab", "aria-selected": view === 'signin', className: `auth__tab${view === 'signin' ? ' is-active' : ''}`, onClick: () => {
                                go('signin');
                            }, children: "\u062F\u062E\u0648\u0644" }), _jsx("button", { type: "button", role: "tab", "aria-selected": view === 'signup', className: `auth__tab${view === 'signup' ? ' is-active' : ''}`, onClick: () => {
                                go('signup');
                            }, children: "\u062D\u0633\u0627\u0628 \u062C\u062F\u064A\u062F" })] }), error ? _jsx("div", { className: "auth__error", children: error }) : null, info ? _jsx("div", { className: "notice notice--info", children: info }) : null, view === 'signin' ? (_jsx(SignInForm, { accounts: accounts, busy: busy, onSubmit: (ident, password) => run(() => signInLocal(ident, password), 'تعذّر الدخول.'), onNoAccount: () => {
                        go('signup');
                    } })) : null, view === 'signup' ? (_jsx(SignUpFlow, { busy: busy, onSubmit: (input) => run(() => registerLocal(input), 'تعذّر إنشاء الحساب.') })) : null, view === 'cloud' && firebaseAvailable ? (_jsx(CloudForms, { busy: busy, run: run, setInfo: setInfo, setError: setError, signIn: signIn, signUp: signUp, resetPassword: resetPassword, signInWithGoogle: signInWithGoogle, sendPhoneCode: sendPhoneCode, confirmPhoneCode: confirmPhoneCode, cancelPhoneSignIn: cancelPhoneSignIn })) : null, _jsxs("div", { className: "auth__foot", children: [firebaseAvailable ? (_jsx("button", { type: "button", className: "auth__link", onClick: () => {
                                go(view === 'cloud' ? 'signin' : 'cloud');
                            }, children: view === 'cloud' ? 'الرجوع إلى حساب الجهاز' : 'الدخول بحساب سحابي (مزامنة بين الأجهزة)' })) : null, _jsx("button", { type: "button", className: "auth__link", onClick: useLocalAccount, children: "\u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0628\u062F\u0648\u0646 \u062D\u0633\u0627\u0628" })] }), _jsx("p", { className: "auth__note", children: firebaseAvailable
                        ? 'حساب الجهاز يحفظ بياناتك على هذا الهاتف وحده. للمزامنة بين الأجهزة استعمل الحساب السحابي.'
                        : 'الحساب والبيانات محفوظة على هذا الجهاز ولا تُرسل إلى أي مكان. احتفظ بنسخة احتياطية من الإعدادات.' }), _jsx("div", { id: RECAPTCHA_ID })] }) }));
}
/* --------------------------------------------------------------- الدخول */
function SignInForm({ accounts, busy, onSubmit, onNoAccount, }) {
    const [ident, setIdent] = useState(() => accounts[0]?.ident ?? '');
    const [password, setPassword] = useState('');
    const submit = (event) => {
        event.preventDefault();
        void onSubmit(ident, password);
    };
    return (_jsxs("form", { onSubmit: submit, noValidate: true, children: [accounts.length > 0 ? (_jsx("div", { className: "auth__accounts", children: accounts.map((account) => (_jsxs("button", { type: "button", className: `auth__account${ident === account.ident ? ' is-active' : ''}`, onClick: () => {
                        setIdent(account.ident);
                    }, children: [_jsx("span", { className: "auth__account-name", children: account.displayName || 'حساب' }), _jsx("span", { className: "auth__account-ident", children: account.kind === 'phone' ? formatPhone(account.ident) : account.ident })] }, account.uid))) })) : null, _jsx(TextInput, { label: "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641 \u0623\u0648 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A", value: ident, onChange: setIdent, placeholder: "0673232932", hint: "\u0646\u0641\u0633 \u0645\u0627 \u0633\u062C\u0651\u0644\u062A \u0628\u0647", dir: "ltr" }), _jsx(TextInput, { label: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631", type: "password", value: password, onChange: setPassword }), _jsx("button", { type: "submit", className: "btn btn--block mt-8", disabled: busy, children: busy ? 'جارٍ…' : 'دخول' }), accounts.length === 0 ? (_jsxs("p", { className: "auth__note", children: ["\u0644\u0627 \u064A\u0648\u062C\u062F \u062D\u0633\u0627\u0628 \u0639\u0644\u0649 \u0647\u0630\u0627 \u0627\u0644\u062C\u0647\u0627\u0632 \u0628\u0639\u062F.", ' ', _jsx("button", { type: "button", className: "auth__link", onClick: onNoAccount, children: "\u0623\u0646\u0634\u0626 \u062D\u0633\u0627\u0628\u0627\u064B \u0627\u0644\u0622\u0646" })] })) : null] }));
}
function SignUpFlow({ busy, onSubmit, }) {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [ident, setIdent] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [userType, setUserType] = useState('craftsman');
    const [craft, setCraft] = useState('carpenter');
    const [customCraft, setCustomCraft] = useState('');
    const [customMaterial, setCustomMaterial] = useState('');
    const [customBasis, setCustomBasis] = useState('unit');
    const [stepError, setStepError] = useState(null);
    const isCustom = craft === 'other';
    const chosen = useMemo(() => tradeChoice({ userType, craft, customCraft, customMaterial, customBasis }), [userType, craft, customCraft, customMaterial, customBasis]);
    const next = (event) => {
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
    const finish = (event) => {
        event.preventDefault();
        if (craft === 'other' && !customCraft.trim()) {
            setStepError('اكتب اسم مهنتك، أو اختر واحدة من المهن أعلاه.');
            return;
        }
        setStepError(null);
        void onSubmit({
            name,
            ident,
            password,
            userType,
            craft,
            customCraft,
            customMaterial,
            customBasis,
        });
    };
    return (_jsxs(_Fragment, { children: [_jsxs("ol", { className: "auth__steps", "aria-label": "\u062E\u0637\u0648\u0627\u062A \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062D\u0633\u0627\u0628", children: [_jsx("li", { className: step === 1 ? 'is-active' : 'is-done', children: "\u062D\u0633\u0627\u0628\u0643" }), _jsx("li", { className: step === 2 ? 'is-active' : '', children: "\u0645\u0647\u0646\u062A\u0643" })] }), stepError ? _jsx("div", { className: "auth__error", children: stepError }) : null, step === 1 ? (_jsxs("form", { onSubmit: next, noValidate: true, children: [_jsx(TextInput, { label: "\u0627\u0644\u0627\u0633\u0645 \u0623\u0648 \u0627\u0633\u0645 \u0627\u0644\u0648\u0631\u0634\u0629", value: name, onChange: setName, placeholder: "\u0645\u062B\u0627\u0644: \u0646\u062C\u0627\u0631\u0629 \u0623\u0628\u0648 \u0639\u0644\u064A" }), _jsx(TextInput, { label: "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641 \u0623\u0648 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A", value: ident, onChange: setIdent, placeholder: "0673232932", hint: "\u064A\u0643\u0641\u064A \u0623\u062D\u062F\u0647\u0645\u0627 \u2014 \u0648\u0647\u0648 \u0645\u0627 \u062A\u062F\u062E\u0644 \u0628\u0647 \u0644\u0627\u062D\u0642\u0627\u064B", dir: "ltr" }), _jsx(TextInput, { label: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631", type: "password", value: password, onChange: setPassword, hint: "\u0664 \u062E\u0627\u0646\u0627\u062A \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644" }), _jsx(TextInput, { label: "\u062A\u0623\u0643\u064A\u062F \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631", type: "password", value: confirm, onChange: setConfirm }), _jsx("button", { type: "submit", className: "btn btn--block mt-8", children: "\u0627\u0644\u062A\u0627\u0644\u064A: \u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0645\u0647\u0646\u0629" })] })) : (_jsxs("form", { onSubmit: finish, noValidate: true, children: [_jsxs("div", { className: "trade-switch", role: "group", "aria-label": "\u0646\u0648\u0639 \u0627\u0644\u0639\u0645\u0644", children: [_jsx("button", { type: "button", className: `trade-switch__btn${userType === 'craftsman' ? ' is-active' : ''}`, onClick: () => {
                                    setUserType('craftsman');
                                }, children: "\u062D\u0631\u0641\u064A" }), _jsx("button", { type: "button", className: `trade-switch__btn${userType === 'merchant' ? ' is-active' : ''}`, onClick: () => {
                                    setUserType('merchant');
                                }, children: "\u062A\u0627\u062C\u0631" })] }), _jsx("p", { className: "trade-q", children: userType === 'merchant' ? 'بماذا تتاجر؟' : 'ما حرفتك؟' }), _jsx("div", { className: "trade-grid", children: TRADE_CHOICES.map((choice) => {
                            // نفس أيقونة المادة للحرفي والتاجر: كلّها متمايزة، والعنوان يوضّح الباقي.
                            const Icon = choice.Icon;
                            const active = craft === choice.craft;
                            return (_jsxs("button", { type: "button", className: `trade-card${active ? ' is-active' : ''}${choice.isCustom ? ' trade-card--add' : ''}`, "aria-pressed": active, onClick: () => {
                                    setCraft(choice.craft);
                                }, children: [_jsx(Icon, { className: "trade-card__icon", width: 26, height: 26 }), _jsx("span", { className: "trade-card__label", children: userType === 'merchant' ? choice.merchantLabel : choice.craftLabel })] }, choice.craft));
                        }) }), isCustom ? (_jsxs("div", { className: "trade-custom", children: [_jsx("p", { className: "trade-custom__head", children: "\u0627\u0643\u062A\u0628 \u0645\u0647\u0646\u062A\u0643 \u0643\u0645\u0627 \u062A\u0633\u0645\u0651\u064A\u0647\u0627 \u0623\u0646\u062A\u060C \u0641\u064A\u0628\u0646\u064A \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0643\u0644 \u0634\u064A\u0621 \u0639\u0644\u064A\u0647\u0627." }), _jsx(TextInput, { label: userType === 'merchant' ? 'بماذا تتاجر؟' : 'ما اسم مهنتك؟', value: customCraft, onChange: setCustomCraft, placeholder: userType === 'merchant' ? 'مثال: تاجر جلود' : 'مثال: صانع أحذية' }), _jsx(TextInput, { label: "\u0627\u0644\u0645\u0627\u062F\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 (\u0627\u062E\u062A\u064A\u0627\u0631\u064A)", value: customMaterial, onChange: setCustomMaterial, placeholder: "\u0645\u062B\u0627\u0644: \u062C\u0644\u062F", hint: "\u062A\u0635\u064A\u0631 \u0635\u0646\u0641\u0627\u064B \u0628\u0627\u0633\u0645\u0647\u0627 \u0641\u064A \u0645\u0624\u0634\u0651\u0631 \u0627\u0644\u0623\u0633\u0639\u0627\u0631" }), userType === 'merchant' ? null : (_jsx(Select, { label: "\u0643\u064A\u0641 \u062A\u064F\u0633\u0639\u0651\u0631 \u0639\u0627\u062F\u0629\u064B\u061F", value: customBasis, options: PRICING_BASES.map((basis) => ({
                                    value: basis.value,
                                    label: basis.label,
                                })), onChange: setCustomBasis, hint: PRICING_BASES.find((b) => b.value === customBasis)?.hint }))] })) : null, _jsxs("div", { className: "trade-preview", children: [_jsx("span", { className: "trade-preview__head", children: "\u0633\u064A\u0641\u062A\u062D \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0639\u0644\u0649" }), _jsx("ul", { children: chosen.prepares.map((line) => (_jsx("li", { children: line }, line))) })] }), _jsx("button", { type: "submit", className: "btn btn--block mt-8", disabled: busy, children: busy ? 'جارٍ…' : 'إنشاء الحساب وفتح التطبيق' }), _jsx("div", { className: "text-center", children: _jsx("button", { type: "button", className: "auth__link", onClick: () => {
                                setStep(1);
                            }, children: "\u0631\u062C\u0648\u0639" }) })] }))] }));
}
function CloudForms({ busy, run, setInfo, setError, signIn, signUp, resetPassword, signInWithGoogle, sendPhoneCode, confirmPhoneCode, cancelPhoneSignIn, }) {
    const [mode, setMode] = useState('email');
    const [isNew, setIsNew] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const submitEmail = (event) => {
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
        void run(() => (isNew ? signUp(name, email, password) : signIn(email, password)), 'تعذّر إتمام العملية.');
    };
    const submitPhone = (event) => {
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
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "auth__tabs", role: "tablist", children: [_jsx("button", { type: "button", role: "tab", "aria-selected": mode === 'email', className: `auth__tab${mode === 'email' ? ' is-active' : ''}`, onClick: () => {
                            setMode('email');
                        }, children: "\u0628\u0627\u0644\u0628\u0631\u064A\u062F" }), _jsx("button", { type: "button", role: "tab", "aria-selected": mode === 'phone', className: `auth__tab${mode === 'phone' ? ' is-active' : ''}`, onClick: () => {
                            setMode('phone');
                            if (codeSent) {
                                cancelPhoneSignIn();
                                setCodeSent(false);
                                setCode('');
                            }
                        }, children: "\u0628\u0627\u0644\u0647\u0627\u062A\u0641" })] }), mode === 'phone' ? (_jsxs("form", { onSubmit: submitPhone, noValidate: true, children: [_jsx(TextInput, { label: "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641", type: "tel", inputMode: "tel", value: phone, onChange: setPhone, placeholder: "0673232932", hint: "\u0645\u062D\u0644\u064A\u0627\u064B 0673232932 \u0623\u0648 \u062F\u0648\u0644\u064A\u0627\u064B 00213673232932", disabled: codeSent, dir: "ltr" }), codeSent ? (_jsx(TextInput, { label: "\u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0651\u0642", type: "text", inputMode: "numeric", value: code, onChange: setCode, placeholder: "123456", hint: "\u0627\u0644\u0631\u0645\u0632 \u0627\u0644\u0645\u0631\u0633\u0644 \u0628\u0631\u0633\u0627\u0644\u0629 \u0646\u0635\u0651\u064A\u0629" })) : null, _jsx("button", { type: "submit", className: "btn btn--block mt-8", disabled: busy, children: busy ? 'جارٍ…' : codeSent ? 'تأكيد الرمز والدخول' : 'إرسال رمز التحقّق' }), codeSent ? (_jsx("div", { className: "text-center", children: _jsx("button", { type: "button", className: "auth__link", onClick: () => {
                                cancelPhoneSignIn();
                                setCodeSent(false);
                                setCode('');
                                setInfo(null);
                                setError(null);
                            }, children: "\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0631\u0642\u0645 \u0623\u0648 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0625\u0631\u0633\u0627\u0644" }) })) : null] })) : (_jsxs("form", { onSubmit: submitEmail, noValidate: true, children: [isNew ? (_jsx(TextInput, { label: "\u0627\u0633\u0645 \u0635\u0627\u062D\u0628 \u0627\u0644\u0639\u0645\u0644", value: name, onChange: setName, placeholder: "\u0645\u062B\u0627\u0644: \u0623\u0628\u0648 \u0639\u0644\u064A" })) : null, _jsx(TextInput, { label: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A", type: "email", inputMode: "email", value: email, onChange: setEmail, placeholder: "name@example.com", dir: "ltr" }), _jsx(TextInput, { label: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631", type: "password", value: password, onChange: setPassword, hint: isNew ? '٦ أحرف على الأقل' : undefined }), _jsx("button", { type: "submit", className: "btn btn--block mt-8", disabled: busy, children: busy ? 'جارٍ…' : isNew ? 'إنشاء الحساب السحابي' : 'دخول' }), _jsxs("div", { className: "text-center", children: [_jsx("button", { type: "button", className: "auth__link", onClick: () => {
                                    setIsNew((value) => !value);
                                    setError(null);
                                }, children: isNew ? 'لديّ حساب سحابي' : 'إنشاء حساب سحابي جديد' }), !isNew ? (_jsx("button", { type: "button", className: "auth__link", onClick: () => {
                                    setInfo(null);
                                    if (!email.trim()) {
                                        setError('أدخل بريدك الإلكتروني أولاً.');
                                        return;
                                    }
                                    void run(async () => {
                                        await resetPassword(email);
                                        setInfo('أُرسل رابط إعادة تعيين كلمة المرور إلى بريدك.');
                                    }, 'تعذّر إرسال الرابط.');
                                }, children: "\u0646\u0633\u064A\u062A \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631\u061F" })) : null] })] })), _jsx("div", { className: "auth__divider", children: "\u0623\u0648" }), _jsxs("button", { type: "button", className: "btn btn--ghost btn--block auth__google", onClick: () => {
                    void run(signInWithGoogle, 'تعذّر الدخول بحساب Google.');
                }, disabled: busy, children: [_jsxs("svg", { viewBox: "0 0 18 18", "aria-hidden": "true", focusable: "false", children: [_jsx("path", { fill: "#4285F4", d: "M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" }), _jsx("path", { fill: "#34A853", d: "M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" }), _jsx("path", { fill: "#FBBC05", d: "M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" }), _jsx("path", { fill: "#EA4335", d: "M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" })] }), "\u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0628\u062D\u0633\u0627\u0628 Google"] })] }));
}
