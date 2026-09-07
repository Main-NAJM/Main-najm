/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  كتالوج المنتجات — هذا هو الملف الوحيد الذي تحتاج تعديله لإضافة منتجاتك.
 *  PRODUCT CATALOGUE — the only file you need to edit to list your products.
 *
 *  المنتجات أدناه أمثلة توضيحية (placeholders) لعرض شكل الموقع.
 *  استبدلها بمنتجاتك الحقيقية من متجر Payhip: افتح صفحة المنتج، انسخ رابطها،
 *  وضعه في الحقل url. أي منتج بلا رابط سيفتح صفحة المتجر الرئيسية.
 *
 *  The items below are sample placeholders. Replace them with your real
 *  Payhip products: open the product page, copy its URL into `url`.
 *  Any product without a URL falls back to the main store page.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** الفئات — id يجب أن يطابق حقل category في المنتجات. */
window.CATEGORIES = [
  { id: 'ebooks', icon: 'book', ar: 'كتب إلكترونية', en: 'Ebooks' },
  { id: 'templates', icon: 'template', ar: 'قوالب', en: 'Templates' },
  { id: 'design', icon: 'design', ar: 'تصاميم', en: 'Design assets' },
  { id: 'courses', icon: 'play', ar: 'دورات', en: 'Courses' },
];

window.PRODUCTS = [
  {
    id: 'sample-ebook-productivity',
    category: 'ebooks',
    url: '',
    price: 9,
    image: '',
    badge: { ar: 'الأكثر مبيعاً', en: 'Bestseller' },
    name: { ar: 'دليل الإنتاجية العملي', en: 'The Practical Productivity Guide' },
    desc: {
      ar: 'كتاب مختصر يشرح نظاماً بسيطاً لترتيب المهام اليومية وإنجازها دون إرهاق، مع نماذج جاهزة للتطبيق من أول يوم.',
      en: 'A short book laying out a simple system for organising and finishing daily tasks without burning out, with ready-made worksheets.',
    },
    includes: [
      { ar: 'ملف PDF مُنسّق (٩٦ صفحة)', en: 'Formatted PDF (96 pages)' },
      { ar: 'نسخة EPUB للقراءة على الهاتف', en: 'EPUB version for phone reading' },
      { ar: 'أوراق عمل قابلة للطباعة', en: 'Printable worksheets' },
    ],
  },
  {
    id: 'sample-ebook-freelance',
    category: 'ebooks',
    url: '',
    price: 12,
    image: '',
    badge: null,
    name: { ar: 'ابدأ العمل الحر', en: 'Start Freelancing' },
    desc: {
      ar: 'خطوات عملية لبناء ملف أعمال، تسعير خدماتك، والتعامل مع العملاء الأوائل — مبنية على تجارب واقعية.',
      en: 'Practical steps to build a portfolio, price your services and handle your first clients — drawn from real experience.',
    },
    includes: [
      { ar: 'ملف PDF (١٤٠ صفحة)', en: 'PDF (140 pages)' },
      { ar: 'نماذج عقود وعروض أسعار', en: 'Contract and quote templates' },
    ],
  },
  {
    id: 'sample-template-invoice',
    category: 'templates',
    url: '',
    price: 7,
    image: '',
    badge: null,
    name: { ar: 'قوالب فواتير عربية', en: 'Arabic Invoice Templates' },
    desc: {
      ar: 'مجموعة فواتير وكشوف حساب بتنسيق عربي من اليمين لليسار، جاهزة للطباعة ومفتوحة للتعديل.',
      en: 'A set of right-to-left Arabic invoices and account statements, print-ready and fully editable.',
    },
    includes: [
      { ar: '١٢ قالباً بصيغة Excel و Word', en: '12 templates in Excel and Word' },
      { ar: 'نسخ PDF جاهزة للطباعة', en: 'Print-ready PDF versions' },
    ],
  },
  {
    id: 'sample-template-cv',
    category: 'templates',
    url: '',
    price: 5,
    image: '',
    badge: { ar: 'جديد', en: 'New' },
    name: { ar: 'قوالب سيرة ذاتية', en: 'CV Templates Pack' },
    desc: {
      ar: 'قوالب سيرة ذاتية أنيقة تدعم العربية والإنجليزية، بتنسيق واضح يمر بأنظمة الفرز الآلي.',
      en: 'Clean CV templates supporting Arabic and English, formatted to pass applicant tracking systems.',
    },
    includes: [
      { ar: '٨ قوالب Word و Google Docs', en: '8 Word and Google Docs templates' },
      { ar: 'دليل كتابة السيرة الذاتية', en: 'CV writing guide' },
    ],
  },
  {
    id: 'sample-template-notion',
    category: 'templates',
    url: '',
    price: 15,
    image: '',
    badge: null,
    name: { ar: 'لوحة إدارة المشاريع', en: 'Project Management Dashboard' },
    desc: {
      ar: 'قالب متكامل لإدارة المشاريع والمهام والعملاء في مكان واحد، مع لوحات متابعة جاهزة.',
      en: 'A complete template for managing projects, tasks and clients in one place, with ready dashboards.',
    },
    includes: [
      { ar: 'قالب جاهز للنسخ', en: 'One-click duplicate template' },
      { ar: 'شرح فيديو للإعداد', en: 'Video walkthrough' },
    ],
  },
  {
    id: 'sample-design-social',
    category: 'design',
    url: '',
    price: 14,
    image: '',
    badge: null,
    name: { ar: 'حزمة تصاميم سوشيال ميديا', en: 'Social Media Design Pack' },
    desc: {
      ar: 'تصاميم منشورات وقصص بمقاسات المنصات الشائعة، بخطوط عربية واضحة وألوان قابلة للتغيير.',
      en: 'Post and story designs at the common platform sizes, with clear Arabic type and swappable colours.',
    },
    includes: [
      { ar: '٤٠ تصميماً بصيغة PSD و Canva', en: '40 designs in PSD and Canva' },
      { ar: 'ملفات الخطوط المستخدمة', en: 'The fonts used' },
    ],
  },
  {
    id: 'sample-design-logo',
    category: 'design',
    url: '',
    price: 0,
    image: '',
    badge: { ar: 'مجاني', en: 'Free' },
    name: { ar: 'عيّنة أيقونات مجانية', en: 'Free Icon Sample' },
    desc: {
      ar: 'عيّنة من مجموعة الأيقونات بصيغة SVG، لتجربة الجودة قبل شراء الحزمة الكاملة.',
      en: 'A sample of the icon set in SVG, so you can judge the quality before buying the full pack.',
    },
    includes: [
      { ar: '٣٠ أيقونة SVG', en: '30 SVG icons' },
      { ar: 'رخصة استخدام شخصي', en: 'Personal-use licence' },
    ],
  },
  {
    id: 'sample-course-design',
    category: 'courses',
    url: '',
    price: 29,
    image: '',
    badge: null,
    name: { ar: 'دورة أساسيات التصميم', en: 'Design Fundamentals Course' },
    desc: {
      ar: 'دورة مصوّرة تشرح أساسيات التكوين والألوان والخطوط، بتمارين تطبيقية بعد كل درس.',
      en: 'A video course covering composition, colour and typography basics, with an exercise after each lesson.',
    },
    includes: [
      { ar: '٢٤ درساً مصوّراً', en: '24 video lessons' },
      { ar: 'ملفات التمارين', en: 'Exercise files' },
      { ar: 'وصول مدى الحياة', en: 'Lifetime access' },
    ],
  },
];
