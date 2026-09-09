import type { Backup, Customer, Order, WorkshopProfile } from '@/lib/types';

export const DEFAULT_PROFILE: WorkshopProfile = {
  name: 'مؤسسة الباشة للمعادن',
  phone: '0673232932',
  address: 'تيمياوين، ولاية برج باجي مختار',
  currency: 'د.ج',
  quoteNote: 'العرض صالح لمدة ١٥ يوماً من تاريخه. تُدفع دفعة أولى ٥٠٪ عند تأكيد الطلب.',
};

export interface Snapshot {
  customers: Customer[];
  orders: Order[];
  profile: WorkshopProfile;
}

/**
 * واجهة التخزين. لها تنفيذان: على الجهاز (localStorage) وعلى Firestore،
 * فيعمل التطبيق كما هو في الحالتين.
 */
export interface Store {
  load(uid: string): Promise<Snapshot>;
  saveCustomer(uid: string, customer: Customer): Promise<void>;
  deleteCustomer(uid: string, id: string): Promise<void>;
  saveOrder(uid: string, order: Order): Promise<void>;
  deleteOrder(uid: string, id: string): Promise<void>;
  saveProfile(uid: string, profile: WorkshopProfile): Promise<void>;
  /** استيراد نسخة احتياطية: يستبدل كل البيانات الحالية. */
  restore(uid: string, backup: Backup): Promise<void>;
}
