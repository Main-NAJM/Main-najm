import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { ConfirmDialog, EmptyState, LineItems, Modal, NumberInput, SectionTitle, TextArea, TextInput, } from '@/components/ui';
import { computeCalculation } from '@/lib/calc';
import { formatDateTime, formatMoney, formatNumber, percent, toNumber } from '@/lib/format';
import { buildCalculationSheet } from '@/print/templates';
import { printHtml } from '@/print/print';
export default function Calculator() {
    const { calculations, marketPrices, profile, create, remove } = useData();
    const { notify, notifyError } = useToast();
    const [draft, setDraft] = useState(() => ({
        title: '',
        materials: [{ name: '', qty: 1, unitPrice: 0 }],
        laborHours: 0,
        laborRate: profile.defaultLaborRate,
        overhead: 0,
        wastePct: 5,
        marginPct: profile.defaultMarginPct,
        notes: '',
    }));
    const [saving, setSaving] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [toDelete, setToDelete] = useState(null);
    const result = useMemo(() => computeCalculation(draft), [draft]);
    const patch = (value) => {
        setDraft((current) => ({ ...current, ...value }));
    };
    const patchMaterial = (index, value) => {
        setDraft((current) => ({
            ...current,
            materials: current.materials.map((m, i) => (i === index ? { ...m, ...value } : m)),
        }));
    };
    const addMaterial = () => {
        setDraft((current) => ({
            ...current,
            materials: [...current.materials, { name: '', qty: 1, unitPrice: 0 }],
        }));
    };
    const removeMaterial = (index) => {
        setDraft((current) => ({
            ...current,
            materials: current.materials.filter((_, i) => i !== index),
        }));
    };
    /** يضيف مادة بسعرها الحالي من مؤشرات السوق. */
    const addFromMarket = (id) => {
        const price = marketPrices.find((item) => item.id === id);
        if (!price)
            return;
        setDraft((current) => ({
            ...current,
            materials: [
                ...current.materials.filter((m) => m.name.trim() || m.unitPrice > 0),
                { name: `${price.name} (${price.unit})`, qty: 1, unitPrice: price.price },
            ],
        }));
        notify(`أُضيفت «${price.name}» بسعر السوق الحالي.`);
    };
    const reset = () => {
        setDraft({
            title: '',
            materials: [{ name: '', qty: 1, unitPrice: 0 }],
            laborHours: 0,
            laborRate: profile.defaultLaborRate,
            overhead: 0,
            wastePct: 5,
            marginPct: profile.defaultMarginPct,
            notes: '',
        });
    };
    const save = async () => {
        const materials = draft.materials.filter((m) => m.name.trim() || m.unitPrice > 0);
        if (!draft.title.trim() && materials.length === 0 && draft.laborHours === 0) {
            notify('أضف عنواناً أو مادة أو ساعات عمل قبل الحفظ.', 'error');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                title: draft.title.trim() || 'حساب بدون عنوان',
                materials: materials.map((m) => ({
                    name: m.name.trim() || 'مادة',
                    qty: m.qty || 0,
                    unitPrice: m.unitPrice || 0,
                })),
                laborHours: draft.laborHours,
                laborRate: draft.laborRate,
                overhead: draft.overhead,
                wastePct: draft.wastePct,
                marginPct: draft.marginPct,
                materialsCost: result.materialsCost,
                laborCost: result.laborCost,
                totalCost: result.totalCost,
                profit: result.profit,
                suggestedPrice: result.suggestedPrice,
                notes: draft.notes.trim(),
            };
            await create('calculations', payload);
            notify('حُفظ الحساب في السجل.');
        }
        catch (error) {
            notifyError(error);
        }
        finally {
            setSaving(false);
        }
    };
    const loadFromHistory = (calc) => {
        setDraft({
            title: calc.title,
            materials: calc.materials?.length
                ? calc.materials.map((m) => ({ ...m }))
                : [{ name: '', qty: 1, unitPrice: 0 }],
            laborHours: calc.laborHours,
            laborRate: calc.laborRate,
            overhead: calc.overhead,
            wastePct: calc.wastePct,
            marginPct: calc.marginPct,
            notes: calc.notes,
        });
        setHistoryOpen(false);
        notify('حُمّل الحساب في النموذج، يمكنك تعديله.');
    };
    const confirmDelete = async () => {
        if (!toDelete)
            return;
        try {
            await remove('calculations', toDelete.id);
            notify('حُذف الحساب من السجل.');
        }
        catch (error) {
            notifyError(error);
        }
        finally {
            setToDelete(null);
        }
    };
    const money = (value) => formatMoney(value, profile.currency);
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "card", children: [_jsx(TextInput, { label: "\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u062D\u0633\u0627\u0628", value: draft.title, onChange: (value) => {
                            patch({ title: value });
                        }, placeholder: "\u0645\u062B\u0627\u0644: \u062A\u0633\u0639\u064A\u0631 \u062E\u0632\u0627\u0646\u0629 \u0628\u0627\u0628\u064A\u0646" }), _jsx(SectionTitle, { action: _jsx("button", { type: "button", className: "btn btn--soft btn--sm", onClick: addMaterial, children: "+ \u0645\u0627\u062F\u0629" }), children: "\u0627\u0644\u0645\u0648\u0627\u062F" }), _jsx(LineItems, { rows: draft.materials, nameLabel: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0627\u062F\u0629", namePlaceholder: "\u0645\u062B\u0627\u0644: \u0644\u0648\u062D \u062E\u0634\u0628", onPatch: patchMaterial, onRemove: removeMaterial, toNumber: (value) => toNumber(value) }), marketPrices.length > 0 ? (_jsxs("div", { className: "mt-12", children: [_jsx("label", { className: "field__label", htmlFor: "market-pick", children: "\u0625\u0636\u0627\u0641\u0629 \u0645\u0627\u062F\u0629 \u0645\u0646 \u0645\u0624\u0634\u0631\u0627\u062A \u0627\u0644\u0633\u0648\u0642" }), _jsxs("select", { id: "market-pick", className: "input input--select", value: "", onChange: (event) => {
                                    if (event.target.value)
                                        addFromMarket(event.target.value);
                                }, children: [_jsx("option", { value: "", children: "\u0627\u062E\u062A\u0631 \u0645\u0627\u062F\u0629\u2026" }), marketPrices.map((price) => (_jsxs("option", { value: price.id, children: [price.name, " \u2014 ", money(price.price), " / ", price.unit] }, price.id)))] })] })) : null, _jsx(SectionTitle, { children: "\u0627\u0644\u0639\u0645\u0644 \u0648\u0627\u0644\u0645\u0635\u0627\u0631\u064A\u0641" }), _jsxs("div", { className: "grid-2", children: [_jsx(NumberInput, { label: "\u0633\u0627\u0639\u0627\u062A \u0627\u0644\u0639\u0645\u0644", suffix: "\u0633\u0627\u0639\u0629", value: draft.laborHours, onChange: (value) => {
                                    patch({ laborHours: toNumber(value) });
                                } }), _jsx(NumberInput, { label: "\u0623\u062C\u0631\u0629 \u0627\u0644\u0633\u0627\u0639\u0629", value: draft.laborRate, onChange: (value) => {
                                    patch({ laborRate: toNumber(value) });
                                } })] }), _jsxs("div", { className: "grid-3", children: [_jsx(NumberInput, { label: "\u0645\u0635\u0627\u0631\u064A\u0641 \u0639\u0627\u0645\u0629", value: draft.overhead, onChange: (value) => {
                                    patch({ overhead: toNumber(value) });
                                }, hint: "\u0643\u0647\u0631\u0628\u0627\u0621\u060C \u0646\u0642\u0644\u060C \u0625\u064A\u062C\u0627\u0631" }), _jsx(NumberInput, { label: "\u0646\u0633\u0628\u0629 \u0627\u0644\u0647\u0627\u0644\u0643", suffix: "\u066A", value: draft.wastePct, onChange: (value) => {
                                    patch({ wastePct: toNumber(value) });
                                } }), _jsx(NumberInput, { label: "\u0646\u0633\u0628\u0629 \u0627\u0644\u0631\u0628\u062D", suffix: "\u066A", value: draft.marginPct, onChange: (value) => {
                                    patch({ marginPct: toNumber(value) });
                                } })] }), _jsxs("div", { className: "summary-box mt-12", children: [_jsxs("div", { className: "summary-row", children: [_jsx("span", { children: "\u062A\u0643\u0644\u0641\u0629 \u0627\u0644\u0645\u0648\u0627\u062F (\u0645\u0639 \u0627\u0644\u0647\u0627\u0644\u0643)" }), _jsx("span", { children: money(result.materialsCost) })] }), _jsxs("div", { className: "summary-row", children: [_jsx("span", { children: "\u0623\u062C\u0648\u0631 \u0627\u0644\u0639\u0645\u0644" }), _jsx("span", { children: money(result.laborCost) })] }), _jsxs("div", { className: "summary-row", children: [_jsx("span", { children: "\u0645\u0635\u0627\u0631\u064A\u0641 \u0639\u0627\u0645\u0629" }), _jsx("span", { children: money(result.overhead) })] }), _jsxs("div", { className: "summary-row", children: [_jsx("span", { children: "\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u062A\u0643\u0644\u0641\u0629" }), _jsx("span", { children: money(result.totalCost) })] }), _jsxs("div", { className: "summary-row", children: [_jsxs("span", { children: ["\u0627\u0644\u0631\u0628\u062D \u0627\u0644\u0645\u062A\u0648\u0642\u0651\u0639 (", percent(draft.marginPct), " \u0645\u0646 \u0627\u0644\u062A\u0643\u0644\u0641\u0629)"] }), _jsx("span", { children: money(result.profit) })] }), _jsxs("div", { className: "summary-row summary-row--total", children: [_jsx("span", { children: "\u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u0645\u0642\u062A\u0631\u062D" }), _jsx("span", { children: money(result.suggestedPrice) })] }), _jsxs("p", { className: "small muted mt-8", children: ["\u0647\u0627\u0645\u0634 \u0627\u0644\u0631\u0628\u062D \u0645\u0646 \u0633\u0639\u0631 \u0627\u0644\u0628\u064A\u0639: ", percent(result.marginOfPrice)] })] }), _jsx(TextArea, { label: "\u0645\u0644\u0627\u062D\u0638\u0627\u062A", value: draft.notes, onChange: (value) => {
                            patch({ notes: value });
                        } }), _jsxs("div", { className: "card__actions", children: [_jsx("button", { type: "button", className: "btn", disabled: saving, onClick: () => {
                                    void save();
                                }, children: saving ? 'جارٍ الحفظ…' : 'حفظ في السجل' }), _jsx("button", { type: "button", className: "btn btn--soft btn--sm", onClick: () => {
                                    printHtml('ورقة تسعير', buildCalculationSheet({
                                        id: 'draft',
                                        createdAt: Date.now(),
                                        updatedAt: Date.now(),
                                        ...draft,
                                        materialsCost: result.materialsCost,
                                        laborCost: result.laborCost,
                                        totalCost: result.totalCost,
                                        profit: result.profit,
                                        suggestedPrice: result.suggestedPrice,
                                    }, profile));
                                }, children: "\u0637\u0628\u0627\u0639\u0629" }), _jsx("button", { type: "button", className: "btn btn--ghost btn--sm", onClick: reset, children: "\u062A\u0641\u0631\u064A\u063A" }), _jsxs("button", { type: "button", className: "btn btn--ghost btn--sm", onClick: () => {
                                    setHistoryOpen(true);
                                }, children: ["\u0627\u0644\u0633\u062C\u0644 (", calculations.length, ")"] })] })] }), _jsx(Modal, { open: historyOpen, wide: true, title: "\u0633\u062C\u0644 \u0627\u0644\u062D\u0633\u0627\u0628\u0627\u062A \u0627\u0644\u0633\u0627\u0628\u0642\u0629", onClose: () => {
                    setHistoryOpen(false);
                }, children: calculations.length === 0 ? (_jsx(EmptyState, { title: "\u0644\u0627 \u062A\u0648\u062C\u062F \u062D\u0633\u0627\u0628\u0627\u062A \u0645\u062D\u0641\u0648\u0638\u0629", description: "\u0643\u0644 \u062D\u0633\u0627\u0628 \u062A\u062D\u0641\u0638\u0647 \u064A\u0638\u0647\u0631 \u0647\u0646\u0627 \u0644\u062A\u0639\u0648\u062F \u0625\u0644\u064A\u0647 \u0623\u0648 \u062A\u0639\u064A\u062F \u0627\u0633\u062A\u062E\u062F\u0627\u0645\u0647 \u0644\u0627\u062D\u0642\u0627\u064B." })) : (_jsx("div", { className: "list", children: calculations.map((calc) => (_jsxs("article", { className: "card", children: [_jsxs("div", { className: "card__head", children: [_jsxs("div", { children: [_jsx("h3", { className: "card__title", children: calc.title }), _jsx("p", { className: "card__sub", children: formatDateTime(calc.createdAt) })] }), _jsx("strong", { children: money(calc.suggestedPrice) })] }), _jsxs("div", { className: "card__meta", children: [_jsxs("span", { children: ["\u0627\u0644\u062A\u0643\u0644\u0641\u0629 ", _jsx("strong", { children: money(calc.totalCost) })] }), _jsxs("span", { children: ["\u0627\u0644\u0631\u0628\u062D ", _jsx("strong", { children: money(calc.profit) })] }), _jsxs("span", { children: ["\u0627\u0644\u0646\u0633\u0628\u0629 ", _jsxs("strong", { children: [formatNumber(calc.marginPct), "\u066A"] })] })] }), _jsxs("div", { className: "card__actions", children: [_jsx("button", { type: "button", className: "btn btn--soft btn--sm", onClick: () => {
                                            loadFromHistory(calc);
                                        }, children: "\u0625\u0639\u0627\u062F\u0629 \u0627\u0633\u062A\u062E\u062F\u0627\u0645" }), _jsx("button", { type: "button", className: "btn btn--ghost btn--sm", onClick: () => {
                                            printHtml(`ورقة تسعير - ${calc.title}`, buildCalculationSheet(calc, profile));
                                        }, children: "\u0637\u0628\u0627\u0639\u0629" }), _jsx("button", { type: "button", className: "btn btn--ghost btn--sm", onClick: () => {
                                            setToDelete(calc);
                                        }, children: "\u062D\u0630\u0641" })] })] }, calc.id))) })) }), _jsx(ConfirmDialog, { open: Boolean(toDelete), title: "\u062D\u0630\u0641 \u0627\u0644\u062D\u0633\u0627\u0628", message: `سيُحذف «${toDelete?.title ?? ''}» من السجل نهائياً.`, onCancel: () => {
                    setToDelete(null);
                }, onConfirm: () => {
                    void confirmDelete();
                } })] }));
}
