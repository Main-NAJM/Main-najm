import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import {
  ConfirmDialog,
  Modal,
  NumberInput,
  SectionTitle,
  Select,
  TextInput,
} from '@/components/ui';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { changePassword } from '@/data/accounts';
import { clearLocalData, exportLocalData, importLocalData } from '@/data/localStore';
import { TRADE_CHOICES, tradeLabel } from '@/lib/trades';
import { APP_NAME, CURRENCIES, USER_TYPES } from '@/lib/constants';
import { formatDateTime, toNumber } from '@/lib/format';
import type { Craft, Profile, UserType } from '@/lib/types';

export default function Settings() {
  const { profile, saveProfile, storeKind, seedDemoData, orders, debts } = useData();
  const { user, signOut, firebaseAvailable, updateLocalAccount } = useAuth();
  const { notify, notifyError } = useToast();
  const { canInstall, installed, install } = usePwaInstall();

  const [draft, setDraft] = useState<Profile>(profile);
  const [saving, setSaving] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  const patch = (value: Partial<Profile>) => {
    setDraft((current) => ({ ...current, ...value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const businessName = draft.businessName.trim() || 'ورشتي';
      await saveProfile({
        ...draft,
        businessName,
        ownerName: draft.ownerName.trim(),
        phone: draft.phone.trim(),
        address: draft.address.trim(),
      });
      // الحساب على الجهاز يحمل نسخته من الاسم والمهنة (تُعرض في شاشة الدخول).
      updateLocalAccount({
        displayName: businessName,
        userType: draft.userType,
        craft: draft.craft,
      });
      notify('حُفظت الإعدادات.');
    } catch (error) {
      notifyError(error);
    } finally {
      setSaving(false);
    }
  };

  const doExport = () => {
    if (!user) return;
    try {
      const json = storeKind === 'local' ? exportLocalData(user.uid) : JSON.stringify(
        { version: 1, exportedAt: Date.now(), orders, debts },
        null,
        2,
      );
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `herfah-pro-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 2000);
      notify('حُفظت نسخة احتياطية.');
    } catch (error) {
      notifyError(error);
    }
  };

  const doImport = async (file: File) => {
    if (!user) return;
    if (storeKind !== 'local') {
      notify('الاستيراد متاح في الوضع المحلي فقط.', 'error');
      return;
    }
    try {
      const text = await file.text();
      importLocalData(user.uid, text);
      notify('استُوردت البيانات بنجاح.');
    } catch (error) {
      notifyError(error instanceof Error ? error : new Error('ملف غير صالح.'));
    }
  };

  const doClear = () => {
    if (!user) return;
    clearLocalData(user.uid);
    setConfirmClear(false);
    notify('حُذفت كل البيانات المحلية.');
  };

  return (
    <>
      <div className="card">
        <SectionTitle>بيانات الورشة</SectionTitle>
        <p className="small muted">تظهر هذه البيانات في رأس كل فاتورة أو كشف تطبعه.</p>
        <div className="mt-12">
          <TextInput
            label="اسم الورشة أو المحل"
            value={draft.businessName}
            onChange={(value) => {
              patch({ businessName: value });
            }}
          />
          <div className="grid-2">
            <TextInput
              label="اسم صاحب العمل"
              value={draft.ownerName}
              onChange={(value) => {
                patch({ ownerName: value });
              }}
            />
            <TextInput
              label="رقم الهاتف"
              type="tel"
              inputMode="tel"
              value={draft.phone}
              onChange={(value) => {
                patch({ phone: value });
              }}
            />
          </div>
          <TextInput
            label="العنوان"
            value={draft.address}
            onChange={(value) => {
              patch({ address: value });
            }}
          />
          <div className="grid-2">
            <Select
              label="نوع الحساب"
              value={draft.userType}
              options={USER_TYPES}
              onChange={(value) => {
                patch({ userType: value as UserType });
              }}
            />
            <Select
              label={draft.userType === 'merchant' ? 'مجال التجارة' : 'الحرفة'}
              hint="يقرّر أسعار المواد المقترحة والقوالب التي يبدأ بها التسعير"
              value={draft.craft}
              options={TRADE_CHOICES.map((choice) => ({
                value: choice.craft,
                label: draft.userType === 'merchant' ? choice.merchantLabel : choice.craftLabel,
              }))}
              onChange={(value) => {
                patch({ craft: value as Craft });
              }}
            />
          </div>
          <Select
            label="العملة"
            value={draft.currency}
            options={CURRENCIES.map((c) => ({ value: c.code, label: c.label }))}
            onChange={(value) => {
              patch({ currency: value });
            }}
          />
          <div className="grid-2">
            <NumberInput
              label="أجرة الساعة الافتراضية"
              value={draft.defaultLaborRate}
              onChange={(value) => {
                patch({ defaultLaborRate: toNumber(value) });
              }}
            />
            <NumberInput
              label="نسبة الربح الافتراضية"
              suffix="٪"
              value={draft.defaultMarginPct}
              onChange={(value) => {
                patch({ defaultMarginPct: toNumber(value) });
              }}
            />
          </div>
        </div>
        <div className="card__actions">
          <button
            type="button"
            className="btn"
            disabled={saving}
            onClick={() => {
              void save();
            }}
          >
            {saving ? 'جارٍ الحفظ…' : 'حفظ الإعدادات'}
          </button>
          {profile.updatedAt ? (
            <span className="small muted">آخر تحديث: {formatDateTime(profile.updatedAt)}</span>
          ) : null}
        </div>
      </div>

      <div className="card">
        <SectionTitle>الحساب والمزامنة</SectionTitle>
        {storeKind === 'local' ? (
          <div className="notice notice--warn">
            {user?.isGuest ? (
              <>
                تعمل الآن <strong>بدون حساب</strong>. البيانات محفوظة في هذا المتصفّح وحده. أنشئ
                حساباً لتفصل بياناتك عن غيرك على نفس الجهاز وتحميها بكلمة مرور.
              </>
            ) : (
              <>
                حسابك محفوظ على <strong>هذا الجهاز</strong> فقط: البيانات لا تتزامن بين الأجهزة،
                وحذف بيانات المتصفّح يمحوها.
              </>
            )}
            {firebaseAvailable
              ? ' للمزامنة بين الأجهزة استعمل حساباً سحابياً من شاشة الدخول.'
              : ' خذ نسخة احتياطية من الأسفل بين حين وآخر.'}
          </div>
        ) : (
          <div className="notice notice--info">
            متصل بـ Firebase — بياناتك تُحفظ وتتزامن تلقائياً، وتعمل أيضاً دون إنترنت وتُرفع عند
            عودة الاتصال.
          </div>
        )}
        <div className="card__meta">
          {user?.email ? (
            <span>
              البريد <strong>{user.email}</strong>
            </span>
          ) : null}
          {user?.phoneNumber ? (
            <span>
              الهاتف <strong dir="ltr">{user.phoneNumber}</strong>
            </span>
          ) : null}
          {user?.displayName ? (
            <span>
              الحساب <strong>{user.displayName}</strong>
            </span>
          ) : null}
          <span>
            المهنة <strong>{tradeLabel(profile.userType, profile.craft)}</strong>
          </span>
          <span>
            التخزين <strong>{storeKind === 'local' ? 'على الجهاز' : 'Firebase'}</strong>
          </span>
        </div>
        <div className="card__actions">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => {
              void signOut();
            }}
          >
            {user?.isGuest ? 'إنشاء حساب أو تسجيل دخول' : 'تسجيل الخروج'}
          </button>
          {user?.isLocal && !user.isGuest ? (
            <button
              type="button"
              className="btn btn--soft btn--sm"
              onClick={() => {
                setChangingPassword(true);
              }}
            >
              تغيير كلمة المرور
            </button>
          ) : null}
          {canInstall ? (
            <button
              type="button"
              className="btn btn--soft btn--sm"
              onClick={() => {
                void install();
              }}
            >
              تثبيت التطبيق على الجهاز
            </button>
          ) : null}
          {installed ? <span className="small muted">التطبيق مثبّت على الجهاز.</span> : null}
        </div>
      </div>

      <div className="card">
        <SectionTitle>النسخ الاحتياطي والبيانات</SectionTitle>
        <p className="small muted">
          احفظ نسخة من بياناتك على جهازك، أو استعدها لاحقاً. يُنصح بأخذ نسخة كل فترة في الوضع
          المحلي.
        </p>
        <div className="card__actions">
          <button type="button" className="btn btn--ghost btn--sm" onClick={doExport}>
            تصدير نسخة احتياطية
          </button>
          {storeKind === 'local' ? (
            <>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  fileInput.current?.click();
                }}
              >
                استيراد نسخة
              </button>
              <button type="button" className="btn btn--soft btn--sm" onClick={seedDemoData}>
                تعبئة بيانات تجريبية
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  setConfirmClear(true);
                }}
              >
                حذف كل البيانات
              </button>
            </>
          ) : null}
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void doImport(file);
            event.target.value = '';
          }}
        />
      </div>

      <div className="card">
        <SectionTitle>عن التطبيق</SectionTitle>
        <p className="small muted">
          {APP_NAME} — تطبيق ويب يعمل على الهاتف والحاسوب، ويمكن تثبيته كتطبيق مستقل. يعمل دون
          إنترنت ويزامن البيانات عند عودة الاتصال.
        </p>
      </div>

      <ConfirmDialog
        open={confirmClear}
        title="حذف كل البيانات"
        message="سيُحذف كل ما هو محفوظ على هذا الجهاز: الطلبيات والمواعيد والحسابات والأسعار والديون. لا يمكن التراجع."
        confirmLabel="حذف الكل"
        onCancel={() => {
          setConfirmClear(false);
        }}
        onConfirm={doClear}
      />

      {user && changingPassword ? (
        <PasswordDialog
          uid={user.uid}
          onClose={() => {
            setChangingPassword(false);
          }}
          onDone={() => {
            setChangingPassword(false);
            notify('غُيّرت كلمة المرور.');
          }}
        />
      ) : null}
    </>
  );
}

/** تغيير كلمة مرور حساب الجهاز — يتطلّب كلمة المرور الحالية. */
function PasswordDialog({
  uid,
  onClose,
  onDone,
}: {
  uid: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (next !== confirm) {
      setError('كلمتا المرور الجديدتان غير متطابقتين.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await changePassword(uid, current, next);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر تغيير كلمة المرور.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      title="تغيير كلمة المرور"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            إلغاء
          </button>
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() => {
              void submit();
            }}
          >
            {busy ? 'جارٍ…' : 'حفظ'}
          </button>
        </>
      }
    >
      {error ? <div className="auth__error">{error}</div> : null}
      <TextInput
        label="كلمة المرور الحالية"
        type="password"
        value={current}
        onChange={setCurrent}
      />
      <TextInput
        label="كلمة المرور الجديدة"
        type="password"
        value={next}
        onChange={setNext}
        hint="٤ خانات على الأقل"
      />
      <TextInput
        label="تأكيد كلمة المرور الجديدة"
        type="password"
        value={confirm}
        onChange={setConfirm}
      />
    </Modal>
  );
}
