/**
 * ينسخ ناتج بناء تطبيق الباشة إلى مجلد النشر الرئيسي:
 *
 *   albacha-app/dist/  →  dist/app/    ← https://<project>.web.app/app
 *
 * يُستدعى من npm run build في جذر المستودع بعد بناء التطبيقين.
 */

import { cp, readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const SOURCE = fileURLToPath(new URL('./dist', import.meta.url));
const TARGET = fileURLToPath(new URL('../dist/app', import.meta.url));

try {
  await readdir(SOURCE);
} catch {
  console.error('لم يُبنَ تطبيق الباشة بعد — شغّل npm run build -w albacha-app أولاً.');
  process.exit(1);
}

// حذف النسخة السابقة حتى لا تبقى ملفات قديمة من بناء أقدم.
await rm(TARGET, { recursive: true, force: true });
await cp(SOURCE, TARGET, { recursive: true });

console.log('نُسخ تطبيق الباشة إلى dist/app');
