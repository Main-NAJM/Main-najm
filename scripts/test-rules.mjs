/**
 * اختبار قواعد أمان Firestore على المحاكي.
 *
 *   npm run emulators     # نافذة أولى
 *   npm run test:rules    # نافذة ثانية
 *
 * لماذا هذا الاختبار موجود: قواعد `firestore.rules` هي الشيء الوحيد الذي يفصل
 * بيانات زبون عن زبون. خطأ حرف واحد فيها يفتح كل شيء، ولا يظهر في أي شاشة
 * ولا في أي بناء — يظهر يوم يقرأ أحدهم بيانات غيره. فالاختبار هنا ليس ترفًا.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, setLogLevel } from 'firebase/firestore';

// حالات الرفض المتوقّعة تطبع PERMISSION_DENIED من الـ SDK. هذا الضجيج يخفي
// نتيجة الاختبار نفسها، والرفض هنا هو النجاح لا الخطأ.
setLogLevel('silent');

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PROJECT_ID = process.env.GCLOUD_PROJECT ?? 'albacha-metals-fecd8';

// ‎firebase emulators:exec‎ يضبط FIRESTORE_EMULATOR_HOST بصيغة host:port، فنقرأه
// كما هو ليعمل السكربت في CI بلا إعداد، ونرجع إلى المنفذ الافتراضي محليًا.
const [HOST, PORT] = (() => {
  const fromEnv = process.env.FIRESTORE_EMULATOR_HOST;
  if (fromEnv) {
    const lastColon = fromEnv.lastIndexOf(':');
    return [fromEnv.slice(0, lastColon), Number(fromEnv.slice(lastColon + 1))];
  }
  return ['127.0.0.1', 8080];
})();

const results = [];
const check = async (name, promise) => {
  try {
    await promise;
    results.push({ name, ok: true });
    console.log(`  ✓ ${name}`);
  } catch (error) {
    results.push({ name, ok: false, error: String(error).slice(0, 160) });
    console.log(`  ✗ ${name}\n      ${String(error).slice(0, 160)}`);
  }
};

let testEnv;
try {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(`${ROOT}firestore.rules`, 'utf8'),
      host: HOST,
      port: PORT,
    },
  });
} catch (error) {
  console.error(
    `\n✖ تعذّر الاتصال بمحاكي Firestore على ${HOST}:${PORT}.\n` +
      `  شغّل أولًا في نافذة أخرى:  npm run emulators\n\n  ${String(error).slice(0, 200)}\n`,
  );
  process.exit(1);
}

await testEnv.clearFirestore();

const ALICE = 'alice-uid';
const BOB = 'bob-uid';
const alice = testEnv.authenticatedContext(ALICE).firestore();
const bob = testEnv.authenticatedContext(BOB).firestore();
const anon = testEnv.unauthenticatedContext().firestore();

const order = { title: 'باب حديد', customerName: 'زبون', updatedAt: Date.now() };

console.log('\nقواعد أمان Firestore — على المحاكي\n');

console.log('صاحب البيانات:');
await check('يكتب في مجموعته (orders)', assertSucceeds(setDoc(doc(alice, `users/${ALICE}/orders/o1`), order)));
await check('يقرأ ما كتبه', assertSucceeds(getDoc(doc(alice, `users/${ALICE}/orders/o1`))));
await check('يكتب ملفّه الشخصي', assertSucceeds(setDoc(doc(alice, `users/${ALICE}`), { businessName: 'ورشتي' })));
await check(
  'يكتب في مجموعات تطبيق الباشة',
  assertSucceeds(setDoc(doc(alice, `users/${ALICE}/albachaCustomers/c1`), { name: 'زبون' })),
);

console.log('\nمستخدم آخر:');
await check('لا يقرأ بيانات غيره', assertFails(getDoc(doc(bob, `users/${ALICE}/orders/o1`))));
await check('لا يكتب في بيانات غيره', assertFails(setDoc(doc(bob, `users/${ALICE}/orders/o2`), order)));
await check('لا يقرأ ملفّ غيره الشخصي', assertFails(getDoc(doc(bob, `users/${ALICE}`))));
await check('لا يحذف بالكتابة فوق مستند غيره', assertFails(setDoc(doc(bob, `users/${ALICE}`), {})));

console.log('\nزائر بلا تسجيل دخول:');
await check('لا يقرأ شيئًا', assertFails(getDoc(doc(anon, `users/${ALICE}/orders/o1`))));
await check('لا يكتب شيئًا', assertFails(setDoc(doc(anon, `users/${ALICE}/orders/o3`), order)));

console.log('\nمسارات خارج القائمة المسموحة:');
await check(
  'مجموعة غير معروفة تحت حسابه مرفوضة',
  assertFails(setDoc(doc(alice, `users/${ALICE}/secretStuff/x`), { a: 1 })),
);
await check('مسار خارج users مرفوض', assertFails(setDoc(doc(alice, 'admin/config'), { a: 1 })));
await check('جذر عشوائي مرفوض', assertFails(getDoc(doc(anon, 'anything/at-all'))));

await testEnv.cleanup();

const failed = results.filter((r) => !r.ok);
console.log(`\n${'─'.repeat(46)}`);
if (failed.length) {
  console.log(`✗ ${failed.length} من ${results.length} فحصًا فشل — القواعد ليست آمنة\n`);
  process.exit(1);
}
console.log(`✓ ${results.length} فحصًا، كلّها سليمة\n`);
