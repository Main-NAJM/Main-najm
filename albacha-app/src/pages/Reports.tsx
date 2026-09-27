import { useMemo, useState } from 'react';
import { useData } from '@/context/DataContext';
import { isActiveOrder, orderTotal } from '@/lib/calc';
import { money } from '@/lib/format';
import { EmptyState, SectionTitle, Spinner, StatCard } from '@/components/ui';
import type { Order } from '@/lib/types';

interface MonthRow {
  key: string;
  label: string;
  orders: number;
  sales: number;
  cost: number;
  profit: number;
  collected: number;
}

const monthKey = (value: number | string): string =>
  typeof value === 'number'
    ? new Date(value).toISOString().slice(0, 7)
    : String(value).slice(0, 7);

const monthLabel = (key: string): string => {
  const [year, month] = key.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat('ar-DZ', { month: 'long', year: 'numeric' }).format(date);
};

/**
 * تقرير شهري:
 * - المبيعات والتكلفة والربح تُنسب إلى شهر إنشاء الطلب.
 * - المحصّل يُنسب إلى شهر الدفعة نفسها، فقد تُدفع في شهر لاحق.
 * عروض الأسعار والطلبات الملغاة لا تدخل في المبيعات.
 */
const buildRows = (orders: Order[]): MonthRow[] => {
  const map = new Map<string, MonthRow>();

  const row = (key: string): MonthRow => {
    const existing = map.get(key);
    if (existing) return existing;
    const created: MonthRow = {
      key,
      label: monthLabel(key),
      orders: 0,
      sales: 0,
      cost: 0,
      profit: 0,
      collected: 0,
    };
    map.set(key, created);
    return created;
  };

  orders.forEach((order) => {
    if (isActiveOrder(order)) {
      const entry = row(monthKey(order.createdAt));
      const sales = orderTotal(order);
      const cost = order.cost ?? 0;
      entry.orders += 1;
      entry.sales += sales;
      entry.cost += cost;
      entry.profit += sales - cost;
    }
    // الدفعات تُحتسب حيث وقعت فعلاً، حتى للطلبات الملغاة (مبالغ قُبضت بالفعل).
    order.payments.forEach((payment) => {
      row(monthKey(payment.date)).collected += payment.amount;
    });
  });

  return [...map.values()].sort((a, b) => b.key.localeCompare(a.key));
};

export default function Reports() {
  const { orders, profile, loading } = useData();
  const rows = useMemo(() => buildRows(orders), [orders]);
  const [openMonth, setOpenMonth] = useState<string | null>(null);

  const year = useMemo(() => {
    const currentYear = new Date().getFullYear().toString();
    const yearRows = rows.filter((entry) => entry.key.startsWith(currentYear));
    return {
      label: currentYear,
      sales: yearRows.reduce((sum, entry) => sum + entry.sales, 0),
      profit: yearRows.reduce((sum, entry) => sum + entry.profit, 0),
      collected: yearRows.reduce((sum, entry) => sum + entry.collected, 0),
    };
  }, [rows]);

  const withoutCost = orders.filter((order) => isActiveOrder(order) && !order.cost).length;

  if (loading) return <Spinner />;

  return (
    <>
      <div className="stats">
        <StatCard label={`مبيعات ${year.label}`} value={money(year.sales, profile.currency)} />
        <StatCard
          label={`ربح ${year.label}`}
          value={money(year.profit, profile.currency)}
          tone={year.profit >= 0 ? 'ok' : 'danger'}
        />
        <StatCard label="المحصّل هذه السنة" value={money(year.collected, profile.currency)} />
      </div>

      {withoutCost ? (
        <div className="notice notice--warn">
          {withoutCost} طلباً بلا تكلفة مسجّلة، فيُحتسب ربحها كاملاً. أضف «تكلفة المواد والتنفيذ»
          في نموذج الطلب ليصير الربح دقيقاً.
        </div>
      ) : null}

      <SectionTitle>الأشهر</SectionTitle>

      {rows.length === 0 ? (
        <EmptyState title="لا توجد بيانات بعد" hint="سجّل طلباً واحداً على الأقل ليظهر التقرير." />
      ) : (
        <div className="list">
          {rows.map((month) => {
            const open = openMonth === month.key;
            const margin = month.sales > 0 ? Math.round((month.profit / month.sales) * 100) : 0;
            return (
              <div key={month.key} className="card">
                <button
                  type="button"
                  className="card__head"
                  aria-expanded={open}
                  onClick={() => setOpenMonth(open ? null : month.key)}
                >
                  <div>
                    <div className="card__title">{month.label}</div>
                    <div className="card__meta">
                      <span>{month.orders} طلب</span>
                      <span>مبيعات {money(month.sales, profile.currency)}</span>
                    </div>
                  </div>
                  <span className={`badge badge--${month.profit >= 0 ? 'ok' : 'danger'}`}>
                    {money(month.profit, profile.currency)}
                  </span>
                </button>

                {open ? (
                  <div className="totals">
                    <div>
                      <span>المبيعات</span>
                      <span>{money(month.sales, profile.currency)}</span>
                    </div>
                    <div>
                      <span>التكاليف المسجّلة</span>
                      <span>{money(month.cost, profile.currency)}</span>
                    </div>
                    <div>
                      <span>هامش الربح</span>
                      <span>{margin}٪</span>
                    </div>
                    <div>
                      <span>المحصّل فعلياً في الشهر</span>
                      <span>{money(month.collected, profile.currency)}</span>
                    </div>
                    <div className="is-grand">
                      <span>الربح</span>
                      <span>{money(month.profit, profile.currency)}</span>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
