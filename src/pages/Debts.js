import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { Badge, ConfirmDialog, EmptyState, Modal, NumberInput, StatCard, TextArea, TextInput, } from '@/components/ui';
import { debtTotals } from '@/lib/calc';
import { daysFromToday, formatDate, formatMoney, relativeDayLabel, telHref, toNumber, todayIso, whatsappHref, } from '@/lib/format';
import { newId } from '@/lib/id';
import { buildDebtStatement, buildDebtsReport } from '@/print/templates';
import { printHtml } from '@/print/print';
const emptyDebt = () => ({
    customerName: '',
    phone: '',
    address: '',
    goods: '',
    amount: 0,
    payments: [],
    dueDate: todayIso(),
    notes: '',
});
export default function Debts() {
    const { debts, profile, create, update, remove } = useData();
    const { notify, notifyError } = useToast();
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [draft, setDraft] = useState(emptyDebt);
    const [saving, setSaving] = useState(false);
    const [toDelete, setToDelete] = useState(null);
    const [payingFor, setPayingFor] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentNote, setPaymentNote] = useState('');
    const [detail, setDetail] = useState(null);
    const totals = useMemo(() => debts.reduce((acc, debt) => {
        const t = debtTotals(debt);
        return {
            amount: acc.amount + t.amount,
            paid: acc.paid + t.paid,
            remaining: acc.remaining + t.remaining,
            overdue: acc.overdue +
                (!t.isSettled && (daysFromToday(debt.dueDate) ?? 1) < 0 ? t.remaining : 0),
        };
    }, { amount: 0, paid: 0, remaining: 0, overdue: 0 }), [debts]);
    const visible = useMemo(() => {
        const term = search.trim().toLowerCase();
        return debts.filter((debt) => {
            const t = debtTotals(debt);
            const overdue = !t.isSettled && (daysFromToday(debt.dueDate) ?? 1) < 0;
            if (filter === 'open' && t.isSettled)
                return false;
            if (filter === 'settled' && !t.isSettled)
                return false;
            if (filter === 'overdue' && !overdue)
                return false;
            if (!term)
                return true;
            return [debt.customerName, debt.phone, debt.address, debt.goods, debt.notes]
                .join(' ')
                .toLowerCase()
                .includes(term);
        });
    }, [debts, filter, search]);
    const openNew = () => {
        setEditing(null);
        setDraft(emptyDebt());
        setFormOpen(true);
    };
    const openEdit = (debt) => {
        setEditing(debt);
        setDraft({
            customerName: debt.customerName,
            phone: debt.phone,
            address: debt.address,
            goods: debt.goods,
            amount: debt.amount,
            payments: debt.payments ?? [],
            dueDate: debt.dueDate,
            notes: debt.notes,
        });
        setFormOpen(true);
    };
    const patch = (value) => {
        setDraft((current) => ({ ...current, ...value }));
    };
    const save = async () => {
        if (!draft.customerName.trim()) {
            notify('اكتب اسم الزبون.', 'error');
            return;
        }
        if (!(draft.amount > 0)) {
            notify('أدخل مبلغ الدين.', 'error');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...draft,
                customerName: draft.customerName.trim(),
                phone: draft.phone.trim(),
                address: draft.address.trim(),
                goods: draft.goods.trim(),
                notes: draft.notes.trim(),
            };
            if (editing) {
                await update('debts', editing.id, payload);
                notify('حُفظ سجل الدين.');
            }
            else {
                await create('debts', payload);
                notify('أُضيف الدين إلى السجل.');
            }
            setFormOpen(false);
            setEditing(null);
        }
        catch (error) {
            notifyError(error);
        }
        finally {
            setSaving(false);
        }
    };
    const addPayment = async () => {
        if (!payingFor)
            return;
        const amount = toNumber(paymentAmount, Number.NaN);
        if (!Number.isFinite(amount) || amount <= 0) {
            notify('أدخل مبلغ دفعة صحيح.', 'error');
            return;
        }
        const payment = {
            id: newId(),
            amount,
            date: todayIso(),
            note: paymentNote.trim(),
        };
        try {
            await update('debts', payingFor.id, {
                payments: [...(payingFor.payments ?? []), payment],
            });
            notify('سُجّلت الدفعة.');
            setPayingFor(null);
            setPaymentAmount('');
            setPaymentNote('');
        }
        catch (error) {
            notifyError(error);
        }
    };
    const removePayment = async (debt, paymentId) => {
        try {
            await update('debts', debt.id, {
                payments: (debt.payments ?? []).filter((p) => p.id !== paymentId),
            });
            notify('حُذفت الدفعة.');
            setDetail((current) => current && current.id === debt.id
                ? { ...current, payments: current.payments.filter((p) => p.id !== paymentId) }
                : current);
        }
        catch (error) {
            notifyError(error);
        }
    };
    const confirmDelete = async () => {
        if (!toDelete)
            return;
        try {
            await remove('debts', toDelete.id);
            notify('حُذف سجل الدين.');
        }
        catch (error) {
            notifyError(error);
        }
        finally {
            setToDelete(null);
        }
    };
    const money = (value) => formatMoney(value, profile.currency);
    const chips = [
        { value: 'all', label: 'الكل' },
        { value: 'open', label: 'غير مسدّد' },
        { value: 'overdue', label: 'متأخر' },
        { value: 'settled', label: 'مسدّد' },
    ];
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "stat-grid", children: [_jsx(StatCard, { label: "\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u062F\u064A\u0648\u0646", value: money(totals.amount) }), _jsx(StatCard, { label: "\u0627\u0644\u0645\u0633\u062F\u0651\u062F", value: money(totals.paid), tone: "ok" }), _jsx(StatCard, { label: "\u0627\u0644\u0645\u062A\u0628\u0642\u0651\u064A", value: money(totals.remaining), tone: "warn" }), _jsx(StatCard, { label: "\u0645\u062A\u0623\u062E\u0631 \u0627\u0644\u0633\u062F\u0627\u062F", value: money(totals.overdue), tone: "danger" })] }), _jsxs("div", { className: "search-bar mt-16", children: [_jsx("span", { className: "search-bar__icon", children: "\u2315" }), _jsx("input", { className: "input", type: "search", placeholder: "\u0627\u0628\u062D\u062B \u0628\u0627\u0633\u0645 \u0627\u0644\u0632\u0628\u0648\u0646 \u0623\u0648 \u0627\u0644\u0628\u0636\u0627\u0639\u0629 \u0623\u0648 \u0627\u0644\u0647\u0627\u062A\u0641", value: search, onChange: (event) => {
                            setSearch(event.target.value);
                        } })] }), _jsxs("div", { className: "filters", children: [chips.map((chip) => (_jsx("button", { type: "button", className: `chip${filter === chip.value ? ' is-active' : ''}`, onClick: () => {
                            setFilter(chip.value);
                        }, children: chip.label }, chip.value))), debts.length > 0 ? (_jsx("button", { type: "button", className: "chip", onClick: () => {
                            printHtml('سجل الديون', buildDebtsReport(visible, profile, chips.find((c) => c.value === filter)?.label ?? 'كل الديون'));
                        }, children: "\uD83D\uDDA8 \u0637\u0628\u0627\u0639\u0629 \u0627\u0644\u0642\u0627\u0626\u0645\u0629" })) : null] }), visible.length === 0 ? (_jsx(EmptyState, { title: debts.length === 0 ? 'لا توجد ديون مسجّلة' : 'لا نتائج مطابقة', description: debts.length === 0
                    ? 'سجّل ديون الزبائن بالاسم والهاتف والعنوان والبضاعة والمبلغ.'
                    : 'جرّب تغيير الفلتر أو كلمة البحث.', action: debts.length === 0 ? (_jsx("button", { type: "button", className: "btn", onClick: openNew, children: "\u0625\u0636\u0627\u0641\u0629 \u062F\u064A\u0646" })) : null })) : (_jsx("div", { className: "list", children: visible.map((debt) => {
                    const t = debtTotals(debt);
                    const overdue = !t.isSettled && (daysFromToday(debt.dueDate) ?? 1) < 0;
                    const tel = telHref(debt.phone);
                    const wa = whatsappHref(debt.phone);
                    return (_jsxs("article", { className: "card", children: [_jsxs("div", { className: "card__head", children: [_jsxs("div", { children: [_jsx("h3", { className: "card__title", children: debt.customerName }), _jsx("p", { className: "card__sub", children: debt.goods || 'بضاعة غير محدّدة' })] }), t.isSettled ? (_jsx(Badge, { tone: "ok", children: "\u0645\u0633\u062F\u0651\u062F" })) : overdue ? (_jsx(Badge, { tone: "danger", children: relativeDayLabel(debt.dueDate) })) : (_jsx(Badge, { tone: "warn", children: money(t.remaining) }))] }), _jsxs("div", { className: "card__meta", children: [_jsxs("span", { children: ["\u0627\u0644\u0645\u0628\u0644\u063A ", _jsx("strong", { children: money(t.amount) })] }), _jsxs("span", { children: ["\u0627\u0644\u0645\u0633\u062F\u0651\u062F ", _jsx("strong", { children: money(t.paid) })] }), _jsxs("span", { children: ["\u0627\u0644\u0645\u062A\u0628\u0642\u0651\u064A ", _jsx("strong", { children: money(t.remaining) })] }), debt.dueDate ? (_jsxs("span", { children: ["\u0627\u0644\u0627\u0633\u062A\u062D\u0642\u0627\u0642 ", _jsx("strong", { children: formatDate(debt.dueDate) })] })) : null, debt.phone ? (_jsxs("span", { children: ["\u0627\u0644\u0647\u0627\u062A\u0641", ' ', tel ? (_jsx("a", { href: tel, children: _jsx("strong", { children: debt.phone }) })) : (_jsx("strong", { children: debt.phone }))] })) : null, debt.address ? (_jsxs("span", { children: ["\u0627\u0644\u0639\u0646\u0648\u0627\u0646 ", _jsx("strong", { children: debt.address })] })) : null] }), t.amount > 0 ? (_jsx("div", { className: "progress", "aria-hidden": "true", children: _jsx("div", { className: "progress__bar", style: { width: `${Math.min(100, (t.paid / t.amount) * 100)}%` } }) })) : null, _jsxs("div", { className: "card__actions", children: [!t.isSettled ? (_jsx("button", { type: "button", className: "btn btn--sm", onClick: () => {
                                            setPayingFor(debt);
                                            setPaymentAmount(String(t.remaining));
                                            setPaymentNote('');
                                        }, children: "\u062A\u0633\u062C\u064A\u0644 \u062F\u0641\u0639\u0629" })) : null, _jsxs("button", { type: "button", className: "btn btn--ghost btn--sm", onClick: () => {
                                            setDetail(debt);
                                        }, children: ["\u0627\u0644\u062F\u0641\u0639\u0627\u062A (", debt.payments?.length ?? 0, ")"] }), _jsx("button", { type: "button", className: "btn btn--soft btn--sm", onClick: () => {
                                            printHtml(`كشف دين - ${debt.customerName}`, buildDebtStatement(debt, profile));
                                        }, children: "\u0637\u0628\u0627\u0639\u0629 \u0643\u0634\u0641" }), wa ? (_jsx("a", { className: "btn btn--ghost btn--sm", href: wa, target: "_blank", rel: "noreferrer noopener", children: "\u0648\u0627\u062A\u0633\u0627\u0628" })) : null, _jsx("button", { type: "button", className: "btn btn--ghost btn--sm", onClick: () => {
                                            openEdit(debt);
                                        }, children: "\u062A\u0639\u062F\u064A\u0644" }), _jsx("button", { type: "button", className: "btn btn--ghost btn--sm", onClick: () => {
                                            setToDelete(debt);
                                        }, children: "\u062D\u0630\u0641" })] })] }, debt.id));
                }) })), _jsx("button", { type: "button", className: "fab", onClick: openNew, children: "+ \u062F\u064A\u0646 \u062C\u062F\u064A\u062F" }), _jsxs(Modal, { open: formOpen, title: editing ? 'تعديل الدين' : 'دين جديد', onClose: () => {
                    setFormOpen(false);
                }, footer: _jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "btn btn--ghost", onClick: () => {
                                setFormOpen(false);
                            }, children: "\u0625\u0644\u063A\u0627\u0621" }), _jsx("button", { type: "button", className: "btn", disabled: saving, onClick: () => {
                                void save();
                            }, children: saving ? 'جارٍ الحفظ…' : 'حفظ' })] }), children: [_jsx(TextInput, { label: "\u0627\u0633\u0645 \u0627\u0644\u0632\u0628\u0648\u0646", value: draft.customerName, onChange: (value) => {
                            patch({ customerName: value });
                        }, autoFocus: true }), _jsxs("div", { className: "grid-2", children: [_jsx(TextInput, { label: "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641", type: "tel", inputMode: "tel", value: draft.phone, onChange: (value) => {
                                    patch({ phone: value });
                                } }), _jsx(TextInput, { label: "\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0627\u0633\u062A\u062D\u0642\u0627\u0642", type: "date", value: draft.dueDate, onChange: (value) => {
                                    patch({ dueDate: value });
                                } })] }), _jsx(TextInput, { label: "\u0627\u0644\u0639\u0646\u0648\u0627\u0646", value: draft.address, onChange: (value) => {
                            patch({ address: value });
                        } }), _jsx(TextInput, { label: "\u0627\u0644\u0628\u0636\u0627\u0639\u0629", value: draft.goods, onChange: (value) => {
                            patch({ goods: value });
                        }, placeholder: "\u0645\u0627 \u0627\u0644\u0630\u064A \u0623\u062E\u0630\u0647 \u0627\u0644\u0632\u0628\u0648\u0646\u061F" }), _jsx(NumberInput, { label: "\u0627\u0644\u0645\u0628\u0644\u063A", value: draft.amount, onChange: (value) => {
                            patch({ amount: toNumber(value) });
                        }, suffix: profile.currency }), _jsx(TextArea, { label: "\u0645\u0644\u0627\u062D\u0638\u0627\u062A", value: draft.notes, onChange: (value) => {
                            patch({ notes: value });
                        } })] }), _jsxs(Modal, { open: Boolean(payingFor), title: `تسجيل دفعة — ${payingFor?.customerName ?? ''}`, onClose: () => {
                    setPayingFor(null);
                }, footer: _jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "btn btn--ghost", onClick: () => {
                                setPayingFor(null);
                            }, children: "\u0625\u0644\u063A\u0627\u0621" }), _jsx("button", { type: "button", className: "btn", onClick: () => {
                                void addPayment();
                            }, children: "\u062D\u0641\u0638 \u0627\u0644\u062F\u0641\u0639\u0629" })] }), children: [_jsxs("p", { className: "small muted", children: ["\u0627\u0644\u0645\u062A\u0628\u0642\u0651\u064A \u062D\u0627\u0644\u064A\u0627\u064B:", ' ', _jsx("strong", { children: payingFor ? money(debtTotals(payingFor).remaining) : '' })] }), _jsxs("div", { className: "mt-12", children: [_jsx(NumberInput, { label: "\u0645\u0628\u0644\u063A \u0627\u0644\u062F\u0641\u0639\u0629", value: paymentAmount, onChange: setPaymentAmount, suffix: profile.currency }), _jsx(TextInput, { label: "\u0645\u0644\u0627\u062D\u0638\u0629", value: paymentNote, onChange: setPaymentNote, placeholder: "\u0646\u0642\u062F\u0627\u064B\u060C \u062A\u062D\u0648\u064A\u0644\u060C \u0634\u064A\u0643\u2026" })] })] }), _jsx(Modal, { open: Boolean(detail), title: `دفعات ${detail?.customerName ?? ''}`, onClose: () => {
                    setDetail(null);
                }, children: (detail?.payments?.length ?? 0) === 0 ? (_jsx("p", { className: "muted small", children: "\u0644\u0627 \u062A\u0648\u062C\u062F \u062F\u0641\u0639\u0627\u062A \u0645\u0633\u062C\u0651\u0644\u0629 \u0628\u0639\u062F." })) : (_jsx("div", { className: "table-wrap table-wrap--cards", children: _jsxs("table", { className: "data", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u0627\u0644\u062A\u0627\u0631\u064A\u062E" }), _jsx("th", { className: "num", children: "\u0627\u0644\u0645\u0628\u0644\u063A" }), _jsx("th", { children: "\u0645\u0644\u0627\u062D\u0638\u0629" }), _jsx("th", { children: "\u0625\u062C\u0631\u0627\u0621" })] }) }), _jsx("tbody", { children: detail?.payments.map((payment) => (_jsxs("tr", { children: [_jsx("td", { "data-label": "\u0627\u0644\u062A\u0627\u0631\u064A\u062E", children: formatDate(payment.date) }), _jsx("td", { className: "num", "data-label": "\u0627\u0644\u0645\u0628\u0644\u063A", children: money(payment.amount) }), _jsx("td", { "data-label": "\u0645\u0644\u0627\u062D\u0638\u0629", children: payment.note || '—' }), _jsx("td", { className: "actions", children: _jsx("button", { type: "button", className: "icon-btn", "aria-label": "\u062D\u0630\u0641 \u0627\u0644\u062F\u0641\u0639\u0629", onClick: () => {
                                                    void removePayment(detail, payment.id);
                                                }, children: "\u2715" }) })] }, payment.id))) })] }) })) }), _jsx(ConfirmDialog, { open: Boolean(toDelete), title: "\u062D\u0630\u0641 \u0627\u0644\u062F\u064A\u0646", message: `سيُحذف سجل «${toDelete?.customerName ?? ''}» وكل دفعاته نهائياً.`, onCancel: () => {
                    setToDelete(null);
                }, onConfirm: () => {
                    void confirmDelete();
                } })] }));
}
