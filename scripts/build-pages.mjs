/**
 * يبني شجرة النشر على GitHub Pages في ‎pages-dist/‎.
 *
 *   npm run build:pages
 *
 * البنية المنشورة على https://main-najm.github.io/Main-najm/ :
 *
 *   /            موقع الباشة التعريفي
 *   /herfah/     تطبيق حرفة برو      (قاعدة /Main-najm/herfah/)
 *   /app/        تطبيق الباشة        (قاعدة /Main-najm/app/)
 *   /bofaida/    موقع BOFAIDA ADS
 *   /studio/     استوديو بوفايدة — أداة خاصّة برمز دخول، لا تُربط من أي صفحة
 *   /albacha/    تحويل قديم إلى /    (يُبقى كي لا تنكسر روابط منشورة)
 *   /404.html    تحويل المسارات العميقة إلى التطبيق المناسب
 *   /.nojekyll   يمنع Jekyll من ابتلاع مجلّدات تبدأ بـ _
 *
 * هذه الشجرة كانت تُبنى يدويًا قبل هذا السكربت، أي أن الموقع الحيّ لم يكن
 * قابلًا لإعادة الإنتاج من المستودع. الآن صار.
 */
import { execFileSync } from 'node:child_process';
import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, 'pages-dist');
const BASE = '/Main-najm/';

const run = (cmd, args, env = {}) => {
  console.log(`  $ ${cmd} ${args.join(' ')}`);
  execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit', env: { ...process.env, ...env } });
};

// ملفات التشغيل والتوثيق لا تُنشر
const EXCLUDED_EXT = new Set(['.mjs', '.md', '.py']);
// ومجلّدات تخصّ المطوّر لا الزائر: وسيط fal يُنصَّب على Cloudflare لا هنا.
const EXCLUDED_DIRS = new Set(['proxy']);
const copySiteFiles = async (from, to) => {
  await mkdir(to, { recursive: true });
  for (const entry of await readdir(from, { withFileTypes: true })) {
    if (entry.isDirectory() && EXCLUDED_DIRS.has(entry.name)) {
      continue;
    } else if (entry.isDirectory()) {
      await copySiteFiles(join(from, entry.name), join(to, entry.name));
    } else if (!EXCLUDED_EXT.has(extname(entry.name).toLowerCase())) {
      await cp(join(from, entry.name), join(to, entry.name));
    }
  }
};

console.log('\n── بناء شجرة GitHub Pages ──────────────────────\n');

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

// 1) حرفة برو → /herfah/
console.log('حرفة برو → /herfah/');
run('npx', ['vite', 'build', '--base', `${BASE}herfah/`, '--outDir', 'dist-herfah', '--emptyOutDir']);
await cp(join(ROOT, 'dist-herfah'), join(OUT, 'herfah'), { recursive: true });
await rm(join(ROOT, 'dist-herfah'), { recursive: true, force: true });

// 2) تطبيق الباشة → /app/
console.log('\nتطبيق الباشة → /app/');
run('npm', ['run', 'build', '-w', 'albacha-app', '--', '--base', `${BASE}app/`]);
await cp(join(ROOT, 'albacha-app', 'dist'), join(OUT, 'app'), { recursive: true });

// 3) الموقع التعريفي → الجذر
console.log('\nالموقع التعريفي → /');
await copySiteFiles(join(ROOT, 'site'), OUT);

// 4) موقع BOFAIDA ADS → /bofaida/
console.log('\nBOFAIDA ADS → /bofaida/');
await copySiteFiles(join(ROOT, 'bofaida'), join(OUT, 'bofaida'));

// 5) استوديو بوفايدة (أداة ناجم الخاصّة) → /studio/
console.log('\nاستوديو بوفايدة → /studio/');
await copySiteFiles(join(ROOT, 'studio'), join(OUT, 'studio'));

// 6) /albacha/ → تحويل إلى الجذر (روابط قديمة منشورة)
await mkdir(join(OUT, 'albacha'), { recursive: true });
await writeFile(
  join(OUT, 'albacha', 'index.html'),
  `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>مؤسسة الباشة للمعادن</title>
<link rel="canonical" href="../">
<meta http-equiv="refresh" content="0; url=../">
</head>
<body><p>انتقل الموقع إلى <a href="../">هنا</a>.</p></body>
</html>
`,
  'utf8',
);

// 7) 404 — يحوّل المسارات العميقة إلى التطبيق المناسب.
//    Pages لا يعرف توجيه SPA، فأي رابط عميق يصل إلى 404.html أولًا.
await writeFile(
  join(OUT, '404.html'),
  `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>جارٍ التحويل…</title>
<script>
(function () {
  var BASE = "${BASE}";
  var loc = window.location;
  var path = loc.pathname;
  var rest = path.indexOf(BASE) === 0 ? path.slice(BASE.length) : path.replace(/^\\//, '');

  var statics = ["albacha/", "bofaida/", "studio/"];
  for (var i = 0; i < statics.length; i++) {
    var dir = statics[i];
    var name = dir.slice(0, -1);
    if (rest === name || rest.indexOf(dir) === 0) {
      loc.replace(BASE + dir);
      return;
    }
  }

  var app = '';
  var apps = ["app/", "herfah/"];
  for (var j = 0; j < apps.length; j++) {
    var a = apps[j];
    var an = a.slice(0, -1);
    if (rest === an || rest.indexOf(a) === 0) {
      app = a;
      rest = rest.slice(an.length).replace(/^\\//, '');
      break;
    }
  }

  // ما لا يخصّ تطبيقاً يعود إلى الموقع التعريفي في الجذر.
  if (!app) {
    loc.replace(BASE);
    return;
  }

  var target = BASE + app + '?p=/' + rest;
  if (loc.search) target += '&q=' + encodeURIComponent(loc.search.slice(1));
  loc.replace(target + loc.hash);
})();
</script>
</head>
<body></body>
</html>
`,
  'utf8',
);

await writeFile(join(OUT, '.nojekyll'), '', 'utf8');

if (!existsSync(join(OUT, 'index.html'))) {
  console.error('\n✖ لا يوجد index.html في الجذر — توقّف قبل النشر.\n');
  process.exit(1);
}

console.log(`\n✔ جاهز في pages-dist/\n`);
