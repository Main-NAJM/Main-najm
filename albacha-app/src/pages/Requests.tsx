/**
 * الطلبات الواردة من نموذج الموقع.
 *
 * الزائر يملأ النموذج بلا حساب، فيصل الطلب هنا باسمه وهاتفه ومقاساته. وزرّ
 * واحد يحوّله إلى زبون وطلب في الدفتر، فلا يُعاد إدخال شيء بخطّ اليد.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { formatDate, newId, waNumber } from '@/lib/format';
import { deleteRequest, loadRequests, markRequestDone } from '@/data/siteStore';
import { Badge, ConfirmDialog, EmptyState, SectionTitle, Spinner } from '@/components/ui';
import type { Customer, MaterialKind, Order, RequestKind, SiteRequest } from '@/lib/types';

const KIND_LABEL: Record<RequestKind, string> = {
  aluminium: 'ألمنيوم',
  iron: 'حديد',
  kitchen: 'مطبخ ألمنيوم',
  railing: 'درج ودرابزين',
  other: 'عمل آخر',
};

/** مادّة الطلب المشتقّة من اختيار الزائر — المطبخ ألمنيوم والدرابزين حديد. */
const KIND_MATERIAL: Record<RequestKind, MaterialKind> = {
  aluminium: 'aluminium',
  iron: 'iron',
  kitchen: 'aluminium',
  railing: 'iron',
  other: 'mixed',
};

