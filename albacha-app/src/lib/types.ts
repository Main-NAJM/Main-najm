/** أنواع بيانات تطبيق مؤسسة الباشة للمعادن. */

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber: string | null;
  /** true عندما يعمل التطبيق على الجهاز فقط بدون Firebase. */
  isLocal: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  note: string;
  createdAt: number;
}

/** طريقة التسعير: بالمتر المربّع (أبواب ونوافذ) أو بالقطعة (إكسسوارات وأعمال مقطوعة). */
export type PricingUnit = 'm2' | 'piece';

export interface OrderItem {
  id: string;
  label: string;
  unit: PricingUnit;
  /** بالمتر — تُستعمل مع التسعير بالمتر المربّع. */
  width: number;
  height: number;
  qty: number;
  unitPrice: number;
}

export type MaterialKind = 'aluminium' | 'iron' | 'mixed';

export type OrderStatus = 'quote' | 'confirmed' | 'ready' | 'installed' | 'cancelled';

export interface Payment {
  id: string;
  amount: number;
  date: string;
  note: string;
}

export interface Order {
  id: string;
  /** معرّف الزبون، مع نسخة من اسمه وهاتفه للعرض والطباعة دون قراءة إضافية. */
  customerId: string;
  customerName: string;
  customerPhone: string;
  title: string;
  material: MaterialKind;
  status: OrderStatus;
  items: OrderItem[];
  /** أجرة التركيب والنقل. */
  laborFee: number;
  discount: number;
  /** تكلفة المواد والتنفيذ — تُستعمل لحساب الربح في التقرير الشهري. */
  cost?: number;
  payments: Payment[];
  /** تاريخ التسليم المتّفق عليه (YYYY-MM-DD). */
  dueDate: string;
  note: string;
  createdAt: number;
  updatedAt: number;
}

export type MaterialUnit = 'meter' | 'kg' | 'piece' | 'sheet' | 'bar';

/** حركة على المخزون: استلام (+) أو صرف (−). */
export interface StockMovement {
  id: string;
  delta: number;
  date: string;
  note: string;
}

export interface Material {
  id: string;
  name: string;
  unit: MaterialUnit;
  quantity: number;
  /** حدّ التنبيه: تحته يظهر التنبيه بإعادة الشراء. */
  minQuantity: number;
  unitCost: number;
  supplier: string;
  note: string;
  /** آخر الحركات، الأحدث أولاً. */
  movements: StockMovement[];
  createdAt: number;
  updatedAt: number;
}

/** صورة عمل مرفقة بطلب — مضغوطة ومخزّنة كـ data URL. */
export interface Photo {
  id: string;
  orderId: string;
  dataUrl: string;
  caption: string;
  createdAt: number;
}

/** صورة معروضة للعموم في معرض الموقع التعريفي. */
export interface SitePhoto {
  id: string;
  dataUrl: string;
  caption: string;
  createdAt: number;
}

/** إعدادات الموقع التعريفي العامّة — يقرأها الزوّار، ويكتبها المالك وحده. */
export interface SiteConfig {
  /** معرّف الحساب المالك؛ يُثبَّت عند أول مطالبة ولا يتغيّر بعدها. */
  ownerUid: string;
  /** رقم واتساب الظاهر في الموقع. فارغ يعني إبقاء الرقم المكتوب في الصفحة. */
  whatsapp: string;
  /** نصّ يظهر أعلى معرض الأعمال. */
  galleryNote: string;
  updatedAt: number;
}

export interface WorkshopProfile {
  name: string;
  phone: string;
  address: string;
  currency: string;
  /** يظهر أسفل عرض السعر المطبوع. */
  quoteNote: string;
}

export interface Backup {
  version: 1;
  exportedAt: number;
  customers: Customer[];
  orders: Order[];
  /** أُضيفت بعد الإصدار الأول، فقد تغيب في النسخ القديمة. */
  materials?: Material[];
  profile: WorkshopProfile;
}
