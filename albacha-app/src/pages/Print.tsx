import { Link, useNavigate, useParams } from 'react-router-dom';
import { useData } from '@/context/DataContext';
import { itemArea, itemTotal, itemsTotal, orderRemaining, orderTotal, paidTotal } from '@/lib/calc';
import { MATERIAL_LABEL, STATUS_LABEL, decimal, formatDate, money } from '@/lib/format';
import { EmptyState, Spinner } from '@/components/ui';

export default function Print() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { orders, profile, loading } = useData();
  const order = orders.find((entry) => entry.id === orderId);

  if (loading) return <Spinner />;

  if (!order) {
    return (
      <EmptyState
        title="الطلب غير موجود"
        hint="ربما حُذف الطلب."
        action={
          <Link className="btn btn--sm" to="/orders">
            العودة إلى الطلبات
          </Link>
        }
      />
    );
  }

  const isQuote = order.status === 'quote';
  const paid = paidTotal(order);
  const remaining = orderRemaining(order);

  return (
    <>
      <div className="toolbar no-print">
        <button type="button" className="btn" onClick={() => window.print()}>
          طباعة / حفظ PDF
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => navigate(-1)}>
          رجوع
        </button>
      </div>

      <div className="sheet">
        <div className="sheet__head">
          <div>
            <div className="sheet__org">{profile.name}</div>
            <div className="small">{profile.address}</div>
            <div className="small" dir="ltr">
              {profile.phone}
            </div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <strong>{isQuote ? 'عرض سعر' : 'فاتورة'}</strong>
            <div className="small">رقم: {order.id.slice(-6)}</div>
            <div className="small">التاريخ: {formatDate(order.createdAt)}</div>
          </div>
        </div>

        <table>
          <tbody>
            <tr>
              <th style={{ width: '25%' }}>الزبون</th>
              <td>{order.customerName}</td>
              <th style={{ width: '20%' }}>الهاتف</th>
              <td dir="ltr">{order.customerPhone || '—'}</td>
            </tr>
            <tr>
              <th>الطلب</th>
              <td>{order.title || '—'}</td>
              <th>المادة</th>
              <td>{MATERIAL_LABEL[order.material]}</td>
            </tr>
            <tr>
              <th>الحالة</th>
              <td>{STATUS_LABEL[order.status]}</td>
              <th>التسليم</th>
              <td>{order.dueDate ? formatDate(order.dueDate) : '—'}</td>
            </tr>
          </tbody>
        </table>

        <table>
          <thead>
            <tr>
              <th style={{ width: '34%' }}>البند</th>
              <th>القياس</th>
              <th>العدد</th>
              <th>المساحة</th>
              <th>سعر الوحدة</th>
              <th>المبلغ</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>{item.label || '—'}</td>
                <td dir="ltr">
                  {item.unit === 'm2' ? `${decimal(item.width)} × ${decimal(item.height)}` : '—'}
                </td>
                <td>{decimal(item.qty, 0)}</td>
                <td>{item.unit === 'm2' ? `${decimal(itemArea(item))} م²` : '—'}</td>
                <td>{money(item.unitPrice, profile.currency)}</td>
                <td>{money(itemTotal(item), profile.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="sheet__totals">
          <tbody>
            <tr>
              <th>مجموع البنود</th>
              <td>{money(itemsTotal(order.items), profile.currency)}</td>
            </tr>
            {order.laborFee ? (
              <tr>
                <th>التركيب والنقل</th>
                <td>{money(order.laborFee, profile.currency)}</td>
              </tr>
            ) : null}
            {order.discount ? (
              <tr>
                <th>الخصم</th>
                <td>− {money(order.discount, profile.currency)}</td>
              </tr>
            ) : null}
            <tr>
              <th>الإجمالي</th>
              <td>
                <strong>{money(orderTotal(order), profile.currency)}</strong>
              </td>
            </tr>
            {!isQuote && paid > 0 ? (
              <>
                <tr>
                  <th>المدفوع</th>
                  <td>{money(paid, profile.currency)}</td>
                </tr>
                <tr>
                  <th>الباقي</th>
                  <td>
                    <strong>{money(Math.max(0, remaining), profile.currency)}</strong>
                  </td>
                </tr>
              </>
            ) : null}
          </tbody>
        </table>

        {order.note ? (
          <p className="small" style={{ marginTop: 12 }}>
            <strong>ملاحظات: </strong>
            {order.note}
          </p>
        ) : null}

        {isQuote && profile.quoteNote ? (
          <p className="small" style={{ marginTop: 8 }}>
            {profile.quoteNote}
          </p>
        ) : null}

        <div className="sheet__sign">
          <span>توقيع الزبون</span>
          <span>عن {profile.name}</span>
        </div>
      </div>
    </>
  );
}
