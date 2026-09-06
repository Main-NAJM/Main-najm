/** بيانات تجريبية تُزرع مرّة واحدة عند أول دخول في الوضع المحلي. */
import { addDays, todayIso } from '@/lib/format';
import { newId } from '@/lib/id';
import type { NewRecord } from './store';
import type {
  Appointment,
  Calculation,
  Debt,
  MarketPrice,
  Order,
  Profile,
} from '@/lib/types';

export const defaultProfile = (): Profile => ({
  businessName: 'ورشتي',
  ownerName: '',
  phone: '',
  address: '',
  userType: 'craftsman',
  craft: 'carpenter',
  currency: 'د.ع',
  defaultLaborRate: 5000,
  defaultMarginPct: 25,
  updatedAt: Date.now(),
});

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

export const seedMarketPrices = (): NewRecord<MarketPrice>[] => [
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
