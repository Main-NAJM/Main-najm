/* عامل الخدمة لتطبيق حرفة برو — تخزين مؤقّت يسمح بالعمل دون إنترنت. */

const VERSION = 'herfah-pro-v6';
const APP_SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;

// مسار التطبيق مشتقّ من موقع هذا الملف، فيعمل على الجذر وعلى مسار فرعي
// مثل GitHub Pages (‎/<اسم-المستودع>/‎) دون تعديل.
const BASE = new URL('./', self.location).pathname;
const INDEX = `${BASE}index.html`;

const PRECACHE = [
  BASE,
  INDEX,
  `${BASE}manifest.webmanifest`,
  `${BASE}icons/icon-192.png`,
  `${BASE}icons/icon-512.png`,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL)
      // addAll تفشل كلّها إذا فشل ملف واحد، لذا نخزّن كل ملف على حدة.
      .then((cache) =>
        Promise.all(
          PRECACHE.map((url) => cache.add(url).catch(() => undefined)),
        ),
      )
      .then(() => self.skipWaiting())
      .catch(() => undefined),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== APP_SHELL && key !== RUNTIME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// مواقع أخرى منشورة على نفس النطاق خارج التطبيق (مثل الموقع التعريفي على /albacha):
// يتجاهلها عامل الخدمة تماماً حتى لا تحلّ صفحاتها محلّ قوقعة التطبيق في الذاكرة.
const EXTERNAL_PATHS = [`${BASE}albacha`, `${BASE}app`];

// مضيفات خطوط Google — تُخزَّن لتبقى الواجهة بخطّها الصحيح دون اتصال.
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

const isSameOrigin = (url) => new URL(url).origin === self.location.origin;
const isFontRequest = (url) => FONT_HOSTS.includes(new URL(url).hostname);
const isOutsideApp = (url) => {
  const { pathname } = new URL(url);
  return EXTERNAL_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
};

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  // خطوط Google: من الذاكرة أولاً، كي تبقى هوية الخطّ قائمة دون إنترنت.
  if (isFontRequest(request.url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request)
            .then((response) => {
              if (response && (response.ok || response.type === 'opaque')) {
                const copy = response.clone();
                caches.open(RUNTIME).then((cache) => cache.put(request, copy));
              }
              return response;
            })
            .catch(() => cached || Response.error()),
      ),
    );
    return;
  }

  // طلبات Firebase وغيرها تمرّ مباشرة إلى الشبكة (لها آلية عملها دون اتصال).
  if (!isSameOrigin(request.url)) return;
  // صفحات خارج التطبيق يتولّاها المتصفّح مباشرة دون تخزين.
  if (isOutsideApp(request.url)) return;

  // التنقّل: الشبكة أولاً مع رجوع إلى نسخة index.html المخزّنة.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(APP_SHELL).then((cache) => cache.put(INDEX, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(INDEX)
            .then((cached) => cached || caches.match(BASE))
            .then((cached) => cached || Response.error()),
        ),
    );
    return;
  }

  // الملفات الثابتة: من الذاكرة أولاً ثم الشبكة.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(RUNTIME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached || Response.error());
    }),
  );
});