export default function Requests() {
  const { user, firebaseAvailable } = useAuth();
  const { customers, orders, saveCustomer, saveOrder } = useData();
  const navigate = useNavigate();

  const [list, setList] = useState<SiteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [removing, setRemoving] = useState<SiteRequest | null>(null);

  const usable = firebaseAvailable && !user?.isLocal;

  const refresh = useCallback(async () => {
    if (!usable) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setList(await loadRequests());
    } catch {
      // القراءة محصورة بمالك الموقع، فهذا يعني أن الحساب ليس المالك.
      setError('لا يقرأ الطلبات الواردة إلا الحساب المالك للموقع التعريفي.');
    } finally {
      setLoading(false);
    }
  }, [usable]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const pending = useMemo(() => list.filter((entry) => entry.status === 'new'), [list]);

  /** ينشئ الزبون إن لم يكن مسجّلاً، ثم يفتح له عرض سعر بمقاسات الطلب. */
  const convert = async (request: SiteRequest) => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const wanted = waNumber(request.phone);
      const existing = customers.find(
        (entry) => entry.phone && waNumber(entry.phone) === wanted,
      );

      let customer: Customer;
      if (existing) {
        customer = existing;
      } else {
        customer = {
          id: newId(),
          name: request.name,
          phone: request.phone,
          address: '',
          note: 'أتى من نموذج الموقع.',
          createdAt: Date.now(),
        };
        await saveCustomer(customer);
      }

      const hasSize = request.width > 0 && request.height > 0;
      const now = Date.now();
      const order: Order = {
        id: newId(),
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        title: KIND_LABEL[request.kind],
        material: KIND_MATERIAL[request.kind],
        status: 'quote',
        items: [
          {
            id: newId(),
            label: KIND_LABEL[request.kind],
            unit: hasSize ? 'm2' : 'piece',
            width: request.width,
            height: request.height,
            qty: request.qty > 0 ? request.qty : 1,
            unitPrice: 0,
          },
        ],
        laborFee: 0,
        discount: 0,
        cost: 0,
        payments: [],
        dueDate: '',
        note: request.note,
        createdAt: now,
        updatedAt: now,
      };
      await saveOrder(order);
      await markRequestDone(request.id);
      setList((current) =>
        current.map((entry) =>
          entry.id === request.id ? { ...entry, status: 'done' } : entry,
        ),
      );
      setInfo(
        existing
          ? `أُضيف عرض سعر إلى ${customer.name}. أدخل السعر ثم أرسله بواتساب.`
          : `أُضيف ${customer.name} إلى الزبائن ومعه عرض سعر. أدخل السعر ثم أرسله بواتساب.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر تحويل الطلب.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (request: SiteRequest) => {
    setBusy(true);
    try {
      await deleteRequest(request.id);
      setList((current) => current.filter((entry) => entry.id !== request.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر حذف الطلب.');
    } finally {
      setBusy(false);
      setRemoving(null);
    }
  };

  if (!usable) {
    return (
      <>
        <SectionTitle>الطلبات الواردة</SectionTitle>
        <div className="notice notice--warn">
          الطلبات الواردة تحتاج تسجيل الدخول بحساب، لأنها تصل من الموقع إلى قاعدة البيانات.
          أنت الآن في وضع الجهاز.
        </div>
      </>
    );
  }

  if (loading) return <Spinner />;

  return (
    <>
      <SectionTitle>الطلبات الواردة</SectionTitle>

      {error ? <div className="notice notice--danger">{error}</div> : null}
      {info ? <div className="notice notice--info">{info}</div> : null}

      {!error && list.length === 0 ? (
        <EmptyState
          title="لا طلبات بعد"
          hint="حين يملأ زائر نموذج «اطلب عرض سعر» في الموقع، يظهر طلبه هنا."
        />
      ) : null}

      {pending.length ? (
        <p className="small muted">{pending.length} طلب جديد بانتظارك.</p>
      ) : null}

      <div className="list">
        {list.map((request) => {
          const link = waNumber(request.phone)
            ? `https://wa.me/${waNumber(request.phone)}?text=${encodeURIComponent(
                `السلام عليكم ${request.name}، وصلنا طلبكم عبر الموقع بخصوص ${KIND_LABEL[request.kind]}.`,
              )}`
            : null;
          const converted = orders.some(
            (entry) => entry.customerPhone && waNumber(entry.customerPhone) === waNumber(request.phone),
          );
          return (
            <div key={request.id} className="card">
              <div className="card__head">
                <div>
                  <div className="card__title">{request.name}</div>
                  <div className="card__meta">
                    <span dir="ltr">{request.phone}</span>
                    <span>{KIND_LABEL[request.kind]}</span>
                    <span>{formatDate(new Date(request.createdAt).toISOString().slice(0, 10))}</span>
                  </div>
                </div>
                <Badge tone={request.status === 'new' ? 'warn' : 'muted'}>
                  {request.status === 'new' ? 'جديد' : 'حُوِّل'}
                </Badge>
              </div>

              {request.width > 0 && request.height > 0 ? (
                <p className="small">
                  المقاس المطلوب: {request.width} م × {request.height} م
                  {request.qty > 1 ? ` × ${request.qty}` : ''}
                </p>
              ) : null}
              {request.note ? <p className="small muted">{request.note}</p> : null}

              <div className="card__actions">
                <button
                  type="button"
                  className="btn btn--sm"
                  disabled={busy || request.status === 'done'}
                  onClick={() => {
                    void convert(request);
                  }}
                >
                  {converted && request.status === 'done'
                    ? 'حُوِّل إلى طلب'
                    : 'حوّله إلى زبون وطلب'}
                </button>
                {link ? (
                  <a className="btn btn--ghost btn--sm" href={link} target="_blank" rel="noopener">
                    ردّ بواتساب
                  </a>
                ) : null}
                {request.status === 'done' ? (
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => navigate('/orders')}
                  >
                    افتح الطلبات
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  disabled={busy}
                  onClick={() => setRemoving(request)}
                >
                  حذف
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={Boolean(removing)}
        title="حذف الطلب الوارد"
        message="سيُحذف من قائمة الطلبات الواردة. ما حُوِّل منه إلى زبون أو طلب يبقى كما هو."
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) void remove(removing);
        }}
      />
    </>
  );
}
