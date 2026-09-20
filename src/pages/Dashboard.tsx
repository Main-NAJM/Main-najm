import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Badge, EmptyState, SectionTitle, StatCard } from '@/components/ui';
import { debtTotals, orderTotals } from '@/lib/calc';
import { orderStatusLabel, orderStatusTone } from '@/lib/constants';
import {
  daysFromToday,
  formatDate,
  formatInt,
  formatMoney,
  formatTime,
  formatWeekday,
  relativeDayLabel,
  todayIso,
} from '@/lib/format';

export default function Dashboard() {
  const { orders, appointments, debts, marketPrices, profile, seedDemoData } = useData();
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

  const todayAppointments = useMemo(
    () =>
      appointments
        .filter((item) => item.date === today && !item.done)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, today],
  );

  const upcomingDeliveries = useMemo(
    () =>
      orders
        .filter((order) => order.status !== 'completed' && order.dueDate)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 4),
    [orders],
  );

  const isEmpty =
    orders.length === 0 &&
    appointments.length === 0 &&
    debts.length === 0 &&
    marketPrices.length === 0;

  const money = (value: number) => formatMoney(value, profile.currency);

  if (isEmpty) {
    return (
      <>
        <div className="card">
          <h2 className="card__title">أهلاً بك في حرفة برو</h2>
          <p className="card__sub">
            نظّم طلبياتك ومواعيدك وحساباتك وديونك في مكان واحد، واطبع فواتيرك وكشوفك بضغطة زر.
          </p>
          <div className="card__actions">
            <Link className="btn" to="/orders">
              ابدأ بإضافة طلبية
            </Link>
            <Link className="btn btn--ghost btn--sm" to="/settings">
              ضبط بيانات الورشة
            </Link>
            {user?.isLocal ? (
              <button type="button" className="btn btn--soft btn--sm" onClick={seedDemoData}>
                تعبئة بيانات تجريبية
              </button>
            ) : null}
          </div>
        </div>
        <div className="mt-16">
          <EmptyState
            title="لا توجد بيانات بعد"
            description="أضف أول طلبية أو موعد أو دين وستظهر ملخّصات يومك هنا."
          />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="stat-grid">
        <StatCard
          label="طلبيات نشِطة"
          value={formatInt(stats.active)}
          sub={`جاري ${formatInt(stats.inProgress)} · معلّق ${formatInt(stats.pending)}`}
          tone="info"
        />
        <StatCard label="طلبيات مكتملة" value={formatInt(stats.completed)} tone="ok" />
        <StatCard label="مستحقات الطلبيات" value={money(stats.receivable)} tone="warn" />
        <StatCard
          label="ديون غير مسدّدة"
          value={money(stats.debtRemaining)}
          sub={stats.overdueCount ? `${formatInt(stats.overdueCount)} متأخر` : 'لا يوجد متأخر'}
          tone={stats.overdueCount ? 'danger' : 'default'}
        />
      </div>

      <SectionTitle
        action={
          <Link className="btn btn--ghost btn--sm" to="/schedule">
            كل المواعيد
          </Link>
        }
      >
        مواعيد اليوم · {formatWeekday(today)}
      </SectionTitle>

      {todayAppointments.length === 0 ? (
        <div className="card">
          <p className="muted small">لا توجد مواعيد اليوم. يوم هادئ للعمل في الورشة.</p>
        </div>
      ) : (
        <div className="list">
          {todayAppointments.map((item) => (
            <article key={item.id} className="card">
              <div className="card__head">
                <div>
                  <h3 className="card__title">{item.title}</h3>
                  <p className="card__sub">
                    {formatTime(item.time)}
                    {item.customerName ? ` · ${item.customerName}` : ''}
                    {item.location ? ` · ${item.location}` : ''}
                  </p>
                </div>
                <Badge tone="info">اليوم</Badge>
              </div>
            </article>
          ))}
        </div>
      )}

      <SectionTitle
        action={
          <Link className="btn btn--ghost btn--sm" to="/orders">
            كل الطلبيات
          </Link>
        }
      >
        تسليمات قادمة
      </SectionTitle>

      {upcomingDeliveries.length === 0 ? (
        <div className="card">
          <p className="muted small">لا توجد طلبيات قيد التنفيذ لها موعد تسليم.</p>
        </div>
      ) : (
        <div className="list">
          {upcomingDeliveries.map((order) => {
            const totals = orderTotals(order);
            const diff = daysFromToday(order.dueDate);
            return (
              <article key={order.id} className="card">
                <div className="card__head">
                  <div>
                    <h3 className="card__title">{order.title}</h3>
                    <p className="card__sub">
                      {order.customerName || 'بدون اسم'} · {formatDate(order.dueDate)}
                    </p>
                  </div>
                  <Badge tone={diff !== null && diff < 0 ? 'danger' : orderStatusTone(order.status)}>
                    {diff !== null && diff < 0
                      ? relativeDayLabel(order.dueDate)
                      : orderStatusLabel(order.status)}
                  </Badge>
                </div>
                <div className="card__meta">
                  <span>
                    الإجمالي <strong>{money(totals.total)}</strong>
                  </span>
                  <span>
                    المتبقّي <strong>{money(totals.remaining)}</strong>
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <SectionTitle
        action={
          <Link className="btn btn--ghost btn--sm" to="/prices">
            كل الأسعار
          </Link>
        }
      >
        روابط سريعة
      </SectionTitle>
      <div className="stat-grid">
        <Link className="stat" to="/calculator">
          <span className="stat__label">حاسبة</span>
          <strong className="stat__value stat__value--text">
            التكلفة والربح
          </strong>
        </Link>
        <Link className="stat" to="/prices">
          <span className="stat__label">مؤشرات</span>
          <strong className="stat__value stat__value--text">
            أسعار السوق
          </strong>
        </Link>
        <Link className="stat" to="/debts">
          <span className="stat__label">سجل</span>
          <strong className="stat__value stat__value--text">
            الديون
          </strong>
        </Link>
        <Link className="stat" to="/print">
          <span className="stat__label">طباعة</span>
          <strong className="stat__value stat__value--text">
            الفواتير والكشوف
          </strong>
        </Link>
      </div>
    </>
  );
}
