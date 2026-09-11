import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { compressImage } from '@/lib/photo';
import { newId, waNumber } from '@/lib/format';
import {
  claimSite,
  deleteSitePhoto,
  loadSite,
  saveSiteConfig,
  saveSitePhoto,
  type SiteState,
} from '@/data/siteStore';
import { ConfirmDialog, EmptyState, SectionTitle, Spinner, TextArea, TextInput } from '@/components/ui';
import type { SiteConfig, SitePhoto } from '@/lib/types';

const SITE_URL = 'https://albacha-metals-fecd8.web.app/albacha';

export default function Site() {
  const { user, firebaseAvailable } = useAuth();
  const { profile } = useData();

  const [state, setState] = useState<SiteState>({ config: null, photos: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [removing, setRemoving] = useState<SitePhoto | null>(null);
  const [draft, setDraft] = useState<SiteConfig | null>(null);

  const usable = firebaseAvailable && !user?.isLocal;

  const refresh = useCallback(async () => {
    if (!usable) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await loadSite();
      setState(next);
      setDraft(next.config);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر تحميل بيانات الموقع.');
    } finally {
      setLoading(false);
    }
  }, [usable]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isOwner = Boolean(user && state.config && state.config.ownerUid === user.uid);
  const claimed = Boolean(state.config);

  const run = async (action: () => Promise<void>, fallback: string) => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : fallback);
    } finally {
      setBusy(false);
    }
  };

  const claim = () =>
    run(async () => {
      if (!user) return;
      const config = await claimSite(user.uid);
      setState((current) => ({ ...current, config }));
      setDraft(config);
      setInfo('صار هذا الحساب مالك الموقع. تستطيع الآن إضافة الصور.');
    }, 'تعذّرت المطالبة بالموقع.');

  const addPhoto = (file: File) =>
    run(async () => {
      const dataUrl = await compressImage(file);
      const photo: SitePhoto = { id: newId(), dataUrl, caption: '', createdAt: Date.now() };
      await saveSitePhoto(photo);
      setState((current) => ({ ...current, photos: [photo, ...current.photos] }));
      setInfo('أُضيفت الصورة إلى الموقع، وتظهر للزوّار فوراً.');
    }, 'تعذّرت إضافة الصورة.');

  const setCaption = (photo: SitePhoto, caption: string) => {
    setState((current) => ({
      ...current,
      photos: current.photos.map((entry) => (entry.id === photo.id ? { ...entry, caption } : entry)),
    }));
  };

  const saveCaption = (photo: SitePhoto) =>
    run(async () => {
      await saveSitePhoto(photo);
      setInfo('حُفظ الوصف.');
    }, 'تعذّر حفظ الوصف.');

  const remove = (photo: SitePhoto) =>
    run(async () => {
      await deleteSitePhoto(photo.id);
      setState((current) => ({
        ...current,
        photos: current.photos.filter((entry) => entry.id !== photo.id),
      }));
    }, 'تعذّر حذف الصورة.');

  const saveConfig = () =>
    run(async () => {
      if (!draft) return;
      await saveSiteConfig(draft);
      setState((current) => ({ ...current, config: draft }));
      setInfo('حُفظت إعدادات الموقع.');
    }, 'تعذّر حفظ الإعدادات.');

  if (!usable) {
    return (
      <>
        <SectionTitle>الموقع التعريفي</SectionTitle>
        <div className="notice notice--warn">
          إدارة الموقع تحتاج تسجيل الدخول بحساب Firebase، لأن الصور تُنشر للزوّار على الإنترنت.
          أنت الآن في وضع الجهاز.
        </div>
      </>
    );
  }

  if (loading) return <Spinner label="جارٍ تحميل بيانات الموقع…" />;

  return (
    <>
      <SectionTitle
        action={
          <a className="small" href={SITE_URL} target="_blank" rel="noopener">
            فتح الموقع
          </a>
        }
      >
        الموقع التعريفي
      </SectionTitle>

      {error ? <div className="notice notice--danger">{error}</div> : null}
      {info ? <div className="notice notice--info">{info}</div> : null}

      {!claimed ? (
        <div className="card">
          <p className="small">
            لم يُربط الموقع بحساب بعد. اضغط الزرّ ليصير هذا الحساب هو المتحكّم الوحيد في محتوى
            الموقع — لا يمكن نقل الملكية بعدها إلا من كونسول Firebase.
          </p>
          <div className="card__actions">
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => {
                void claim();
              }}
            >
              {busy ? 'جارٍ…' : 'اربط الموقع بهذا الحساب'}
            </button>
          </div>
        </div>
      ) : !isOwner ? (
        <div className="notice notice--warn">
          الموقع مربوط بحساب آخر، فلا تستطيع التعديل من هذا الحساب. ادخل بالحساب المالك.
        </div>
      ) : null}

      {isOwner ? (
        <>
          <div className="card">
            <p className="small muted">
              الصور تظهر في قسم «معرض أعمالنا» بالموقع فور إضافتها — لا تحتاج إعادة نشر ولا
              أي خطوة تقنية. تُصغَّر الصورة تلقائياً قبل الرفع.
            </p>
            <label className="btn btn--block mt-8" style={{ cursor: 'pointer' }}>
              {busy ? 'جارٍ…' : 'إضافة صورة عمل'}
              <input
                type="file"
                accept="image/*"
                hidden
                disabled={busy}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void addPhoto(file);
                  event.target.value = '';
                }}
              />
            </label>
          </div>

          {state.photos.length === 0 ? (
            <EmptyState
              title="لا صور في الموقع بعد"
              hint="أضف صور أبواب ونوافذ نفّذتها — هي أقوى ما يقنع الزبون."
            />
          ) : (
            <div className="list">
              {state.photos.map((photo) => (
                <div key={photo.id} className="card">
                  <img
                    src={photo.dataUrl}
                    alt={photo.caption || 'صورة عمل'}
                    loading="lazy"
                    style={{ width: '100%', borderRadius: 10, display: 'block' }}
                  />
                  <div className="mt-8">
                    <TextInput
                      label="وصف الصورة"
                      value={photo.caption}
                      onChange={(value) => setCaption(photo, value)}
                      placeholder="مثال: باب حديد مزخرف — حي النصر"
                    />
                  </div>
                  <div className="card__actions">
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      disabled={busy}
                      onClick={() => {
                        void saveCaption(photo);
                      }}
                    >
                      حفظ الوصف
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => setRemoving(photo)}
                    >
                      حذف من الموقع
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <SectionTitle>إعدادات الموقع</SectionTitle>
          <div className="card">
            <TextInput
              label="رقم واتساب الظاهر للزوّار"
              type="tel"
              inputMode="tel"
              value={draft?.whatsapp ?? ''}
              onChange={(value) => setDraft(draft ? { ...draft, whatsapp: value } : draft)}
              placeholder={profile.phone}
              hint={
                draft?.whatsapp
                  ? `سيُفتح على: wa.me/${waNumber(draft.whatsapp)}`
                  : 'اتركه فارغاً لإبقاء الرقم المكتوب في الموقع'
              }
            />
            <TextArea
              label="نصّ أعلى معرض الأعمال"
              value={draft?.galleryNote ?? ''}
              onChange={(value) => setDraft(draft ? { ...draft, galleryNote: value } : draft)}
              placeholder="مثال: نماذج من أعمالنا في تيمياوين وما حولها."
            />
            <div className="card__actions">
              <button
                type="button"
                className="btn"
                disabled={busy}
                onClick={() => {
                  void saveConfig();
                }}
              >
                حفظ الإعدادات
              </button>
            </div>
          </div>
        </>
      ) : null}

      <ConfirmDialog
        open={Boolean(removing)}
        title="حذف الصورة من الموقع"
        message="ستختفي الصورة عن الزوّار فوراً. لا يمكن التراجع."
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) void remove(removing);
          setRemoving(null);
        }}
      />
    </>
  );
}
