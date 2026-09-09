import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '@/context/DataContext';
import { isActiveOrder, isOverdue, orderRemaining } from '@/lib/calc';
import { formatDate, money, waNumber } from '@/lib/format';
import { EmptyState, SectionTitle, Spinner, StatCard } from '@/components/ui';
import type { Order } from '@/lib/types';

interface Row {
  customerId: string;
  name: string;
  phone: string;
  due: number;
  orders: Order[];
  overdue: boolean;
}

export default function Receivables() {
  const { orders, customers, profile, loading } = useData();

  const rows = useMemo<Row[]>(() => {
    const map = new Map<string, Row>();
    orders.filter(isActiveOrder).forEach((order) => {
      const due = orderRemaining(order);
      if (due <= 0) return;
      const customer = customers.find((entry) => entry.id === order.customerId);
      const row = map.get(order.customerId) ?? {
        customerId: order.customerId,
        name: order.customerName || customer?.name || 'زبون محذوف',
        phone: customer?.phone ?? order.customerPhone,
        due: 0,
        orders: [],
        overdue: false,
      };
      row.due += due;
      row.orders.push(order);
      if (isOverdue(order)) row.overdue = true;
      map.set(order.customerId, row);
    });
    return [...map.values()].sort((a, b) => b.due - a.due);
  }, [orders, customers]);

  const total = rows.reduce((sum, row) => sum + row.due, 0);

  if (loading) return <Spinner />;

  return (
    <>
      <div className="stats">
        <StatCard
          label="إجمالي المستحقّات"
          value={money(total, profile.currency)}
          tone={total > 0 ? 'danger' : 'ok'}
        />
        <StatCard label="زبائن عليهم مبالغ" value={String(rows.length)} />
      </div>

      <SectionTitle>المستحقّات حسب الزبون</SectionTitle>

      {rows.length === 0 ? (
        <EmptyState
          title="لا توجد مبالغ مستحقّة"
          hint="كل الطلبات المسجّلة مدفوعة بالكامل."
        />
      ) : (
        <div className="list">
          {rows.map((row) => (
            <div key={row.customerId} className="card">
              <div className="card__head">
                <div>
                  <div className="card__title">{row.name}</div>
                  <div className="card__meta">
                    {row.phone ? <span dir="ltr">{row.phone}</span> : null}
                    <span>{row.orders.length} طلب غير مسدَّد</span>
                  </div>
                </div>
                <span className={`badge badge--${row.overdue ? 'danger' : 'warn'}`}>
                  {money(row.due, profile.currency)}
                </span>
              </div>

              <div className="list mt-8">
                {row.orders.map((order) => (
                  <div key={order.id} className="card__meta">
                    <span>{order.title || 'طلب بدون عنوان'}</span>
                    <span>{money(orderRemaining(order), profile.currency)}</span>
                    {order.dueDate ? (
                      <span className={isOverdue(order) ? 'badge badge--danger' : undefined}>
                        {formatDate(order.dueDate)}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="card__actions">
                {row.phone ? (
                  <>
                    <a className="btn btn--ghost btn--sm" href={`tel:${row.phone}`}>
                      اتصال
                    </a>
                    <a
                      className="btn btn--ghost btn--sm"
                      href={`https://wa.me/${waNumber(row.phone)}?text=${encodeURIComponent(
                        `السلام عليكم، تذكير بمستحقّات ${money(row.due, profile.currency)} لدى ${profile.name}.`,
                      )}`}
                      target="_blank"
                      rel="noopener"
                    >
                      تذكير بواتساب
                    </a>
                  </>
                ) : null}
                <Link className="btn btn--ghost btn--sm" to="/orders">
                  فتح الطلبات
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
