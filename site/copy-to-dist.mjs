// ينسخ الموقع التعريفي إلى مجلد البناء ليُنشر مع التطبيق على Firebase Hosting.
//
// المصدر: site/            (ملفات الموقع فقط — تُستثنى السكربتات والتوثيق)
// الهدف:  dist/albacha/    ← يصبح الرابط https://<project>.web.app/albacha
//
// لنشر الموقع في جذر النطاق بدلاً من مسار فرعي، غيّر DEST_DIR إلى '' (سلسلة فارغة)
// واحذف قسم hosting.rewrites الخاص بـ /albacha من firebase.json.

import { cp, mkdir, readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_DIR = fileURLToPath(new URL('.', import.meta.url));
const DIST_DIR = fileURLToPath(new URL('../dist', import.meta.url));
const DEST_DIR = 'albacha';

// ملفات التشغيل والتوثيق لا تُنشر.
const EXCLUDED = new Set(['.mjs', '.md']);

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
  if (entry.isFile() && EXCLUDED.has(extname(entry.name).toLowerCase())) continue;
  await cp(join(SITE_DIR, entry.name), join(target, entry.name), { recursive: true });
  copied.push(entry.name);
}

if (!copied.includes('index.html')) {
  console.error('لم يُعثر على site/index.html — لم يُنسخ الموقع.');
  process.exit(1);
}

console.log(`نُسخ الموقع التعريفي إلى dist/${DEST_DIR || ''} (${copied.join('، ')})`);
