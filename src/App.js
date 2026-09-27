import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Spinner } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { DataProvider } from '@/context/DataContext';
import Login from '@/pages/Login';
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Orders = lazy(() => import('@/pages/Orders'));
const Schedule = lazy(() => import('@/pages/Schedule'));
const Calculator = lazy(() => import('@/pages/Calculator'));
const ProductPricing = lazy(() => import('@/pages/ProductPricing'));
const Openings = lazy(() => import('@/pages/Openings'));
const Inventory = lazy(() => import('@/pages/Inventory'));
const MarketPrices = lazy(() => import('@/pages/MarketPrices'));
const Debts = lazy(() => import('@/pages/Debts'));
const Print = lazy(() => import('@/pages/Print'));
const Settings = lazy(() => import('@/pages/Settings'));
export default function App() {
    const { user, loading } = useAuth();
    if (loading) {
        return (_jsx("div", { className: "page-loader", children: _jsx(Spinner, { label: "\u062C\u0627\u0631\u064D \u0641\u062A\u062D \u0627\u0644\u062A\u0637\u0628\u064A\u0642\u2026" }) }));
    }
    if (!user)
        return _jsx(Login, {});
    return (_jsx(DataProvider, { children: _jsx(Layout, { children: _jsx(Suspense, { fallback: _jsx(Spinner, {}), children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "/orders", element: _jsx(Orders, {}) }), _jsx(Route, { path: "/schedule", element: _jsx(Schedule, {}) }), _jsx(Route, { path: "/calculator", element: _jsx(Calculator, {}) }), _jsx(Route, { path: "/products", element: _jsx(ProductPricing, {}) }), _jsx(Route, { path: "/openings", element: _jsx(Openings, {}) }), _jsx(Route, { path: "/inventory", element: _jsx(Inventory, {}) }), _jsx(Route, { path: "/prices", element: _jsx(MarketPrices, {}) }), _jsx(Route, { path: "/debts", element: _jsx(Debts, {}) }), _jsx(Route, { path: "/print", element: _jsx(Print, {}) }), _jsx(Route, { path: "/settings", element: _jsx(Settings, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) }) }) }));
}
