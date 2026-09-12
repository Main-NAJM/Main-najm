#!/usr/bin/env bash
#
# نشر المشروع كاملاً بأمر واحد، بلا مفتاح حساب خدمة وبلا أسرار في GitHub.
#
#   bash scripts/deploy.sh
#
# يصلح لأي طرفية فيها متصفّح — بما فيها طرفية GitHub Codespaces التي تُفتح من
# الهاتف. تسجيل الدخول يتمّ برابط يُفتح في المتصفّح ثم رمز يُلصق هنا، فلا حاجة
# إلى ملف مفتاح (‎service account key‎) الذي تمنعه السياسات الإدارية.
#
# لنشر مشروع آخر:  FIREBASE_PROJECT=<id> bash scripts/deploy.sh

set -euo pipefail

cd "$(dirname "$0")/.."

read_project() {
  node -p "JSON.parse(require('fs').readFileSync('.firebaserc','utf8')).projects.default"
}
PROJECT="${FIREBASE_PROJECT:-$(read_project)}"
FIREBASE=(npx --yes firebase-tools@13)

echo "▸ المشروع: ${PROJECT}"

# ١) تسجيل الدخول — يُتخطّى إن كانت الجلسة قائمة
if ! "${FIREBASE[@]}" projects:list >/dev/null 2>&1; then
  echo "▸ تسجيل الدخول إلى Firebase"
  echo "  سيظهر رابط: افتحه في المتصفّح، اختر حساب Google، ثم الصق الرمز هنا."
  "${FIREBASE[@]}" login --no-localhost
fi

# ٢) الحزم
echo "▸ تثبيت الحزم"
if [ -d node_modules ]; then npm install; else npm ci; fi

# ٣) مفاتيح الويب في .env.local (تُحقن في الموقع والتطبيق وقت البناء)
echo "▸ تجهيز مفاتيح الويب"
node scripts/firebase-setup.mjs --project "${PROJECT}" --force

# ٤) البناء
echo "▸ بناء الموقع والتطبيقين"
npm run build

# ٥) النشر: الاستضافة وقواعد أمان Firestore معاً
echo "▸ النشر"
"${FIREBASE[@]}" deploy --project "${PROJECT}" --only hosting,firestore:rules

cat <<EOF

✅ تمّ النشر:

   https://${PROJECT}.web.app/          حرفة برو
   https://${PROJECT}.web.app/albacha   الموقع التعريفي
   https://${PROJECT}.web.app/app       تطبيق مؤسسة الباشة

افتح ‎/app‎ من الهاتف وثبّته: ⋮ ← «تثبيت التطبيق».
EOF
