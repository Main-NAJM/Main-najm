import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useId, useRef, } from 'react';
export function Field({ label, hint, children }) {
    const id = useId();
    return (_jsxs("div", { className: "field", children: [_jsx("label", { className: "field__label", htmlFor: id, children: label }), children(id), hint ? _jsx("p", { className: "field__hint", children: hint }) : null] }));
}
export function TextInput({ label, value, onChange, type = 'text', placeholder, hint, required, autoFocus, inputMode, disabled, dir, }) {
    return (_jsx(Field, { label: label, hint: hint, children: (id) => (_jsx("input", { id: id, className: `input${dir === 'ltr' ? ' input--ltr' : ''}`, type: type, value: value, placeholder: placeholder, required: required, autoFocus: autoFocus, inputMode: inputMode, disabled: disabled, dir: dir, onChange: (event) => {
                onChange(event.target.value);
            } })) }));
}
/**
 * عدّاد: رقم بين زرَّي نقصان وزيادة.
 *
 * يُستعمل حيث يكون الرقم صغيراً ويُعدَّل بخطوة واحدة — عدد قطع البروفيل مثلاً:
 * صاحب الورشة يعرف أنها «إحدى عشرة أو اثنتا عشرة»، فيرفعها بضغطة بدل أن يفتح
 * لوحة المفاتيح الرقمية ويمسح ويكتب. والحقل يبقى قابلاً للكتابة لمن يعرف رقمه.
 */
