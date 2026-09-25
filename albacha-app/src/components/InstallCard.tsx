/**
 * بطاقة تثبيت اللوحة على الشاشة الرئيسية.
 *
 * ثلاث حالات: مثبَّتة فتُطمئن وتختفي، أو المتصفّح جاهز فيظهر الزرّ، أو لم
 * يجهز بعد فتُشرح الطريقة اليدوية — لأن اسم البند يختلف بين إصدارات المتصفّح.
 */
import { useEffect, useState } from 'react';
import { canInstall, isInstalled, promptInstall, subscribeInstall } from '@/lib/install';

export default function InstallCard({ compact = false }: { compact?: boolean }) {
  const [ready, setReady] = useState(canInstall());
  const [installed, setInstalled] = useState(isInstalled());
  const [note, setNote] = useState<string | null>(null);
  const [showHow, setShowHow] = useState(false);

  useEffect(
    () =>
      subscribeInstall(() => {
        setReady(canInstall());
        setInstalled(isInstalled());
      }),
    [],
  );

  if (installed) {
    return compact ? null : (
      <div className="card">
        <p className="small">اللوحة مثبّتة على شاشتك ✓ تفتحها بأيقونتها «لوحة الباشة».</p>
      </div>
    );
  }

  const install = async () => {
    const outcome = await promptInstall();
    if (outcome === 'accepted') setNote('تمّ التثبيت. ستجد أيقونة «لوحة الباشة» على شاشتك.');
    else if (outcome === 'dismissed') setNote('أُلغي التثبيت. تستطيع المحاولة متى شئت.');
    else setShowHow(true);
  };

  return (
    <div className="card">
      {!compact ? (
        <p className="small muted">
          ثبّتها على الشاشة الرئيسية لتفتحها بأيقونتها مباشرة، وتعمل دون إنترنت.
        </p>
      ) : null}

      {note ? <div className="notice notice--info">{note}</div> : null}

      <div className="card__actions">
        <button
          type="button"
          className="btn"
          onClick={() => {
            void install();
          }}
        >
          ثبّت اللوحة على الشاشة
        </button>
      </div>

      {!ready || showHow ? (
        <p className="small muted mt-8">
          إن لم تفتح نافذة التثبيت: من قائمة المتصفّح ⋮ اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة
          الرئيسية». وفي متصفّح سامسونغ: ☰ ← «إضافة صفحة إلى» ← «الشاشة الرئيسية».
        </p>
      ) : null}
    </div>
  );
}
