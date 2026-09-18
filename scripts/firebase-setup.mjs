/**
 * تهيئة مشروع Firebase للتطبيق بأمر واحد:
 *
 *   npx firebase-tools@13 login     # مرّة واحدة
 *   npm run firebase:setup
 *
 * ما يفعله:
 *   1. يقرأ معرّف المشروع من ‎.firebaserc‎ (أو من ‎--project <id>‎).
 *   2. يبحث عن تطبيق ويب مسجّل في المشروع، ويُنشئ واحداً إن لم يوجد.
 *   3. يجلب إعدادات SDK ويكتبها في ‎.env.local‎ (غير مرفوع إلى Git).
 *
 * خيارات: ‎--project <id>‎ لتجاوز ‎.firebaserc‎، و‎--force‎ لاستبدال ‎.env.local‎ الموجود.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const ENV_FILE = `${ROOT}.env.local`;
const RC_FILE = `${ROOT}.firebaserc`;
const APP_DISPLAY_NAME = 'حرفة برو (ويب)';
const CLI = ['--yes', 'firebase-tools@13'];

const args = process.argv.slice(2);
const force = args.includes('--force');
const projectFlagIndex = args.indexOf('--project');
const projectFromFlag = projectFlagIndex >= 0 ? args[projectFlagIndex + 1] : undefined;

const fail = (message) => {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
};

function readProjectId() {
  if (projectFromFlag) return projectFromFlag;
  if (!existsSync(RC_FILE)) {
    fail(
      'لم يُحدَّد المشروع: أضف ملف .firebaserc أو مرّر --project <معرّف-المشروع>.\n' +
        '  للحصول على المعرّف: npx firebase-tools@13 projects:list',
    );
  }
  try {
    const rc = JSON.parse(readFileSync(RC_FILE, 'utf8'));
    const id = rc?.projects?.default;
    if (!id) fail('لا يحوي .firebaserc مشروعاً افتراضياً (projects.default).');
    return id;
  } catch (error) {
    return fail(`تعذّرت قراءة .firebaserc: ${error.message}`);
  }
}

function firebase(commandArgs) {
  try {
    return execFileSync('npx', [...CLI, ...commandArgs, '--json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (error) {
    // ‎firebase‎ يكتب تفاصيل الخطأ في stdout بصيغة JSON حتى عند الفشل.
    const output = `${error.stdout ?? ''}`.trim();
    if (output) return output;
    fail(
      `فشل تنفيذ: firebase ${commandArgs.join(' ')}\n  ${(error.stderr || error.message)
        .toString()
        .trim()}`,
    );
  }
}

function parse(output, what) {
  let data;
  try {
    data = JSON.parse(output);
  } catch {
    return fail(`تعذّر فهم مخرجات ${what}. تأكّد من تسجيل الدخول: npx firebase-tools@13 login`);
  }
  if (data.status !== 'success') {
    const message = data.error ?? 'خطأ غير معروف من Firebase CLI';
    if (/not logged in|authenticat|credential|firebase login/i.test(String(message))) {
      fail(`${message}\n  سجّل الدخول أولاً: npx firebase-tools@13 login`);
    }
    fail(`${what}: ${message}`);
  }
  return data.result;
}

const projectId = readProjectId();
console.log(`المشروع: ${projectId}`);

// 1) تطبيق ويب مسجّل؟
const apps = parse(firebase(['apps:list', 'WEB', '--project', projectId]), 'apps:list');
let webApp = Array.isArray(apps) ? apps.find((app) => app.appId) : undefined;

if (webApp) {
  console.log(`تطبيق ويب موجود: ${webApp.displayName ?? webApp.appId}`);
} else {
  console.log('لا يوجد تطبيق ويب في المشروع — يجري إنشاؤه…');
  webApp = parse(
    firebase(['apps:create', 'WEB', APP_DISPLAY_NAME, '--project', projectId]),
    'apps:create',
  );
  console.log(`أُنشئ تطبيق ويب: ${webApp.appId}`);
}

// 2) إعدادات SDK
const sdk = parse(
  firebase(['apps:sdkconfig', 'WEB', webApp.appId, '--project', projectId]),
  'apps:sdkconfig',
);
const config = sdk?.sdkConfig ?? sdk;
const missing = ['apiKey', 'authDomain', 'projectId', 'appId'].filter((key) => !config?.[key]);
if (missing.length) fail(`نقصت حقول في إعدادات SDK: ${missing.join('، ')}`);

// 3) كتابة .env.local
if (existsSync(ENV_FILE) && !force) {
  fail('الملف .env.local موجود مسبقاً. أضف --force لاستبداله:\n  npm run firebase:setup -- --force');
}

const lines = [
  '# مولَّد بأمر: npm run firebase:setup — لا يُرفع إلى Git.',
  `VITE_FIREBASE_API_KEY=${config.apiKey}`,
  `VITE_FIREBASE_AUTH_DOMAIN=${config.authDomain}`,
  `VITE_FIREBASE_PROJECT_ID=${config.projectId}`,
  `VITE_FIREBASE_STORAGE_BUCKET=${config.storageBucket ?? ''}`,
  `VITE_FIREBASE_MESSAGING_SENDER_ID=${config.messagingSenderId ?? ''}`,
  `VITE_FIREBASE_APP_ID=${config.appId}`,
  '',
];
writeFileSync(ENV_FILE, lines.join('\n'), 'utf8');

// 4) متجر أم آية ملفّ ثابت لا يمرّ على Vite، فلا يقرأ متغيّرات البيئة.
//    تُكتب له نفس المفاتيح في ملفّ سكربت يقرأه المتصفّح مباشرة.
const SHOP_CONFIG = `${ROOT}om-aya/firebase-config.js`;
writeFileSync(SHOP_CONFIG, `// مولَّد بأمر: npm run firebase:setup — لا تُعدّله يدوياً.
// مفاتيح الويب ليست أسراراً: تُشحن مع الصفحة إلى كل متصفّح، والحماية في
// firestore.rules لا في إخفائها.
window.OM_AYA_FIREBASE = {
  apiKey: ${JSON.stringify(config.apiKey)},
  authDomain: ${JSON.stringify(config.authDomain)},
  projectId: ${JSON.stringify(config.projectId)},
  storageBucket: ${JSON.stringify(config.storageBucket ?? '')},
  messagingSenderId: ${JSON.stringify(config.messagingSenderId ?? '')},
  appId: ${JSON.stringify(config.appId)},
};
`, 'utf8');

console.log(`
✔ كُتب ملف .env.local
✔ كُتب ملف om-aya/firebase-config.js

بقيت خطوة واحدة في الكونسول (مرّة واحدة) — تفعيل طرق الدخول:
  https://console.firebase.google.com/project/${projectId}/authentication/providers
  فعّل: Email/Password ثم Google ثم Phone.

ثم:  npm run dev
`);
