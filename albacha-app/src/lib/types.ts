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

export type Material = 'aluminium' | 'iron' | 'mixed';

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
  material: Material;
  status: OrderStatus;
  items: OrderItem[];
  /** أجرة التركيب والنقل. */
  laborFee: number;
  discount: number;
  payments: Payment[];
  /** تاريخ التسليم المتّفق عليه (YYYY-MM-DD). */
  dueDate: string;
  note: string;
  createdAt: number;
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
  profile: WorkshopProfile;
}
