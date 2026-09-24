#!/usr/bin/env bash
# يبني ملف APK لموقع BOFAIDA ADS — بلا Gradle وبلا Android Studio.
#
# الموقع صفحة ساكنة، فلا بناء له: تُنسخ كما هي إلى assets، ويقدّمها النشاط
# على أصل https داخلي فيعمل التطبيق دون إنترنت من أول تشغيل.
#
# المتطلّبات (تُنزَّل أو تُثبَّت مرّة واحدة):
#   apt-get install -y android-sdk-build-tools android-sdk-platform-23
#   وjava، وecj وdx من مركز Maven (ينزّلهما السكربت).
#
# الاستعمال:  bash scripts/build-bofaida-apk.sh [مسار-ملف-المفاتيح]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE="$ROOT/bofaida"
SRC="$ROOT/android-bofaida"
OUT="$ROOT/build-apk-bofaida"
TOOLS="$OUT/tools"
ANDROID_JAR="/usr/lib/android-sdk/platforms/android-23/android.jar"
KEYSTORE="${1:-$OUT/bofaida.keystore}"
KEY_ALIAS="bofaida"
KEY_PASS="${BOFAIDA_KEY_PASS:-bofaida-ads}"
APK_NAME="bofaida-ads"
PKG_DIR="dz/bofaida/ads"

say() { printf '\n\033[1m› %s\033[0m\n' "$1"; }

# ------------------------------------------------------------------ تحقّق
say "التحقّق من الأدوات"
for tool in aapt2 zipalign apksigner keytool java zip; do
  command -v "$tool" >/dev/null || { echo "ينقص: $tool"; exit 1; }
done
[ -f "$ANDROID_JAR" ] || { echo "ينقص: $ANDROID_JAR"; exit 1; }

mkdir -p "$TOOLS"

# dx 1.7 هو المحوّل الوحيد إلى dex المتاح خارج خوادم Google، وهو لا يقرأ إلا
# شيفرة جافا 6. وjavac الحديث لا يولّد أقدم من جافا 8. فيُستعمل مترجم Eclipse:
# يعمل على أي JDK ويولّد ما يطلبه dx.
DX="$TOOLS/dx.jar"
ECJ="$TOOLS/ecj.jar"
[ -f "$DX" ] || curl -fsSL -o "$DX" \
  "https://repo.maven.apache.org/maven2/com/google/android/tools/dx/1.7/dx-1.7.jar"
[ -f "$ECJ" ] || curl -fsSL -o "$ECJ" \
  "https://repo.maven.apache.org/maven2/org/eclipse/jdt/ecj/3.33.0/ecj-3.33.0.jar"

# ------------------------------------------------------- تجهيز أصول الموقع
say "تجهيز صفحات الموقع"
rm -rf "$OUT/work"
mkdir -p "$OUT/work/classes" "$OUT/work/dex" "$OUT/work/assets/www"
# ما يخصّ المطوّر لا يدخل التطبيق: التوثيق، وسكربتات البناء، وصورة الشعار الخام.
(cd "$SITE" && find . -type f \
  ! -name '*.md' ! -name '*.mjs' ! -name '*.py' ! -name 'source-logo.png' \
  ! -path './proxy/*' -print0 | tar --null -cf - -T -) | tar -xf - -C "$OUT/work/assets/www"

# ------------------------------------------- تضمين الخطوط للعمل بلا إنترنت
say "تضمين الخطوط"
FONT_DIR="$OUT/work/assets/www/fonts"
mkdir -p "$FONT_DIR"
FONT_UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
curl -fsSL -A "$FONT_UA" \
  "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600&display=swap" \
  -o "$FONT_DIR/fonts.css"

python3 - "$FONT_DIR" <<'PY'
import os, re, subprocess, sys
font_dir = sys.argv[1]
css_path = os.path.join(font_dir, 'fonts.css')
css = open(css_path, encoding='utf-8').read()
urls = sorted(set(re.findall(r'url\((https://fonts\.gstatic\.com/[^)]+)\)', css)))
if not urls:
    sys.exit('لم يُعثر على ملفّات الخطّ في ورقة الأنماط.')
