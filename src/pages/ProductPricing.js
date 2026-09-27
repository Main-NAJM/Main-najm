import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { Badge, ConfirmDialog, EmptyState, Modal, NumberInput, SectionTitle, Select, TextArea, TextInput, } from '@/components/ui';
import { basisUnit, computeProductPrice } from '@/lib/calc';
import { DENSITY_HINTS, PRICING_BASES, basisLabel, basisNeeds, isRetiredBasis, } from '@/lib/constants';
import { TRADE_CHOICES, craftName } from '@/lib/trades';
import { formatMoney, formatNumber, percent, toNumber } from '@/lib/format';
import { buildProductQuote } from '@/print/templates';
import { printHtml } from '@/print/print';
const emptyProduct = (craft) => ({
    name: '',
    craft,
    basis: 'area',
    unitPrice: 0,
    density: 0,
    sheetPrice: 0,
    sheetName: '',
    wastePct: 5,
    fittings: 0,
    labor: 0,
    marginPct: 25,
    defaultWidth: 100,
    defaultHeight: 200,
    defaultDepth: 0,
    notes: '',
});
export default function ProductPricing() {
    const { products, profile, create, update, remove } = useData();
    const { notify, notifyError } = useToast();
    const [selectedId, setSelectedId] = useState('');
    const [dims, setDims] = useState({
        widthCm: 0,
        heightCm: 0,
        depthCm: 0,
        quantity: 1,
    });
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [draft, setDraft] = useState(() => emptyProduct(profile.craft));
    const [saving, setSaving] = useState(false);
    const [toDelete, setToDelete] = useState(null);
    // ترتيب المنتجات: حرفة المستخدم أولاً، فهي الأقرب إلى عمله.
    const ordered = useMemo(() => {
        return [...products].sort((a, b) => {
            const mine = (p) => (p.craft === profile.craft ? 0 : 1);
            return mine(a) - mine(b) || a.name.localeCompare(b.name, 'ar');
        });
    }, [products, profile.craft]);
    const selected = ordered.find((p) => p.id === selectedId) ?? null;
    // عند اختيار منتج تُملأ مقاساته الافتراضية، فيبدأ الحساب من رقم معقول.
    useEffect(() => {
        if (!selected)
            return;
        setDims((current) => ({
            widthCm: selected.defaultWidth || 0,
            heightCm: selected.defaultHeight || 0,
            depthCm: selected.defaultDepth || 0,
            quantity: current.quantity || 1,
        }));
    }, [selected]);
    // أول منتج يُختار تلقائياً كي لا تبدأ الشاشة فارغة.
    useEffect(() => {
        if (!selectedId && ordered.length > 0)
            setSelectedId(ordered[0].id);
    }, [ordered, selectedId]);
    const result = selected ? computeProductPrice(selected, dims) : null;
    const needs = selected ? basisNeeds(selected.basis) : [];
    const money = (value) => formatMoney(value, profile.currency);
    // قالب المهنة المكتوبة يحمل اسمها، فلا تُكرَّر الكلمة مرّتين في السطر نفسه.
    const craftOf = (product) => {
        const label = craftName(product.craft, profile.customCraft);
        return label === product.name ? '' : label;
    };
    const productLabel = (product) => {
        const label = craftOf(product);
        return label ? `${product.name} — ${label}` : product.name;
    };
    /* ------------------------------------------------------- إدارة القوالب */
    const openNew = () => {
        setEditing(null);
        setDraft(emptyProduct(profile.craft));
        setFormOpen(true);
    };
    const openEdit = (product) => {
        setEditing(product);
        setDraft({
            name: product.name,
            craft: product.craft,
            basis: product.basis,
            unitPrice: product.unitPrice,
            density: product.density,
            sheetPrice: product.sheetPrice,
            sheetName: product.sheetName,
            wastePct: product.wastePct,
            fittings: product.fittings,
            labor: product.labor,
            marginPct: product.marginPct,
            defaultWidth: product.defaultWidth,
            defaultHeight: product.defaultHeight,
            defaultDepth: product.defaultDepth,
            notes: product.notes,
        });
        setFormOpen(true);
    };
    const patch = (value) => {
        setDraft((current) => ({ ...current, ...value }));
    };
    const save = async () => {
        if (!draft.name.trim()) {
            notify('اكتب اسم المنتج.', 'error');
            return;
        }
        if (draft.basis === 'weight' && !(draft.density > 0)) {
            notify('التسعير بالوزن يحتاج كثافة المادة.', 'error');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...draft,
                name: draft.name.trim(),
                notes: draft.notes.trim(),
            };
            if (editing) {
                await update('products', editing.id, payload);
                notify('حُفظ المنتج.');
            }
            else {
                const id = await create('products', payload);
                setSelectedId(id);
                notify('أُضيف المنتج.');
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
    const confirmDelete = async () => {
        if (!toDelete)
            return;
        try {
            await remove('products', toDelete.id);
            if (selectedId === toDelete.id)
                setSelectedId('');
            notify('حُذف المنتج.');
        }
        catch (error) {
            notifyError(error);
        }
        finally {
            setToDelete(null);
        }
    };
    /* --------------------------------------------- تحويل النتيجة إلى طلبية */
    const createOrder = async () => {
        if (!selected || !result)
            return;
        try {
            await create('orders', {
                title: selected.name,
                customerName: '',
                phone: '',
                address: '',
                notes: [
                    `المقاس: ${formatNumber(dims.widthCm)}×${formatNumber(dims.heightCm)}${dims.depthCm ? `×${formatNumber(dims.depthCm)}` : ''} سم`,
                    `${formatNumber(result.measure)} ${result.measureUnit} للقطعة`,
                    selected.notes,
                ]
                    .filter(Boolean)
                    .join(' — '),
                status: 'pending',
                items: [
                    {
                        name: `${selected.name} (${formatNumber(result.measure)} ${result.measureUnit})`,
                        qty: result.quantity,
                        unitPrice: result.unitTotal,
                    },
                ],
                extraCharges: 0,
                discount: 0,
                paid: 0,
                dueDate: '',
            });
            notify('أُنشئت طلبية بهذا السعر. أكمل بيانات الزبون من صفحة الطلبيات.');
        }
        catch (error) {
            notifyError(error);
        }
    };
    /* --------------------------------------------------------------- عرض */
    if (products.length === 0) {
        return (_jsxs(_Fragment, { children: [_jsx(EmptyState, { title: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u0646\u062A\u062C\u0627\u062A \u0628\u0639\u062F", description: "\u0623\u0636\u0641 \u0645\u0646\u062A\u062C\u0627\u064B \u0648\u062D\u062F\u0651\u062F \u0643\u064A\u0641 \u062A\u0633\u0639\u0651\u0631\u0647: \u0628\u0627\u0644\u0645\u062A\u0631 \u0627\u0644\u0645\u0631\u0628\u0651\u0639 \u0623\u0648 \u0627\u0644\u0637\u0648\u0644\u064A \u0623\u0648 \u0628\u0627\u0644\u0642\u0637\u0639\u0629. \u0628\u0639\u062F\u0647\u0627 \u064A\u0643\u0641\u064A \u0623\u0646 \u062A\u062F\u062E\u0644 \u0627\u0644\u0645\u0642\u0627\u0633 \u0644\u064A\u0638\u0647\u0631 \u0627\u0644\u0633\u0639\u0631.", action: _jsx("button", { type: "button", className: "btn", onClick: openNew, children: "\u0625\u0636\u0627\u0641\u0629 \u0645\u0646\u062A\u062C" }) }), _jsx(ProductForm, { open: formOpen, editing: editing, draft: draft, saving: saving, currency: profile.currency, customCraft: profile.customCraft, onPatch: patch, onClose: () => {
                        setFormOpen(false);
                    }, onSave: () => {
                        void save();
                    } })] }));
    }
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "card", children: [_jsx(Select, { label: "\u0627\u0644\u0645\u0646\u062A\u062C", value: selectedId, options: ordered.map((p) => ({
                            value: p.id,
                            label: productLabel(p),
                        })), onChange: setSelectedId, hint: selected ? `يُسعَّر ${basisLabel(selected.basis)}` : undefined }), selected ? (_jsxs(_Fragment, { children: [_jsx(SectionTitle, { children: "\u0627\u0644\u0645\u0642\u0627\u0633\u0627\u062A" }), _jsx("p", { className: "small muted", children: "\u0643\u0644 \u0627\u0644\u0645\u0642\u0627\u0633\u0627\u062A \u0628\u0627\u0644\u0633\u0646\u062A\u064A\u0645\u062A\u0631." }), _jsxs("div", { className: "grid-3 mt-12", children: [needs.includes('width') ? (_jsx(NumberInput, { label: "\u0627\u0644\u0639\u0631\u0636", suffix: "\u0633\u0645", value: dims.widthCm, onChange: (v) => {
                                            setDims((c) => ({ ...c, widthCm: toNumber(v) }));
                                        } })) : null, needs.includes('height') ? (_jsx(NumberInput, { label: "\u0627\u0644\u0627\u0631\u062A\u0641\u0627\u0639", suffix: "\u0633\u0645", value: dims.heightCm, onChange: (v) => {
                                            setDims((c) => ({ ...c, heightCm: toNumber(v) }));
                                        } })) : null, needs.includes('depth') ? (_jsx(NumberInput, { label: "\u0627\u0644\u0639\u0645\u0642", suffix: "\u0633\u0645", value: dims.depthCm, onChange: (v) => {
                                            setDims((c) => ({ ...c, depthCm: toNumber(v) }));
                                        } })) : null, _jsx(NumberInput, { label: "\u0627\u0644\u0643\u0645\u064A\u0629", suffix: "\u0642\u0637\u0639\u0629", value: dims.quantity, onChange: (v) => {
                                            setDims((c) => ({ ...c, quantity: toNumber(v) }));
                                        } })] }), needs.length === 0 ? (_jsx("div", { className: "notice notice--info", children: "\u0647\u0630\u0627 \u0627\u0644\u0645\u0646\u062A\u062C \u064A\u064F\u0633\u0639\u064E\u0651\u0631 \u0628\u0627\u0644\u0642\u0637\u0639\u0629\u060C \u0641\u0644\u0627 \u064A\u062D\u062A\u0627\u062C \u0645\u0642\u0627\u0633\u0627\u062A. \u063A\u064A\u0651\u0631 \u0627\u0644\u0643\u0645\u064A\u0629 \u0641\u0642\u0637." })) : null, isRetiredBasis(selected.basis) ? (_jsxs("div", { className: "notice notice--warn mt-12", children: ["\u0647\u0630\u0627 \u0627\u0644\u0642\u0627\u0644\u0628 \u064A\u062D\u0633\u0628 \u0628\u0645\u062D\u064A\u0637 \u0627\u0644\u0641\u062A\u062D\u0629\u060C \u0648\u0647\u064A \u0637\u0631\u064A\u0642\u0629 \u063A\u064A\u0631 \u062F\u0642\u064A\u0642\u0629: \u0646\u0627\u0641\u0630\u0629 \u0661\u00D7\u0661 \u0641\u064A\u0647\u0627 \u0661\u0661 \u0642\u0637\u0639\u0629 \u0628\u0631\u0648\u0641\u064A\u0644 \u0644\u0627 \u0623\u0631\u0628\u0639. \u0633\u0639\u0651\u0631 \u0627\u0644\u0623\u0628\u0648\u0627\u0628 \u0648\u0627\u0644\u0646\u0648\u0627\u0641\u0630 \u0645\u0646 \u0634\u0627\u0634\u0629", ' ', _jsx(Link, { to: "/openings", children: "\u0627\u0644\u0623\u0628\u0648\u0627\u0628 \u0648\u0627\u0644\u0646\u0648\u0627\u0641\u0630" }), "."] })) : null, result ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "summary-box mt-12", children: [selected.basis !== 'unit' ? (_jsxs("div", { className: "summary-row", children: [_jsxs("span", { children: ["\u0627\u0644\u0645\u0642\u062F\u0627\u0631 \u0644\u0644\u0642\u0637\u0639\u0629 (", basisUnit(selected.basis), ")"] }), _jsx("span", { children: formatNumber(result.measure) })] })) : null, _jsxs("div", { className: "summary-row", children: [_jsx("span", { children: selected.basis === 'frame'
                                                            ? `البروفيل (${formatNumber(result.measure)} م.ط × ${money(selected.unitPrice)})`
                                                            : 'قيمة المادة' }), _jsx("span", { children: money(result.materialCost) })] }), result.sheetCost > 0 ? (_jsxs("div", { className: "summary-row", children: [_jsxs("span", { children: [selected.sheetName || 'الصفيحة', " (", formatNumber(result.sheetArea), " \u0645\u00B2 \u00D7", ' ', money(selected.sheetPrice), ")"] }), _jsx("span", { children: money(result.sheetCost) })] })) : null, result.wasteCost > 0 ? (_jsxs("div", { className: "summary-row", children: [_jsxs("span", { children: ["\u0627\u0644\u0647\u0627\u0644\u0643 (", percent(selected.wastePct), ")"] }), _jsx("span", { children: money(result.wasteCost) })] })) : null, result.fittings > 0 ? (_jsxs("div", { className: "summary-row", children: [_jsx("span", { children: "\u0625\u0643\u0633\u0633\u0648\u0627\u0631\u0627\u062A" }), _jsx("span", { children: money(result.fittings) })] })) : null, result.labor > 0 ? (_jsxs("div", { className: "summary-row", children: [_jsx("span", { children: "\u0623\u062C\u0631\u0629 \u0627\u0644\u0639\u0645\u0644" }), _jsx("span", { children: money(result.labor) })] })) : null, _jsxs("div", { className: "summary-row", children: [_jsx("span", { children: "\u062A\u0643\u0644\u0641\u0629 \u0627\u0644\u0642\u0637\u0639\u0629" }), _jsx("span", { children: money(result.unitCost) })] }), _jsxs("div", { className: "summary-row", children: [_jsxs("span", { children: ["\u0627\u0644\u0631\u0628\u062D (", percent(selected.marginPct), ")"] }), _jsx("span", { children: money(result.unitProfit) })] }), _jsxs("div", { className: "summary-row", children: [_jsx("span", { children: "\u0633\u0639\u0631 \u0627\u0644\u0642\u0637\u0639\u0629" }), _jsx("span", { children: money(result.unitTotal) })] }), _jsxs("div", { className: "summary-row summary-row--total", children: [_jsxs("span", { children: ["\u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A (", formatNumber(result.quantity), " \u0642\u0637\u0639\u0629)"] }), _jsx("span", { children: money(result.total) })] }), _jsxs("p", { className: "small muted mt-8", children: ["\u0631\u0628\u062D\u0643 \u0645\u0646 \u0647\u0630\u0647 \u0627\u0644\u0635\u0641\u0642\u0629: ", money(result.totalProfit)] })] }), _jsxs("div", { className: "card__actions", children: [_jsx("button", { type: "button", className: "btn", onClick: () => {
                                                    void createOrder();
                                                }, children: "\u062A\u062D\u0648\u064A\u0644\u0647\u0627 \u0625\u0644\u0649 \u0637\u0644\u0628\u064A\u0629" }), _jsx("button", { type: "button", className: "btn btn--soft btn--sm", onClick: () => {
                                                    printHtml(`عرض سعر - ${selected.name}`, buildProductQuote(selected, dims, result, profile));
                                                }, children: "\u0637\u0628\u0627\u0639\u0629 \u0639\u0631\u0636 \u0633\u0639\u0631" }), _jsx("button", { type: "button", className: "btn btn--ghost btn--sm", onClick: () => {
                                                    openEdit(selected);
                                                }, children: "\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0645\u0646\u062A\u062C" })] })] })) : null] })) : null] }), _jsxs(SectionTitle, { action: _jsx("button", { type: "button", className: "btn btn--soft btn--sm", onClick: openNew, children: "+ \u0645\u0646\u062A\u062C" }), children: ["\u0645\u0646\u062A\u062C\u0627\u062A\u064A (", products.length, ")"] }), _jsx("div", { className: "list", children: ordered.map((product) => (_jsxs("article", { className: "card", children: [_jsxs("div", { className: "card__head", children: [_jsxs("div", { children: [_jsx("h3", { className: "card__title", children: product.name }), _jsxs("p", { className: "card__sub", children: [craftOf(product) ? `${craftOf(product)} · ` : '', basisLabel(product.basis)] })] }), product.id === selectedId ? _jsx(Badge, { tone: "ok", children: "\u0645\u062E\u062A\u0627\u0631" }) : null] }), _jsxs("div", { className: "card__meta", children: [_jsxs("span", { children: ["\u0633\u0639\u0631 \u0627\u0644\u0648\u062D\u062F\u0629", ' ', _jsxs("strong", { children: [money(product.unitPrice), " / ", basisUnit(product.basis)] })] }), product.fittings > 0 ? (_jsxs("span", { children: ["\u0625\u0643\u0633\u0633\u0648\u0627\u0631\u0627\u062A ", _jsx("strong", { children: money(product.fittings) })] })) : null, product.labor > 0 ? (_jsxs("span", { children: ["\u0623\u062C\u0631\u0629 ", _jsx("strong", { children: money(product.labor) })] })) : null, _jsxs("span", { children: ["\u0627\u0644\u0631\u0628\u062D ", _jsxs("strong", { children: [formatNumber(product.marginPct), "\u066A"] })] })] }), _jsxs("div", { className: "card__actions", children: [_jsx("button", { type: "button", className: "btn btn--soft btn--sm", onClick: () => {
                                        setSelectedId(product.id);
                                    }, children: "\u0627\u062D\u0633\u0628 \u0628\u0647\u0630\u0627" }), _jsx("button", { type: "button", className: "btn btn--ghost btn--sm", onClick: () => {
                                        openEdit(product);
                                    }, children: "\u062A\u0639\u062F\u064A\u0644" }), _jsx("button", { type: "button", className: "btn btn--ghost btn--sm", onClick: () => {
                                        setToDelete(product);
                                    }, children: "\u062D\u0630\u0641" })] })] }, product.id))) }), _jsx(ProductForm, { open: formOpen, editing: editing, draft: draft, saving: saving, currency: profile.currency, customCraft: profile.customCraft, onPatch: patch, onClose: () => {
                    setFormOpen(false);
                }, onSave: () => {
                    void save();
                } }), _jsx(ConfirmDialog, { open: Boolean(toDelete), title: "\u062D\u0630\u0641 \u0627\u0644\u0645\u0646\u062A\u062C", message: `سيُحذف قالب «${toDelete?.name ?? ''}» نهائياً. الطلبيات المسجّلة لا تتأثّر.`, onCancel: () => {
                    setToDelete(null);
                }, onConfirm: () => {
                    void confirmDelete();
                } })] }));
}
/* ------------------------------------------------------ نموذج قالب المنتج */
function ProductForm({ open, editing, draft, saving, currency, customCraft, onPatch, onClose, onSave, }) {
    const needs = basisNeeds(draft.basis);
    const basisInfo = PRICING_BASES.find((b) => b.value === draft.basis);
    return (_jsxs(Modal, { open: open, wide: true, title: editing ? 'تعديل المنتج' : 'منتج جديد', onClose: onClose, footer: _jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "btn btn--ghost", onClick: onClose, children: "\u0625\u0644\u063A\u0627\u0621" }), _jsx("button", { type: "button", className: "btn", disabled: saving, onClick: onSave, children: saving ? 'جارٍ الحفظ…' : 'حفظ' })] }), children: [_jsx(TextInput, { label: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u062A\u062C", value: draft.name, onChange: (v) => {
                    onPatch({ name: v });
                }, placeholder: "\u0645\u062B\u0627\u0644: \u0628\u0627\u0628 \u062E\u0634\u0628 \u062F\u0627\u062E\u0644\u064A", autoFocus: true }), _jsxs("div", { className: "grid-2", children: [_jsx(Select, { label: "\u0627\u0644\u062D\u0631\u0641\u0629", value: draft.craft, options: TRADE_CHOICES.map((choice) => ({
                            value: choice.craft,
                            label: craftName(choice.craft, customCraft),
                        })), onChange: (v) => {
                            onPatch({ craft: v });
                        } }), _jsx(Select, { label: "\u0637\u0631\u064A\u0642\u0629 \u0627\u0644\u062A\u0633\u0639\u064A\u0631", value: draft.basis, options: PRICING_BASES.map((b) => ({ value: b.value, label: b.label })), onChange: (v) => {
                            onPatch({ basis: v });
                        } })] }), basisInfo ? _jsx("p", { className: "small muted mt-0", children: basisInfo.hint }) : null, _jsxs("div", { className: "grid-2 mt-12", children: [_jsx(NumberInput, { label: draft.basis === 'frame'
                            ? 'سعر المتر الطولي للبروفيل'
                            : `سعر الوحدة (${basisUnit(draft.basis)})`, value: draft.unitPrice, onChange: (v) => {
                            onPatch({ unitPrice: toNumber(v) });
                        }, suffix: currency, hint: draft.basis === 'frame' ? 'العادي ١٨٠٠ · الملوّن ٢٥٠٠' : undefined }), draft.basis === 'weight' ? (_jsx(NumberInput, { label: "\u0643\u062B\u0627\u0641\u0629 \u0627\u0644\u0645\u0627\u062F\u0629", suffix: "\u0643\u063A/\u0645\u00B3", value: draft.density, onChange: (v) => {
                            onPatch({ density: toNumber(v) });
                        }, hint: DENSITY_HINTS.map((d) => `${d.label} ${formatNumber(d.value)}`).join(' · ') })) : (_jsx(NumberInput, { label: "\u0646\u0633\u0628\u0629 \u0627\u0644\u0647\u0627\u0644\u0643", suffix: "\u066A", value: draft.wastePct, onChange: (v) => {
                            onPatch({ wastePct: toNumber(v) });
                        } }))] }), _jsxs("div", { className: "grid-2 mt-12", children: [_jsx(NumberInput, { label: "\u0633\u0639\u0631 \u0627\u0644\u0645\u062A\u0631 \u0627\u0644\u0645\u0631\u0628\u0651\u0639 \u0644\u0644\u0635\u0641\u064A\u062D\u0629", value: draft.sheetPrice, onChange: (v) => {
                            onPatch({ sheetPrice: toNumber(v) });
                        }, suffix: currency, hint: "\u0632\u062C\u0627\u062C \u0623\u0648 \u0623\u064A \u0644\u0648\u062D \u064A\u0645\u0644\u0623 \u0627\u0644\u0625\u0637\u0627\u0631. \u0627\u062A\u0631\u0643\u0647 \u0635\u0641\u0631\u0627\u064B \u0625\u0646 \u0644\u0627 \u0635\u0641\u064A\u062D\u0629." }), _jsx(TextInput, { label: "\u0627\u0633\u0645 \u0627\u0644\u0635\u0641\u064A\u062D\u0629", value: draft.sheetName, onChange: (v) => {
                            onPatch({ sheetName: v });
                        }, placeholder: "\u0632\u062C\u0627\u062C \u0664 \u0645\u0645", hint: "\u064A\u0638\u0647\u0631 \u0641\u064A \u0639\u0631\u0636 \u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u0645\u0637\u0628\u0648\u0639" })] }), draft.basis === 'weight' ? (_jsx(NumberInput, { label: "\u0646\u0633\u0628\u0629 \u0627\u0644\u0647\u0627\u0644\u0643", suffix: "\u066A", value: draft.wastePct, onChange: (v) => {
                    onPatch({ wastePct: toNumber(v) });
                } })) : null, _jsxs("div", { className: "grid-3", children: [_jsx(NumberInput, { label: "\u0625\u0643\u0633\u0633\u0648\u0627\u0631\u0627\u062A \u0644\u0644\u0642\u0637\u0639\u0629", value: draft.fittings, onChange: (v) => {
                            onPatch({ fittings: toNumber(v) });
                        }, hint: "\u0623\u0642\u0641\u0627\u0644\u060C \u0645\u0641\u0635\u0651\u0644\u0627\u062A\u060C \u062A\u0631\u0643\u064A\u0628" }), _jsx(NumberInput, { label: "\u0623\u062C\u0631\u0629 \u0627\u0644\u0639\u0645\u0644 \u0644\u0644\u0642\u0637\u0639\u0629", value: draft.labor, onChange: (v) => {
                            onPatch({ labor: toNumber(v) });
                        } }), _jsx(NumberInput, { label: "\u0646\u0633\u0628\u0629 \u0627\u0644\u0631\u0628\u062D", suffix: "\u066A", value: draft.marginPct, onChange: (v) => {
                            onPatch({ marginPct: toNumber(v) });
                        } })] }), needs.length > 0 ? (_jsxs(_Fragment, { children: [_jsx(SectionTitle, { children: "\u0645\u0642\u0627\u0633\u0627\u062A \u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629" }), _jsx("p", { className: "small muted", children: "\u062A\u064F\u0645\u0644\u0623 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B \u0639\u0646\u062F \u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0645\u0646\u062A\u062C\u060C \u0648\u064A\u0645\u0643\u0646 \u062A\u063A\u064A\u064A\u0631\u0647\u0627 \u0648\u0642\u062A \u0627\u0644\u062D\u0633\u0627\u0628." }), _jsxs("div", { className: "grid-3 mt-12", children: [needs.includes('width') ? (_jsx(NumberInput, { label: "\u0627\u0644\u0639\u0631\u0636", suffix: "\u0633\u0645", value: draft.defaultWidth, onChange: (v) => {
                                    onPatch({ defaultWidth: toNumber(v) });
                                } })) : null, needs.includes('height') ? (_jsx(NumberInput, { label: "\u0627\u0644\u0627\u0631\u062A\u0641\u0627\u0639", suffix: "\u0633\u0645", value: draft.defaultHeight, onChange: (v) => {
                                    onPatch({ defaultHeight: toNumber(v) });
                                } })) : null, needs.includes('depth') ? (_jsx(NumberInput, { label: "\u0627\u0644\u0639\u0645\u0642", suffix: "\u0633\u0645", value: draft.defaultDepth, onChange: (v) => {
                                    onPatch({ defaultDepth: toNumber(v) });
                                } })) : null] })] })) : null, _jsx(TextArea, { label: "\u0645\u0644\u0627\u062D\u0638\u0627\u062A", value: draft.notes, onChange: (v) => {
                    onPatch({ notes: v });
                } })] }));
}
