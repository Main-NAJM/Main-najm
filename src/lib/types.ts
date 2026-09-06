/** أنواع البيانات الأساسية في تطبيق حرفة برو. */

export type UserType = 'craftsman' | 'merchant';

export type Craft = 'carpenter' | 'blacksmith' | 'tailor' | 'other';

export type OrderStatus = 'in_progress' | 'pending' | 'completed';

export type MaterialKind = 'wood' | 'iron' | 'fabric' | 'other';

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

export interface Profile {
  businessName: string;
  ownerName: string;
  phone: string;
  address: string;
  userType: UserType;
  craft: Craft;
  currency: string;
  /** أجرة الساعة الافتراضية في الحاسبة. */
  defaultLaborRate: number;
  /** نسبة الربح الافتراضية في الحاسبة. */
  defaultMarginPct: number;
  updatedAt: number;
}

export type CollectionName =
  | 'orders'
  | 'appointments'
  | 'calculations'
  | 'marketPrices'
  | 'debts';

export interface CollectionMap {
  orders: Order;
  appointments: Appointment;
  calculations: Calculation;
  marketPrices: MarketPrice;
  debts: Debt;
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous: boolean;
  /** true عندما يعمل التطبيق محلياً بدون Firebase. */
  isLocal: boolean;
}
