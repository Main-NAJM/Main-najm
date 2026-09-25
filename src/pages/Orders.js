import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { Badge, ConfirmDialog, EmptyState, LineItems, Modal, NumberInput, Select, TextArea, TextInput, } from '@/components/ui';
import { orderTotals } from '@/lib/calc';
import { ORDER_STATUSES, orderStatusLabel, orderStatusTone } from '@/lib/constants';
import { formatDate, formatMoney, relativeDayLabel, telHref, toNumber, todayIso, } from '@/lib/format';
import { buildInvoice } from '@/print/templates';
import { printHtml } from '@/print/print';
const emptyOrder = () => ({
    title: '',
    customerName: '',
    phone: '',
    address: '',
    notes: '',
    status: 'in_progress',
    items: [{ name: '', qty: 1, unitPrice: 0 }],
    extraCharges: 0,
    discount: 0,
    paid: 0,
    dueDate: todayIso(),
});
export default function Orders() {
    const { orders, profile, create, update, remove } = useData();
    const { notify, notifyError } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [editing, setEditing] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [draft, setDraft] = useState(emptyOrder);
    const [saving, setSaving] = useState(false);
    const [toDelete, setToDelete] = useState(null);
    // فتح نموذج طلبية جديدة عبر اختصار التطبيق (?new=1).
    useEffect(() => {
        if (searchParams.get('new') === '1') {
            setEditing(null);
            setDraft(emptyOrder());
            setFormOpen(true);
            searchParams.delete('new');
            setSearchParams(searchParams, { replace: true });
        }
    }, [searchParams, setSearchParams]);
    const counts = useMemo(() => {
        const base = {
            all: orders.length,
            in_progress: 0,
            pending: 0,
            completed: 0,
        };
        orders.forEach((order) => {
            base[order.status] += 1;
        });
        return base;
    }, [orders]);
    const visible = useMemo(() => {
        const term = search.trim().toLowerCase();
        return orders.filter((order) => {
            if (filter !== 'all' && order.status !== filter)
                return false;
            if (!term)
                return true;
            return [order.title, order.customerName, order.phone, order.address, order.notes]
                .join(' ')
                .toLowerCase()
                .includes(term);
        });
    }, [orders, filter, search]);
    const openNew = () => {
        setEditing(null);
        setDraft({ ...emptyOrder(), items: [{ name: '', qty: 1, unitPrice: 0 }] });
        setFormOpen(true);
    };
    const openEdit = (order) => {
        setEditing(order);
        setDraft({
            title: order.title,
            customerName: order.customerName,
            phone: order.phone,
            address: order.address,
            notes: order.notes,
            status: order.status,
            items: order.items?.length ? order.items.map((item) => ({ ...item })) : [{ name: '', qty: 1, unitPrice: 0 }],
            extraCharges: order.extraCharges,
            discount: order.discount,
            paid: order.paid,
            dueDate: order.dueDate,
        });
        setFormOpen(true);
    };
    const patchDraft = (patch) => {
        setDraft((current) => ({ ...current, ...patch }));
    };
    const patchItem = (index, patch) => {
        setDraft((current) => ({
            ...current,
            items: current.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
        }));
    };
    const addItem = () => {
        setDraft((current) => ({
            ...current,
            items: [...current.items, { name: '', qty: 1, unitPrice: 0 }],
        }));
    };
    const removeItem = (index) => {
        setDraft((current) => ({
            ...current,
            items: current.items.filter((_, i) => i !== index),
        }));
    };
    const draftTotals = orderTotals({
        ...draft,
        items: draft.items.filter((item) => item.name.trim() || item.unitPrice > 0),
    });
    const save = async () => {
        if (!draft.title.trim() && !draft.customerName.trim()) {
            notify('أدخل عنوان الطلبية أو اسم الزبون على الأقل.', 'error');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...draft,
                title: draft.title.trim() || draft.customerName.trim(),
                customerName: draft.customerName.trim(),
                phone: draft.phone.trim(),
                address: draft.address.trim(),
                notes: draft.notes.trim(),
                items: draft.items
                    .filter((item) => item.name.trim() || item.qty > 0 || item.unitPrice > 0)
                    .map((item) => ({
                    name: item.name.trim() || 'بند',
                    qty: item.qty || 0,
                    unitPrice: item.unitPrice || 0,
                })),
            };
            if (editing) {
                await update('orders', editing.id, payload);
                notify('حُفظت تعديلات الطلبية.');
            }
            else {
                await create('orders', payload);
                notify('أُضيفت الطلبية.');
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
    const changeStatus = async (order, status) => {
        try {
            await update('orders', order.id, { status });
            notify(`الطلبية الآن: ${orderStatusLabel(status)}`);
        }
        catch (error) {
            notifyError(error);
        }
    };
    const confirmDelete = async () => {
        if (!toDelete)
            return;
        try {
            await remove('orders', toDelete.id);
            notify('حُذفت الطلبية.');
        }
        catch (error) {
            notifyError(error);
        }
        finally {
            setToDelete(null);
        }
    };
    const printInvoice = (order) => {
        printHtml(`فاتورة - ${order.title}`, buildInvoice(order, profile));
    };
    const filterChips = [
        { value: 'all', label: 'الكل' },
        ...ORDER_STATUSES.map((status) => ({ value: status.value, label: status.label })),
    ];
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "search-bar", children: [_jsx("span", { className: "search-bar__icon", children: "\u2315" }), _jsx("input", { className: "input", type: "search", placeholder: "\u0627\u0628\u062D\u062B \u0628\u0627\u0633\u0645 \u0627\u0644\u0632\u0628\u0648\u0646 \u0623\u0648 \u0627\u0644\u0637\u0644\u0628\u064A\u0629 \u0623\u0648 \u0627\u0644\u0647\u0627\u062A\u0641", value: search, onChange: (event) => {
                            setSearch(event.target.value);
                        } })] }), _jsx("div", { className: "filters", children: filterChips.map((chip) => (_jsxs("button", { type: "button", className: `chip${filter === chip.value ? ' is-active' : ''}`, onClick: () => {
                        setFilter(chip.value);
                    }, children: [chip.label, " (", counts[chip.value], ")"] }, chip.value))) }), visible.length === 0 ? (_jsx(EmptyState, { title: orders.length === 0 ? 'لا توجد طلبيات بعد' : 'لا نتائج مطابقة', description: orders.length === 0
                    ? 'أضف أول طلبية لتتابع حالتها ومبالغها ومواعيد تسليمها.'
                    : 'جرّب تغيير كلمة البحث أو الفلتر.', action: orders.length === 0 ? (_jsx("button", { type: "button", className: "btn", onClick: openNew, children: "\u0625\u0636\u0627\u0641\u0629 \u0637\u0644\u0628\u064A\u0629" })) : null })) : (_jsx("div", { className: "list", children: visible.map((order) => {
                    const totals = orderTotals(order);
                    const tel = telHref(order.phone);
                    const late = order.status !== 'completed' &&
                        order.dueDate &&
                        relativeDayLabel(order.dueDate).startsWith('متأخر');
                    return (_jsxs("article", { className: "card", children: [_jsxs("div", { className: "card__head", children: [_jsxs("div", { children: [_jsx("h3", { className: "card__title", children: order.title }), _jsx("p", { className: "card__sub", children: order.customerName || 'بدون اسم زبون' })] }), _jsx(Badge, { tone: orderStatusTone(order.status), children: orderStatusLabel(order.status) })] }), _jsxs("div", { className: "card__meta", children: [_jsxs("span", { children: ["\u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A ", _jsx("strong", { children: formatMoney(totals.total, profile.currency) })] }), _jsxs("span", { children: ["\u0627\u0644\u0645\u062A\u0628\u0642\u0651\u064A ", _jsx("strong", { children: formatMoney(totals.remaining, profile.currency) })] }), order.dueDate ? (_jsxs("span", { children: ["\u0627\u0644\u062A\u0633\u0644\u064A\u0645 ", _jsx("strong", { children: formatDate(order.dueDate) }), late ? _jsxs(Badge, { tone: "danger", children: [" ", relativeDayLabel(order.dueDate)] }) : null] })) : null, order.phone ? (_jsxs("span", { children: ["\u0627\u0644\u0647\u0627\u062A\u0641", ' ', tel ? (_jsx("a", { href: tel, children: _jsx("strong", { children: order.phone }) })) : (_jsx("strong", { children: order.phone }))] })) : null] }), totals.total > 0 ? (_jsx("div", { className: "progress", "aria-hidden": "true", children: _jsx("div", { className: "progress__bar", style: { width: `${Math.min(100, (totals.paid / totals.total) * 100)}%` } }) })) : null, _jsxs("div", { className: "card__actions", children: [_jsx("select", { className: "input input--select input--compact", value: order.status, onChange: (event) => {
                                            void changeStatus(order, event.target.value);
                                        }, "aria-label": "\u062D\u0627\u0644\u0629 \u0627\u0644\u0637\u0644\u0628\u064A\u0629", children: ORDER_STATUSES.map((status) => (_jsx("option", { value: status.value, children: status.label }, status.value))) }), _jsx("button", { type: "button", className: "btn btn--ghost btn--sm", onClick: () => {
                                            openEdit(order);
                                        }, children: "\u062A\u0639\u062F\u064A\u0644" }), _jsx("button", { type: "button", className: "btn btn--soft btn--sm", onClick: () => {
                                            printInvoice(order);
                                        }, children: "\u0637\u0628\u0627\u0639\u0629 \u0641\u0627\u062A\u0648\u0631\u0629" }), _jsx("button", { type: "button", className: "btn btn--ghost btn--sm", onClick: () => {
                                            setToDelete(order);
                                        }, children: "\u062D\u0630\u0641" })] })] }, order.id));
                }) })), _jsx("button", { type: "button", className: "fab", onClick: openNew, children: "+ \u0637\u0644\u0628\u064A\u0629 \u062C\u062F\u064A\u062F\u0629" }), _jsxs(Modal, { open: formOpen, wide: true, title: editing ? 'تعديل الطلبية' : 'طلبية جديدة', onClose: () => {
                    setFormOpen(false);
                }, footer: _jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "btn btn--ghost", onClick: () => {
                                setFormOpen(false);
                            }, children: "\u0625\u0644\u063A\u0627\u0621" }), _jsx("button", { type: "button", className: "btn", disabled: saving, onClick: () => {
                                void save();
                            }, children: saving ? 'جارٍ الحفظ…' : 'حفظ' })] }), children: [_jsx(TextInput, { label: "\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0637\u0644\u0628\u064A\u0629", value: draft.title, onChange: (value) => {
                            patchDraft({ title: value });
                        }, placeholder: "\u0645\u062B\u0627\u0644: \u062E\u0632\u0627\u0646\u0629 \u0645\u0644\u0627\u0628\u0633 \u0628\u0627\u0628\u064A\u0646", autoFocus: true }), _jsxs("div", { className: "grid-2", children: [_jsx(TextInput, { label: "\u0627\u0633\u0645 \u0627\u0644\u0632\u0628\u0648\u0646", value: draft.customerName, onChange: (value) => {
                                    patchDraft({ customerName: value });
                                } }), _jsx(TextInput, { label: "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641", type: "tel", inputMode: "tel", value: draft.phone, onChange: (value) => {
                                    patchDraft({ phone: value });
                                } })] }), _jsx(TextInput, { label: "\u0627\u0644\u0639\u0646\u0648\u0627\u0646", value: draft.address, onChange: (value) => {
                            patchDraft({ address: value });
                        } }), _jsxs("div", { className: "grid-2", children: [_jsx(Select, { label: "\u0627\u0644\u062D\u0627\u0644\u0629", value: draft.status, options: ORDER_STATUSES.map((s) => ({ value: s.value, label: s.label })), onChange: (value) => {
                                    patchDraft({ status: value });
                                } }), _jsx(TextInput, { label: "\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u062A\u0633\u0644\u064A\u0645", type: "date", value: draft.dueDate, onChange: (value) => {
                                    patchDraft({ dueDate: value });
                                } })] }), _jsxs("div", { className: "section-title", children: [_jsx("h2", { children: "\u0628\u0646\u0648\u062F \u0627\u0644\u0637\u0644\u0628\u064A\u0629" }), _jsx("button", { type: "button", className: "btn btn--soft btn--sm", onClick: addItem, children: "+ \u0628\u0646\u062F" })] }), _jsx(LineItems, { rows: draft.items, nameLabel: "\u0627\u0644\u0648\u0635\u0641", namePlaceholder: "\u0645\u062B\u0627\u0644: \u0623\u0644\u0648\u0627\u062D \u062E\u0634\u0628", onPatch: patchItem, onRemove: removeItem, toNumber: (value) => toNumber(value) }), _jsxs("div", { className: "grid-3 mt-12", children: [_jsx(NumberInput, { label: "\u0623\u062C\u0648\u0631 \u0625\u0636\u0627\u0641\u064A\u0629", value: draft.extraCharges, onChange: (value) => {
                                    patchDraft({ extraCharges: toNumber(value) });
                                } }), _jsx(NumberInput, { label: "\u062E\u0635\u0645", value: draft.discount, onChange: (value) => {
                                    patchDraft({ discount: toNumber(value) });
                                } }), _jsx(NumberInput, { label: "\u0627\u0644\u0645\u062F\u0641\u0648\u0639", value: draft.paid, onChange: (value) => {
                                    patchDraft({ paid: toNumber(value) });
                                } })] }), _jsxs("div", { className: "summary-box mt-8", children: [_jsxs("div", { className: "summary-row", children: [_jsx("span", { children: "\u0645\u062C\u0645\u0648\u0639 \u0627\u0644\u0628\u0646\u0648\u062F" }), _jsx("span", { children: formatMoney(draftTotals.itemsTotal, profile.currency) })] }), _jsxs("div", { className: "summary-row", children: [_jsx("span", { children: "\u0627\u0644\u0645\u062F\u0641\u0648\u0639" }), _jsx("span", { children: formatMoney(draftTotals.paid, profile.currency) })] }), _jsxs("div", { className: "summary-row", children: [_jsx("span", { children: "\u0627\u0644\u0645\u062A\u0628\u0642\u0651\u064A" }), _jsx("span", { children: formatMoney(draftTotals.remaining, profile.currency) })] }), _jsxs("div", { className: "summary-row summary-row--total", children: [_jsx("span", { children: "\u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A" }), _jsx("span", { children: formatMoney(draftTotals.total, profile.currency) })] })] }), _jsx(TextArea, { label: "\u0645\u0644\u0627\u062D\u0638\u0627\u062A", value: draft.notes, onChange: (value) => {
                            patchDraft({ notes: value });
                        }, placeholder: "\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u062E\u0627\u0645\u0627\u062A\u060C \u0627\u0644\u0645\u0642\u0627\u0633\u0627\u062A\u060C \u0623\u0648 \u0623\u064A \u0627\u062A\u0641\u0627\u0642 \u0645\u0639 \u0627\u0644\u0632\u0628\u0648\u0646" })] }), _jsx(ConfirmDialog, { open: Boolean(toDelete), title: "\u062D\u0630\u0641 \u0627\u0644\u0637\u0644\u0628\u064A\u0629", message: `سيُحذف سجل «${toDelete?.title ?? ''}» نهائياً. هل تريد المتابعة؟`, onCancel: () => {
                    setToDelete(null);
                }, onConfirm: () => {
                    void confirmDelete();
                } })] }));
}
