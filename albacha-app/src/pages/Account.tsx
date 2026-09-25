/**
 * إعدادات لوحة التحكّم: اسم المؤسسة وهاتفها، والحساب.
 *
 * موجز بقصد — اللوحة لاستقبال الطلبات وإدارة الموقع، وما عداهما يشتّت.
 */
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { SectionTitle, TextInput } from '@/components/ui';
import InstallCard from '@/components/InstallCard';
import type { WorkshopProfile } from '@/lib/types';

export default function Account() {
  const { user, signOut, firebaseAvailable } = useAuth();
  const { profile, saveProfile } = useData();

  const [draft, setDraft] = useState<WorkshopProfile>(profile);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  const save = async () => {
    setError(null);
    try {
      await saveProfile(draft);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر الحفظ.');
    }
  };

  return (
    <>
      <SectionTitle>التثبيت على الهاتف</SectionTitle>
      <InstallCard />

      <SectionTitle>بيانات المؤسسة</SectionTitle>
      <div className="card">
        <TextInput
          label="اسم المؤسسة"
          value={draft.name}
          onChange={(value) => setDraft({ ...draft, name: value })}
        />
        <TextInput
          label="هاتف المؤسسة"
          type="tel"
          inputMode="tel"
          value={draft.phone}
          onChange={(value) => setDraft({ ...draft, phone: value })}
          hint="يُقترح كرقم الواتساب الظاهر للزوّار في صفحة «الموقع»."
        />
        <TextInput
          label="العنوان"
          value={draft.address}
          onChange={(value) => setDraft({ ...draft, address: value })}
        />
        {error ? <div className="notice notice--danger">{error}</div> : null}
        {saved ? <div className="notice notice--info">حُفظت البيانات.</div> : null}
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
        </div>
      </div>

      <SectionTitle>الحساب</SectionTitle>
      <div className="card">
        <p className="small">
          {user?.isLocal ? (
            'أنت في وضع الجهاز. سجّل الدخول لاستقبال طلبات الموقع وإدارة صوره.'
          ) : (
            <>
              مسجَّل الدخول باسم{' '}
              <strong dir="ltr">{user?.email ?? user?.displayName ?? '—'}</strong>
            </>
          )}
        </p>
        {!firebaseAvailable ? (
          <div className="notice notice--warn">
            لم تُضبط مفاتيح Firebase في هذه النسخة، فلوحة التحكّم لا تتّصل بالموقع.
          </div>
        ) : null}
        <div className="card__actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              void signOut();
            }}
          >
            {user?.isLocal ? 'الانتقال لتسجيل الدخول' : 'تسجيل الخروج'}
          </button>
        </div>
      </div>
    </>
  );
}
