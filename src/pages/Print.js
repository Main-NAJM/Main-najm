import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { EmptyState, Select } from '@/components/ui';
import { debtTotals, orderTotals } from '@/lib/calc';
import { ORDER_STATUSES } from '@/lib/constants';
import { daysFromToday, formatInt, formatMoney } from '@/lib/format';
import { downloadHtml, printHtml } from '@/print/print';
import { buildCalculationsReport, buildDebtsReport, buildInvoice, buildOrdersReport, } from '@/print/templates';
export default function Print() {
    const { orders, debts, calculations, profile } = useData();
    const { notify } = useToast();
    const [kind, setKind] = useState('orders');
    const [orderId, setOrderId] = useState('');
    const [orderFilter, setOrderFilter] = useState('all');
    const [debtFilter, setDebtFilter] = useState('open');
    const filteredOrders = useMemo(() => {
        if (orderFilter === 'all')
            return orders;
        if (orderFilter === 'unpaid') {
            return orders.filter((order) => orderTotals(order).remaining > 0);
        }
        return orders.filter((order) => order.status === orderFilter);
    }, [orders, orderFilter]);
    const filteredDebts = useMemo(() => {
        return debts.filter((debt) => {
            const t = debtTotals(debt);
            const overdue = !t.isSettled && (daysFromToday(debt.dueDate) ?? 1) < 0;
            if (debtFilter === 'open')
                return !t.isSettled;
            if (debtFilter === 'settled')
                return t.isSettled;
            if (debtFilter === 'overdue')
                return overdue;
            return true;
        });
    }, [debts, debtFilter]);
    const orderFilterLabel = orderFilter === 'all'
        ? 'كل الطلبيات'
        : orderFilter === 'unpaid'
            ? 'الطلبيات التي عليها مبالغ متبقّية'
            : `الطلبيات: ${ORDER_STATUSES.find((s) => s.value === orderFilter)?.label ?? ''}`;
    const debtFilterLabel = debtFilter === 'all'
        ? 'كل الديون'
        : debtFilter === 'open'
            ? 'الديون غير المسدّدة'
            : debtFilter === 'overdue'
                ? 'الديون المتأخّرة'
                : 'الديون المسدّدة';
    const selectedOrder = orders.find((order) => order.id === orderId) ?? null;
    const build = () => {
        switch (kind) {
            case 'invoice': {
                if (!selectedOrder) {
                    notify('اختر الطلبية المطلوب طباعة فاتورتها.', 'error');
                    return null;
                }
                return {
                    title: `فاتورة - ${selectedOrder.title}`,
                    body: buildInvoice(selectedOrder, profile),
                    file: `invoice-${selectedOrder.id.slice(-6)}`,
                };
            }
            case 'orders':
                return {
                    title: 'كشف الطلبيات',
                    body: buildOrdersReport(filteredOrders, profile, orderFilterLabel),
                    file: 'orders-report',
                };
            case 'debts':
                return {
                    title: 'سجل الديون',
                    body: buildDebtsReport(filteredDebts, profile, debtFilterLabel),
                    file: 'debts-report',
                };
            case 'calculations':
                return {
                    title: 'سجل التسعير',
                    body: buildCalculationsReport(calculations, profile),
                    file: 'pricing-report',
                };
            default:
                return null;
        }
    };
    const doPrint = () => {
        const doc = build();
        if (doc)
            printHtml(doc.title, doc.body);
    };
    const doDownload = () => {
        const doc = build();
        if (doc) {
            downloadHtml(doc.title, doc.body, doc.file);
            notify('حُفظ الملف، يمكنك فتحه وطباعته في أي وقت.');
        }
    };
    const summary = (() => {
        switch (kind) {
            case 'invoice':
                return selectedOrder
                    ? `الإجمالي ${formatMoney(orderTotals(selectedOrder).total, profile.currency)} · المتبقّي ${formatMoney(orderTotals(selectedOrder).remaining, profile.currency)}`
                    : 'لم تُختر طلبية بعد.';
            case 'orders': {
                const total = filteredOrders.reduce((sum, o) => sum + orderTotals(o).total, 0);
                const remaining = filteredOrders.reduce((sum, o) => sum + orderTotals(o).remaining, 0);
                return `${formatInt(filteredOrders.length)} طلبية · الإجمالي ${formatMoney(total, profile.currency)} · المتبقّي ${formatMoney(remaining, profile.currency)}`;
            }
            case 'debts': {
                const remaining = filteredDebts.reduce((sum, d) => sum + debtTotals(d).remaining, 0);
                return `${formatInt(filteredDebts.length)} سجل · المتبقّي ${formatMoney(remaining, profile.currency)}`;
            }
            case 'calculations':
                return `${formatInt(calculations.length)} حساب محفوظ`;
            default:
                return '';
        }
    })();
    const hasData = orders.length > 0 || debts.length > 0 || calculations.length > 0;
    if (!hasData) {
        return (_jsx(EmptyState, { title: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0628\u064A\u0627\u0646\u0627\u062A \u0644\u0644\u0637\u0628\u0627\u0639\u0629", description: "\u0623\u0636\u0641 \u0637\u0644\u0628\u064A\u0627\u062A \u0623\u0648 \u062F\u064A\u0648\u0646\u0627\u064B \u0623\u0648 \u062D\u0633\u0627\u0628\u0627\u062A \u062A\u0633\u0639\u064A\u0631\u060C \u062B\u0645 \u0639\u062F \u0625\u0644\u0649 \u0647\u0646\u0627 \u0644\u0637\u0628\u0627\u0639\u0629 \u0627\u0644\u0641\u0648\u0627\u062A\u064A\u0631 \u0648\u0627\u0644\u0643\u0634\u0648\u0641." }));
    }
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "card", children: [_jsx(Select, { label: "\u0646\u0648\u0639 \u0627\u0644\u0645\u0633\u062A\u0646\u062F", value: kind, options: [
                            { value: 'invoice', label: 'فاتورة طلبية' },
                            { value: 'orders', label: 'كشف الطلبيات' },
                            { value: 'debts', label: 'سجل الديون' },
                            { value: 'calculations', label: 'سجل التسعير' },
                        ], onChange: (value) => {
                            setKind(value);
                        } }), kind === 'invoice' ? (_jsx(Select, { label: "\u0627\u0644\u0637\u0644\u0628\u064A\u0629", value: orderId, options: [
                            { value: '', label: 'اختر طلبية…' },
                            ...orders.map((order) => ({
                                value: order.id,
                                label: `${order.title} — ${order.customerName || 'بدون اسم'}`,
                            })),
                        ], onChange: setOrderId })) : null, kind === 'orders' ? (_jsx(Select, { label: "\u0627\u0644\u062A\u0635\u0641\u064A\u0629", value: orderFilter, options: [
                            { value: 'all', label: 'كل الطلبيات' },
                            ...ORDER_STATUSES.map((s) => ({ value: s.value, label: s.label })),
                            { value: 'unpaid', label: 'عليها مبالغ متبقّية' },
                        ], onChange: (value) => {
                            setOrderFilter(value);
                        } })) : null, kind === 'debts' ? (_jsx(Select, { label: "\u0627\u0644\u062A\u0635\u0641\u064A\u0629", value: debtFilter, options: [
                            { value: 'open', label: 'غير مسدّد' },
                            { value: 'overdue', label: 'متأخر' },
                            { value: 'settled', label: 'مسدّد' },
                            { value: 'all', label: 'الكل' },
                        ], onChange: (value) => {
                            setDebtFilter(value);
                        } })) : null, _jsx("div", { className: "summary-box mt-8", children: _jsxs("div", { className: "summary-row", children: [_jsx("span", { children: "\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0645\u0633\u062A\u0646\u062F" }), _jsx("span", { children: summary })] }) }), _jsxs("div", { className: "card__actions", children: [_jsx("button", { type: "button", className: "btn", onClick: doPrint, children: "\u0637\u0628\u0627\u0639\u0629" }), _jsx("button", { type: "button", className: "btn btn--ghost btn--sm", onClick: doDownload, children: "\u062D\u0641\u0638 \u0643\u0645\u0644\u0641" })] })] }), _jsx("div", { className: "notice notice--info mt-16", children: "\u0639\u0644\u0649 \u0627\u0644\u0647\u0627\u062A\u0641 \u0627\u062E\u062A\u0631 \u00AB\u0637\u0628\u0627\u0639\u0629\u00BB \u062B\u0645 \u00AB\u062D\u0641\u0638 \u0643\u0640 PDF\u00BB \u0645\u0646 \u0646\u0627\u0641\u0630\u0629 \u0627\u0644\u0637\u0628\u0627\u0639\u0629 \u0644\u0645\u0634\u0627\u0631\u0643\u0629 \u0627\u0644\u0645\u0633\u062A\u0646\u062F \u0645\u0639 \u0627\u0644\u0632\u0628\u0648\u0646. \u062A\u0638\u0647\u0631 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0648\u0631\u0634\u0629 \u0641\u064A \u0631\u0623\u0633 \u0643\u0644 \u0645\u0633\u062A\u0646\u062F\u060C \u0648\u064A\u0645\u0643\u0646\u0643 \u062A\u0639\u062F\u064A\u0644\u0647\u0627 \u0645\u0646 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A." })] }));
}
