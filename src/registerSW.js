/** تسجيل عامل الخدمة ليعمل التطبيق دون إنترنت. */
export const registerServiceWorker = () => {
    if (!('serviceWorker' in navigator))
        return;
    if (import.meta.env.DEV)
        return;
    // داخل غلاف أندرويد الأصول كلّها في ملف التطبيق، فلا عامل خدمة معها ولا حاجة
    // إليه. يضع البناءُ هذه العلامة (scripts/build-apk.sh) فيُترك التسجيل بهدوء.
    if (document.documentElement.dataset.bundled === '1')
        return;
    window.addEventListener('load', () => {
        const base = import.meta.env.BASE_URL;
        navigator.serviceWorker
            .register(`${base}sw.js`, { scope: base })
            .then((registration) => {
            // تحديث صامت عند توفّر نسخة جديدة.
            registration.addEventListener('updatefound', () => {
                const installing = registration.installing;
                if (!installing)
                    return;
                installing.addEventListener('statechange', () => {
                    if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                        installing.postMessage({ type: 'SKIP_WAITING' });
                    }
                });
            });
        })
            .catch((error) => {
            console.warn('تعذّر تسجيل عامل الخدمة', error);
        });
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing)
                return;
            refreshing = true;
            window.location.reload();
        });
    });
};
