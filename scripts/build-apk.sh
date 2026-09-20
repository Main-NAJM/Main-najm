#!/usr/bin/env bash
# يبني ملف APK لتطبيق حرفة برو، بلا Gradle وبلا Android Studio.
#
# لماذا يدوياً؟ لأن أدوات Google (dl.google.com) غير متاحة في كل بيئة، بينما
# أدوات البناء نفسها موجودة في مستودعات أوبنتو ومركز Maven. النتيجة واحدة:
# ملف APK موقّع يُثبَّت على الهاتف.
#
# المتطلّبات:
#   apt-get install -y android-sdk-build-tools android-sdk-platform-23 default-jdk-headless
#   وملفّ dx.jar من مركز Maven (ينزّله السكربت إن لم يوجد).
#
# الاستعمال:  bash scripts/build-apk.sh [مسار-ملف-المفاتيح]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/build-apk"
TOOLS="$OUT/tools"
ANDROID_JAR="/usr/lib/android-sdk/platforms/android-23/android.jar"
KEYSTORE="${1:-$OUT/herfah.keystore}"
KEY_ALIAS="herfah"
KEY_PASS="${HERFAH_KEY_PASS:-herfah-pro}"
APK_NAME="herfah-pro"

say() { printf '\n\033[1m› %s\033[0m\n' "$1"; }

# ------------------------------------------------------------------ تحقّق
say "التحقّق من الأدوات"
for tool in aapt2 zipalign apksigner keytool zip; do
  command -v "$tool" >/dev/null || { echo "ينقص: $tool"; exit 1; }
done
[ -f "$ANDROID_JAR" ] || { echo "ينقص: $ANDROID_JAR"; exit 1; }

JAVAC="${HERFAH_JAVAC:-/usr/lib/jvm/java-8-openjdk-amd64/bin/javac}"
[ -x "$JAVAC" ] || { echo "ينقص javac 8: $JAVAC (apt-get install openjdk-8-jdk-headless)"; exit 1; }

mkdir -p "$TOOLS"
DX="$TOOLS/dx.jar"
if [ ! -f "$DX" ]; then
  echo "تنزيل المحوّل إلى dex من مركز Maven…"
  curl -fsSL -o "$DX" \
    "https://repo.maven.apache.org/maven2/com/google/android/tools/dx/1.7/dx-1.7.jar"
fi

# --------------------------------------------------- بناء التطبيق للويب
# الأصول تُقدَّم من جذر أصلٍ داخلي، فالمسارات المطلقة صحيحة والموجّه يعمل كما هو.
say "بناء نسخة الويب"
cd "$ROOT"
rm -rf dist
npx tsc -b
npx vite build

# ----------------------------------------------- تضمين الخطّ للعمل بلا إنترنت
# الخطّ من Google Fonts مرخّص بـ OFL، فيُنسخ داخل التطبيق ليعمل بلا شبكة.
say "تضمين خطّ تجوّل"
FONT_DIR="$ROOT/dist/fonts"
mkdir -p "$FONT_DIR"
FONT_UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
curl -fsSL -A "$FONT_UA" \
  "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" \
  -o "$FONT_DIR/tajawal.css"

python3 - "$FONT_DIR" <<'PY'
import os, re, subprocess, sys
font_dir = sys.argv[1]
css_path = os.path.join(font_dir, 'tajawal.css')
css = open(css_path, encoding='utf-8').read()
urls = sorted(set(re.findall(r'url\((https://fonts\.gstatic\.com/[^)]+)\)', css)))
if not urls:
    sys.exit('لم يُعثر على ملفّات الخطّ في ورقة الأنماط.')
for url in urls:
    name = url.rsplit('/', 1)[-1]
    subprocess.run(['curl', '-fsSL', url, '-o', os.path.join(font_dir, name)], check=True)
    css = css.replace(url, name)  # نسبي إلى مجلّد الورقة نفسه
open(css_path, 'w', encoding='utf-8').write(css)
print(f'ضُمّن {len(urls)} ملفّ خطّ')
PY

