/**
 * تهيئة مجلد ‎dist‎ للنشر على GitHub Pages.
 *
 * تخدم Pages ملفات ثابتة بلا إعادة توجيه، فطلب مسار داخلي مثل ‎/app/orders‎ بعد
 * تحديث الصفحة يعطي 404 بدل أن يفتح التطبيق. الحيلة المعتادة: صفحة ‎404.html‎
 * تلتقط الطلب وتعيد التوجيه إلى صفحة التطبيق الصحيحة حاملةً المسار المقصود في
 * ‎?p=‎، وقصاصة صغيرة في كل ‎index.html‎ تعيد كتابة العنوان قبل إقلاع React.
 *
 * يستدعيه سير عمل Pages بعد ‎npm run build‎:
 *   BASE_PATH=/<اسم-المستودع>/ node scripts/pages-404.mjs
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));

// نفس المسار الذي بُني به التطبيق، وينتهي بشرطة مائلة دائماً.
const BASE = (process.env.BASE_PATH || '/').replace(/\/*$/, '/');

/** التطبيقات ذات التوجيه من طرف العميل، ومسار كلٍّ منها تحت BASE. */
const SPA_DIRS = ['', 'app/'];
/** الموقع التعريفي صفحة ثابتة: أي مسار تحته يعود إلى صفحته وحدها. */
const STATIC_DIRS = ['albacha/'];

const fallback = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>جارٍ التحويل…</title>
<script>
(function () {
  var BASE = ${JSON.stringify(BASE)};
  var loc = window.location;
  var path = loc.pathname;
  var rest = path.indexOf(BASE) === 0 ? path.slice(BASE.length) : path.replace(/^\\//, '');

  var statics = ${JSON.stringify(STATIC_DIRS)};
  for (var i = 0; i < statics.length; i++) {
    var dir = statics[i];
    var name = dir.slice(0, -1);
    if (rest === name || rest.indexOf(dir) === 0) {
      loc.replace(BASE + dir);
      return;
    }
  }

  var app = '';
  var apps = ${JSON.stringify(SPA_DIRS.filter(Boolean))};
  for (var j = 0; j < apps.length; j++) {
    var a = apps[j];
    var an = a.slice(0, -1);
    if (rest === an || rest.indexOf(a) === 0) {
      app = a;
      rest = rest.slice(an.length).replace(/^\\//, '');
      break;
    }
  }

  var target = BASE + app + '?p=/' + rest;
  if (loc.search) target += '&q=' + encodeURIComponent(loc.search.slice(1));
  loc.replace(target + loc.hash);
})();
</script>
</head>
<body></body>
</html>
`;

/** تعيد كتابة العنوان من ‎?p=‎ قبل أن يقرأه الموجِّه. */
const RESTORE = `<script>
(function () {
  var params = new URLSearchParams(window.location.search);
  var p = params.get('p');
  if (p === null) return;
  var q = params.get('q');
  var path = window.location.pathname.replace(/\\/$/, '') + p;
  window.history.replaceState(null, '', path + (q ? '?' + q : '') + window.location.hash);
})();
</script>
`;

await writeFile(`${DIST}404.html`, fallback, 'utf8');
// يمنع Jekyll من ابتلاع الملفات والمجلدات التي تبدأ بشرطة سفلية.
await writeFile(`${DIST}.nojekyll`, '', 'utf8');

for (const dir of SPA_DIRS) {
  const file = `${DIST}${dir}index.html`;
  const html = await readFile(file, 'utf8');
  if (html.includes("params.get('p')")) continue;
  await writeFile(file, html.replace('</head>', `${RESTORE}</head>`), 'utf8');
}

console.log(`جُهّز dist لـ GitHub Pages على المسار ${BASE} (404.html و.nojekyll)`);
