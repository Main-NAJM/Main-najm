import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { Badge, ConfirmDialog, EmptyState, Modal, NumberInput, SectionTitle, StatCard, TextArea, TextInput, } from '@/components/ui';
import { PlusIcon } from '@/components/icons';
import { inventoryTotals, stockLevel } from '@/lib/calc';
import { formatInt, formatMoney, formatNumber, toNumber } from '@/lib/format';
const emptyItem = () => ({
    name: '',
    unit: 'قطعة',
    qty: 0,
    lowAt: 0,
    costPrice: 0,
    salePrice: 0,
    supplier: '',
    notes: '',
});
const LEVEL_BADGE = {
    out: { tone: 'danger', label: 'نفد' },
    low: { tone: 'warn', label: 'منخفض' },
    ok: { tone: 'ok', label: 'متوفّر' },
};
export default function Inventory() {
    const { inventory, profile, create, update, remove } = useData();
    const { notify, notifyError } = useToast();
    const [filter, setFilter] = useState('all');
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [draft, setDraft] = useState(emptyItem);
    const [saving, setSaving] = useState(false);
    const [toDelete, setToDelete] = useState(null);
    const [moving, setMoving] = useState(null);
    const [moveQty, setMoveQty] = useState('');
    const money = (value) => formatMoney(value, profile.currency);
    const totals = useMemo(() => inventoryTotals(inventory), [inventory]);
    // الأكثر إلحاحاً أوّلاً: ما نفد، ثم ما انخفض، ثم الباقي بالاسم.
    const visible = useMemo(() => {
        const rank = { out: 0, low: 1, ok: 2 };
        return inventory
            .filter((item) => {
            const level = stockLevel(item);
            if (filter === 'low')
                return level !== 'ok';
            if (filter === 'out')
                return level === 'out';
            return true;
        })
            .sort((a, b) => {
            const diff = rank[stockLevel(a)] - rank[stockLevel(b)];
            return diff !== 0 ? diff : a.name.localeCompare(b.name, 'ar');
        });
    }, [inventory, filter]);
    const openNew = () => {
        setEditing(null);
        setDraft(emptyItem());
        setFormOpen(true);
    };
    const openEdit = (item) => {
        setEditing(item);
        setDraft({
            name: item.name,
            unit: item.unit,
            qty: item.qty,
            lowAt: item.lowAt,
            costPrice: item.costPrice,
            salePrice: item.salePrice,
            supplier: item.supplier,
            notes: item.notes,
        });
        setFormOpen(true);
    };
    const patch = (value) => {
        setDraft((current) => ({ ...current, ...value }));
    };
    const save = async () => {
        if (!draft.name.trim()) {
            notify('اكتب اسم السلعة.', 'error');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...draft,
                name: draft.name.trim(),
                unit: draft.unit.trim() || 'قطعة',
                supplier: draft.supplier.trim(),
                notes: draft.notes.trim(),
            };
            if (editing) {
                await update('inventory', editing.id, payload);
                notify('حُفظت السلعة.');
            }
            else {
                await create('inventory', payload);
                notify('أُضيفت السلعة إلى المخزون.');
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
    /** إدخال أو إخراج كمية. الرصيد لا ينزل تحت الصفر. */
    const applyMove = async () => {
        if (!moving)
            return;
        const amount = toNumber(moveQty, Number.NaN);
        if (!Number.isFinite(amount) || amount <= 0) {
            notify('أدخل كمية أكبر من صفر.', 'error');
            return;
        }
        const current = Math.max(0, moving.item.qty || 0);
        const next = moving.direction === 'in' ? current + amount : Math.max(0, current - amount);
        if (moving.direction === 'out' && amount > current) {
            notify(`لا يوجد إلا ${formatNumber(current)} ${moving.item.unit} — أُخرج المتاح كلّه.`);
        }
        try {
            await update('inventory', moving.item.id, { qty: next });
            notify(moving.direction === 'in'
                ? `أُضيف ${formatNumber(amount)} ${moving.item.unit}.`
                : `أُخرج ${formatNumber(current - next)} ${moving.item.unit}.`);
            setMoving(null);
            setMoveQty('');
        }
        catch (error) {
            notifyError(error);
        }
    };
    const confirmDelete = async () => {
        if (!toDelete)
            return;
        try {
            await remove('inventory', toDelete.id);
            notify('حُذفت السلعة.');
        }
        catch (error) {
            notifyError(error);
        }
        finally {
            setToDelete(null);
        }
    };
    const chips = [
        { value: 'all', label: `الكل (${formatInt(totals.items)})` },
        { value: 'low', label: `تحتاج تموين (${formatInt(totals.needsRestock)})` },
        { value: 'out', label: `نفدت (${formatInt(totals.outOfStock)})` },
    ];
    if (inventory.length === 0) {
        return (_jsxs(_Fragment, { children: [_jsx(EmptyState, { title: "\u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0641\u0627\u0631\u063A", description: "\u0633\u062C\u0651\u0644 \u0627\u0644\u0633\u0644\u0639 \u0627\u0644\u062A\u064A \u062A\u0634\u062A\u0631\u064A\u0647\u0627 \u0648\u062A\u0628\u064A\u0639\u0647\u0627\u060C \u0648\u0636\u0639 \u0644\u0643\u0644 \u0633\u0644\u0639\u0629 \u062D\u062F\u0651 \u062A\u0646\u0628\u064A\u0647 \u2014 \u064A\u0646\u0628\u0651\u0647\u0643 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0642\u0628\u0644 \u0623\u0646 \u062A\u0646\u0641\u062F.", action: _jsx("button", { type: "button", className: "btn", onClick: openNew, children: "\u0625\u0636\u0627\u0641\u0629 \u0633\u0644\u0639\u0629" }) }), _jsx(ItemForm, { open: formOpen, editing: editing, draft: draft, saving: saving, currency: profile.currency, onPatch: patch, onClose: () => {
                        setFormOpen(false);
                    }, onSave: () => {
                        void save();
                    } })] }));
    }
    return (_jsxs(_Fragment, { children: [totals.needsRestock > 0 ? (_jsxs("div", { className: "notice notice--warn", children: [_jsx("strong", { children: formatInt(totals.needsRestock) }), " \u0633\u0644\u0639\u0629 \u062A\u062D\u062A\u0627\u062C \u062A\u0645\u0648\u064A\u0646", totals.outOfStock > 0 ? ` (منها ${formatInt(totals.outOfStock)} نفدت تماماً)` : '', "."] })) : null, _jsxs("div", { className: "stat-grid", children: [_jsx(StatCard, { label: "\u0639\u062F\u062F \u0627\u0644\u0633\u0644\u0639", value: formatInt(totals.items) }), _jsx(StatCard, { label: "\u062A\u062D\u062A\u0627\u062C \u062A\u0645\u0648\u064A\u0646", value: formatInt(totals.needsRestock), tone: totals.needsRestock > 0 ? 'warn' : 'ok' }), _jsx(StatCard, { label: "\u0642\u064A\u0645\u0629 \u0627\u0644\u0645\u062E\u0632\u0648\u0646", value: money(totals.value), tone: "info", sub: "\u0628\u0633\u0639\u0631 \u0627\u0644\u0634\u0631\u0627\u0621" })] }), _jsx("div", { className: "filters", children: chips.map((chip) => (_jsx("button", { type: "button", className: `chip${filter === chip.value ? ' is-active' : ''}`, onClick: () => {
                        setFilter(chip.value);
                    }, children: chip.label }, chip.value))) }), _jsx(SectionTitle, { action: _jsxs("button", { type: "button", className: "btn btn--sm", onClick: openNew, children: [_jsx(PlusIcon, { width: 16, height: 16 }), " \u0633\u0644\u0639\u0629"] }), children: "\u0627\u0644\u0633\u0644\u0639" }), visible.length === 0 ? (_jsx(EmptyState, { title: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0633\u0644\u0639 \u0641\u064A \u0647\u0630\u0627 \u0627\u0644\u062A\u0635\u0646\u064A\u0641", description: "\u062C\u0631\u0651\u0628 \u062A\u0635\u0646\u064A\u0641\u0627\u064B \u0622\u062E\u0631." })) : (_jsx("div", { className: "list", children: visible.map((item) => {
                    const level = stockLevel(item);
                    const badge = LEVEL_BADGE[level];
                    return (_jsxs("article", { className: "card", children: [_jsxs("div", { className: "card__head", children: [_jsxs("div", { children: [_jsx("h3", { className: "card__title", children: item.name }), _jsxs("p", { className: "card__sub", children: [formatNumber(item.qty), " ", item.unit, item.supplier ? ` · ${item.supplier}` : ''] })] }), _jsx(Badge, { tone: badge.tone, children: badge.label })] }), _jsxs("div", { className: "card__meta", children: [item.lowAt > 0 ? (_jsxs("span", { children: ["\u062D\u062F\u0651 \u0627\u0644\u062A\u0646\u0628\u064A\u0647", ' ', _jsxs("strong", { children: [formatNumber(item.lowAt), " ", item.unit] })] })) : null, item.costPrice > 0 ? (_jsxs("span", { children: ["\u0627\u0644\u0634\u0631\u0627\u0621 ", _jsx("strong", { children: money(item.costPrice) })] })) : null, item.salePrice > 0 ? (_jsxs("span", { children: ["\u0627\u0644\u0628\u064A\u0639 ", _jsx("strong", { children: money(item.salePrice) })] })) : null, item.costPrice > 0 ? (_jsxs("span", { children: ["\u0642\u064A\u0645\u0629 \u0627\u0644\u0631\u0635\u064A\u062F ", _jsx("strong", { children: money(item.qty * item.costPrice) })] })) : null] }), item.notes ? _jsx("p", { className: "small muted mt-8", children: item.notes }) : null, _jsxs("div", { className: "card__actions", children: [_jsx("button", { type: "button", className: "btn btn--soft btn--sm", onClick: () => {
                                            setMoving({ item, direction: 'in' });
                                            setMoveQty('');
                                        }, children: "\u0625\u062F\u062E\u0627\u0644" }), _jsx("button", { type: "button", className: "btn btn--soft btn--sm", disabled: item.qty <= 0, onClick: () => {
                                            setMoving({ item, direction: 'out' });
                                            setMoveQty('');
                                        }, children: "\u0625\u062E\u0631\u0627\u062C" }), _jsx("button", { type: "button", className: "btn btn--ghost btn--sm", onClick: () => {
                                            openEdit(item);
                                        }, children: "\u062A\u0639\u062F\u064A\u0644" }), _jsx("button", { type: "button", className: "btn btn--ghost btn--sm", onClick: () => {
                                            setToDelete(item);
                                        }, children: "\u062D\u0630\u0641" })] })] }, item.id));
                }) })), _jsx(ItemForm, { open: formOpen, editing: editing, draft: draft, saving: saving, currency: profile.currency, onPatch: patch, onClose: () => {
                    setFormOpen(false);
                }, onSave: () => {
                    void save();
                } }), _jsxs(Modal, { open: Boolean(moving), title: moving?.direction === 'in' ? 'إدخال إلى المخزون' : 'إخراج من المخزون', onClose: () => {
                    setMoving(null);
                }, footer: _jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "btn btn--ghost", onClick: () => {
                                setMoving(null);
                            }, children: "\u0625\u0644\u063A\u0627\u0621" }), _jsx("button", { type: "button", className: "btn", onClick: () => {
                                void applyMove();
                            }, children: "\u062D\u0641\u0638" })] }), children: [_jsxs("p", { className: "modal__message", children: [_jsx("strong", { children: moving?.item.name }), " \u2014 \u0627\u0644\u0631\u0635\u064A\u062F \u0627\u0644\u062D\u0627\u0644\u064A", ' ', _jsxs("strong", { children: [formatNumber(moving?.item.qty ?? 0), " ", moving?.item.unit] })] }), _jsx(NumberInput, { label: moving?.direction === 'in' ? 'الكمية الداخلة' : 'الكمية الخارجة', value: moveQty, onChange: setMoveQty, suffix: moving?.item.unit })] }), _jsx(ConfirmDialog, { open: Boolean(toDelete), title: "\u062D\u0630\u0641 \u0627\u0644\u0633\u0644\u0639\u0629", message: `ستُحذف «${toDelete?.name ?? ''}» من المخزون نهائياً.`, onCancel: () => {
                    setToDelete(null);
                }, onConfirm: () => {
                    void confirmDelete();
                } })] }));
}
/* ------------------------------------------------------------ نموذج السلعة */
function ItemForm({ open, editing, draft, saving, currency, onPatch, onClose, onSave, }) {
    return (_jsxs(Modal, { open: open, title: editing ? 'تعديل سلعة' : 'سلعة جديدة', onClose: onClose, footer: _jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "btn btn--ghost", onClick: onClose, children: "\u0625\u0644\u063A\u0627\u0621" }), _jsx("button", { type: "button", className: "btn", disabled: saving, onClick: onSave, children: saving ? 'جارٍ الحفظ…' : 'حفظ' })] }), children: [_jsx(TextInput, { label: "\u0627\u0633\u0645 \u0627\u0644\u0633\u0644\u0639\u0629", value: draft.name, onChange: (value) => {
                    onPatch({ name: value });
                }, placeholder: "\u0645\u062B\u0627\u0644: \u0644\u0648\u062D MDF \u0661\u0668 \u0645\u0644\u0645" }), _jsxs("div", { className: "grid-2", children: [_jsx(TextInput, { label: "\u0648\u062D\u062F\u0629 \u0627\u0644\u0639\u062F\u0651", value: draft.unit, onChange: (value) => {
                            onPatch({ unit: value });
                        }, placeholder: "\u0642\u0637\u0639\u0629\u060C \u0645\u062A\u0631\u060C \u0643\u064A\u0633\u2026" }), _jsx(TextInput, { label: "\u0627\u0644\u0645\u0648\u0631\u0651\u062F", value: draft.supplier, onChange: (value) => {
                            onPatch({ supplier: value });
                        }, placeholder: "\u0627\u0633\u0645 \u0627\u0644\u0645\u062D\u0644 \u0623\u0648 \u0627\u0644\u062A\u0627\u062C\u0631" })] }), _jsxs("div", { className: "grid-2", children: [_jsx(NumberInput, { label: "\u0627\u0644\u0643\u0645\u064A\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629", value: draft.qty, suffix: draft.unit, onChange: (value) => {
                            onPatch({ qty: toNumber(value) });
                        } }), _jsx(NumberInput, { label: "\u062D\u062F\u0651 \u0627\u0644\u062A\u0646\u0628\u064A\u0647", value: draft.lowAt, suffix: draft.unit, hint: "\u064A\u0646\u0628\u0651\u0647\u0643 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0645\u062A\u0649 \u0646\u0632\u0644 \u0627\u0644\u0631\u0635\u064A\u062F \u0625\u0644\u064A\u0647", onChange: (value) => {
                            onPatch({ lowAt: toNumber(value) });
                        } })] }), _jsxs("div", { className: "grid-2", children: [_jsx(NumberInput, { label: `سعر الشراء (${currency})`, value: draft.costPrice, onChange: (value) => {
                            onPatch({ costPrice: toNumber(value) });
                        } }), _jsx(NumberInput, { label: `سعر البيع (${currency})`, value: draft.salePrice, onChange: (value) => {
                            onPatch({ salePrice: toNumber(value) });
                        } })] }), _jsx(TextArea, { label: "\u0645\u0644\u0627\u062D\u0638\u0627\u062A", value: draft.notes, rows: 2, onChange: (value) => {
                    onPatch({ notes: value });
                } })] }));
}
