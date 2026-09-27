/**
 * إعدادات Firebase لمتجر أم عمر.
 *
 * هذه المفاتيح ليست أسراراً: تُشحن مع الصفحة إلى متصفّح كل زائرة على أي حال.
 * حماية البيانات في قواعد الأمان (‎firestore.rules‎ في جذر المستودع) لا في إخفاء
 * المفاتيح — القواعد تسمح للجميع بقراءة المنتجات، ولا تسمح بكتابتها إلا لحساب
 * صاحبة المتجر.
 *
 * مصدر القيم:
 *   Firebase Console ← ⚙ Project settings ← Your apps ← تطبيق الويب
 *   ← SDK setup and configuration ← Config
 *
 * ملاحظة: ‎npm run firebase:setup‎ يعيد كتابة هذا الملف من المشروع، وكذلك خطوة
 * النشر — فلا حاجة لتعديله يدوياً بعد اليوم.
 */

window.OM_AYA_FIREBASE = {
  apiKey: 'AIzaSyC91OFvMReKqz5nLwJjVSx0_zEFORZ5eRI',
  authDomain: 'albacha-metals-fecd8.firebaseapp.com',
  projectId: 'albacha-metals-fecd8',
  storageBucket: 'albacha-metals-fecd8.firebasestorage.app',
  messagingSenderId: '379093155638',
  appId: '1:379093155638:web:903d928937a71e92c6fd97',
};
