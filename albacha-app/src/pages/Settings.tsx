import { useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { formatDate } from '@/lib/format';
import { SectionTitle, Spinner, TextArea, TextInput } from '@/components/ui';
import type { Backup } from '@/lib/types';

/** فحص أوّلي لملف النسخة الاحتياطية قبل استيراده. */
const isBackup = (value: unknown): value is Backup => {
  const data = value as Partial<Backup> | null;
  return Boolean(
    data &&
      typeof data === 'object' &&
      Array.isArray(data.customers) &&
      Array.isArray(data.orders) &&
      data.profile &&
      typeof data.profile === 'object',
  );
};

export default function Settings() {
  const { user, signOut, firebaseAvailable } = useAuth();
  const { profile, saveProfile, exportBackup, importBackup, storeKind, loading, customers, orders } =
    useData();
  const [draft, setDraft] = useState(profile);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const save = async () => {
    await saveProfile(draft);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  const download = () => {
    const backup = exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `albacha-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const upload = async (file: File) => {
    setMessage(null);
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isBackup(parsed)) {
        setMessage('الملف ليس نسخة احتياطية صالحة.');
        return;
      }
      await importBackup(parsed);
      setDraft(parsed.profile);
      setMessage(`استُوردت ${parsed.customers.length} زبوناً و${parsed.orders.length} طلباً.`);
    } catch {
      setMessage('تعذّرت قراءة الملف.');
    }
  };

  if (loading) return <Spinner />;

  return (
    <>
      <SectionTitle>بيانات المؤسسة</SectionTitle>
      <div className="card">
        <p className="small muted">تظهر هذه البيانات في أعلى عروض الأسعار والفواتير المطبوعة.</p>
        <div className="mt-8">
          <TextInput
            label="اسم المؤسسة"
            value={draft.name}
            onChange={(value) => setDraft({ ...draft, name: value })}
          />
          <div className="row">
            <TextInput
              label="الهاتف"
              type="tel"
              inputMode="tel"
              value={draft.phone}
              onChange={(value) => setDraft({ ...draft, phone: value })}
            />
            <TextInput
              label="العملة"
              value={draft.currency}
              onChange={(value) => setDraft({ ...draft, currency: value })}
              hint="مثال: د.ج"
            />
          </div>
          <TextInput
            label="العنوان"
            value={draft.address}
            onChange={(value) => setDraft({ ...draft, address: value })}
          />
          <TextArea
            label="ملاحظة أسفل عرض السعر"
            value={draft.quoteNote}
            onChange={(value) => setDraft({ ...draft, quoteNote: value })}
            hint="شروط الدفع ومدّة صلاحية العرض."
          />
        </div>
        <div className="card__actions">
          <button
            type="button"
            className="btn"
            onClick={() => {
              void save();
            }}
          >
            حفظ
          </button>
          {saved ? <span className="badge badge--ok">حُفظت</span> : null}
        </div>
      </div>

      <SectionTitle>النسخ الاحتياطي</SectionTitle>
      <div className="card">
        <div className="card__meta">
          <span>
            الزبائن <strong>{customers.length}</strong>
          </span>
          <span>
            الطلبات <strong>{orders.length}</strong>
          </span>
          <span>
            التخزين <strong>{storeKind === 'local' ? 'هذا الجهاز' : 'Firebase'}</strong>
          </span>
        </div>
        {message ? <div className="notice notice--info mt-8">{message}</div> : null}
        <div className="card__actions">
          <button type="button" className="btn btn--ghost btn--sm" onClick={download}>
            تصدير نسخة (JSON)
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => fileRef.current?.click()}
          >
            استيراد نسخة
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
              event.target.value = '';
            }}
          />
        </div>
        <p className="small muted mt-8">
          الاستيراد يستبدل كل البيانات الحالية بمحتوى الملف.
        </p>
      </div>

      <SectionTitle>الحساب</SectionTitle>
      <div className="card">
        {user?.isLocal ? (
          <div className="notice notice--warn">
            تعمل الآن بدون حساب: البيانات محفوظة في هذا المتصفّح فقط. سجّل الدخول لتتزامن بين
            هاتفك وحاسوبك.
          </div>
        ) : (
          <div className="notice notice--info">
            متصل بـ Firebase — بياناتك تُحفظ وتتزامن تلقائياً، وتعمل أيضاً دون إنترنت.
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
              الاسم <strong>{user.displayName}</strong>
            </span>
          ) : null}
        </div>
        <div className="card__actions">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => {
              void signOut();
            }}
          >
            {user?.isLocal ? 'الانتقال لتسجيل الدخول' : 'تسجيل الخروج'}
          </button>
        </div>
        {!firebaseAvailable ? (
          <p className="small muted mt-8">
            لربط المشروع: شغّل <strong>npm run firebase:setup</strong> في جذر المستودع.
          </p>
        ) : null}
        <p className="small muted mt-8">آخر فتح: {formatDate(Date.now())}</p>
      </div>
    </>
  );
}
