/* عامل الخدمة لتطبيق الباشة — قوقعة التطبيق تعمل دون إنترنت، والبيانات تتكفّل بها
   ذاكرة Firestore الدائمة. النطاق مشتقّ من موقع الملف فيعمل على ‎/‎ وعلى ‎/app/‎. */

const VERSION = 'albacha-app-v2';
const CACHE = `${VERSION}-shell`;

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
      .open(CACHE)
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
        Promise.all(
          keys.filter((key) => key.startsWith('albacha-app-') && key !== CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // طلبات Firebase وغيرها تمرّ إلى الشبكة — لها آليتها في العمل دون اتصال.
  if (url.origin !== self.location.origin) return;
  // ما هو خارج نطاق هذا التطبيق (مثل الموقع التعريفي) لا يخصّه.
  if (!url.pathname.startsWith(BASE)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(INDEX, copy));
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