# استبدال رابط Google بورقة محليّة داخل صفحة البداية
python3 - "$ROOT/dist/index.html" <<'PY'
import re, sys
path = sys.argv[1]
html = open(path, encoding='utf-8').read()
before = html
html = re.sub(r'\s*<link rel="preconnect"[^>]*fonts\.(googleapis|gstatic)\.com[^>]*/?>', '', html)
html = re.sub(
    r'\s*<link[^>]*fonts\.googleapis\.com/css2[^>]*/?>',
    '\n    <link rel="stylesheet" href="/fonts/tajawal.css" />',
    html,
)
if html == before:
    sys.exit('لم يُستبدل رابط الخطّ — تغيّرت صفحة البداية.')
open(path, 'w', encoding='utf-8').write(html)
print('رُبطت صفحة البداية بالخطّ المحلّي')
PY

# عامل الخدمة لا لزوم له داخل التطبيق: الأصول كلّها في الملف أصلاً، وذاكرته
# الوسيطة قد تُبقي نسخة قديمة بعد تحديث التطبيق. تُعلَّم الصفحة ليُترك تسجيله.
rm -f "$ROOT/dist/sw.js"
python3 - "$ROOT/dist/index.html" <<'PY'
import sys
path = sys.argv[1]
html = open(path, encoding='utf-8').read()
if 'data-bundled' not in html:
    html = html.replace('<html lang="ar" dir="rtl">', '<html lang="ar" dir="rtl" data-bundled="1">', 1)
    open(path, 'w', encoding='utf-8').write(html)
print('عُلِّمت الصفحة كنسخة مضمّنة')
PY

# ------------------------------------------------------------ تجميع APK
say "تجميع الموارد"
rm -rf "$OUT/work"
mkdir -p "$OUT/work/classes" "$OUT/work/dex" "$OUT/work/assets"
# الأصول تحت www/ لا في جذر assets، ليطابق ما يقرؤه MainActivity.
cp -r "$ROOT/dist" "$OUT/work/assets/www"
aapt2 compile --dir "$ROOT/android/res" -o "$OUT/work/res.zip"

aapt2 link \
  -o "$OUT/work/base.apk" \
  --manifest "$ROOT/android/AndroidManifest.xml" \
  -I "$ANDROID_JAR" \
  -A "$OUT/work/assets" \
  --java "$OUT/work" \
  --auto-add-overlay \
  "$OUT/work/res.zip"

say "ترجمة شيفرة أندرويد"
# المحوّل dx 1.7 (وهو الوحيد المتاح خارج خوادم Google) لا يقرأ إلا شيفرة جافا 7،
# وjavac الحديث لا يولّدها. فيُستعمل javac 8 بهدف 1.7 — وهو بناء أندرويد الكلاسيكي.
"$JAVAC" -source 1.6 -target 1.6 -encoding UTF-8 -nowarn -Xlint:-options \
  -bootclasspath "$ANDROID_JAR" \
  -classpath "$ANDROID_JAR" \
  -d "$OUT/work/classes" \
  "$ROOT/android/java/pro/herfah/app/MainActivity.java" \
  "$OUT/work/pro/herfah/app/R.java"

say "التحويل إلى dex"
java -cp "$DX" com.android.dx.command.Main --dex \
  --output="$OUT/work/dex/classes.dex" "$OUT/work/classes"

say "تجميع الملف وتوقيعه"
cd "$OUT/work/dex" && zip -q "$OUT/work/base.apk" classes.dex && cd "$ROOT"

if [ ! -f "$KEYSTORE" ]; then
  echo "إنشاء مفتاح توقيع جديد في $KEYSTORE"
  keytool -genkeypair -v \
    -keystore "$KEYSTORE" -alias "$KEY_ALIAS" \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$KEY_PASS" -keypass "$KEY_PASS" \
    -dname "CN=Herfah Pro, OU=App, O=Herfah, L=, S=, C=DZ" >/dev/null 2>&1
fi

rm -f "$OUT/$APK_NAME.apk"
zipalign -p -f 4 "$OUT/work/base.apk" "$OUT/work/aligned.apk"
apksigner sign \
  --ks "$KEYSTORE" --ks-key-alias "$KEY_ALIAS" \
  --ks-pass "pass:$KEY_PASS" --key-pass "pass:$KEY_PASS" \
  --out "$OUT/$APK_NAME.apk" "$OUT/work/aligned.apk"

say "التحقّق من التوقيع"
apksigner verify --print-certs "$OUT/$APK_NAME.apk" | head -4

printf '\n\033[1mجاهز:\033[0m %s (%s)\n' "$OUT/$APK_NAME.apk" \
  "$(du -h "$OUT/$APK_NAME.apk" | cut -f1)"
