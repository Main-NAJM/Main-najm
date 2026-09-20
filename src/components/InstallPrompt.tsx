import { useState } from 'react';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { APP_NAME } from '@/lib/constants';

const DISMISS_KEY = 'herfah-pro:v1:install-dismissed';

const wasDismissed = (): boolean => {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
};

/**
 * دعوة لتثبيت التطبيق على الشاشة الرئيسية، تظهر حين يسمح المتصفّح بذلك.
 * تُغلق مرّة واحدة فلا تُلحّ، ويبقى الزر في الإعدادات لمن غيّر رأيه.
 */
export function InstallPrompt() {
  const { canInstall, install } = usePwaInstall();
  const [dismissed, setDismissed] = useState(wasDismissed);

  if (!canInstall || dismissed) return null;

  const close = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* التخزين ممنوع: تُخفى لهذه الزيارة فقط */
    }
    setDismissed(true);
  };

  return (
    <div className="install-bar">
      <img
        className="install-bar__icon"
        src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
        alt=""
      />
      <div className="install-bar__text">
        <strong>ثبّت {APP_NAME} على هاتفك</strong>
        <span>يفتح كتطبيق ويعمل بلا إنترنت.</span>
      </div>
      <button
        type="button"
        className="btn btn--sm"
        onClick={() => {
          void install();
        }}
      >
        تثبيت
      </button>
      <button type="button" className="icon-btn" onClick={close} aria-label="إخفاء">
        ✕
      </button>
    </div>
  );
}
