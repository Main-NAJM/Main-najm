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
  Profile,
  ProductTemplate,
  UserType,
} from '@/lib/types';

export interface ProfileSeed {
  businessName?: string;
  phone?: string;
  userType?: UserType;
  craft?: Craft;
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
 * مؤشّر الأسعار: أسطر صنف المادة الذي يخصّ المهنة، وكلّها إن لم تُحدَّد مهنة.
 * حرفة «أخرى» لا مادة لها، فتبدأ الصفحة فارغة.
 */
export const seedMarketPrices = (craft?: Craft): NewRecord<MarketPrice>[] => {
  const rows = ALL_MARKET_PRICES();
  if (!craft) return rows;
  const material = tradeFor(craft).material;
  return material === 'other' ? [] : rows.filter((row) => row.kind === material);
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
];

/** قوالب المهنة المختارة، وكلّها إن لم تُحدَّد مهنة. */
export const seedProducts = (craft?: Craft): NewRecord<ProductTemplate>[] => {
  const rows = ALL_PRODUCTS();
  return craft ? rows.filter((row) => row.craft === craft) : rows;
};
