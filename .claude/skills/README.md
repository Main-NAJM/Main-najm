# مهارات Claude في هذا المستودع

## najm-software — برمجيات ناجم

عقد العمل الدائم لهذا المستودع. تُحمَّل تلقائيًا مع أي طلب بناء أو تعديل أو تصميم أو إصلاح،
وتحكم ثلاثة أمور: **كيف يُسأل ناجم** (لا سؤال تقنيًا — بطاقة قرار بنعم/لا فقط)،
**مستوى الجودة** (آبل)، و**التجاوب** (320px → 2560px، RTL، كل هاتف وحاسوب).

- **المسار:** `.claude/skills/najm-software/`
- **المراجع:** `apple-quality.md` · `responsive.md` · `decisions.md` · `workflow.md`

بوّابة الجودة الآلية قبل أي تسليم:

```bash
bash .claude/skills/najm-software/scripts/quality-gate.sh          # فحص كامل
bash .claude/skills/najm-software/scripts/quality-gate.sh --fast   # بلا بناء
```

تفحص الأنواع والبناء، وترصد الخصائص الاتجاهية، و`vh`، والعروض الثابتة، والألوان الخام،
و`:hover` بلا حماية، و`any`، و`outline: none`. الخروج: `0` نظيف · `1` مخالفات · `2` فشل بناء.

---

## ui-ux-pro-max

مهارة ذكاء تصميم UI/UX: قاعدة بيانات محلية قابلة للبحث (أنماط، لوحات ألوان، اقترانات خطوط،
إرشادات UX، مخططات بيانية، وإرشادات خاصة بكل تقنية).

- **المصدر:** https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- **الإصدار:** 2.13.0
- **الرخصة:** MIT (© NextLevelBuilder)
- **المسار الأصلي:** `.claude/skills/ui-ux-pro-max/` في مستودع المصدر (نُسخت كما هي)

### الاستخدام

سكربت البحث يحتاج Python 3 فقط (المكتبة القياسية، بدون أي اتصال بالشبكة):

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py --domain style "طلب البحث"
python3 .claude/skills/ui-ux-pro-max/scripts/search.py --domain color --max-results 3 "business app"
python3 .claude/skills/ui-ux-pro-max/scripts/search.py --stack react "form validation"
```

النطاقات المتاحة: `style`, `color`, `chart`, `landing`, `product`, `ux`, `typography`,
`icons`, `gsap`, `react`, `web`, `google-fonts`.

### التحديث

انسخ مجلد `.claude/skills/ui-ux-pro-max/` من أحدث إصدار في مستودع المصدر، أو استخدم:

```bash
npx ui-ux-pro-max-cli init --ai claude
```
