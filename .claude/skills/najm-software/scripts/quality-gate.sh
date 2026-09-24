#!/usr/bin/env bash
# بوّابة الجودة — برمجيات ناجم
#
# تفحص ما يمكن فحصه آليًا قبل التسليم: الأنواع، البناء، ومخالفات التجاوب/RTL/الجودة
# الشائعة. لا تغني عن الفحص اليدوي في المتصفح (راجع references/responsive.md §10).
#
#   bash .claude/skills/najm-software/scripts/quality-gate.sh          # فحص كامل
#   bash .claude/skills/najm-software/scripts/quality-gate.sh --fast   # بلا بناء
#
# الخروج: 0 نظيف أو تحذيرات فقط · 1 مخالفات صارمة · 2 فشل أنواع/بناء

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
cd "$ROOT" || exit 2

FAST=0
[[ "${1:-}" == "--fast" ]] && FAST=1

RED=$'\033[31m'; YEL=$'\033[33m'; GRN=$'\033[32m'; DIM=$'\033[2m'; OFF=$'\033[0m'
[[ -t 1 ]] || { RED=""; YEL=""; GRN=""; DIM=""; OFF=""; }

ERRORS=0
WARNINGS=0

# يجمع ملفات المصدر المتتبَّعة في git، مع تجاهل المهارات والمخرجات والاعتماديات
sources() {
  local pattern="$1"
  git ls-files -z -- "$pattern" 2>/dev/null \
    | tr '\0' '\n' \
    | grep -Ev '(^|/)(node_modules|dist|build|\.claude|public/vendor)/' \
    || true
}

# فحص: النمط، الوصف، الشدّة (error|warn)، الملفات، واستثناء اختياري
check() {
  local pattern="$1" label="$2" severity="$3" glob="$4" exclude="${5:-}"
  local files hits

  files="$(sources "$glob")"
  [[ -z "$files" ]] && return 0

  hits="$(printf '%s\n' "$files" | xargs -d '\n' grep -nEI -- "$pattern" 2>/dev/null || true)"
  [[ -n "$exclude" && -n "$hits" ]] && hits="$(printf '%s\n' "$hits" | grep -Ev -- "$exclude" || true)"
  [[ -z "$hits" ]] && return 0

  local count
  count="$(printf '%s\n' "$hits" | grep -c . || true)"

  if [[ "$severity" == "error" ]]; then
    printf '%s✗%s %s %s(%s)%s\n' "$RED" "$OFF" "$label" "$DIM" "$count" "$OFF"
    ERRORS=$((ERRORS + count))
  else
    printf '%s!%s %s %s(%s)%s\n' "$YEL" "$OFF" "$label" "$DIM" "$count" "$OFF"
    WARNINGS=$((WARNINGS + count))
  fi
  printf '%s\n' "$hits" | head -8 | sed "s/^/    ${DIM}/;s/$/${OFF}/"
  [[ "$count" -gt 8 ]] && printf '    %s… و%s أخرى%s\n' "$DIM" "$((count - 8))" "$OFF"
  return 0
}

# فحص واعٍ بالأقواس: يُبلّغ عن النمط فقط حين يكون خارج كتلة @media معيّنة.
# السبب: القاعدة داخل حارسها ليست مخالفة، والبوّابة التي تصرخ بلا سبب
# يتعلّم المرء تجاهلها — فتفقد قيمتها كلّها.
#   $1 نمط المخالفة · $2 نمط سطر @media الحارس · $3 الوصف
check_outside_media() {
  local pattern="$1" guard_pattern="$2" label="$3"
  local files hits count

  files="$(sources '*.css')"
  [[ -z "$files" ]] && return 0

  hits="$(printf '%s\n' "$files" | xargs -d '\n' awk \
    -v pat="$pattern" -v guardpat="$guard_pattern" '
    FNR == 1 { depth = 0; guard = -1 }
    {
      line = $0
      is_media = (line ~ /^[[:space:]]*@media/)
      opens_guard = (is_media && line ~ guardpat)

      if (!is_media && guard < 0 && line ~ pat)
        printf "%s:%d:%s\n", FILENAME, FNR, line

      n = gsub(/\{/, "{", line)
      m = gsub(/\}/, "}", line)

      for (i = 0; i < n; i++) {
        depth++
        if (opens_guard && guard < 0) { guard = depth; opens_guard = 0 }
      }
      for (i = 0; i < m; i++) {
        if (guard == depth) guard = -1
        depth--
      }
    }
  ' 2>/dev/null || true)"

  [[ -z "$hits" ]] && return 0
  count="$(printf '%s\n' "$hits" | grep -c . || true)"
  printf '%s!%s %s %s(%s)%s\n' "$YEL" "$OFF" "$label" "$DIM" "$count" "$OFF"
  WARNINGS=$((WARNINGS + count))
  printf '%s\n' "$hits" | head -8 | sed "s/^/    ${DIM}/;s/$/${OFF}/"
  [[ "$count" -gt 8 ]] && printf '    %s… و%s أخرى%s\n' "$DIM" "$((count - 8))" "$OFF"
  return 0
}

