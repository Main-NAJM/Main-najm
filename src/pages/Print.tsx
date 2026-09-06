import { useMemo, useState } from 'react';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { EmptyState, Select } from '@/components/ui';
import { debtTotals, orderTotals } from '@/lib/calc';
import { ORDER_STATUSES } from '@/lib/constants';
import { daysFromToday, formatInt, formatMoney } from '@/lib/format';
import { downloadHtml, printHtml } from '@/print/print';
import {
  buildCalculationsReport,
  buildDebtsReport,
  buildInvoice,
  buildOrdersReport,
} from '@/print/templates';
import type { OrderStatus } from '@/lib/types';

type DocKind = 'invoice' | 'orders' | 'debts' | 'calculations';
type OrderFilter = OrderStatus | 'all' | 'unpaid';
type DebtFilter = 'all' | 'open' | 'overdue' | 'settled';

export default function Print() {
  const { orders, debts, calculations, profile } = useData();
  const { notify } = useToast();

  const [kind, setKind] = useState<DocKind>('orders');
  const [orderId, setOrderId] = useState<string>('');
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all');
  const [debtFilter, setDebtFilter] = useState<DebtFilter>('open');

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'all') return orders;
    if (orderFilter === 'unpaid') {
      return orders.filter((order) => orderTotals(order).remaining > 0);
    }
    return orders.filter((order) => order.status === orderFilter);
  }, [orders, orderFilter]);

  const filteredDebts = useMemo(() => {
    return debts.filter((debt) => {
      const t = debtTotals(debt);
      const overdue = !t.isSettled && (daysFromToday(debt.dueDate) ?? 1) < 0;
      if (debtFilter === 'open') return !t.isSettled;
      if (debtFilter === 'settled') return t.isSettled;
      if (debtFilter === 'overdue') return overdue;
      return true;
    });
  }, [debts, debtFilter]);

  const orderFilterLabel =
    orderFilter === 'all'
      ? 'كل الطلبيات'
      : orderFilter === 'unpaid'
        ? 'الطلبيات التي عليها مبالغ متبقّية'
        : `الطلبيات: ${ORDER_STATUSES.find((s) => s.value === orderFilter)?.label ?? ''}`;

  const debtFilterLabel =
    debtFilter === 'all'
      ? 'كل الديون'
      : debtFilter === 'open'
        ? 'الديون غير المسدّدة'
        : debtFilter === 'overdue'
          ? 'الديون المتأخّرة'
          : 'الديون المسدّدة';

  const selectedOrder = orders.find((order) => order.id === orderId) ?? null;

  const build = (): { title: string; body: string; file: string } | null => {
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
    if (doc) printHtml(doc.title, doc.body);
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

  const hasData =
    orders.length > 0 || debts.length > 0 || calculations.length > 0;

  if (!hasData) {
    return (
      <EmptyState
        title="لا توجد بيانات للطباعة"
        description="أضف طلبيات أو ديوناً أو حسابات تسعير، ثم عد إلى هنا لطباعة الفواتير والكشوف."
      />
    );
  }

  return (
    <>
      <div className="card">
        <Select
          label="نوع المستند"
          value={kind}
          options={[
            { value: 'invoice', label: 'فاتورة طلبية' },
            { value: 'orders', label: 'كشف الطلبيات' },
            { value: 'debts', label: 'سجل الديون' },
            { value: 'calculations', label: 'سجل التسعير' },
          ]}
          onChange={(value) => {
            setKind(value as DocKind);
          }}
        />

        {kind === 'invoice' ? (
          <Select
            label="الطلبية"
            value={orderId}
            options={[
              { value: '', label: 'اختر طلبية…' },
              ...orders.map((order) => ({
                value: order.id,
                label: `${order.title} — ${order.customerName || 'بدون اسم'}`,
              })),
            ]}
            onChange={setOrderId}
          />
        ) : null}

        {kind === 'orders' ? (
          <Select
            label="التصفية"
            value={orderFilter}
            options={[
              { value: 'all', label: 'كل الطلبيات' },
              ...ORDER_STATUSES.map((s) => ({ value: s.value as OrderFilter, label: s.label })),
              { value: 'unpaid', label: 'عليها مبالغ متبقّية' },
            ]}
            onChange={(value) => {
              setOrderFilter(value as OrderFilter);
            }}
          />
        ) : null}

        {kind === 'debts' ? (
          <Select
            label="التصفية"
            value={debtFilter}
            options={[
              { value: 'open', label: 'غير مسدّد' },
              { value: 'overdue', label: 'متأخر' },
              { value: 'settled', label: 'مسدّد' },
              { value: 'all', label: 'الكل' },
            ]}
            onChange={(value) => {
              setDebtFilter(value as DebtFilter);
            }}
          />
        ) : null}

        <div className="summary-box mt-8">
          <div className="summary-row">
            <span>محتوى المستند</span>
            <span>{summary}</span>
          </div>
        </div>

        <div className="card__actions">
          <button type="button" className="btn" onClick={doPrint}>
            طباعة
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={doDownload}>
            حفظ كملف
          </button>
        </div>
      </div>

      <div className="notice notice--info mt-16">
        على الهاتف اختر «طباعة» ثم «حفظ كـ PDF» من نافذة الطباعة لمشاركة المستند مع الزبون. تظهر
        بيانات الورشة في رأس كل مستند، ويمكنك تعديلها من الإعدادات.
      </div>
    </>
  );
}
