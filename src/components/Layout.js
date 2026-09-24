import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { APP_NAME } from '@/lib/constants';
import { tradeLabel } from '@/lib/trades';
import { InstallPrompt } from './InstallPrompt';
import { CalculatorIcon, CalendarIcon, DebtIcon, HomeIcon, MoreIcon, OrdersIcon, PriceIcon, PrintIcon, ProductIcon, SettingsIcon, StockIcon, } from './icons';
const primaryLinks = [
    { to: '/', label: 'الرئيسية', Icon: HomeIcon, end: true },
    { to: '/orders', label: 'الطلبيات', Icon: OrdersIcon, end: false },
    { to: '/schedule', label: 'المواعيد', Icon: CalendarIcon, end: false },
    { to: '/debts', label: 'الديون', Icon: DebtIcon, end: false },
];
const moreLinks = [
    { to: '/inventory', label: 'المخزون', Icon: StockIcon },
    { to: '/openings', label: 'الأبواب والنوافذ', Icon: ProductIcon },
    { to: '/products', label: 'حاسبة المنتج', Icon: ProductIcon },
    { to: '/calculator', label: 'حاسبة التكلفة', Icon: CalculatorIcon },
    { to: '/prices', label: 'أسعار السوق', Icon: PriceIcon },
    { to: '/print', label: 'الطباعة', Icon: PrintIcon },
    { to: '/settings', label: 'الإعدادات', Icon: SettingsIcon },
];
const pageTitles = {
    '/': 'لوحة اليوم',
    '/orders': 'الطلبيات',
    '/schedule': 'تنظيم الوقت',
    '/debts': 'سجل الديون',
    '/calculator': 'حاسبة التكلفة والربح',
    '/products': 'حاسبة سعر المنتج',
    '/openings': 'الأبواب والنوافذ',
    '/inventory': 'المخزون والسلع',
    '/prices': 'مؤشرات أسعار السوق',
    '/print': 'الطباعة والتقارير',
    '/settings': 'الإعدادات',
};
export function Layout({ children }) {
    const { pathname } = useLocation();
    const { profile, storeKind } = useData();
    const { user } = useAuth();
    const [moreOpen, setMoreOpen] = useState(false);
    const [online, setOnline] = useState(() => navigator.onLine);
    useEffect(() => {
        setMoreOpen(false);
    }, [pathname]);
    useEffect(() => {
        const goOnline = () => {
            setOnline(true);
        };
        const goOffline = () => {
            setOnline(false);
        };
        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);
        return () => {
            window.removeEventListener('online', goOnline);
            window.removeEventListener('offline', goOffline);
        };
    }, []);
    const title = pageTitles[pathname] ?? APP_NAME;
    const isMoreActive = moreLinks.some((link) => pathname.startsWith(link.to));
    return (_jsxs("div", { className: "app-shell", children: [_jsx("header", { className: "app-header", children: _jsxs("div", { className: "app-header__row", children: [_jsxs("div", { children: [_jsx("h1", { className: "app-header__title", children: title }), _jsxs("div", { className: "app-header__sub", children: [profile.businessName || APP_NAME, " \u00B7 ", tradeLabel(profile)] })] }), _jsxs("div", { className: "app-header__actions", children: [storeKind === 'local' ? (_jsx("span", { className: "header-btn", title: "\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0645\u062D\u0641\u0648\u0638\u0629 \u0639\u0644\u0649 \u0647\u0630\u0627 \u0627\u0644\u062C\u0647\u0627\u0632 \u0641\u0642\u0637", children: "\u0648\u0636\u0639 \u0645\u062D\u0644\u064A" })) : null, user?.email ? (_jsx(NavLink, { to: "/settings", className: "header-btn", children: "\u062D\u0633\u0627\u0628\u064A" })) : null] })] }) }), !online ? (_jsx("div", { className: "offline-bar", children: "\u0644\u0627 \u064A\u0648\u062C\u062F \u0627\u062A\u0635\u0627\u0644 \u0628\u0627\u0644\u0625\u0646\u062A\u0631\u0646\u062A \u2014 \u062A\u0639\u0645\u0644 \u0627\u0644\u0622\u0646 \u0639\u0644\u0649 \u0627\u0644\u0646\u0633\u062E\u0629 \u0627\u0644\u0645\u062D\u0641\u0648\u0638\u0629\u060C \u0648\u0633\u062A\u062A\u0645 \u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B." })) : null, _jsxs("main", { className: "app-main", children: [_jsx(InstallPrompt, {}), children] }), _jsxs("nav", { className: "bottom-nav", "aria-label": "\u0627\u0644\u062A\u0646\u0642\u0651\u0644 \u0627\u0644\u0631\u0626\u064A\u0633\u064A", children: [primaryLinks.map(({ to, label, Icon, end }) => (_jsxs(NavLink, { to: to, end: end, className: ({ isActive }) => `bottom-nav__item${isActive && !moreOpen ? ' is-active' : ''}`, children: [_jsx(Icon, {}), _jsx("span", { children: label })] }, to))), _jsxs("button", { type: "button", className: `bottom-nav__item${isMoreActive || moreOpen ? ' is-active' : ''}`, onClick: () => {
                            setMoreOpen((open) => !open);
                        }, "aria-expanded": moreOpen, children: [_jsx(MoreIcon, {}), _jsx("span", { children: "\u0627\u0644\u0645\u0632\u064A\u062F" })] })] }), moreOpen ? (_jsx("div", { className: "more-sheet", role: "presentation", onMouseDown: (event) => {
                    if (event.target === event.currentTarget)
                        setMoreOpen(false);
                }, children: _jsxs("div", { className: "more-sheet__panel", role: "dialog", "aria-label": "\u0642\u0648\u0627\u0626\u0645 \u0625\u0636\u0627\u0641\u064A\u0629", children: [_jsx("div", { className: "sheet-handle" }), _jsxs("div", { className: "row-between", children: [_jsx("strong", { children: "\u0623\u0642\u0633\u0627\u0645 \u0623\u062E\u0631\u0649" }), _jsx("button", { type: "button", className: "icon-btn", onClick: () => {
                                        setMoreOpen(false);
                                    }, "aria-label": "\u0625\u063A\u0644\u0627\u0642", children: "\u2715" })] }), _jsx("div", { className: "more-sheet__grid", children: moreLinks.map(({ to, label, Icon }) => (_jsxs(NavLink, { to: to, className: ({ isActive }) => `more-sheet__link${isActive ? ' is-active' : ''}`, children: [_jsx(Icon, {}), _jsx("span", { children: label })] }, to))) })] }) })) : null] }));
}