echo
echo "── بوّابة الجودة ──────────────────────────────"
echo "${DIM}${ROOT}${OFF}"
echo

# ─── 1. الأنواع والبناء ────────────────────────────────────────────────────
if [[ -f package.json ]] && [[ ! -d node_modules ]]; then
  echo "${YEL}!${OFF} node_modules غير مثبّتة — شغّل ${DIM}npm install${OFF} ثم أعد الفحص"
  WARNINGS=$((WARNINGS + 1))
elif [[ -f package.json ]] && command -v npm >/dev/null 2>&1; then
  echo "${DIM}فحص الأنواع…${OFF}"
  if ! npm run --silent lint >/tmp/najm-typecheck.log 2>&1; then
    echo "${RED}✗ فشل فحص الأنواع${OFF}"
    tail -25 /tmp/najm-typecheck.log | sed 's/^/    /'
    exit 2
  fi
  echo "${GRN}✓${OFF} الأنواع سليمة"

  if [[ "$FAST" -eq 0 ]]; then
    echo "${DIM}البناء…${OFF}"
    if ! npm run --silent build >/tmp/najm-build.log 2>&1; then
      echo "${RED}✗ فشل البناء${OFF}"
      tail -25 /tmp/najm-build.log | sed 's/^/    /'
      exit 2
    fi
    echo "${GRN}✓${OFF} البناء نجح"
  else
    echo "${DIM}· تخطّي البناء (--fast)${OFF}"
  fi
else
  echo "${YEL}!${OFF} لا يوجد package.json أو npm — تخطّي الأنواع والبناء"
fi
echo

# ─── 2. RTL والخصائص المنطقية ──────────────────────────────────────────────
echo "${DIM}RTL والتجاوب…${OFF}"

check '(^|[^-a-z])(margin|padding)-(left|right)[[:space:]]*:' \
  'خصائص هامش/حشو اتجاهية — استخدم margin-inline-start / padding-inline-end' \
  error '*.css'

check '(^|[^-a-z])border-(left|right)[[:space:]]*(:|-)' \
  'حدّ اتجاهي — استخدم border-inline-start / border-inline-end' \
  error '*.css'

check 'text-align[[:space:]]*:[[:space:]]*(left|right)' \
  'محاذاة اتجاهية — استخدم text-align: start / end' \
  error '*.css'

check '(^|[^-a-z])(left|right)[[:space:]]*:[[:space:]]*[^;]' \
  'تموضع اتجاهي — استخدم inset-inline-start / inset-inline-end' \
  error '*.css'

check '[0-9](\.[0-9]+)?vh([^a-z]|$)' \
  'وحدة vh — استخدم dvh أو svh (شريط متصفح الجوال يكسر vh)' \
  error '*.css'

# عرض ثابت داخل @media (min-width: …) لا يطال الشاشات الضيّقة أصلًا
check_outside_media '(^|[^-a-z])(min-)?width[[:space:]]*:[[:space:]]*[0-9]{3,}px' \
  'min-width' \
  'عرض ثابت كبير — قد يُنتج تمريرًا أفقيًا على 320px'

