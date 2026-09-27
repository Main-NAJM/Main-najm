import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { Badge, ConfirmDialog, EmptyState, Modal, NumberInput, Select, TextInput, } from '@/components/ui';
import { priceChangePct } from '@/lib/calc';
import { MATERIAL_KINDS, materialKindLabel } from '@/lib/constants';
import { tradeMaterial } from '@/lib/trades';
import { formatDate, formatMoney, formatNumber, toNumber, todayIso } from '@/lib/format';
const emptyPrice = (kind) => ({
    kind,
    name: '',
    unit: MATERIAL_KINDS.find((m) => m.value === kind)?.unit ?? 'وحدة',
    price: 0,
    previousPrice: null,
    source: '',
    priceDate: todayIso(),
});
export default function MarketPrices() {
    const { marketPrices, profile, create, update, remove } = useData();
    const { notify, notifyError } = useToast();
    // صنف المادة الذي يخصّ مهنة صاحب الحساب — يُقترح عند إضافة سعر جديد.
    const defaultKind = tradeMaterial(profile.craft);
    const [filter, setFilter] = useState('all');
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [draft, setDraft] = useState(() => emptyPrice(defaultKind));
    const [saving, setSaving] = useState(false);
    const [toDelete, setToDelete] = useState(null);
    const [updating, setUpdating] = useState(null);
    const [newPrice, setNewPrice] = useState('');
    const visible = useMemo(() => (filter === 'all' ? marketPrices : marketPrices.filter((p) => p.kind === filter)), [marketPrices, filter]);
    const grouped = useMemo(() => {
        const map = new Map();
        visible.forEach((price) => {
            const list = map.get(price.kind) ?? [];
            list.push(price);
            map.set(price.kind, list);
        });
        return [...map.entries()].sort((a, b) => MATERIAL_KINDS.findIndex((m) => m.value === a[0]) -
            MATERIAL_KINDS.findIndex((m) => m.value === b[0]));
    }, [visible]);
    const openNew = () => {
        setEditing(null);
        setDraft(emptyPrice(filter === 'all' ? defaultKind : filter));
        setFormOpen(true);
    };
    const openEdit = (price) => {
        setEditing(price);
        setDraft({
            kind: price.kind,
            name: price.name,
            unit: price.unit,
            price: price.price,
            previousPrice: price.previousPrice,
            source: price.source,
            priceDate: price.priceDate,
        });
        setFormOpen(true);
    };
    const patch = (value) => {
        setDraft((current) => ({ ...current, ...value }));
    };
    const save = async () => {
        if (!draft.name.trim()) {
            notify('اكتب اسم المادة.', 'error');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...draft,
                name: draft.name.trim(),
                unit: draft.unit.trim() || 'وحدة',
                source: draft.source.trim(),
            };
            if (editing) {
                await update('marketPrices', editing.id, payload);
                notify('حُفظت المادة.');
            }
            else {
                await create('marketPrices', payload);
                notify('أُضيفت المادة إلى مؤشرات السوق.');
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
    /** تحديث السعر: السعر الحالي يصبح «السعر السابق» لحساب نسبة التغيّر. */
    const applyPriceUpdate = async () => {
        if (!updating)
            return;
        const value = toNumber(newPrice, Number.NaN);
        if (!Number.isFinite(value) || value < 0) {
            notify('أدخل سعراً صحيحاً.', 'error');
            return;
        }
        try {
            await update('marketPrices', updating.id, {
                previousPrice: updating.price,
                price: value,
                priceDate: todayIso(),
            });
            notify('حُدّث السعر.');
            setUpdating(null);
            setNewPrice('');
        }
        catch (error) {
            notifyError(error);
        }
    };
    const confirmDelete = async () => {
        if (!toDelete)
            return;
        try {
            await remove('marketPrices', toDelete.id);
            notify('حُذفت المادة.');
        }
        catch (error) {
            notifyError(error);
        }
        finally {
            setToDelete(null);
        }
    };
    const chips = [
        { value: 'all', label: 'الكل' },
        ...MATERIAL_KINDS.map((kind) => ({
            value: kind.value,
            label: materialKindLabel(kind.value, profile.customMaterial),
        })),
    ];
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "filters", children: chips.map((chip) => (_jsx("button", { type: "button", className: `chip${filter === chip.value ? ' is-active' : ''}`, onClick: () => {
                        setFilter(chip.value);
                    }, children: chip.label }, chip.value))) }), _jsx("p", { className: "small muted", children: "\u0633\u062C\u0651\u0644 \u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0645\u0648\u0627\u062F \u0627\u0644\u062A\u064A \u062A\u0634\u062A\u0631\u064A\u0647\u0627 \u0648\u062D\u062F\u0651\u062B\u0647\u0627 \u0643\u0644\u0645\u0627 \u062A\u063A\u064A\u0651\u0631 \u0627\u0644\u0633\u0648\u0642. \u0627\u0644\u0646\u0633\u0628\u0629 \u062A\u064F\u062D\u0633\u0628 \u0645\u0642\u0627\u0631\u0646\u0629 \u0628\u0622\u062E\u0631 \u0633\u0639\u0631 \u0645\u0633\u062C\u0651\u0644\u060C \u0648\u064A\u0645\u0643\u0646 \u0633\u062D\u0628 \u0627\u0644\u0633\u0639\u0631 \u0645\u0628\u0627\u0634\u0631\u0629 \u0625\u0644\u0649 \u062D\u0627\u0633\u0628\u0629 \u0627\u0644\u062A\u0643\u0644\u0641\u0629." }), grouped.length === 0 ? (_jsx("div", { className: "mt-16", children: _jsx(EmptyState, { title: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0623\u0633\u0639\u0627\u0631 \u0645\u0633\u062C\u0651\u0644\u0629", description: "\u0623\u0636\u0641 \u0627\u0644\u0645\u0648\u0627\u062F \u0627\u0644\u062A\u064A \u062A\u0633\u062A\u0639\u0645\u0644\u0647\u0627 (\u062E\u0634\u0628\u060C \u062D\u062F\u064A\u062F\u060C \u0642\u0645\u0627\u0634) \u0644\u062A\u062A\u0627\u0628\u0639 \u062A\u063A\u064A\u0651\u0631 \u0623\u0633\u0639\u0627\u0631\u0647\u0627.", action: _jsx("button", { type: "button", className: "btn", onClick: openNew, children: "\u0625\u0636\u0627\u0641\u0629 \u0645\u0627\u062F\u0629" }) }) })) : (grouped.map(([kind, prices]) => (_jsxs("section", { children: [_jsxs("div", { className: "section-title", children: [_jsx("h2", { children: materialKindLabel(kind, profile.customMaterial) }), _jsxs("span", { className: "small muted", children: [prices.length, " \u0645\u0627\u062F\u0629"] })] }), _jsx("div", { className: "list", children: prices.map((price) => {
                            const change = priceChangePct(price.price, price.previousPrice);
                            return (_jsxs("article", { className: "card", children: [_jsxs("div", { className: "card__head", children: [_jsxs("div", { children: [_jsx("h3", { className: "card__title", children: price.name }), _jsxs("p", { className: "card__sub", children: ["\u0644\u0643\u0644 ", price.unit, price.source ? ` · ${price.source}` : ''] })] }), _jsxs("div", { className: "text-end", children: [_jsx("strong", { className: "amount", children: formatMoney(price.price, profile.currency) }), _jsx("div", { children: change === null ? (_jsx(Badge, { tone: "muted", children: "\u0633\u0639\u0631 \u0623\u0648\u0644" })) : change > 0 ? (_jsxs(Badge, { tone: "danger", children: ["\u25B2 ", formatNumber(change), "\u066A"] })) : change < 0 ? (_jsxs(Badge, { tone: "ok", children: ["\u25BC ", formatNumber(Math.abs(change)), "\u066A"] })) : (_jsx(Badge, { tone: "muted", children: "\u062B\u0627\u0628\u062A" })) })] })] }), _jsxs("div", { className: "card__meta", children: [_jsxs("span", { children: ["\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0633\u0639\u0631 ", _jsx("strong", { children: formatDate(price.priceDate) })] }), price.previousPrice ? (_jsxs("span", { children: ["\u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u0633\u0627\u0628\u0642", ' ', _jsx("strong", { children: formatMoney(price.previousPrice, profile.currency) })] })) : null] }), _jsxs("div", { className: "card__actions", children: [_jsx("button", { type: "button", className: "btn btn--soft btn--sm", onClick: () => {
                                                    setUpdating(price);
                                                    setNewPrice(String(price.price));
                                                }, children: "\u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0633\u0639\u0631" }), _jsx("button", { type: "button", className: "btn btn--ghost btn--sm", onClick: () => {
                                                    openEdit(price);
                                                }, children: "\u062A\u0639\u062F\u064A\u0644" }), _jsx("button", { type: "button", className: "btn btn--ghost btn--sm", onClick: () => {
                                                    setToDelete(price);
                                                }, children: "\u062D\u0630\u0641" })] })] }, price.id));
                        }) })] }, kind)))), _jsx("button", { type: "button", className: "fab", onClick: openNew, children: "+ \u0645\u0627\u062F\u0629 \u062C\u062F\u064A\u062F\u0629" }), _jsxs(Modal, { open: formOpen, title: editing ? 'تعديل المادة' : 'مادة جديدة', onClose: () => {
                    setFormOpen(false);
                }, footer: _jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "btn btn--ghost", onClick: () => {
                                setFormOpen(false);
                            }, children: "\u0625\u0644\u063A\u0627\u0621" }), _jsx("button", { type: "button", className: "btn", disabled: saving, onClick: () => {
                                void save();
                            }, children: saving ? 'جارٍ الحفظ…' : 'حفظ' })] }), children: [_jsx(Select, { label: "\u0646\u0648\u0639 \u0627\u0644\u0645\u0627\u062F\u0629", value: draft.kind, options: MATERIAL_KINDS.map((m) => ({
                            value: m.value,
                            label: materialKindLabel(m.value, profile.customMaterial),
                        })), onChange: (value) => {
                            patch({
                                kind: value,
                                unit: MATERIAL_KINDS.find((m) => m.value === value)?.unit ?? draft.unit,
                            });
                        } }), _jsx(TextInput, { label: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0627\u062F\u0629", value: draft.name, onChange: (value) => {
                            patch({ name: value });
                        }, placeholder: "\u0645\u062B\u0627\u0644: \u0644\u0648\u062D MDF \u0661\u0668 \u0645\u0644\u0645", autoFocus: true }), _jsxs("div", { className: "grid-2", children: [_jsx(TextInput, { label: "\u0627\u0644\u0648\u062D\u062F\u0629", value: draft.unit, onChange: (value) => {
                                    patch({ unit: value });
                                }, placeholder: "\u0645\u062A\u0631\u060C \u0637\u0646\u060C \u0644\u0648\u062D\u2026" }), _jsx(NumberInput, { label: "\u0627\u0644\u0633\u0639\u0631", value: draft.price, onChange: (value) => {
                                    patch({ price: toNumber(value) });
                                } })] }), _jsxs("div", { className: "grid-2", children: [_jsx(TextInput, { label: "\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0633\u0639\u0631", type: "date", value: draft.priceDate, onChange: (value) => {
                                    patch({ priceDate: value });
                                } }), _jsx(TextInput, { label: "\u0627\u0644\u0645\u0635\u062F\u0631", value: draft.source, onChange: (value) => {
                                    patch({ source: value });
                                }, placeholder: "\u0627\u0633\u0645 \u0627\u0644\u0645\u062D\u0644 \u0623\u0648 \u0627\u0644\u0633\u0648\u0642" })] })] }), _jsxs(Modal, { open: Boolean(updating), title: `تحديث سعر ${updating?.name ?? ''}`, onClose: () => {
                    setUpdating(null);
                }, footer: _jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "btn btn--ghost", onClick: () => {
                                setUpdating(null);
                            }, children: "\u0625\u0644\u063A\u0627\u0621" }), _jsx("button", { type: "button", className: "btn", onClick: () => {
                                void applyPriceUpdate();
                            }, children: "\u062D\u0641\u0638 \u0627\u0644\u0633\u0639\u0631" })] }), children: [_jsxs("p", { className: "small muted", children: ["\u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u062D\u0627\u0644\u064A:", ' ', _jsx("strong", { children: updating ? formatMoney(updating.price, profile.currency) : '' }), " \u2014 \u0633\u064A\u064F\u062D\u0641\u0638 \u0643\u0633\u0639\u0631 \u0633\u0627\u0628\u0642 \u0644\u062D\u0633\u0627\u0628 \u0646\u0633\u0628\u0629 \u0627\u0644\u062A\u063A\u064A\u0651\u0631."] }), _jsx("div", { className: "mt-12", children: _jsx(NumberInput, { label: "\u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u062C\u062F\u064A\u062F", value: newPrice, onChange: setNewPrice }) })] }), _jsx(ConfirmDialog, { open: Boolean(toDelete), title: "\u062D\u0630\u0641 \u0627\u0644\u0645\u0627\u062F\u0629", message: `سيُحذف سعر «${toDelete?.name ?? ''}» نهائياً.`, onCancel: () => {
                    setToDelete(null);
                }, onConfirm: () => {
                    void confirmDelete();
                } })] }));
}
