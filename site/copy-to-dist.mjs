// ينسخ الموقع التعريفي إلى مجلد البناء ليُنشر مع التطبيق على Firebase Hosting.
//
// المصدر: site/     (ملفات الموقع فقط — تُستثنى السكربتات والتوثيق)
// الهدف:  dist/      ← الموقع هو الصفحة الرئيسية للنطاق
//
// كان تحت ‎/albacha‎ حين كان الجذر لتطبيق «حرفة برو». وقد رُفع ذاك من النشر،
// فصار الموقع في الجذر ليَقصُر الرابط الذي يُرسَل للزبائن، ويبقى ‎/albacha/‎
// صفحة تحويل حتى لا تنكسر الروابط المُرسَلة من قبل.

import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_DIR = fileURLToPath(new URL('.', import.meta.url));
const DIST_DIR = fileURLToPath(new URL('../dist', import.meta.url));
const DEST_DIR = '';

// ملفات التشغيل والتوثيق والتوليد لا تُنشر — في المجلد وفي مجلداته الفرعية.
const EXCLUDED = new Set(['.mjs', '.md', '.py']);
const isExcluded = (path) => EXCLUDED.has(extname(path).toLowerCase());

const target = DEST_DIR ? join(DIST_DIR, DEST_DIR) : DIST_DIR;

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

// حقن إعدادات Firebase في الصفحة المنشورة، ليقرأ الموقع معرض الأعمال الذي
// يديره صاحب المؤسسة من التطبيق. القيم من .env.local (يكتبها npm run firebase:setup)
// وهي مفاتيح عميل عامّة تُشحن في كل تطبيق ويب — ليست أسراراً.
const ENV_KEYS = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
};

const readEnvFile = async () => {
  const values = {};
  try {
    const raw = await readFile(fileURLToPath(new URL('../.env.local', import.meta.url)), 'utf8');
    for (const line of raw.split('\n')) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match) values[match[1]] = match[2].trim();
    }
  } catch {
    /* لا ملف بيئة — يُنشر الموقع بمحتواه المكتوب */
  }
  return values;
};

const env = await readEnvFile();
const config = Object.fromEntries(
  Object.entries(ENV_KEYS)
    .map(([key, name]) => [key, process.env[name] || env[name] || ''])
    .filter(([, value]) => value),
);

const indexPath = join(target, 'index.html');
if (config.apiKey && config.projectId) {
  const html = await readFile(indexPath, 'utf8');
  const inject = `<script>window.__ALBACHA_FIREBASE__ = ${JSON.stringify(config)};</script>\n</head>`;
  await writeFile(indexPath, html.replace('</head>', inject), 'utf8');
  console.log('حُقنت إعدادات Firebase في الموقع (معرض الأعمال يعمل).');
} else {
  console.log('لا توجد إعدادات Firebase — يُنشر الموقع بمعرضه المكتوب.');
}

if (!copied.includes('index.html')) {
  console.error('لم يُعثر على site/index.html — لم يُنسخ الموقع.');
  process.exit(1);
}

// الرابط القديم ‎/albacha/‎ قد يكون بيد زبائن، فيُحوَّل بدل أن يعطي 404.
const legacy = join(DIST_DIR, 'albacha');
await mkdir(legacy, { recursive: true });
await writeFile(
  join(legacy, 'index.html'),
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

console.log(`نُسخ الموقع التعريفي إلى dist/${DEST_DIR || '(الجذر)'} (${copied.join('، ')})`);