for url in urls:
    name = url.rsplit('/', 1)[-1]
    subprocess.run(['curl', '-fsSL', url, '-o', os.path.join(font_dir, name)], check=True)
    css = css.replace(url, name)
open(css_path, 'w', encoding='utf-8').write(css)
print(f'ضُمّن {len(urls)} ملفّ خطّ')
PY

# الصفحة تشير إلى Google Fonts؛ داخل التطبيق تشير إلى الورقة المضمّنة.
# وعامل الخدمة يُحذف: الأصول كلّها في الملف، وذاكرته قد تُبقي نسخة قديمة.
python3 - "$OUT/work/assets/www" <<'PY'
import os, re, sys
root = sys.argv[1]
path = os.path.join(root, 'index.html')
html = open(path, encoding='utf-8').read()
before = html
html = re.sub(r'\s*<link rel="preconnect"[^>]*fonts\.(googleapis|gstatic)\.com[^>]*/?>', '', html)
html = re.sub(
    r'\s*<link[^>]*fonts\.googleapis\.com/css2[^>]*/?>',
    '\n<link rel="stylesheet" href="/fonts/fonts.css">',
    html,
)
if html == before:
    sys.exit('لم يُستبدل رابط الخطّ — تغيّرت الصفحة.')
open(path, 'w', encoding='utf-8').write(html)
sw = os.path.join(root, 'sw.js')
if os.path.exists(sw):
    os.remove(sw)
print('رُبطت الصفحة بالخطّ المضمّن، وحُذف عامل الخدمة')
PY

# ------------------------------------------------------------ تجميع APK
say "تجميع الموارد"
aapt2 compile --dir "$SRC/res" -o "$OUT/work/res.zip"
aapt2 link \
  -o "$OUT/work/base.apk" \
  --manifest "$SRC/AndroidManifest.xml" \
  -I "$ANDROID_JAR" \
  -A "$OUT/work/assets" \
  --java "$OUT/work" \
  --auto-add-overlay \
  "$OUT/work/res.zip"

say "ترجمة شيفرة أندرويد"
java -jar "$ECJ" -source 1.6 -target 1.6 -nowarn -proc:none \
  -bootclasspath "$ANDROID_JAR" \
  -d "$OUT/work/classes" \
  "$SRC/java/$PKG_DIR/MainActivity.java" \
  "$OUT/work/$PKG_DIR/R.java"

java -cp "$DX" com.android.dx.command.Main \
  --dex --output="$OUT/work/dex/classes.dex" "$OUT/work/classes"

say "ضمّ الشيفرة إلى الحزمة"
(cd "$OUT/work/dex" && zip -q "$OUT/work/base.apk" classes.dex)

# --------------------------------------------------------- توقيع ومحاذاة
if [ ! -f "$KEYSTORE" ]; then
  say "توليد مفتاح توقيع"
  # مفتاح محلّي: يكفي لتثبيت التطبيق مباشرة. ولو أُريد نشره في متجر يوماً
  # فليكن المفتاح محفوظاً في مكان آمن — تغييره يمنع التحديث فوق المثبَّت.
  keytool -genkeypair -v -keystore "$KEYSTORE" -alias "$KEY_ALIAS" \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$KEY_PASS" -keypass "$KEY_PASS" \
    -dname "CN=BOFAIDA ADS, O=BOFAIDA ADS, L=Bordj Badji Mokhtar, C=DZ" >/dev/null
fi

say "محاذاة وتوقيع"
zipalign -f -p 4 "$OUT/work/base.apk" "$OUT/work/aligned.apk"
apksigner sign --ks "$KEYSTORE" --ks-key-alias "$KEY_ALIAS" \
  --ks-pass "pass:$KEY_PASS" --key-pass "pass:$KEY_PASS" \
  --out "$OUT/$APK_NAME.apk" "$OUT/work/aligned.apk"
apksigner verify "$OUT/$APK_NAME.apk"

printf '\n\033[1m✔ جاهز:\033[0m %s (%s)\n\n' \
  "$OUT/$APK_NAME.apk" "$(du -h "$OUT/$APK_NAME.apk" | cut -f1)"
