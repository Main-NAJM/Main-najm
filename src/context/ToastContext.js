import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useMemo, useRef, useState, } from 'react';
import { newId } from '@/lib/id';
const ToastContext = createContext(null);
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timers = useRef(new Map());
    const dismiss = useCallback((id) => {
        setToasts((current) => current.filter((t) => t.id !== id));
        const timer = timers.current.get(id);
        if (timer) {
            window.clearTimeout(timer);
            timers.current.delete(id);
        }
    }, []);
    const notify = useCallback((message, tone = 'ok') => {
        const id = newId();
        setToasts((current) => [...current.slice(-2), { id, message, tone }]);
        const timer = window.setTimeout(() => {
            dismiss(id);
        }, tone === 'error' ? 6000 : 3200);
        timers.current.set(id, timer);
    }, [dismiss]);
    const notifyError = useCallback((error) => {
        const message = error instanceof Error ? error.message : 'حدث خطأ غير متوقّع، أعد المحاولة.';
        notify(message, 'error');
    }, [notify]);
    const value = useMemo(() => ({ notify, notifyError }), [notify, notifyError]);
    return (_jsxs(ToastContext.Provider, { value: value, children: [children, _jsx("div", { className: "toast-stack", role: "status", "aria-live": "polite", children: toasts.map((toast) => (_jsx("button", { type: "button", className: `toast toast--${toast.tone}`, onClick: () => {
                        dismiss(toast.id);
                    }, children: toast.message }, toast.id))) })] }));
}
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context)
        throw new Error('useToast يجب أن يُستخدم داخل ToastProvider.');
    return context;
};
