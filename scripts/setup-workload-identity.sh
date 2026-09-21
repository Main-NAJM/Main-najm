#!/usr/bin/env bash
# تهيئة النشر بلا مفتاح (Workload Identity Federation).
#
# لماذا: سياسة المؤسسة على Google Cloud تمنع إنشاء مفاتيح لحسابات الخدمة، وهو
# منع في محلّه — المفتاح ملف دائم يصلح لمن يقع في يده. البديل هنا أن يوقّع
# GitHub هوية كل تشغيل، ويقبلها Google من هذا المستودع وحده، بلا مفتاح أصلًا.
#
# كيف: افتح Google Cloud Shell من console.cloud.google.com (أيقونة الطرفية
# أعلى اليمين)، ثم الصق الأمر التالي سطرًا واحدًا:
#
#   curl -fsSL https://raw.githubusercontent.com/Main-NAJM/Main-najm/main/scripts/setup-workload-identity.sh | bash
#
# أو استنسخ المستودع وشغّل الملف مباشرة. يُشغَّل مرة واحدة فقط، وتكراره غير ضار.
# في آخره يطبع متغيّرين تضيفهما في GitHub، والتعليمات مطبوعة معهما.

set -euo pipefail

PROJECT_ID="${PROJECT_ID:-albacha-metals-fecd8}"
REPO="${REPO:-Main-NAJM/Main-najm}"
POOL="${POOL:-github}"
PROVIDER="${PROVIDER:-github-oidc}"
SA_NAME="${SA_NAME:-github-deployer}"
SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"

echo "المشروع: $PROJECT_ID"
echo "المستودع المسموح له وحده: $REPO"
echo

gcloud config set project "$PROJECT_ID" >/dev/null
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"

echo "١/٥ تفعيل الواجهات اللازمة…"
gcloud services enable \
  iamcredentials.googleapis.com \
  sts.googleapis.com \
  firebasehosting.googleapis.com \
  firebaserules.googleapis.com >/dev/null

echo "٢/٥ حساب خدمة للنشر…"
gcloud iam service-accounts create "$SA_NAME" \
  --display-name="ناشر GitHub Actions" >/dev/null 2>&1 || echo "    موجود مسبقًا."

echo "٣/٥ صلاحيات النشر — النشر وقواعد الأمان وقراءة إعدادات التطبيق فقط…"
for role in \
  roles/firebasehosting.admin \
  roles/firebaserules.admin \
  roles/firebase.viewer \
  roles/serviceusage.serviceUsageConsumer
do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA_EMAIL" \
    --role="$role" \
    --condition=None >/dev/null
done

echo "٤/٥ مجمّع الهويات ومزوّده…"
gcloud iam workload-identity-pools create "$POOL" \
  --location=global \
  --display-name="GitHub" >/dev/null 2>&1 || echo "    المجمّع موجود مسبقًا."

# شرط النطاق هو صمّام الأمان: لا تُقبل هوية إلا إن جاءت من هذا المستودع بعينه.
gcloud iam workload-identity-pools providers create-oidc "$PROVIDER" \
  --location=global \
  --workload-identity-pool="$POOL" \
  --display-name="GitHub OIDC" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='$REPO'" >/dev/null 2>&1 || echo "    المزوّد موجود مسبقًا."

echo "٥/٥ ربط المستودع بحساب الخدمة…"
POOL_PATH="$(gcloud iam workload-identity-pools describe "$POOL" \
  --location=global --format='value(name)')"

gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/$POOL_PATH/attribute.repository/$REPO" >/dev/null

cat <<EOF

تمّت التهيئة على Google Cloud. بقيت خطوة واحدة في GitHub:

  Settings ← Secrets and variables ← Actions ← تبويب Variables ← New variable

أضف اثنين بهذين الاسمين والقيمتين:

  GCP_WORKLOAD_IDENTITY_PROVIDER
  projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL/providers/$PROVIDER

  GCP_SERVICE_ACCOUNT
  $SA_EMAIL

هما متغيّران (Variables) لا أسرار (Secrets) — لا يحملان شيئًا سرّيًا.
وبعدهما يمكن حذف السرّ FIREBASE_SERVICE_ACCOUNT، فلم يعد له عمل.
EOF
