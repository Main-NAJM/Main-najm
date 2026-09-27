import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { APP_NAME } from '@/lib/constants';
const DISMISS_KEY = 'herfah-pro:v1:install-dismissed';
const wasDismissed = () => {
    try {
        return window.localStorage.getItem(DISMISS_KEY) === '1';
    }
    catch {
        return false;
    }
};
/**
 * دعوة لتثبيت التطبيق على الشاشة الرئيسية، تظهر حين يسمح المتصفّح بذلك.
 * تُغلق مرّة واحدة فلا تُلحّ، ويبقى الزر في الإعدادات لمن غيّر رأيه.
 */
export function InstallPrompt() {
    const { canInstall, install } = usePwaInstall();
    const [dismissed, setDismissed] = useState(wasDismissed);
    if (!canInstall || dismissed)
        return null;
    const close = () => {
        try {
            window.localStorage.setItem(DISMISS_KEY, '1');
        }
        catch {
            /* التخزين ممنوع: تُخفى لهذه الزيارة فقط */
        }
        setDismissed(true);
    };
    return (_jsxs("div", { className: "install-bar", children: [_jsx("img", { className: "install-bar__icon", src: `${import.meta.env.BASE_URL}icons/icon-192.png`, alt: "" }), _jsxs("div", { className: "install-bar__text", children: [_jsxs("strong", { children: ["\u062B\u0628\u0651\u062A ", APP_NAME, " \u0639\u0644\u0649 \u0647\u0627\u062A\u0641\u0643"] }), _jsx("span", { children: "\u064A\u0641\u062A\u062D \u0643\u062A\u0637\u0628\u064A\u0642 \u0648\u064A\u0639\u0645\u0644 \u0628\u0644\u0627 \u0625\u0646\u062A\u0631\u0646\u062A." })] }), _jsx("button", { type: "button", className: "btn btn--sm", onClick: () => {
                    void install();
                }, children: "\u062A\u062B\u0628\u064A\u062A" }), _jsx("button", { type: "button", className: "icon-btn", onClick: close, "aria-label": "\u0625\u062E\u0641\u0627\u0621", children: "\u2715" })] }));
}
