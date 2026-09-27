import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Badge, EmptyState, SectionTitle, StatCard } from '@/components/ui';
import { debtTotals, inventoryTotals, orderTotals, stockLevel } from '@/lib/calc';
import { orderStatusLabel, orderStatusTone } from '@/lib/constants';
import { daysFromToday, formatDate, formatInt, formatMoney, formatTime, formatWeekday, relativeDayLabel, todayIso, } from '@/lib/format';
export default function Dashboard() {
    const { orders, appointments, debts, marketPrices, inventory, profile, seedDemoData } = useData();
    const { user } = useAuth();
    const today = todayIso();
    const stats = useMemo(() => {
        const active = orders.filter((order) => order.status !== 'completed');
        const receivable = orders.reduce((sum, order) => sum + orderTotals(order).remaining, 0);
        const debtRemaining = debts.reduce((sum, debt) => sum + debtTotals(debt).remaining, 0);
        const overdueDebts = debts.filter((debt) => {
            const t = debtTotals(debt);
            return !t.isSettled && (daysFromToday(debt.dueDate) ?? 1) < 0;
        });
        return {
            inProgress: orders.filter((order) => order.status === 'in_progress').length,
            pending: orders.filter((order) => order.status === 'pending').length,
            completed: orders.filter((order) => order.status === 'completed').length,
            active: active.length,
            receivable,
            debtRemaining,
            overdueCount: overdueDebts.length,
        };
    }, [orders, debts]);
    // ما نفد أو نزل إلى حدّ التنبيه — أول ما يحتاج صاحب الورشة معرفته صباحاً.
    const stock = useMemo(() => inventoryTotals(inventory), [inventory]);
    const lowStock = useMemo(() => inventory.filter((item) => stockLevel(item) !== 'ok').slice(0, 4), [inventory]);
    const todayAppointments = useMemo(() => appointments
        .filter((item) => item.date === today && !item.done)
        .sort((a, b) => a.time.localeCompare(b.time)), [appointments, today]);
    const upcomingDeliveries = useMemo(() => orders
        .filter((order) => order.status !== 'completed' && order.dueDate)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 4), [orders]);
    const isEmpty = orders.length === 0 &&
        appointments.length === 0 &&
        debts.length === 0 &&
        marketPrices.length === 0;
    const money = (value) => formatMoney(value, profile.currency);
    if (isEmpty) {
        return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "card", children: [_jsx("h2", { className: "card__title", children: "\u0623\u0647\u0644\u0627\u064B \u0628\u0643 \u0641\u064A \u062D\u0631\u0641\u0629 \u0628\u0631\u0648" }), _jsx("p", { className: "card__sub", children: "\u0646\u0638\u0651\u0645 \u0637\u0644\u0628\u064A\u0627\u062A\u0643 \u0648\u0645\u0648\u0627\u0639\u064A\u062F\u0643 \u0648\u062D\u0633\u0627\u0628\u0627\u062A\u0643 \u0648\u062F\u064A\u0648\u0646\u0643 \u0641\u064A \u0645\u0643\u0627\u0646 \u0648\u0627\u062D\u062F\u060C \u0648\u0627\u0637\u0628\u0639 \u0641\u0648\u0627\u062A\u064A\u0631\u0643 \u0648\u0643\u0634\u0648\u0641\u0643 \u0628\u0636\u063A\u0637\u0629 \u0632\u0631." }), _jsxs("div", { className: "card__actions", children: [_jsx(Link, { className: "btn", to: "/orders", children: "\u0627\u0628\u062F\u0623 \u0628\u0625\u0636\u0627\u0641\u0629 \u0637\u0644\u0628\u064A\u0629" }), _jsx(Link, { className: "btn btn--ghost btn--sm", to: "/settings", children: "\u0636\u0628\u0637 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0648\u0631\u0634\u0629" }), user?.isLocal ? (_jsx("button", { type: "button", className: "btn btn--soft btn--sm", onClick: seedDemoData, children: "\u062A\u0639\u0628\u0626\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u062A\u062C\u0631\u064A\u0628\u064A\u0629" })) : null] })] }), _jsx("div", { className: "mt-16", children: _jsx(EmptyState, { title: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0628\u064A\u0627\u0646\u0627\u062A \u0628\u0639\u062F", description: "\u0623\u0636\u0641 \u0623\u0648\u0644 \u0637\u0644\u0628\u064A\u0629 \u0623\u0648 \u0645\u0648\u0639\u062F \u0623\u0648 \u062F\u064A\u0646 \u0648\u0633\u062A\u0638\u0647\u0631 \u0645\u0644\u062E\u0651\u0635\u0627\u062A \u064A\u0648\u0645\u0643 \u0647\u0646\u0627." }) })] }));
    }
    return (_jsxs(_Fragment, { children: [stock.needsRestock > 0 ? (_jsxs(Link, { className: "notice notice--warn notice--link", to: "/inventory", children: [_jsx("strong", { children: formatInt(stock.needsRestock) }), " \u0633\u0644\u0639\u0629 \u062A\u062D\u062A\u0627\u062C \u062A\u0645\u0648\u064A\u0646", stock.outOfStock > 0 ? ` (منها ${formatInt(stock.outOfStock)} نفدت)` : '', ":", ' ', lowStock.map((item) => item.name).join('، '), stock.needsRestock > lowStock.length ? '…' : ''] })) : null, _jsxs("div", { className: "stat-grid", children: [_jsx(StatCard, { label: "\u0637\u0644\u0628\u064A\u0627\u062A \u0646\u0634\u0650\u0637\u0629", value: formatInt(stats.active), sub: `جاري ${formatInt(stats.inProgress)} · معلّق ${formatInt(stats.pending)}`, tone: "info" }), _jsx(StatCard, { label: "\u0637\u0644\u0628\u064A\u0627\u062A \u0645\u0643\u062A\u0645\u0644\u0629", value: formatInt(stats.completed), tone: "ok" }), _jsx(StatCard, { label: "\u0645\u0633\u062A\u062D\u0642\u0627\u062A \u0627\u0644\u0637\u0644\u0628\u064A\u0627\u062A", value: money(stats.receivable), tone: "warn" }), _jsx(StatCard, { label: "\u062F\u064A\u0648\u0646 \u063A\u064A\u0631 \u0645\u0633\u062F\u0651\u062F\u0629", value: money(stats.debtRemaining), sub: stats.overdueCount ? `${formatInt(stats.overdueCount)} متأخر` : 'لا يوجد متأخر', tone: stats.overdueCount ? 'danger' : 'default' })] }), _jsxs(SectionTitle, { action: _jsx(Link, { className: "btn btn--ghost btn--sm", to: "/schedule", children: "\u0643\u0644 \u0627\u0644\u0645\u0648\u0627\u0639\u064A\u062F" }), children: ["\u0645\u0648\u0627\u0639\u064A\u062F \u0627\u0644\u064A\u0648\u0645 \u00B7 ", formatWeekday(today)] }), todayAppointments.length === 0 ? (_jsx("div", { className: "card", children: _jsx("p", { className: "muted small", children: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u0648\u0627\u0639\u064A\u062F \u0627\u0644\u064A\u0648\u0645. \u064A\u0648\u0645 \u0647\u0627\u062F\u0626 \u0644\u0644\u0639\u0645\u0644 \u0641\u064A \u0627\u0644\u0648\u0631\u0634\u0629." }) })) : (_jsx("div", { className: "list", children: todayAppointments.map((item) => (_jsx("article", { className: "card", children: _jsxs("div", { className: "card__head", children: [_jsxs("div", { children: [_jsx("h3", { className: "card__title", children: item.title }), _jsxs("p", { className: "card__sub", children: [formatTime(item.time), item.customerName ? ` · ${item.customerName}` : '', item.location ? ` · ${item.location}` : ''] })] }), _jsx(Badge, { tone: "info", children: "\u0627\u0644\u064A\u0648\u0645" })] }) }, item.id))) })), _jsx(SectionTitle, { action: _jsx(Link, { className: "btn btn--ghost btn--sm", to: "/orders", children: "\u0643\u0644 \u0627\u0644\u0637\u0644\u0628\u064A\u0627\u062A" }), children: "\u062A\u0633\u0644\u064A\u0645\u0627\u062A \u0642\u0627\u062F\u0645\u0629" }), upcomingDeliveries.length === 0 ? (_jsx("div", { className: "card", children: _jsx("p", { className: "muted small", children: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0637\u0644\u0628\u064A\u0627\u062A \u0642\u064A\u062F \u0627\u0644\u062A\u0646\u0641\u064A\u0630 \u0644\u0647\u0627 \u0645\u0648\u0639\u062F \u062A\u0633\u0644\u064A\u0645." }) })) : (_jsx("div", { className: "list", children: upcomingDeliveries.map((order) => {
                    const totals = orderTotals(order);
                    const diff = daysFromToday(order.dueDate);
                    return (_jsxs("article", { className: "card", children: [_jsxs("div", { className: "card__head", children: [_jsxs("div", { children: [_jsx("h3", { className: "card__title", children: order.title }), _jsxs("p", { className: "card__sub", children: [order.customerName || 'بدون اسم', " \u00B7 ", formatDate(order.dueDate)] })] }), _jsx(Badge, { tone: diff !== null && diff < 0 ? 'danger' : orderStatusTone(order.status), children: diff !== null && diff < 0
                                            ? relativeDayLabel(order.dueDate)
                                            : orderStatusLabel(order.status) })] }), _jsxs("div", { className: "card__meta", children: [_jsxs("span", { children: ["\u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A ", _jsx("strong", { children: money(totals.total) })] }), _jsxs("span", { children: ["\u0627\u0644\u0645\u062A\u0628\u0642\u0651\u064A ", _jsx("strong", { children: money(totals.remaining) })] })] })] }, order.id));
                }) })), _jsx(SectionTitle, { action: _jsx(Link, { className: "btn btn--ghost btn--sm", to: "/prices", children: "\u0643\u0644 \u0627\u0644\u0623\u0633\u0639\u0627\u0631" }), children: "\u0631\u0648\u0627\u0628\u0637 \u0633\u0631\u064A\u0639\u0629" }), _jsxs("div", { className: "stat-grid", children: [_jsxs(Link, { className: "stat", to: "/calculator", children: [_jsx("span", { className: "stat__label", children: "\u062D\u0627\u0633\u0628\u0629" }), _jsx("strong", { className: "stat__value stat__value--text", children: "\u0627\u0644\u062A\u0643\u0644\u0641\u0629 \u0648\u0627\u0644\u0631\u0628\u062D" })] }), _jsxs(Link, { className: "stat", to: "/prices", children: [_jsx("span", { className: "stat__label", children: "\u0645\u0624\u0634\u0631\u0627\u062A" }), _jsx("strong", { className: "stat__value stat__value--text", children: "\u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0633\u0648\u0642" })] }), _jsxs(Link, { className: "stat", to: "/debts", children: [_jsx("span", { className: "stat__label", children: "\u0633\u062C\u0644" }), _jsx("strong", { className: "stat__value stat__value--text", children: "\u0627\u0644\u062F\u064A\u0648\u0646" })] }), _jsxs(Link, { className: "stat", to: "/print", children: [_jsx("span", { className: "stat__label", children: "\u0637\u0628\u0627\u0639\u0629" }), _jsx("strong", { className: "stat__value stat__value--text", children: "\u0627\u0644\u0641\u0648\u0627\u062A\u064A\u0631 \u0648\u0627\u0644\u0643\u0634\u0648\u0641" })] })] })] }));
}
