/**
 * يكتب ‎.env.local‎ بمفاتيح الويب قبل البناء، من أحد مصدرين:
 *
 *   1. متغيّرات البيئة ‎VITE_FIREBASE_*‎  (أسرار أو متغيّرات المستودع)
 *   2. الملف ‎firebase.web.json‎ المرفوع مع الشيفرة
 *
 * مفاتيح الويب هذه **ليست أسراراً**: كل تطبيق ويب يشحنها داخل حزمته ويقرأها أي زائر.
 * الحماية تأتي من قواعد أمان Firestore ومن طرق الدخول، لا من إخفائها. لذلك يجوز
 * رفعها مع الشيفرة، بخلاف مفتاح حساب الخدمة الذي لا يُرفع أبداً.
 *
 * إن لم يوجد أي مصدر يُبنى المشروع بلا Firebase: التطبيق يعمل في «وضع الجهاز»
 * (كل البيانات في المتصفّح) والموقع يعرض معرضه المكتوب في الصفحة.
 *
 * لا يمسّ ‎.env.local‎ الموجود مسبقاً إلا مع ‎--force‎.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const ENV_FILE = `${ROOT}.env.local`;
const WEB_CONFIG = `${ROOT}firebase.web.json`;

const FIELDS = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
};

const force = process.argv.includes('--force');

if (existsSync(ENV_FILE) && !force) {
  console.log('.env.local موجود — تُرك كما هو.');
  process.exit(0);
}

let fromFile = {};
if (existsSync(WEB_CONFIG)) {
  try {
    fromFile = JSON.parse(readFileSync(WEB_CONFIG, 'utf8'));
  } catch (error) {
    console.error(`✖ تعذّرت قراءة firebase.web.json: ${error.message}`);
    process.exit(1);
  }
}

const values = Object.fromEntries(
  Object.entries(FIELDS)
    .map(([field, name]) => [name, process.env[name] || fromFile[field] || ''])
    .filter(([, value]) => value),
);

const required = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_APP_ID'];
const missing = required.filter((name) => !values[name]);

if (missing.length) {
  console.log(
    'لا توجد مفاتيح ويب (لا firebase.web.json ولا متغيّرات بيئة) —\n' +
      '  يُبنى المشروع بلا Firebase: التطبيق في وضع الجهاز، والموقع بمعرضه المكتوب.',
  );
  process.exit(0);
}

// authDomain يُشتقّ من معرّف المشروع إن لم يُذكر، فهو دائماً <project>.firebaseapp.com
values.VITE_FIREBASE_AUTH_DOMAIN ||= `${values.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`;

const lines = [
  '# مولَّد بأمر: node scripts/web-config.mjs — لا يُرفع إلى Git.',
  ...Object.values(FIELDS).map((name) => `${name}=${values[name] ?? ''}`),
  '',
];
writeFileSync(ENV_FILE, lines.join('\n'), 'utf8');

console.log(`✔ كُتب .env.local للمشروع ${values.VITE_FIREBASE_PROJECT_ID}`);
