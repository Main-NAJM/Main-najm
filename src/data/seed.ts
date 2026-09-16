/**
 * محتوى البداية.
 *
 * نوعان مختلفان عمداً:
 * - محتوى مرجعي (قوالب التسعير ومؤشّر الأسعار) يُزرع لكل حساب جديد حسب مهنته،
 *   لأنه أرقام يعدّلها صاحب الورشة لا بيانات زبائن.
 * - بيانات تجريبية كاملة (طلبيات ومواعيد وديون) لا تُزرع تلقائياً لحساب حقيقي —
 *   فزبائن وهميون وديون وهمية في تطبيق عمل خطر — بل بطلب صريح من الإعدادات.
 */
import { addDays, todayIso } from '@/lib/format';
import { newId } from '@/lib/id';
import { tradeFor } from '@/lib/trades';
import type { NewRecord } from './store';
import type {
  Appointment,
  Calculation,
  Craft,
  Debt,
  MarketPrice,
  Order,
  PricingBasis,
  Profile,
  ProductTemplate,
  UserType,
} from '@/lib/types';

export interface ProfileSeed {
  businessName?: string;
  phone?: string;
  userType?: UserType;
  craft?: Craft;
  customCraft?: string;
  customMaterial?: string;
  customBasis?: PricingBasis;
}

/** ملف العمل الافتراضي، مبنيّ على ما سجّله صاحبه عند إنشاء الحساب. */
export const defaultProfile = (seed: ProfileSeed = {}): Profile => {
  const craft = seed.craft ?? 'carpenter';
  const userType = seed.userType ?? 'craftsman';
  const trade = tradeFor(craft);
  return {
    businessName: seed.businessName?.trim() || 'ورشتي',
    ownerName: seed.businessName?.trim() ?? '',
    phone: seed.phone ?? '',
    address: '',
    userType,
    craft,
    customCraft: seed.customCraft?.trim() ?? '',
    customMaterial: seed.customMaterial?.trim() ?? '',
    customBasis: seed.customBasis ?? 'unit',
    currency: 'د.ع',
    defaultLaborRate: userType === 'merchant' ? 0 : trade.defaultLaborRate,
    defaultMarginPct: userType === 'merchant' ? 15 : trade.defaultMarginPct,
    updatedAt: Date.now(),
  };
};

export const seedOrders = (): NewRecord<Order>[] => [
  {
    title: 'خزانة ملابس بابين',
    customerName: 'أبو أحمد',
    phone: '07700000001',
    address: 'حي الصناعة، الشارع الثاني',
    notes: 'خشب MDF لون بني غامق، مرايا على الباب الأيمن.',
    status: 'in_progress',
    items: [
      { name: 'ألواح MDF', qty: 6, unitPrice: 35000 },
      { name: 'مفصلات وأدراج', qty: 1, unitPrice: 40000 },
    ],
    extraCharges: 60000,
    discount: 10000,
    paid: 150000,
    dueDate: addDays(todayIso(), 6),
  },
  {
    title: 'باب حديد للمخزن',
    customerName: 'شركة النور',
    phone: '07700000002',
    address: 'المنطقة الصناعية، مخزن ٤',
    notes: 'قياس ٢٢٠×١٢٠ سم مع قفل ثقيل.',
    status: 'pending',
    items: [{ name: 'حديد مقاطع', qty: 1, unitPrice: 220000 }],
    extraCharges: 45000,
    discount: 0,
    paid: 0,
    dueDate: addDays(todayIso(), 14),
  },
  {
    title: 'تفصيل ١٠ بدلات عمل',
    customerName: 'مطعم السنابل',
    phone: '07700000003',
    address: 'شارع المطاعم',
    notes: 'قماش قطن، تطريز الاسم على الجيب.',
    status: 'completed',
    items: [{ name: 'بدلة عمل', qty: 10, unitPrice: 22000 }],
    extraCharges: 0,
    discount: 20000,
    paid: 200000,
    dueDate: addDays(todayIso(), -3),
  },
];

export const seedAppointments = (): NewRecord<Appointment>[] => [
  {
    title: 'أخذ قياسات الخزانة',
    date: todayIso(),
    time: '10:00',
    durationMin: 60,
    customerName: 'أبو أحمد',
    phone: '07700000001',
    location: 'بيت الزبون',
    notes: 'أخذ القياسات النهائية قبل القص.',
    orderId: null,
    done: false,
  },
  {
    title: 'تسليم بدلات المطعم',
    date: addDays(todayIso(), 1),
    time: '17:30',
    durationMin: 30,
    customerName: 'مطعم السنابل',
    phone: '07700000003',
    location: 'شارع المطاعم',
    notes: '',
    orderId: null,
    done: false,
  },
];