export function Stepper({ label, value, onChange, hint, suffix, min = 0, max, step = 1, }) {
    const clamp = (next) => {
        const bounded = Math.max(min, max === undefined ? next : Math.min(max, next));
        // كسور الفاصلة العائمة تُنتج ١١٫٠٠٠٠٠٠٠٠٠٠٠٠٢ عند الجمع المتكرّر.
        return Math.round(bounded * 1000) / 1000;
    };
    return (_jsx(Field, { label: label, hint: hint, children: (id) => (_jsxs("div", { className: "stepper", children: [_jsx("button", { type: "button", className: "stepper__btn", onClick: () => {
                        onChange(clamp(value - step));
                    }, disabled: value <= min, "aria-label": `نقصان ${label}`, children: "\u2212" }), _jsxs("div", { className: "input-wrap stepper__field", children: [_jsx("input", { id: id, className: "input", type: "number", inputMode: "numeric", min: min, max: max, step: step, value: value === 0 ? '' : value, onFocus: (event) => {
                                event.target.select();
                            }, onChange: (event) => {
                                const next = Number(event.target.value);
                                onChange(Number.isFinite(next) ? clamp(next) : min);
                            } }), suffix ? _jsx("span", { className: "input-wrap__suffix", children: suffix }) : null] }), _jsx("button", { type: "button", className: "stepper__btn", onClick: () => {
                        onChange(clamp(value + step));
                    }, disabled: max !== undefined && value >= max, "aria-label": `زيادة ${label}`, children: "+" })] })) }));
}
export function NumberInput({ label, value, onChange, hint, suffix, min = 0, step, }) {
    return (_jsx(Field, { label: label, hint: hint, children: (id) => (_jsxs("div", { className: "input-wrap", children: [_jsx("input", { id: id, className: "input", type: "number", inputMode: "decimal", min: min, step: step ?? 'any', 
                    // الصفر يُعرض فارغاً لا رقماً: حقل مبدوء بصفر يجعل الكتابة فيه
                    // «05000»، ولا تصحّحه React لأنها تقارن «05000» بـ5000 مقارنة مرنة
                    // فتراهما سواء. والفارغ هنا يعني صفراً على أي حال.
                    value: value === 0 ? '' : value, onFocus: (event) => {
                        // تحديد ما في الحقل عند لمسه: من يضغط على مبلغ ليصحّحه يريد كتابته
                        // من جديد، لا إلحاق أرقامه بالقديم.
                        event.target.select();
                    }, onChange: (event) => {
                        onChange(event.target.value);
                    } }), suffix ? _jsx("span", { className: "input-wrap__suffix", children: suffix }) : null] })) }));
}
export function TextArea({ label, value, onChange, rows = 3, placeholder, hint }) {
    return (_jsx(Field, { label: label, hint: hint, children: (id) => (_jsx("textarea", { id: id, className: "input input--area", rows: rows, value: value, placeholder: placeholder, onChange: (event) => {
                onChange(event.target.value);
            } })) }));
}
export function Select({ label, value, options, onChange, hint, }) {
    return (_jsx(Field, { label: label, hint: hint, children: (id) => (_jsx("select", { id: id, className: "input input--select", value: value, onChange: (event) => {
                onChange(event.target.value);
            }, children: options.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })) }));
}
/** محرّر صفوف (وصف + كمية + سعر) بعناوين واضحة على الهاتف والحاسوب. */
export function LineItems({ rows, nameLabel, namePlaceholder, onPatch, onRemove, toNumber: parse, }) {
    return (_jsxs("div", { className: "line-items", children: [_jsxs("div", { className: "line-item line-item--head", "aria-hidden": "true", children: [_jsx("span", { children: nameLabel }), _jsx("span", { children: "\u0627\u0644\u0643\u0645\u064A\u0629" }), _jsx("span", { children: "\u0633\u0639\u0631 \u0627\u0644\u0648\u062D\u062F\u0629" }), _jsx("span", {})] }), rows.map((row, index) => (_jsxs("div", { className: "line-item", children: [_jsxs("label", { className: "li-field", children: [_jsx("span", { className: "li-field__caption", children: nameLabel }), _jsx("input", { className: "input", placeholder: namePlaceholder, value: row.name, onChange: (event) => {
                                    onPatch(index, { name: event.target.value });
                                } })] }), _jsxs("label", { className: "li-field", children: [_jsx("span", { className: "li-field__caption", children: "\u0627\u0644\u0643\u0645\u064A\u0629" }), _jsx("input", { className: "input", type: "number", inputMode: "decimal", min: 0, step: "any", value: row.qty === 0 ? '' : row.qty, onFocus: (event) => {
                                    event.target.select();
                                }, onChange: (event) => {
                                    onPatch(index, { qty: parse(event.target.value) });
                                } })] }), _jsxs("label", { className: "li-field", children: [_jsx("span", { className: "li-field__caption", children: "\u0633\u0639\u0631 \u0627\u0644\u0648\u062D\u062F\u0629" }), _jsx("input", { className: "input", type: "number", inputMode: "decimal", min: 0, step: "any", value: row.unitPrice === 0 ? '' : row.unitPrice, onFocus: (event) => {
                                    event.target.select();
                                }, onChange: (event) => {
                                    onPatch(index, { unitPrice: parse(event.target.value) });
                                } })] }), _jsx("button", { type: "button", className: "icon-btn li-remove", "aria-label": `حذف السطر ${index + 1}`, onClick: () => {
                            onRemove(index);
                        }, children: "\u2715" })] }, index)))] }));
}
export function Modal({ open, title, onClose, children, footer, wide }) {
    const panelRef = useRef(null);
    // onClose تُكتب في موضع الاستدعاء كدالّة سهمية، فهويّتها تتغيّر مع كل رسم.
    // حفظها في مرجع يمنع الأثر أدناه من إعادة التشغيل مع كل حرف يُكتب.
    const closeRef = useRef(onClose);
    closeRef.current = onClose;
    // التركيز على اللوحة مرّة واحدة عند الفتح فقط. كان هذا السطر داخل أثرٍ يعتمد
    // على onClose، فيُعاد تشغيله مع كل ضغطة مفتاح فينتزع التركيز من الحقل الذي
    // يكتب فيه صاحبه — فلا يُقبل إلا أوّل حرف.
    useEffect(() => {
        if (!open)
            return;
        panelRef.current?.focus();
    }, [open]);
    useEffect(() => {
        if (!open)
            return;
        // العنصر الذي فتح النافذة — يُعاد إليه التركيز عند الإغلاق، وإلا وجد
        // مستخدم لوحة المفاتيح نفسه في أول الصفحة بلا سياق.
        const opener = document.activeElement;
        const onKeyDown = (event) => {
            // closeRef لا onClose: هويّة onClose تتغيّر مع كل رسم، والاعتماد عليها
            // هنا هو ما كان ينتزع التركيز من الحقل بعد أوّل حرف.
            if (event.key === 'Escape') {
                closeRef.current();
                return;
            }
            if (event.key !== 'Tab')
                return;
            // حبس التركيز: بدونه يخرج Tab إلى الصفحة خلف النافذة وهي معطّلة بصريًا
            const panel = panelRef.current;
            if (!panel)
                return;
            const items = Array.from(panel.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((el) => el.getClientRects().length > 0);
            if (items.length === 0) {
                event.preventDefault();
                panel.focus();
                return;
            }
            const first = items[0];
            const last = items[items.length - 1];
            const active = document.activeElement;
            if (event.shiftKey && (active === first || active === panel)) {
                event.preventDefault();
                last.focus();
            }
            else if (!event.shiftKey && active === last) {
                event.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', onKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = previousOverflow;
            opener?.focus();
        };
    }, [open]);
    if (!open)
        return null;
    return (_jsx("div", { className: "modal-backdrop", role: "presentation", onMouseDown: (event) => {
            if (event.target === event.currentTarget)
                onClose();
        }, children: _jsxs("div", { className: `modal${wide ? ' modal--wide' : ''}`, role: "dialog", "aria-modal": "true", "aria-label": title, tabIndex: -1, ref: panelRef, children: [_jsxs("header", { className: "modal__header", children: [_jsx("h2", { className: "modal__title", children: title }), _jsx("button", { type: "button", className: "icon-btn", onClick: onClose, "aria-label": "\u0625\u063A\u0644\u0627\u0642", children: "\u2715" })] }), _jsx("div", { className: "modal__body", children: children }), footer ? _jsx("footer", { className: "modal__footer", children: footer }) : null] }) }));
}
/* ------------------------------------------------------------------ عناصر */
export function Badge({ tone, children }) {
    return _jsx("span", { className: `badge badge--${tone}`, children: children });
}
export function EmptyState({ title, description, action, }) {
    return (_jsxs("div", { className: "empty", children: [_jsx("div", { className: "empty__mark", "aria-hidden": "true", children: "\u2301" }), _jsx("h3", { className: "empty__title", children: title }), _jsx("p", { className: "empty__text", children: description }), action] }));
}
export function SectionTitle({ children, action }) {
    return (_jsxs("div", { className: "section-title", children: [_jsx("h2", { children: children }), action] }));
}
export function StatCard({ label, value, tone = 'default', sub, }) {
    return (_jsxs("div", { className: `stat stat--${tone}`, children: [_jsx("span", { className: "stat__label", children: label }), _jsx("strong", { className: "stat__value", children: value }), sub ? _jsx("span", { className: "stat__sub", children: sub }) : null] }));
}
export function ConfirmDialog({ open, title, message, confirmLabel = 'حذف', onConfirm, onCancel, }) {
    return (_jsx(Modal, { open: open, title: title, onClose: onCancel, footer: _jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "btn btn--ghost", onClick: onCancel, children: "\u0625\u0644\u063A\u0627\u0621" }), _jsx("button", { type: "button", className: "btn btn--danger", onClick: onConfirm, children: confirmLabel })] }), children: _jsx("p", { className: "modal__message", children: message }) }));
}
export function Spinner({ label = 'جارٍ التحميل…' }) {
    return (_jsxs("div", { className: "spinner", role: "status", children: [_jsx("span", { className: "spinner__dot" }), _jsx("span", { children: label })] }));
}
