/**
 * إعدادات Firebase لمتجر أم آية.
 *
 * هذه المفاتيح ليست أسراراً: تُشحن مع الصفحة إلى متصفّح كل زائرة على أي حال.
 * حماية البيانات في قواعد الأمان (‎firestore.rules‎ في جذر المستودع) لا في إخفاء
 * المفاتيح — القواعد تسمح للجميع بقراءة المنتجات، ولا تسمح بكتابتها إلا لحساب
 * صاحبة المتجر.
 *
 * من أين تأتي القيم الستّ؟
 *   Firebase Console ← ⚙ Project settings ← Your apps ← تطبيق الويب
 *   ← SDK setup and configuration ← Config
 *
 * وما دامت فارغة يعمل المتجر بلا قاعدة بيانات: يعرض ما في ‎PRODUCTS‎ و‎PHONE‎
 * داخل ‎index.html‎ إن وُجد، ولا تكتب لوحة الإدارة شيئاً.
 *
 * ملاحظة: ‎npm run firebase:setup‎ يملأ هذا الملف تلقائياً من المشروع، وكذلك
 * خطوة النشر — فلا حاجة لتعبئته يدوياً إن كان النشر يعمل.
 */

window.OM_AYA_FIREBASE = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};
