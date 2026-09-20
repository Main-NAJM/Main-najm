/* عامل الخدمة لتطبيق مؤسسة الباشة للمعادن — يجعل الموقع يعمل دون إنترنت بعد أول زيارة. */

const VERSION = 'albacha-v1';
const CACHE = `${VERSION}-assets`;

// نطاق العمل مشتقّ من موقع هذا الملف، فيعمل في الجذر وعلى مسار فرعي مثل ‎/albacha/‎.
const BASE = new URL('./', self.location).pathname;
const INDEX = `${BASE}index.html`;

const PRECACHE = [
  BASE,
  INDEX,
  `${BASE}manifest.webmanifest`,
  `${BASE}icons/icon-192.png`,
  `${BASE}icons/icon-512.png`,
  `${BASE}icons/icon-maskable-512.png`,
  `${BASE}icons/apple-touch-icon.png`,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // addAll تفشل كلّها إذا فشل ملف واحد، لذا يُخزّن كل ملف على حدة.
      .then((cache) => Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => undefined))))
      .then(() => self.skipWaiting())
      .catch(() => undefined),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key.startsWith('albacha-') && key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // خطوط Google: من الذاكرة أولاً حتى تظهر بخطوطها الصحيحة دون إنترنت.
  if (!sameOrigin) {
    if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
      event.respondWith(
        caches.match(request).then(
          (cached) =>
            cached ||
            fetch(request)
              .then((response) => {
                const copy = response.clone();
                caches.open(CACHE).then((cache) => cache.put(request, copy));
                return response;
              })
              .catch(() => cached || Response.error()),
        ),
      );
    }
    return;
  }

  // ملفات خارج نطاق هذا الموقع (مثل تطبيق حرفة برو في الجذر) لا تخصّه.
  if (!url.pathname.startsWith(BASE)) return;

  // التنقّل: الشبكة أولاً ليصل أي تحديث، مع رجوع إلى الصفحة المخزّنة دون إنترنت.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(INDEX, copy));
          return response;
        })
        .catch(() => caches.match(INDEX).then((cached) => cached || caches.match(BASE)).then((cached) => cached || Response.error())),
    );
    return;
  }

  // بقيّة الملفات: من الذاكرة أولاً ثم الشبكة.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => Response.error());
    }),
  );
});
