// ينسخ متجر أم آية إلى مجلد البناء ليُنشر مع التطبيق على Firebase Hosting.
//
// المصدر: om-aya/          (ملفات الموقع فقط — تُستثنى السكربتات والتوثيق)
// الهدف:  dist/om-aya/     ← يصبح الرابط https://<project>.web.app/om-aya
//
// لنشر المتجر في جذر النطاق بدلاً من مسار فرعي، غيّر DEST_DIR إلى '' (سلسلة فارغة)
// واحذف قسم hosting.rewrites الخاص بـ /om-aya من firebase.json.

import { cp, mkdir, readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_DIR = fileURLToPath(new URL('.', import.meta.url));
const DIST_DIR = fileURLToPath(new URL('../dist', import.meta.url));
const DEST_DIR = 'om-aya';

// ملفات التشغيل والتوثيق والتوليد لا تُنشر — في المجلد وفي مجلداته الفرعية.
const EXCLUDED = new Set(['.mjs', '.md', '.py']);
const isExcluded = (path) => EXCLUDED.has(extname(path).toLowerCase());

const target = DEST_DIR ? join(DIST_DIR, DEST_DIR) : DIST_DIR;

try {
  await readdir(DIST_DIR);
} catch {
  console.error('مجلد dist غير موجود — شغّل npm run build أولاً.');
  process.exit(1);
}

await mkdir(target, { recursive: true });

const entries = await readdir(SITE_DIR, { withFileTypes: true });
const copied = [];

for (const entry of entries) {
  if (entry.isFile() && isExcluded(entry.name)) continue;
  await cp(join(SITE_DIR, entry.name), join(target, entry.name), {
    recursive: true,
    filter: (src) => !isExcluded(src),
  });
  copied.push(entry.name);
}

if (!copied.includes('index.html')) {
  console.error('لم يُعثر على om-aya/index.html — لم يُنسخ المتجر.');
  process.exit(1);
}

console.log(`نُسخ متجر أم آية إلى dist/${DEST_DIR || ''} (${copied.join('، ')})`);
