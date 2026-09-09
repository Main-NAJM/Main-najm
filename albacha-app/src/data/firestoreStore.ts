/** تخزين على Firestore تحت users/{uid} — لكل حساب بياناته وحده. */
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Customer, Order, WorkshopProfile } from '@/lib/types';
import { DEFAULT_PROFILE, type Snapshot, type Store } from './store';

const requireDb = () => {
  if (!db) throw new Error('لم تُضبط إعدادات Firebase.');
  return db;
};

// أسماء المجموعات مسبوقة بـ albacha لأن نفس مشروع Firebase يحوي تطبيق «حرفة برو»
// الذي يستعمل users/{uid}/orders بمخطّط مختلف — فالفصل يمنع اختلاط البيانات.
const customersRef = (uid: string) => collection(requireDb(), 'users', uid, 'albachaCustomers');
const ordersRef = (uid: string) => collection(requireDb(), 'users', uid, 'albachaOrders');
const userRef = (uid: string) => doc(requireDb(), 'users', uid);

export const firestoreStore: Store = {
  async load(uid) {
    const [customersSnap, ordersSnap, userSnap] = await Promise.all([
      getDocs(customersRef(uid)),
      getDocs(ordersRef(uid)),
      getDoc(userRef(uid)),
    ]);

    const snapshot: Snapshot = {
      customers: customersSnap.docs.map((entry) => entry.data() as Customer),
      orders: ordersSnap.docs.map((entry) => entry.data() as Order),
      profile: {
        ...DEFAULT_PROFILE,
        // حقل خاصّ بهذا التطبيق: users/{uid}.profile يخصّ تطبيقاً آخر في نفس المشروع.
        ...((userSnap.data()?.albachaProfile ?? {}) as Partial<WorkshopProfile>),
      },
    };
    return snapshot;
  },

  async saveCustomer(uid, customer) {
    await setDoc(doc(customersRef(uid), customer.id), customer);
  },

  async deleteCustomer(uid, id) {
    await deleteDoc(doc(customersRef(uid), id));
  },

  async saveOrder(uid, order) {
    await setDoc(doc(ordersRef(uid), order.id), order);
  },

  async deleteOrder(uid, id) {
    await deleteDoc(doc(ordersRef(uid), id));
  },

  async saveProfile(uid, profile) {
    await setDoc(userRef(uid), { albachaProfile: profile }, { merge: true });
  },

  async restore(uid, backup) {
    // حذف الموجود ثم كتابة النسخة، على دفعات لأن الحدّ ٥٠٠ عملية للدفعة.
    const [existingCustomers, existingOrders] = await Promise.all([
      getDocs(customersRef(uid)),
      getDocs(ordersRef(uid)),
    ]);

    const operations: ((batch: ReturnType<typeof writeBatch>) => void)[] = [
      ...existingCustomers.docs.map((entry) => (batch: ReturnType<typeof writeBatch>) => {
        batch.delete(entry.ref);
      }),
      ...existingOrders.docs.map((entry) => (batch: ReturnType<typeof writeBatch>) => {
        batch.delete(entry.ref);
      }),
      ...backup.customers.map((customer: Customer) => (batch: ReturnType<typeof writeBatch>) => {
        batch.set(doc(customersRef(uid), customer.id), customer);
      }),
      ...backup.orders.map((order: Order) => (batch: ReturnType<typeof writeBatch>) => {
        batch.set(doc(ordersRef(uid), order.id), order);
      }),
    ];

    for (let index = 0; index < operations.length; index += 400) {
      const batch = writeBatch(requireDb());
      operations.slice(index, index + 400).forEach((apply) => apply(batch));
      await batch.commit();
    }

    await setDoc(userRef(uid), { albachaProfile: backup.profile }, { merge: true });
  },
};