check_outside_media ':hover' 'hover[[:space:]]*:[[:space:]]*hover' \
  ':hover خارج @media (hover: hover) — يعلق بعد اللمس على الجوال'

echo

# ─── 3. الرموز والتصميم ────────────────────────────────────────────────────
echo "${DIM}الرموز والتصميم…${OFF}"

check '#[0-9a-fA-F]{3,8}([^0-9a-fA-F]|$)' \
  'لون خام خارج global.css — أضف رمزًا في src/styles/global.css' \
  error '*.css' '(styles/global\.css|/vendor/)'

# داخل prefers-reduced-motion و@media print الـ !important هو الاستخدام
# الصحيح — لا بدّ له من كسر كل ما سبقه. خارجهما يبقى رائحة كود.
check_outside_media '!important' 'prefers-reduced-motion|print' \
  '!important — يُسمح به فقط لتجاوز مكتبة خارجية، مع تعليق'

# استثناء واحد معلن: سطر يكتب بديله إلى جانبه، هكذا:
#   outline: none; /* بديل: .input-wrap:focus-within */
# يعني أن الحلقة انتقلت إلى عنصر أعلى لا أنها أُلغيت — وهو ما يقع حين يحمل
# الغلاف الإطار ويحمل معه الحلقة. وأيّ outline: none بلا بديل مكتوب يبقى مخالفة.
check 'outline[[:space:]]*:[[:space:]]*(none|0)' \
  'outline: none — يكسر التنقّل بلوحة المفاتيح ما لم يوجد بديل :focus-visible' \
  error '*.css' '/\* بديل: '

if ! grep -q 'prefers-reduced-motion' src/styles/global.css 2>/dev/null; then
  echo "${YEL}!${OFF} لا يوجد @media (prefers-reduced-motion) في global.css"
  WARNINGS=$((WARNINGS + 1))
fi

if [[ -f index.html ]] && ! grep -q 'viewport-fit=cover' index.html; then
  echo "${RED}✗${OFF} index.html بلا viewport-fit=cover — المناطق الآمنة معطّلة"
  ERRORS=$((ERRORS + 1))
fi

echo

# ─── 4. نظافة الكود ────────────────────────────────────────────────────────
echo "${DIM}الكود…${OFF}"

for g in '*.ts' '*.tsx'; do
  check '(:[[:space:]]*any([^a-zA-Z]|$)|as[[:space:]]+any([^a-zA-Z]|$))' \
    "any في $g — استخدم unknown مع تضييق، أو عرّف النوع" error "$g"
  check '@ts-(ignore|expect-error|nocheck)' \
    "تعطيل فحص الأنواع في $g" error "$g"
  check 'console\.(log|debug)' \
    "console.log متروك في $g" warn "$g"
  check '(^|[^A-Za-z])(TODO|FIXME)([^A-Za-z]|$)' \
    "علامة عمل ناقص في $g — «بالتفصيل» تعني بلا TODO" error "$g"
  check 'style=\{\{' \
    "نمط سطري في $g — انقله إلى CSS ما لم يكن محسوبًا وقت التشغيل" warn "$g"
done

echo

# ─── الخلاصة ───────────────────────────────────────────────────────────────
echo "──────────────────────────────────────────────"
if [[ "$ERRORS" -gt 0 ]]; then
  echo "${RED}✗ $ERRORS مخالفة صارمة${OFF}${WARNINGS:+ · $WARNINGS تحذير}"
  echo "${DIM}أصلحها قبل التسليم. التفاصيل في references/responsive.md و apple-quality.md${OFF}"
  echo
  exit 1
fi

if [[ "$WARNINGS" -gt 0 ]]; then
  echo "${YEL}✓ بلا مخالفات صارمة · $WARNINGS تحذير — راجعها${OFF}"
else
  echo "${GRN}✓ نظيف${OFF}"
fi

echo
echo "${DIM}يبقى الفحص اليدوي: 320 · 390 · 768 · 1280px، الحالات الأربع،"
echo "لوحة المفاتيح، الوضع الداكن. راجع references/responsive.md §10${OFF}"
echo
exit 0
