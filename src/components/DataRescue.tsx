/**
 * استعادة دفتر ضاع عن صاحبه.
 *
 * يظهر تنبيه في أعلى اللوحة حين يكون الحساب المفتوح فارغاً بينما على الجهاز
 * بياناتٌ أخرى — وهو ما يحدث حين يُنشأ حساب ثانٍ برقم بدل بريد، أو حين يُستعمل
 * التطبيق مرّة «بدون حساب» ثم يُسجَّل. الضمّ لا يحذف شيئاً من الحساب الحالي.
 */
import { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { mergeInto, scanDevice, type DeviceDataSet } from '@/data/rescue';
import { uploadToCloud } from '@/data/cloudSync';
import { countLabel, formatDateTime, formatInt } from '@/lib/format';
import { Modal } from './ui';

const setTitle = (set: DeviceDataSet): string => {
  if (set.source === 'snapshot') return 'نسخة محفوظة تلقائياً من حسابك';
  return set.businessName || 'دفتر محفوظ على هذا الجهاز';
};

const setSummary = (set: DeviceDataSet): string =>
  set.counts.map((row) => `${formatInt(row.count)} ${row.label}`).join(' · ');

/**
 * وجهة الاستعادة تتبع نوع الحساب المفتوح: دفتر الجهاز يُضمّ محلياً، والحساب
 * ذو المزامنة يُرفع إليه الدفتر فيصير في السحابة ولا يعود حبيس الهاتف.
 */
const restoreSet = async (
  set: DeviceDataSet,
  uid: string,
  storeKind: string,
): Promise<{ added: number; refused: string[] }> => {
  if (storeKind === 'local') return { added: mergeInto(set.uid, uid).added, refused: [] };
  const sourceUid = set.uid.endsWith('#snapshot') ? set.uid.slice(0, -'#snapshot'.length) : set.uid;
  const result = await uploadToCloud(sourceUid, uid);
  return { added: result.uploaded, refused: result.refused };
};

const REFUSED_LABELS: Record<string, string> = {
  orders: 'الطلبيات',
  products: 'قوالب التسعير',
  inventory: 'المخزون',
  expenses: 'المصاريف',
  workers: 'العمّال',
  appointments: 'المواعيد',
  calculations: 'حسابات التكلفة',
  marketPrices: 'أسعار السوق',
  debts: 'الديون',
};

const refusedNote = (refused: string[]): string =>
  `لم تُقبل بعد: ${refused.map((name) => REFUSED_LABELS[name] ?? name).join('، ')} — ` +
  'صلاحيات المشروع لم تُحدَّث لها، وهي باقية سليمة على الجهاز.';

export function DataRescue() {
  const { user } = useAuth();
  const { orders, debts, appointments, expenses, workers, inventory, calculations, storeKind } =
    useData();
  const { notify, notifyError } = useToast();

  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const uid = user?.uid ?? null;

  // «فارغ» يعني: لا سجلّ عمل واحد. قوالب التسعير وأسعار السوق تُزرع تلقائياً
  // لكل حساب جديد، فوجودها لا يعني أنّ صاحبه أدخل شيئاً.
  const isEmpty =
    orders.length === 0 &&
    debts.length === 0 &&
    appointments.length === 0 &&
    expenses.length === 0 &&
    workers.length === 0 &&
    inventory.length === 0 &&
    calculations.length === 0;

  const sets = useMemo(() => (uid ? scanDevice(uid) : []), [uid, nonce]);

  if (!uid || sets.length === 0) return null;

  const restore = async (set: DeviceDataSet) => {
    setBusy(set.uid);
    try {
      const { added, refused } = await restoreSet(set, uid, storeKind);
      if (added === 0 && refused.length === 0) {
        notify('لا جديد في هذا الدفتر — كل ما فيه موجود عندك أصلاً.');
      } else {
        const moved = `${storeKind === 'local' ? 'استُرجع' : 'رُفع'} ${countLabel(added, {
          one: 'سجل واحد',
          two: 'سجلّان',
          few: 'سجلات',
          many: 'سجلاً',
        })} إلى حسابك.`;
        notify(refused.length > 0 ? `${moved} ${refusedNote(refused)}` : moved, refused.length > 0 ? 'error' : 'ok');
      }
      setNonce((value) => value + 1);
      if (refused.length === 0) setOpen(false);
    } catch (error) {
      notifyError(error instanceof Error ? error : new Error('تعذّرت الاستعادة.'));
    } finally {
      setBusy(null);
    }
  };

  // العدّ المعروض هو ما أدخله صاحب الدفتر، لا القوالب المزروعة تلقائياً.
  const total = sets.reduce((sum, set) => sum + set.workTotal, 0);

  return (
    <>
      {isEmpty && !dismissed && total > 0 ? (
        <div className="notice notice--warn rescue-bar">
          <div>
            <strong>
              حسابك يفتح فارغاً، لكن على الجهاز{' '}
              {countLabel(total, {
                one: 'سجل واحد محفوظ',
                two: 'سجلّان محفوظان',
                few: 'سجلات محفوظة',
                many: 'سجلاً محفوظاً',
              })}
              .
            </strong>
            <span className="small">
              {storeKind === 'local'
                ? 'غالباً دخلتَ بحساب ثانٍ غير الذي كنت تعمل عليه. يمكن استرجاع الدفتر كما هو.'
                : 'هذا دفترك القديم المحفوظ على الهاتف. ارفعه إلى حسابك ليصير مُزامَناً ولا يضيع بضياع الجهاز.'}
            </span>
          </div>
          <div className="rescue-bar__actions">
            <button
              type="button"
              className="btn btn--sm"
              onClick={() => {
                setOpen(true);
              }}
            >
              {storeKind === 'local' ? 'استرجاع بياناتي' : 'رفع دفتري إلى حسابي'}
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label="إخفاء التنبيه"
              onClick={() => {
                setDismissed(true);
              }}
            >
              ✕
            </button>
          </div>
        </div>
      ) : null}

      <Modal
        open={open}
        wide
        title="دفاتر محفوظة على هذا الجهاز"
        onClose={() => {
          setOpen(false);
        }}
        footer={
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              setOpen(false);
            }}
          >
            إغلاق
          </button>
        }
      >
        <p className="small muted">
          الاسترجاع يضيف السجلات إلى حسابك الحالي ولا يحذف منه شيئاً، ولا يمسّ الدفتر الأصلي —
          فإن استرجعتَ الخطأ، لم تخسر شيئاً.
        </p>
        <ul className="ledger mt-12">
          {sets.map((set) => (
            <li key={set.uid}>
              <div>
                <strong>{setTitle(set)}</strong>
                <span className="ledger__meta">{setSummary(set)}</span>
                <span className="ledger__meta">
                  آخر تعديل {set.updatedAt ? formatDateTime(set.updatedAt) : '—'}
                </span>
              </div>
              <div className="ledger__end">
                <button
                  type="button"
                  className="btn btn--sm"
                  disabled={busy === set.uid}
                  onClick={() => {
                    void restore(set);
                  }}
                >
                  {busy === set.uid ? 'جارٍ…' : 'استرجاع'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}

/** نفس القائمة داخل الإعدادات — تُعرض دائماً لا عند الفراغ فقط. */
export function DataRescueList() {
  const { user } = useAuth();
  const { storeKind } = useData();
  const { notify, notifyError } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const uid = user?.uid ?? null;
  const sets = useMemo(() => (uid ? scanDevice(uid) : []), [uid, nonce]);

  if (!uid) return null;

  if (sets.length === 0) {
    return (
      <p className="small muted">
        لا توجد على هذا الجهاز بيانات خارج حسابك. إن كنت تبحث عن دفتر أدخلته في تطبيق الهاتف
        بينما تفتح الآن الموقع (أو العكس)، فلكلٍّ منهما تخزينه الخاصّ — انقل الدفتر بملف نسخة
        احتياطية من هناك واستورده هنا.
      </p>
    );
  }

  const restore = async (set: DeviceDataSet) => {
    setBusy(set.uid);
    try {
      const { added, refused } = await restoreSet(set, uid, storeKind);
      const moved = `${storeKind === 'local' ? 'استُرجع' : 'رُفع'} ${countLabel(added, {
        one: 'سجل واحد',
        two: 'سجلّان',
        few: 'سجلات',
        many: 'سجلاً',
      })} إلى حسابك.`;
      notify(
        added === 0 && refused.length === 0 ? 'لا جديد في هذا الدفتر.' : moved + (refused.length > 0 ? ` ${refusedNote(refused)}` : ''),
        refused.length > 0 ? 'error' : 'ok',
      );
      setNonce((value) => value + 1);
    } catch (error) {
      notifyError(error instanceof Error ? error : new Error('تعذّرت الاستعادة.'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <ul className="ledger">
      {sets.map((set) => (
        <li key={set.uid}>
          <div>
            <strong>{setTitle(set)}</strong>
            <span className="ledger__meta">{setSummary(set)}</span>
            <span className="ledger__meta">
              آخر تعديل {set.updatedAt ? formatDateTime(set.updatedAt) : '—'}
            </span>
          </div>
          <div className="ledger__end">
            <button
              type="button"
              className="btn btn--sm"
              disabled={busy === set.uid}
              onClick={() => {
                void restore(set);
              }}
            >
              {busy === set.uid ? 'جارٍ…' : 'استرجاع'}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
