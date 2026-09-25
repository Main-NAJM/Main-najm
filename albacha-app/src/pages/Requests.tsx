/**
 * الطلبات الواردة من نموذج الموقع — وهي الشاشة الرئيسية للوحة التحكّم.
 *
 * الزبون يملأ النموذج في الموقع بلا حساب ولا تطبيق، فيصل الطلب هنا باسمه
 * وهاتفه ومقاساته. وصاحب المؤسسة يردّ عليه بواتساب، ثم يعلّمه منجزاً.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { formatDate, waNumber } from '@/lib/format';
import { deleteRequest, loadRequests, markRequestDone } from '@/data/siteStore';
import { Badge, ConfirmDialog, EmptyState, SectionTitle, Spinner } from '@/components/ui';
import type { RequestKind, SiteRequest } from '@/lib/types';

const KIND_LABEL: Record<RequestKind, string> = {
  aluminium: 'أبواب ونوافذ ألمنيوم',
  iron: 'أبواب وبوابات حديد',
  kitchen: 'مطبخ ألمنيوم',
  railing: 'درج ودرابزين حديد',
  other: 'عمل آخر',
};

export default function Requests() {
  const { user, firebaseAvailable } = useAuth();

  const [list, setList] = useState<SiteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      setError('لا يقرأ الطلبات الواردة إلا الحساب المالك للموقع. اربط الموقع من صفحة «الموقع».');
    } finally {
      setLoading(false);
    }
  }, [usable]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const pending = useMemo(() => list.filter((entry) => entry.status === 'new'), [list]);

  const markDone = async (request: SiteRequest) => {
    setBusy(true);
    try {
      await markRequestDone(request.id);
      setList((current) =>
        current.map((entry) => (entry.id === request.id ? { ...entry, status: 'done' } : entry)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر تحديث الطلب.');
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
          الطلبات تصل من الموقع إلى قاعدة البيانات، فتحتاج تسجيل الدخول بحساب. أنت الآن في وضع
          الجهاز.
        </div>
      </>
    );
  }

  if (loading) return <Spinner />;

  return (
    <>
      <div className="stats">
        <div className="stat">
          <span className="stat__label">طلبات جديدة</span>
          <strong className="stat__value">{pending.length}</strong>
        </div>
        <div className="stat">
          <span className="stat__label">إجمالي الطلبات</span>
          <strong className="stat__value">{list.length}</strong>
        </div>
      </div>

      <SectionTitle>الطلبات الواردة</SectionTitle>

      {error ? <div className="notice notice--danger">{error}</div> : null}

      {!error && list.length === 0 ? (
        <EmptyState
          title="لا طلبات بعد"
          hint="حين يملأ زائر نموذج «اطلب عرض سعر» في الموقع، يظهر طلبه هنا باسمه ومقاساته."
        />
      ) : null}

      <div className="list">
        {list.map((request) => {
          const number = waNumber(request.phone);
          // مخزَّنة بالمتر وتُعرض بالسنتيمتر، فهي وحدة من كتبها ومن يقرأها.
          const cm = (metres: number) => Math.round(metres * 100);
          const size =
            request.width > 0 && request.height > 0
              ? `${cm(request.width)} سم × ${cm(request.height)} سم${
                  request.qty > 1 ? ` × ${request.qty}` : ''
                }`
              : '';
          const reply = [
            `السلام عليكم ${request.name}،`,
            `وصلنا طلبكم عبر موقع مؤسسة الباشة للمعادن بخصوص ${KIND_LABEL[request.kind]}.`,
            size ? `المقاس المطلوب: ${size}` : '',
            '',
            'نرسل لكم عرض السعر بعد قليل إن شاء الله.',
          ]
            .filter(Boolean)
            .join('\n');

          return (
            <div key={request.id} className="card">
              <div className="card__head">
                <div>
                  <div className="card__title">{request.name}</div>
                  <div className="card__meta">
                    <span dir="ltr">{request.phone}</span>
                    <span>{KIND_LABEL[request.kind]}</span>
                    <span>
                      {formatDate(new Date(request.createdAt).toISOString().slice(0, 10))}
                    </span>
                  </div>
                </div>
                <Badge tone={request.status === 'new' ? 'warn' : 'muted'}>
                  {request.status === 'new' ? 'جديد' : 'تمّ الردّ'}
                </Badge>
              </div>

              {size ? <p className="small">المقاس المطلوب: {size}</p> : null}
              {request.note ? <p className="small muted">{request.note}</p> : null}

              <div className="card__actions">
                {number ? (
                  <a
                    className="btn btn--sm"
                    href={`https://wa.me/${number}?text=${encodeURIComponent(reply)}`}
                    target="_blank"
                    rel="noopener"
                  >
                    ردّ بواتساب
                  </a>
                ) : null}
                {number ? (
                  <a className="btn btn--ghost btn--sm" href={`tel:${request.phone}`}>
                    اتصال
                  </a>
                ) : null}
                {request.status === 'new' ? (
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    disabled={busy}
                    onClick={() => {
                      void markDone(request);
                    }}
                  >
                    علّمه «تمّ الردّ»
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
        title="حذف الطلب"
        message="سيُحذف الطلب نهائياً من لوحة التحكّم. لا يمكن التراجع."
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) void remove(removing);
        }}
      />
    </>
  );
}
