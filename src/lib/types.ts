/** أنواع البيانات الأساسية في تطبيق حرفة برو. */

export type UserType = 'craftsman' | 'merchant';

/**
 * المهنة. 'other' ليست حرفة بعينها بل بابٌ مفتوح: يكتب صاحبها اسم مهنته ومادّته
 * وطريقة تسعيره في ‎Profile.customCraft/customMaterial/customBasis‎، فيعمل التطبيق
 * بها كما يعمل بالحرف المعروفة.
 */
export type Craft =
  | 'carpenter'
  | 'blacksmith'
  | 'aluminium'
  | 'mechanic'
  | 'builder'
  | 'tailor'
  | 'other';

export type OrderStatus = 'in_progress' | 'pending' | 'completed';

export type MaterialKind =
  | 'wood'
  | 'iron'
  | 'aluminium'
  | 'glass'
  | 'fabric'
  | 'building'
  | 'parts'
  | 'other';

/**
 * أساس تسعير المنتج: ما الذي يُضرب فيه سعر الوحدة.
 * area  — المتر المربّع (عرض × ارتفاع): أبواب، نوافذ، خزائن، ستائر.
 * length — المتر الطولي (العرض وحده): دربزين، إفريز، حواف.
 * volume — المتر المكعّب (عرض × ارتفاع × عمق): كتل خشبية.
 * weight — الكيلوغرام (يُحسب من الحجم × كثافة المادة): حديد بالوزن.
 * unit  — القطعة: تسعير ثابت لا يتبع المقاس.
 */
export type PricingBasis = 'area' | 'length' | 'volume' | 'weight' | 'unit';

/** حقول مشتركة لكل السجلات المخزّنة. */
export interface BaseRecord {
  id: string;
  createdAt: number;
  updatedAt: number;
}

export interface OrderItem {
  name: string;
  qty: number;
  unitPrice: number;
}

export interface Order extends BaseRecord {
  title: string;
  customerName: string;
  phone: string;
  address: string;
  notes: string;
  status: OrderStatus;
  items: OrderItem[];
  /** مبلغ إضافي (أجرة عمل، نقل، ...) يضاف على مجموع البنود. */
  extraCharges: number;
  discount: number;
  paid: number;
  /** تاريخ التسليم بصيغة YYYY-MM-DD. */
  dueDate: string;
}

export interface Appointment extends BaseRecord {
  title: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm */
  time: string;
  durationMin: number;
  customerName: string;
  phone: string;
  location: string;
  notes: string;
  orderId: string | null;
  done: boolean;
}

export interface CalcMaterial {
  name: string;
  qty: number;
  unitPrice: number;
}

export interface Calculation extends BaseRecord {
  title: string;
  materials: CalcMaterial[];
  laborHours: number;
  laborRate: number;
  /** مصاريف عامة (كهرباء، إيجار، نقل...). */
  overhead: number;
  /** نسبة الهالك من قيمة المواد. */
  wastePct: number;
  /** نسبة الربح المطلوبة. */
  marginPct: number;
  /** نتائج محفوظة وقت الحساب. */
  materialsCost: number;
  laborCost: number;
  totalCost: number;
  profit: number;
  suggestedPrice: number;
  notes: string;
}

export interface MarketPrice extends BaseRecord {
  kind: MaterialKind;
  name: string;
  unit: string;
  price: number;
  /** السعر السابق، يُستخدم لحساب نسبة التغيّر. */
  previousPrice: number | null;
  source: string;
  /** YYYY-MM-DD */
  priceDate: string;
}

export interface DebtPayment {
  id: string;
  amount: number;
  /** YYYY-MM-DD */
  date: string;
  note: string;
}

export interface Debt extends BaseRecord {
  customerName: string;
  phone: string;
  address: string;
  goods: string;
  amount: number;
  payments: DebtPayment[];
  /** YYYY-MM-DD */
  dueDate: string;
  notes: string;
}

/** قالب منتج: نوعه وأساس تسعيره وسعر وحدته، تُشتقّ منه الأسعار بالمقاسات. */
export interface ProductTemplate extends BaseRecord {
  name: string;
  craft: Craft;
  basis: PricingBasis;
  /** سعر الوحدة الواحدة من أساس التسعير (المتر المربّع مثلاً). */
  unitPrice: number;
  /** كثافة المادة كغ/م³ — تُستعمل مع أساس الوزن فقط. */
  density: number;
  /** نسبة الهالك من قيمة المادة. */
  wastePct: number;
  /** إضافات ثابتة لكل قطعة: إكسسوارات، أقفال، تركيب. */
  fittings: number;
  /** أجرة عمل ثابتة لكل قطعة. */
  labor: number;
  /** نسبة الربح المطلوبة فوق التكلفة. */
  marginPct: number;
  /** أبعاد افتراضية تُملأ عند اختيار المنتج (سم). */
  defaultWidth: number;
  defaultHeight: number;
  defaultDepth: number;
  notes: string;
}

export interface Profile {
  businessName: string;
  ownerName: string;
  phone: string;
  address: string;
  userType: UserType;
  craft: Craft;
  /** اسم المهنة كما كتبه صاحبها — يُستعمل متى كانت craft === 'other'. */
  customCraft: string;
  /** اسم المادة الأساسية (جلد، رخام، بلاستيك…) — يسمّي صنف «مواد أخرى». */
  customMaterial: string;
  /** طريقة التسعير المعتادة في هذه المهنة — أساس القالب الأوّل. */
  customBasis: PricingBasis;
  currency: string;
  /** أجرة الساعة الافتراضية في الحاسبة. */
  defaultLaborRate: number;
  /** نسبة الربح الافتراضية في الحاسبة. */
  defaultMarginPct: number;
  updatedAt: number;
}

export type CollectionName =
  | 'orders'
  | 'products'
  | 'appointments'
  | 'calculations'
  | 'marketPrices'
  | 'debts';

export interface CollectionMap {
  orders: Order;
  products: ProductTemplate;
  appointments: Appointment;
  calculations: Calculation;
  marketPrices: MarketPrice;
  debts: Debt;
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  /** يُملأ عند الدخول برقم الهاتف. */
  phoneNumber: string | null;
  isAnonymous: boolean;
  /** true عندما يعمل التطبيق محلياً بدون Firebase. */
  isLocal: boolean;
  /** المهنة المسجّلة وقت إنشاء الحساب — يبني عليها التطبيق محتواه الأوّل. */
  userType?: UserType;
  craft?: Craft;
  customCraft?: string;
  customMaterial?: string;
  customBasis?: PricingBasis;
  /** true لجلسة «بدون حساب» على هذا الجهاز. */
  isGuest?: boolean;
}
