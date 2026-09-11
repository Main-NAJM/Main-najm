#!/usr/bin/env bash
#
# يبني الموقع والتطبيقين وينشرهما على GitHub Pages عبر فرع ‎gh-pages‎:
#
#   bash scripts/publish-gh-pages.sh
#
# هذا هو طريق النشر ما دام GitHub Actions معطّلاً على المستودع (كل تشغيل ينتهي
# بـ startup_failure حتى لملف لا يفعل شيئاً). Pages يقرأ الفرع مباشرةً بلا Actions،
# فيبقى الموقع يتحدّث. حين يعود Actions، ‎deploy-pages.yml‎ يتولّى هذا تلقائياً.
#
# يبني على مسار ‎/<اسم-المستودع>/‎ لأن Pages يخدم المشروع من مسار فرعي.

set -euo pipefail

cd "$(dirname "$0")/.."

BRANCH="${PAGES_BRANCH:-gh-pages}"
REPO_NAME="$(basename "$(git rev-parse --show-toplevel)")"
BASE="/${REPO_NAME}/"
MESSAGE="${1:-تحديث النسخة المنشورة}"

# مفاتيح الويب من firebase.web.json إن لم يكن ‎.env.local‎ موجوداً (جلسة جديدة مثلاً).
node scripts/web-config.mjs

echo "▸ البناء على المسار ${BASE}"
rm -rf dist albacha-app/dist
BASE_PATH="$BASE" APP_BASE_PATH="${BASE}app/" npm run build
BASE_PATH="$BASE" node scripts/pages-404.mjs

# شجرة عمل منفصلة للفرع المنشور، فلا تُمسّ شجرة العمل الحالية ولا فرعها.
WORK="$(mktemp -d)"
cleanup() { git worktree remove --force "$WORK" >/dev/null 2>&1 || true; }
trap cleanup EXIT

echo "▸ تجهيز فرع ${BRANCH}"
git fetch -q origin "$BRANCH" 2>/dev/null || true
if git rev-parse --verify -q "origin/${BRANCH}" >/dev/null; then
  git worktree add -q --force -B "$BRANCH" "$WORK" "origin/${BRANCH}"
else
  git worktree add -q --force --detach "$WORK"
  git -C "$WORK" checkout -q --orphan "$BRANCH"
  git -C "$WORK" rm -rq --cached . 2>/dev/null || true
fi

# محتوى الفرع هو ناتج البناء وحده: يُمسح القديم كاملاً قبل النسخ حتى لا تبقى
# ملفات من بناء أقدم (أسماء الحزم تحمل بصمة المحتوى فتتراكم).
find "$WORK" -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
cp -r dist/. "$WORK"/
printf 'node_modules/\n' > "$WORK/.gitignore"

git -C "$WORK" add -A
if git -C "$WORK" diff --cached --quiet; then
  echo "▸ لا جديد — الفرع مطابق للبناء الحالي."
  exit 0
fi

git -C "$WORK" commit -q -m "$MESSAGE"
git -C "$WORK" push -q origin "$BRANCH"

cat <<EOF

✅ نُشر. يستغرق Pages دقيقة أو دقيقتين ثم:

   https://main-najm.github.io${BASE}          حرفة برو
   https://main-najm.github.io${BASE}albacha/  الموقع التعريفي
   https://main-najm.github.io${BASE}app/      تطبيق مؤسسة الباشة
EOF
