import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { ConfirmDialog, Modal, NumberInput, SectionTitle, Select, TextInput, } from '@/components/ui';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { useTheme } from '@/hooks/useTheme';
import { THEME_CHOICES } from '@/lib/theme';
import { changePassword } from '@/data/accounts';
import { clearLocalData, exportLocalData, importLocalData } from '@/data/localStore';
import { isUsingEmulators } from '@/lib/firebase';
import { TRADE_CHOICES, tradeLabel } from '@/lib/trades';
import { APP_NAME, CURRENCIES, PRICING_BASES, USER_TYPES } from '@/lib/constants';
import { formatDateTime, toNumber } from '@/lib/format';
export default function Settings() {
    const { profile, saveProfile, storeKind, seedDemoData, orders, debts } = useData();
    const { user, signOut, firebaseAvailable, updateLocalAccount } = useAuth();
    const { notify, notifyError } = useToast();
    const { canInstall, installed, install } = usePwaInstall();
    const { theme, setTheme } = useTheme();
    const [draft, setDraft] = useState(profile);
    const [saving, setSaving] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const fileInput = useRef(null);
    useEffect(() => {
        setDraft(profile);
    }, [profile]);
    const patch = (value) => {
        setDraft((current) => ({ ...current, ...value }));
    };
    const save = async () => {
        setSaving(true);
        try {
            const businessName = draft.businessName.trim() || 'ورشتي';
            await saveProfile({
                ...draft,
                businessName,
                ownerName: draft.ownerName.trim(),
                phone: draft.phone.trim(),
                address: draft.address.trim(),
                customCraft: draft.customCraft.trim(),
                customMaterial: draft.customMaterial.trim(),
            });
            // الحساب على الجهاز يحمل نسخته من الاسم والمهنة (تُعرض في شاشة الدخول).
            updateLocalAccount({
                displayName: businessName,
                userType: draft.userType,
                craft: draft.craft,
                customCraft: draft.customCraft.trim(),
                customMaterial: draft.customMaterial.trim(),
                customBasis: draft.customBasis,
            });
            notify('حُفظت الإعدادات.');
        }
        catch (error) {
            notifyError(error);
        }
        finally {
            setSaving(false);
        }
    };
    const doExport = () => {
        if (!user)
            return;
        try {
            const json = storeKind === 'local' ? exportLocalData(user.uid) : JSON.stringify({ version: 1, exportedAt: Date.now(), orders, debts }, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `herfah-pro-backup-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 2000);
            notify('حُفظت نسخة احتياطية.');
        }
        catch (error) {
            notifyError(error);
        }
    };
    const doImport = async (file) => {
        if (!user)
            return;
        if (storeKind !== 'local') {
            notify('الاستيراد متاح في الوضع المحلي فقط.', 'error');
            return;
        }
        try {
            const text = await file.text();
            importLocalData(user.uid, text);
            notify('استُوردت البيانات بنجاح.');
        }
        catch (error) {
            notifyError(error instanceof Error ? error : new Error('ملف غير صالح.'));
        }
    };
    const doClear = () => {
        if (!user)
            return;
        clearLocalData(user.uid);
        setConfirmClear(false);
        notify('حُذفت كل البيانات المحلية.');
    };
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "card", children: [_jsx(SectionTitle, { children: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0648\u0631\u0634\u0629" }), _jsx("p", { className: "small muted", children: "\u062A\u0638\u0647\u0631 \u0647\u0630\u0647 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0641\u064A \u0631\u0623\u0633 \u0643\u0644 \u0641\u0627\u062A\u0648\u0631\u0629 \u0623\u0648 \u0643\u0634\u0641 \u062A\u0637\u0628\u0639\u0647." }), _jsxs("div", { className: "mt-12", children: [_jsx(TextInput, { label: "\u0627\u0633\u0645 \u0627\u0644\u0648\u0631\u0634\u0629 \u0623\u0648 \u0627\u0644\u0645\u062D\u0644", value: draft.businessName, onChange: (value) => {
                                    patch({ businessName: value });
                                } }), _jsxs("div", { className: "grid-2", children: [_jsx(TextInput, { label: "\u0627\u0633\u0645 \u0635\u0627\u062D\u0628 \u0627\u0644\u0639\u0645\u0644", value: draft.ownerName, onChange: (value) => {
                                            patch({ ownerName: value });
                                        } }), _jsx(TextInput, { label: "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641", type: "tel", inputMode: "tel", value: draft.phone, onChange: (value) => {
                                            patch({ phone: value });
                                        } })] }), _jsx(TextInput, { label: "\u0627\u0644\u0639\u0646\u0648\u0627\u0646", value: draft.address, onChange: (value) => {
                                    patch({ address: value });
                                } }), _jsxs("div", { className: "grid-2", children: [_jsx(Select, { label: "\u0646\u0648\u0639 \u0627\u0644\u062D\u0633\u0627\u0628", value: draft.userType, options: USER_TYPES, onChange: (value) => {
                                            patch({ userType: value });
                                        } }), _jsx(Select, { label: draft.userType === 'merchant' ? 'مجال التجارة' : 'الحرفة', hint: "\u064A\u0642\u0631\u0651\u0631 \u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0645\u0648\u0627\u062F \u0627\u0644\u0645\u0642\u062A\u0631\u062D\u0629 \u0648\u0627\u0644\u0642\u0648\u0627\u0644\u0628 \u0627\u0644\u062A\u064A \u064A\u0628\u062F\u0623 \u0628\u0647\u0627 \u0627\u0644\u062A\u0633\u0639\u064A\u0631", value: draft.craft, options: TRADE_CHOICES.map((choice) => ({
                                            value: choice.craft,
                                            label: draft.userType === 'merchant' ? choice.merchantLabel : choice.craftLabel,
                                        })), onChange: (value) => {
                                            patch({ craft: value });
                                        } })] }), draft.craft === 'other' ? (_jsxs(_Fragment, { children: [_jsx(TextInput, { label: draft.userType === 'merchant' ? 'بماذا تتاجر؟' : 'اسم مهنتك', value: draft.customCraft, onChange: (value) => {
                                            patch({ customCraft: value });
                                        }, placeholder: draft.userType === 'merchant' ? 'تاجر جلود' : 'صانع أحذية', hint: "\u064A\u0638\u0647\u0631 \u0641\u064A \u0631\u0623\u0633 \u0627\u0644\u0635\u0641\u062D\u0627\u062A \u0648\u0641\u064A \u0639\u0631\u0648\u0636 \u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0645\u0637\u0628\u0648\u0639\u0629" }), _jsxs("div", { className: "grid-2", children: [_jsx(TextInput, { label: "\u0627\u0644\u0645\u0627\u062F\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629", value: draft.customMaterial, onChange: (value) => {
                                                    patch({ customMaterial: value });
                                                }, placeholder: "\u062C\u0644\u062F", hint: "\u0627\u0633\u0645 \u0635\u0646\u0641\u0643 \u0641\u064A \u0645\u0624\u0634\u0651\u0631 \u0627\u0644\u0623\u0633\u0639\u0627\u0631" }), _jsx(Select, { label: "\u0637\u0631\u064A\u0642\u0629 \u0627\u0644\u062A\u0633\u0639\u064A\u0631 \u0627\u0644\u0645\u0639\u062A\u0627\u062F\u0629", value: draft.customBasis, options: PRICING_BASES.map((basis) => ({
                                                    value: basis.value,
                                                    label: basis.label,
                                                })), onChange: (value) => {
                                                    patch({ customBasis: value });
                                                } })] })] })) : null, _jsx(Select, { label: "\u0627\u0644\u0639\u0645\u0644\u0629", value: draft.currency, options: CURRENCIES.map((c) => ({ value: c.code, label: c.label })), onChange: (value) => {
                                    patch({ currency: value });
                                } }), _jsxs("div", { className: "grid-2", children: [_jsx(NumberInput, { label: "\u0623\u062C\u0631\u0629 \u0627\u0644\u0633\u0627\u0639\u0629 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629", value: draft.defaultLaborRate, onChange: (value) => {
                                            patch({ defaultLaborRate: toNumber(value) });
                                        } }), _jsx(NumberInput, { label: "\u0646\u0633\u0628\u0629 \u0627\u0644\u0631\u0628\u062D \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629", suffix: "\u066A", value: draft.defaultMarginPct, onChange: (value) => {
                                            patch({ defaultMarginPct: toNumber(value) });
                                        } })] })] }), _jsxs("div", { className: "card__actions", children: [_jsx("button", { type: "button", className: "btn", disabled: saving, onClick: () => {
                                    void save();
                                }, children: saving ? 'جارٍ الحفظ…' : 'حفظ الإعدادات' }), profile.updatedAt ? (_jsxs("span", { className: "small muted", children: ["\u0622\u062E\u0631 \u062A\u062D\u062F\u064A\u062B: ", formatDateTime(profile.updatedAt)] })) : null] })] }), _jsxs("div", { className: "card", children: [_jsx(SectionTitle, { children: "\u0627\u0644\u0645\u0638\u0647\u0631" }), _jsx("p", { className: "small muted", children: "\u064A\u064F\u062D\u0641\u0638 \u0641\u064A \u0647\u0630\u0627 \u0627\u0644\u062C\u0647\u0627\u0632 \u0648\u062D\u062F\u0647 \u2014 \u0641\u0644\u0647\u0627\u062A\u0641\u0643 \u0645\u0638\u0647\u0631 \u0648\u0644\u062D\u0627\u0633\u0648\u0628 \u0627\u0644\u0648\u0631\u0634\u0629 \u0622\u062E\u0631 \u0625\u0646 \u0634\u0626\u062A." }), _jsx("div", { className: "chips mt-12", role: "group", "aria-label": "\u0645\u0638\u0647\u0631 \u0627\u0644\u062A\u0637\u0628\u064A\u0642", children: THEME_CHOICES.map((option) => (_jsx("button", { type: "button", className: `chip${theme === option.value ? ' is-active' : ''}`, "aria-pressed": theme === option.value, onClick: () => {
                                setTheme(option.value);
                            }, children: option.label }, option.value))) }), _jsx("p", { className: "small muted mt-12", children: THEME_CHOICES.find((option) => option.value === theme)?.hint })] }), _jsxs("div", { className: "card", children: [_jsx(SectionTitle, { children: "\u0627\u0644\u062D\u0633\u0627\u0628 \u0648\u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629" }), storeKind === 'local' ? (_jsxs("div", { className: "notice notice--warn", children: [user?.isGuest ? (_jsxs(_Fragment, { children: ["\u062A\u0639\u0645\u0644 \u0627\u0644\u0622\u0646 ", _jsx("strong", { children: "\u0628\u062F\u0648\u0646 \u062D\u0633\u0627\u0628" }), ". \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0645\u062D\u0641\u0648\u0638\u0629 \u0641\u064A \u0647\u0630\u0627 \u0627\u0644\u0645\u062A\u0635\u0641\u0651\u062D \u0648\u062D\u062F\u0647. \u0623\u0646\u0634\u0626 \u062D\u0633\u0627\u0628\u0627\u064B \u0644\u062A\u0641\u0635\u0644 \u0628\u064A\u0627\u0646\u0627\u062A\u0643 \u0639\u0646 \u063A\u064A\u0631\u0643 \u0639\u0644\u0649 \u0646\u0641\u0633 \u0627\u0644\u062C\u0647\u0627\u0632 \u0648\u062A\u062D\u0645\u064A\u0647\u0627 \u0628\u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631."] })) : (_jsxs(_Fragment, { children: ["\u062D\u0633\u0627\u0628\u0643 \u0645\u062D\u0641\u0648\u0638 \u0639\u0644\u0649 ", _jsx("strong", { children: "\u0647\u0630\u0627 \u0627\u0644\u062C\u0647\u0627\u0632" }), " \u0641\u0642\u0637: \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0644\u0627 \u062A\u062A\u0632\u0627\u0645\u0646 \u0628\u064A\u0646 \u0627\u0644\u0623\u062C\u0647\u0632\u0629\u060C \u0648\u062D\u0630\u0641 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u062A\u0635\u0641\u0651\u062D \u064A\u0645\u062D\u0648\u0647\u0627."] })), firebaseAvailable
                                ? ' للمزامنة بين الأجهزة استعمل حساباً سحابياً من شاشة الدخول.'
                                : ' خذ نسخة احتياطية من الأسفل بين حين وآخر.'] })) : (_jsx("div", { className: "notice notice--info", children: "\u0645\u062A\u0635\u0644 \u0628\u0640 Firebase \u2014 \u0628\u064A\u0627\u0646\u0627\u062A\u0643 \u062A\u064F\u062D\u0641\u0638 \u0648\u062A\u062A\u0632\u0627\u0645\u0646 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B\u060C \u0648\u062A\u0639\u0645\u0644 \u0623\u064A\u0636\u0627\u064B \u062F\u0648\u0646 \u0625\u0646\u062A\u0631\u0646\u062A \u0648\u062A\u064F\u0631\u0641\u0639 \u0639\u0646\u062F \u0639\u0648\u062F\u0629 \u0627\u0644\u0627\u062A\u0635\u0627\u0644." })), _jsxs("div", { className: "card__meta", children: [user?.email ? (_jsxs("span", { children: ["\u0627\u0644\u0628\u0631\u064A\u062F ", _jsx("strong", { children: user.email })] })) : null, user?.phoneNumber ? (_jsxs("span", { children: ["\u0627\u0644\u0647\u0627\u062A\u0641 ", _jsx("strong", { dir: "ltr", children: user.phoneNumber })] })) : null, user?.displayName ? (_jsxs("span", { children: ["\u0627\u0644\u062D\u0633\u0627\u0628 ", _jsx("strong", { children: user.displayName })] })) : null, _jsxs("span", { children: ["\u0627\u0644\u0645\u0647\u0646\u0629 ", _jsx("strong", { children: tradeLabel(profile) })] }), _jsxs("span", { children: ["\u0627\u0644\u062A\u062E\u0632\u064A\u0646", ' ', _jsx("strong", { children: storeKind === 'local'
                                            ? 'على الجهاز'
                                            : isUsingEmulators
                                                ? 'محاكي Firebase (على هذا الجهاز)'
                                                : 'Firebase' })] })] }), _jsxs("div", { className: "card__actions", children: [_jsx("button", { type: "button", className: "btn btn--ghost btn--sm", onClick: () => {
                                    void signOut();
                                }, children: user?.isGuest ? 'إنشاء حساب أو تسجيل دخول' : 'تسجيل الخروج' }), user?.isLocal && !user.isGuest ? (_jsx("button", { type: "button", className: "btn btn--soft btn--sm", onClick: () => {
                                    setChangingPassword(true);
                                }, children: "\u062A\u063A\u064A\u064A\u0631 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" })) : null, canInstall ? (_jsx("button", { type: "button", className: "btn btn--soft btn--sm", onClick: () => {
                                    void install();
                                }, children: "\u062A\u062B\u0628\u064A\u062A \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0639\u0644\u0649 \u0627\u0644\u062C\u0647\u0627\u0632" })) : null, installed ? _jsx("span", { className: "small muted", children: "\u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0645\u062B\u0628\u0651\u062A \u0639\u0644\u0649 \u0627\u0644\u062C\u0647\u0627\u0632." }) : null] })] }), _jsxs("div", { className: "card", children: [_jsx(SectionTitle, { children: "\u0627\u0644\u0646\u0633\u062E \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A \u0648\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A" }), _jsx("p", { className: "small muted", children: "\u0627\u062D\u0641\u0638 \u0646\u0633\u062E\u0629 \u0645\u0646 \u0628\u064A\u0627\u0646\u0627\u062A\u0643 \u0639\u0644\u0649 \u062C\u0647\u0627\u0632\u0643\u060C \u0623\u0648 \u0627\u0633\u062A\u0639\u062F\u0647\u0627 \u0644\u0627\u062D\u0642\u0627\u064B. \u064A\u064F\u0646\u0635\u062D \u0628\u0623\u062E\u0630 \u0646\u0633\u062E\u0629 \u0643\u0644 \u0641\u062A\u0631\u0629 \u0641\u064A \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0645\u062D\u0644\u064A." }), _jsxs("div", { className: "card__actions", children: [_jsx("button", { type: "button", className: "btn btn--ghost btn--sm", onClick: doExport, children: "\u062A\u0635\u062F\u064A\u0631 \u0646\u0633\u062E\u0629 \u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629" }), storeKind === 'local' ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "btn btn--ghost btn--sm", onClick: () => {
                                            fileInput.current?.click();
                                        }, children: "\u0627\u0633\u062A\u064A\u0631\u0627\u062F \u0646\u0633\u062E\u0629" }), _jsx("button", { type: "button", className: "btn btn--soft btn--sm", onClick: seedDemoData, children: "\u062A\u0639\u0628\u0626\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u062A\u062C\u0631\u064A\u0628\u064A\u0629" }), _jsx("button", { type: "button", className: "btn btn--ghost btn--sm", onClick: () => {
                                            setConfirmClear(true);
                                        }, children: "\u062D\u0630\u0641 \u0643\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A" })] })) : null] }), _jsx("input", { ref: fileInput, type: "file", accept: "application/json", hidden: true, onChange: (event) => {
                            const file = event.target.files?.[0];
                            if (file)
                                void doImport(file);
                            event.target.value = '';
                        } })] }), _jsxs("div", { className: "card", children: [_jsx(SectionTitle, { children: "\u0639\u0646 \u0627\u0644\u062A\u0637\u0628\u064A\u0642" }), _jsxs("p", { className: "small muted", children: [APP_NAME, " \u2014 \u062A\u0637\u0628\u064A\u0642 \u0648\u064A\u0628 \u064A\u0639\u0645\u0644 \u0639\u0644\u0649 \u0627\u0644\u0647\u0627\u062A\u0641 \u0648\u0627\u0644\u062D\u0627\u0633\u0648\u0628\u060C \u0648\u064A\u0645\u0643\u0646 \u062A\u062B\u0628\u064A\u062A\u0647 \u0643\u062A\u0637\u0628\u064A\u0642 \u0645\u0633\u062A\u0642\u0644. \u064A\u0639\u0645\u0644 \u062F\u0648\u0646 \u0625\u0646\u062A\u0631\u0646\u062A \u0648\u064A\u0632\u0627\u0645\u0646 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0639\u0646\u062F \u0639\u0648\u062F\u0629 \u0627\u0644\u0627\u062A\u0635\u0627\u0644."] })] }), _jsx(ConfirmDialog, { open: confirmClear, title: "\u062D\u0630\u0641 \u0643\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", message: "\u0633\u064A\u064F\u062D\u0630\u0641 \u0643\u0644 \u0645\u0627 \u0647\u0648 \u0645\u062D\u0641\u0648\u0638 \u0639\u0644\u0649 \u0647\u0630\u0627 \u0627\u0644\u062C\u0647\u0627\u0632: \u0627\u0644\u0637\u0644\u0628\u064A\u0627\u062A \u0648\u0627\u0644\u0645\u0648\u0627\u0639\u064A\u062F \u0648\u0627\u0644\u062D\u0633\u0627\u0628\u0627\u062A \u0648\u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0648\u0627\u0644\u062F\u064A\u0648\u0646. \u0644\u0627 \u064A\u0645\u0643\u0646 \u0627\u0644\u062A\u0631\u0627\u062C\u0639.", confirmLabel: "\u062D\u0630\u0641 \u0627\u0644\u0643\u0644", onCancel: () => {
                    setConfirmClear(false);
                }, onConfirm: doClear }), user && changingPassword ? (_jsx(PasswordDialog, { uid: user.uid, onClose: () => {
                    setChangingPassword(false);
                }, onDone: () => {
                    setChangingPassword(false);
                    notify('غُيّرت كلمة المرور.');
                } })) : null] }));
}
/** تغيير كلمة مرور حساب الجهاز — يتطلّب كلمة المرور الحالية. */
function PasswordDialog({ uid, onClose, onDone, }) {
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const submit = async () => {
        if (next !== confirm) {
            setError('كلمتا المرور الجديدتان غير متطابقتين.');
            return;
        }
        setError(null);
        setBusy(true);
        try {
            await changePassword(uid, current, next);
            onDone();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'تعذّر تغيير كلمة المرور.');
        }
        finally {
            setBusy(false);
        }
    };
    return (_jsxs(Modal, { open: true, title: "\u062A\u063A\u064A\u064A\u0631 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631", onClose: onClose, footer: _jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "btn btn--ghost", onClick: onClose, children: "\u0625\u0644\u063A\u0627\u0621" }), _jsx("button", { type: "button", className: "btn", disabled: busy, onClick: () => {
                        void submit();
                    }, children: busy ? 'جارٍ…' : 'حفظ' })] }), children: [error ? _jsx("div", { className: "auth__error", children: error }) : null, _jsx(TextInput, { label: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062D\u0627\u0644\u064A\u0629", type: "password", value: current, onChange: setCurrent }), _jsx(TextInput, { label: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629", type: "password", value: next, onChange: setNext, hint: "\u0664 \u062E\u0627\u0646\u0627\u062A \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644" }), _jsx(TextInput, { label: "\u062A\u0623\u0643\u064A\u062F \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629", type: "password", value: confirm, onChange: setConfirm })] }));
}
