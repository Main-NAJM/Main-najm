/**
 * تثبيت اللوحة على الشاشة الرئيسية من داخلها.
 *
 * المتصفّح يطلق beforeinstallprompt مرّة واحدة وقد يسبق إقلاع React، فيُلتقط
 * هنا على مستوى الوحدة ويُحتفظ به حتى يضغط صاحب المؤسسة الزرّ. بهذا لا يحتاج
 * إلى البحث عن «تثبيت التطبيق» في قوائم المتصفّح — وهي تختلف بين إصدار وآخر.
 */

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();

const notify = (): void => {
  for (const listener of listeners) listener();
};

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    // منع الشريط التلقائي: نعرض الزرّ في مكانه من اللوحة بدلاً منه.
    event.preventDefault();
    deferred = event as InstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    notify();
  });
}

/** هل تعمل اللوحة الآن كتطبيق مثبَّت لا كصفحة في المتصفّح؟ */
export const isInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  const iosStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
  return window.matchMedia('(display-mode: standalone)').matches || iosStandalone;
};

export const canInstall = (): boolean => deferred !== null;

export const subscribeInstall = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** يفتح نافذة التثبيت. تعيد 'unavailable' إن لم يعرضها المتصفّح بعد. */
export const promptInstall = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
  if (!deferred) return 'unavailable';
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  notify();
  return outcome;
};