export const seedCalculations = (): NewRecord<Calculation>[] => [
  {
    title: 'تسعير خزانة بابين',
    materials: [
      { name: 'ألواح MDF', qty: 6, unitPrice: 35000 },
      { name: 'إكسسوارات', qty: 1, unitPrice: 40000 },
    ],
    laborHours: 14,
    laborRate: 5000,
    overhead: 25000,
    wastePct: 7,
    marginPct: 25,
    materialsCost: 267500,
    laborCost: 70000,
    totalCost: 362500,
    profit: 90625,
    suggestedPrice: 453125,
    notes: 'يشمل التركيب في بيت الزبون.',
  },
];

const ALL_MARKET_PRICES = (): NewRecord<MarketPrice>[] => [
  {
    kind: 'wood',
    name: 'لوح MDF ١٨ ملم',
    unit: 'لوح',
    price: 35000,
    previousPrice: 32000,
    source: 'سوق المواد الإنشائية',
    priceDate: todayIso(),
  },
  {
    kind: 'wood',
    name: 'خشب زان',
    unit: 'متر مكعّب',
    price: 950000,
    previousPrice: 980000,
    source: 'مستورد محلي',
    priceDate: todayIso(),
  },
  {
    kind: 'iron',
    name: 'حديد تسليح ١٢ ملم',
    unit: 'طن',
    price: 850000,
    previousPrice: 820000,
    source: 'معمل الحديد',
    priceDate: todayIso(),
  },
  {
    kind: 'iron',
    name: 'مقطع حديد مربّع',
    unit: 'متر',
    price: 9000,
    previousPrice: 9000,
    source: 'سوق الحدادين',
    priceDate: todayIso(),
  },
  {
    kind: 'fabric',
    name: 'قماش قطن',
    unit: 'متر',
    price: 7000,
    previousPrice: 6500,
    source: 'سوق الأقمشة',
    priceDate: todayIso(),
  },
  {
    kind: 'fabric',
    name: 'قماش جبردين',
    unit: 'متر',
    price: 11000,
    previousPrice: 11500,
    source: 'سوق الأقمشة',
    priceDate: todayIso(),
  },
  {
    kind: 'aluminium',
    name: 'مقطع ألمنيوم',
    unit: 'متر',
    price: 1400,
    previousPrice: 1300,
    source: 'موزّع الألمنيوم',
    priceDate: todayIso(),
  },
  {
    kind: 'glass',
    name: 'زجاج ٤ ملم',
    unit: 'متر مربّع',
    price: 2200,
    previousPrice: 2200,
    source: 'محل الزجاج',
    priceDate: todayIso(),
  },
  {
    kind: 'glass',
    name: 'زجاج مزدوج',
    unit: 'متر مربّع',
    price: 6500,
    previousPrice: 6200,
    source: 'محل الزجاج',
    priceDate: todayIso(),
  },
  {
    kind: 'building',
    name: 'كيس إسمنت ٥٠ كغ',
    unit: 'كيس',
    price: 850,
    previousPrice: 800,
    source: 'تاجر مواد البناء',
    priceDate: todayIso(),
  },
  {
    kind: 'building',
    name: 'رمل',
    unit: 'متر مكعّب',
    price: 2500,
    previousPrice: 2500,
    source: 'مقلع الرمل',
    priceDate: todayIso(),
  },
  {
    kind: 'building',
    name: 'آجر',
    unit: 'ألف طوبة',
    price: 14000,
    previousPrice: 13000,
    source: 'معمل الآجر',
    priceDate: todayIso(),
  },
  {
    kind: 'parts',
    name: 'زيت محرّك ٥ لتر',
    unit: 'علبة',
    price: 4200,
    previousPrice: 3900,
    source: 'موزّع قطع الغيار',
    priceDate: todayIso(),
  },
  {
    kind: 'parts',
    name: 'فلتر زيت',
    unit: 'قطعة',
    price: 700,
    previousPrice: 700,
    source: 'موزّع قطع الغيار',
    priceDate: todayIso(),
  },
  {
    kind: 'parts',
    name: 'طقم فرامل أمامي',
    unit: 'طقم',
    price: 5500,
    previousPrice: 5200,
    source: 'موزّع قطع الغيار',
    priceDate: todayIso(),
  },
];

