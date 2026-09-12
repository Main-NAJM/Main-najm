import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '@/context/DataContext';
import { isActiveOrder, isOverdue, orderRemaining, orderTotal } from '@/lib/calc';
import { STATUS_LABEL, STATUS_TONE, formatDate, money } from '@/lib/format';
import { Badge, EmptyState, SectionTitle, Spinner, StatCard } from '@/components/ui';

export default function Dashboard() {
  const {
    customers,
    orders,
    materials,
    profile,
    loading,
    error,
    deviceBackup,
    adoptDeviceData,
    dismissDeviceData,
  } = useData();
  const [adopting, setAdopting] = useState(false);
  const [adoptError, setAdoptError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const active = orders.filter(isActiveOrder);
    const quotes = orders.filter((order) => order.status === 'quote');
    const overdue = orders.filter((order) => isOverdue(order));
    const outstanding = active.reduce((sum, order) => sum + Math.max(0, orderRemaining(order)), 0);
    const inProgress = orders.filter(
      (order) => order.status === 'confirmed' || order.status === 'ready',
    );
    return { quotes, overdue, outstanding, inProgress };
  }, [orders]);

  const lowStock = useMemo(
    () =>
      materials.filter(
        (material) => material.minQuantity > 0 && material.quantity <= material.minQuantity,
      ),
    [materials],
  );

  const latest = orders.slice(0, 5);

  if (loading) return <Spinner />;

  return (
    <>
      {error ? <div className="notice notice--danger">{error}</div> : null}

      {deviceBackup ? (
        <div className="notice notice--info">
          <p>
            على هذا الجهاز بيانات أدخلتَها قبل ربط الحساب:{' '}
            <strong>{deviceBackup.customers.length} زبون</strong> و{' '}
            <strong>{deviceBackup.orders.length} طلب</strong>
            {deviceBackup.materials?.length ? ` و${deviceBackup.materials.length} مادة` : ''}. حسابك
            فارغ — هل ننقلها إليه لتُزامَن مع بقيّة أجهزتك؟
          </p>
          {adoptError ? <p className="notice notice--danger">{adoptError}</p> : null}
          <div className="card__actions">
            <button
              type="button"
              className="btn btn--primary btn--sm"
              disabled={adopting}
              onClick={async () => {
                setAdoptError(null);
                setAdopting(true);
                try {
                  await adoptDeviceData();
                } catch (err) {
                  setAdoptError(err instanceof Error ? err.message : 'تعذّر نقل البيانات.');
                } finally {
                  setAdopting(false);
                }
              }}
            >
              {adopting ? 'جارٍ النقل…' : 'انقلها إلى حسابي'}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              disabled={adopting}
              onClick={dismissDeviceData}
            >
              لاحقاً
            </button>
          </div>
          <p className="field__hint">
            «لاحقاً» لا يحذف شيئاً — تبقى على الجهاز ويعود السؤال عند فتح التطبيق مجدّداً.
          </p>
        </div>
      ) : null}

      <div className="stats">
        <StatCard label="الزبائن" value={String(customers.length)} />
        <StatCard
          label="قيد التنفيذ"
          value={String(stats.inProgress.length)}
          hint={`${stats.quotes.length} عرض سعر معلّق`}
        />
        <StatCard
          label="مستحقّ على الزبائن"
          value={money(stats.outstanding, profile.currency)}
          tone={stats.outstanding > 0 ? 'danger' : 'ok'}
        />
        <StatCard
          label="متأخّر عن موعده"
          value={String(stats.overdue.length)}
          tone={stats.overdue.length ? 'danger' : undefined}
          hint={stats.overdue.length ? 'راجع الطلبات المتأخّرة' : 'كل شيء في وقته'}
        />
      </div>

      <div className="toolbar">
        <Link className="btn" to="/orders">
          طلب أو عرض سعر جديد
        </Link>
        <Link className="btn btn--ghost" to="/customers">
          إضافة زبون
        </Link>
      </div>

      {lowStock.length ? (
        <div className="notice notice--warn">
          {lowStock.length} مادة تحت حدّ التنبيه: {lowStock.slice(0, 3).map((m) => m.name).join('، ')}
          {lowStock.length > 3 ? '…' : ''} —{' '}
          <Link to="/materials">راجع المخزون</Link>
        </div>
      ) : null}

      {stats.overdue.length ? (
        <div className="card">
          <SectionTitle>طلبات تجاوزت موعد التسليم</SectionTitle>
          <div className="list mt-8">
            {stats.overdue.map((order) => (
              <div key={order.id} className="card__meta">
                <span>
                  <strong>{order.customerName}</strong> — {order.title || 'طلب'}
                </span>
                <span className="badge badge--danger">{formatDate(order.dueDate)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <SectionTitle action={<Link className="small" to="/orders">الكل</Link>}>
        آخر الطلبات
      </SectionTitle>

      {latest.length === 0 ? (
        <EmptyState
          title="لا توجد طلبات بعد"
          hint="ابدأ بإضافة زبون ثم سجّل له عرض سعر أو طلباً."
          action={
            <Link className="btn btn--sm" to="/customers">
              إضافة أول زبون
            </Link>
          }
        />
      ) : (
        <div className="list">
          {latest.map((order) => (
            <div key={order.id} className="card">
              <div className="card__head">
                <div>
                  <div className="card__title">{order.title || 'طلب بدون عنوان'}</div>
                  <div className="card__meta">
                    <span>{order.customerName}</span>
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                </div>
                <Badge tone={STATUS_TONE[order.status]}>{STATUS_LABEL[order.status]}</Badge>
              </div>
              <div className="card__meta">
                <span>
                  الإجمالي <strong>{money(orderTotal(order), profile.currency)}</strong>
                </span>
                {isActiveOrder(order) && orderRemaining(order) > 0 ? (
                  <span>
                    الباقي <strong>{money(orderRemaining(order), profile.currency)}</strong>
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