export const seedDebts = (): NewRecord<Debt>[] => [
  {
    customerName: 'أبو أحمد',
    phone: '07700000001',
    address: 'حي الصناعة، الشارع الثاني',
    goods: 'خزانة ملابس بابين',
    amount: 300000,
    payments: [
      { id: newId(), amount: 150000, date: addDays(todayIso(), -10), note: 'عربون' },
    ],
    dueDate: addDays(todayIso(), 6),
    notes: '',
  },
  {
    customerName: 'شركة النور',
    phone: '07700000002',
    address: 'المنطقة الصناعية، مخزن ٤',
    goods: 'باب حديد',
    amount: 265000,
    payments: [],
    dueDate: addDays(todayIso(), -2),
    notes: 'يُراجع المحاسب يوم الخميس.',
  },
];

/**
 * مؤشّر الأسعار: أسطر أصناف المواد التي تخصّ المهنة، وكلّها إن لم تُحدَّد مهنة.
 * المهنة المكتوبة يدوياً لا أسعار جاهزة لها — إلا سطراً باسم مادّتها إن سمّاها
 * صاحبها، ليجد الصفحة مبدوءة لا فارغة.
 */
export const seedMarketPrices = (
  craft?: Craft,
  customMaterial?: string,
): NewRecord<MarketPrice>[] => {
  const rows = ALL_MARKET_PRICES();
  if (!craft) return rows;
  if (craft === 'other') {
    const name = customMaterial?.trim();
    if (!name) return [];
    return [
      {
        kind: 'other',
        name,
        unit: 'وحدة',
        price: 0,
        previousPrice: null,
        source: '',
        priceDate: todayIso(),
      },
    ];
  }
  const materials = tradeFor(craft).materials;
  return rows.filter((row) => materials.includes(row.kind));
};

/** قوالب منتجات شائعة لكل حرفة — نقطة انطلاق يعدّلها صاحب الورشة. */
const ALL_PRODUCTS = (): NewRecord<ProductTemplate>[] => [
  {
    name: 'باب خشب داخلي',
    craft: 'carpenter',
    basis: 'area',
    unitPrice: 45000,
    density: 0,
    wastePct: 8,
    fittings: 25000,
    labor: 30000,
    marginPct: 25,
    defaultWidth: 90,
    defaultHeight: 210,
    defaultDepth: 0,
    notes: 'السعر للمتر المربّع، والإكسسوارات تشمل المفصّلات والقفل.',
  },
  {
    name: 'خزانة ملابس',
    craft: 'carpenter',
    basis: 'area',
    unitPrice: 60000,
    density: 0,
    wastePct: 10,
    fittings: 40000,
    labor: 70000,
    marginPct: 25,
    defaultWidth: 200,
    defaultHeight: 240,
    defaultDepth: 60,
    notes: 'يُحسب بمساحة الواجهة.',
  },
  {
    name: 'باب حديد',
    craft: 'blacksmith',
    basis: 'area',
    unitPrice: 38000,
    density: 0,
    wastePct: 6,
    fittings: 20000,
    labor: 35000,
    marginPct: 22,
    defaultWidth: 120,
    defaultHeight: 220,
    defaultDepth: 0,
    notes: '',
  },
  {
    name: 'دربزين حديد',
    craft: 'blacksmith',
    basis: 'length',
    unitPrice: 22000,
    density: 0,
    wastePct: 5,
    fittings: 0,
    labor: 12000,
    marginPct: 20,
    defaultWidth: 300,
    defaultHeight: 0,
    defaultDepth: 0,
    notes: 'السعر للمتر الطولي.',
  },
  {
    name: 'ستارة قماش',
    craft: 'tailor',
    basis: 'area',
    unitPrice: 7000,
    density: 0,
    wastePct: 12,
    fittings: 8000,
    labor: 10000,
    marginPct: 30,
    defaultWidth: 200,
    defaultHeight: 260,
    defaultDepth: 0,
    notes: 'الهالك أعلى بسبب الكسرات والحاشية.',
  },
  {
    name: 'بدلة عمل',
    craft: 'tailor',
    basis: 'unit',
    unitPrice: 18000,
    density: 0,
    wastePct: 0,
    fittings: 2000,
    labor: 6000,
    marginPct: 28,
    defaultWidth: 0,
    defaultHeight: 0,
    defaultDepth: 0,
    notes: 'تسعير بالقطعة لا بالمقاس.',
  },
  {
    name: 'نافذة ألمنيوم',
    craft: 'aluminium',
    basis: 'area',
    unitPrice: 14000,
    density: 0,
    wastePct: 7,
    fittings: 6000,
    labor: 9000,
    marginPct: 24,
    defaultWidth: 120,
    defaultHeight: 100,
    defaultDepth: 0,
    notes: 'السعر للمتر المربّع شاملاً المقطع والزجاج. الإكسسوارات: بكرات ومقابض.',
  },
  {
    name: 'باب ألمنيوم بزجاج',
    craft: 'aluminium',
    basis: 'area',
    unitPrice: 17000,
    density: 0,
    wastePct: 8,
    fittings: 12000,
    labor: 14000,
    marginPct: 24,
    defaultWidth: 90,
    defaultHeight: 210,
    defaultDepth: 0,
    notes: 'الإكسسوارات تشمل القفل والمفصّلات ومغلاق الباب.',
  },
  {
    name: 'واجهة زجاجية',
    craft: 'aluminium',
    basis: 'area',
    unitPrice: 22000,
    density: 0,
    wastePct: 6,
    fittings: 0,
    labor: 12000,
    marginPct: 22,
    defaultWidth: 300,
    defaultHeight: 250,
    defaultDepth: 0,
    notes: 'زجاج سميك على هيكل ألمنيوم — يُسعّر بمساحة الواجهة.',
  },
  {
    name: 'تغيير زيت وفلتر',
    craft: 'mechanic',
    basis: 'unit',
    unitPrice: 4900,
    density: 0,
    wastePct: 0,
    fittings: 0,
    labor: 2000,
    marginPct: 30,
    defaultWidth: 0,
    defaultHeight: 0,
    defaultDepth: 0,
    notes: 'سعر الوحدة = الزيت والفلتر. الأجرة أجرة اليد.',
  },
  {
    name: 'تصليح الفرامل',
    craft: 'mechanic',
    basis: 'unit',
    unitPrice: 5500,
    density: 0,
    wastePct: 0,
    fittings: 1000,
    labor: 4000,
    marginPct: 30,
    defaultWidth: 0,
    defaultHeight: 0,
    defaultDepth: 0,
    notes: 'الطقم الأمامي. الإكسسوارات: سائل الفرامل.',
  },
  {
    name: 'تشخيص العطب',
    craft: 'mechanic',
    basis: 'unit',
    unitPrice: 0,
    density: 0,
    wastePct: 0,
    fittings: 0,
    labor: 2500,
    marginPct: 0,
    defaultWidth: 0,
    defaultHeight: 0,
    defaultDepth: 0,
    notes: 'أجرة عمل فقط بلا قطع.',
  },
  {
    name: 'بناء جدار آجر',
    craft: 'builder',
    basis: 'area',
    unitPrice: 3800,
    density: 0,
    wastePct: 8,
    fittings: 0,
    labor: 2200,
    marginPct: 18,
    defaultWidth: 400,
    defaultHeight: 280,
    defaultDepth: 0,
    notes: 'السعر للمتر المربّع: آجر وإسمنت ورمل. الأجرة أجرة البناء.',
  },
  {
    name: 'صبّ خرسانة',
    craft: 'builder',
    basis: 'volume',
    unitPrice: 62000,
    density: 0,
    wastePct: 5,
    fittings: 0,
    labor: 18000,
    marginPct: 18,
    defaultWidth: 400,
    defaultHeight: 20,
    defaultDepth: 400,
    notes: 'السعر للمتر المكعّب. الارتفاع هنا سماكة الصبّة.',
  },
];

/**
 * قالب البداية لمهنة كتبها صاحبها بنفسه: باسم مهنته، وبطريقة التسعير التي
 * اختارها، وبأرقام صفرية يملؤها هو — فلا نخترع له سعراً لا نعرفه.
 */
export const seedCustomProduct = (
  name: string,
  basis: PricingBasis,
  marginPct: number,
): NewRecord<ProductTemplate>[] => {
  const trimmed = name.trim();
  if (!trimmed) return [];
  return [
    {
      name: trimmed,
      craft: 'other',
      basis,
      unitPrice: 0,
      density: 0,
      wastePct: 0,
      fittings: 0,
      labor: 0,
      marginPct,
      defaultWidth: basis === 'unit' ? 0 : 100,
      defaultHeight: basis === 'area' || basis === 'volume' || basis === 'weight' ? 100 : 0,
      defaultDepth: basis === 'volume' || basis === 'weight' ? 10 : 0,
      notes: 'قالب بداية — ضع فيه سعر وحدتك وأجرتك ونسبة ربحك.',
    },
  ];
};

/** قوالب المهنة المختارة، وكلّها إن لم تُحدَّد مهنة. */
export const seedProducts = (craft?: Craft): NewRecord<ProductTemplate>[] => {
  const rows = ALL_PRODUCTS();
  return craft ? rows.filter((row) => row.craft === craft) : rows;
};
