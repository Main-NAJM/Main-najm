/** تخزين على Firestore تحت users/{uid} — لكل حساب بياناته وحده. */
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Customer, Material, Order, Photo, WorkshopProfile } from '@/lib/types';
import { DEFAULT_PROFILE, type Snapshot, type Store } from './store';

const requireDb = () => {
  if (!db) throw new Error('لم تُضبط إعدادات Firebase.');
  return db;
};

// أسماء المجموعات مسبوقة بـ albacha لأن نفس مشروع Firebase يحوي تطبيق «حرفة برو»
// الذي يستعمل users/{uid}/orders بمخطّط مختلف — فالفصل يمنع اختلاط البيانات.
const customersRef = (uid: string) => collection(requireDb(), 'users', uid, 'albachaCustomers');
const ordersRef = (uid: string) => collection(requireDb(), 'users', uid, 'albachaOrders');
const materialsRef = (uid: string) => collection(requireDb(), 'users', uid, 'albachaMaterials');
const photosRef = (uid: string) => collection(requireDb(), 'users', uid, 'albachaPhotos');
const userRef = (uid: string) => doc(requireDb(), 'users', uid);

export const firestoreStore: Store = {
  async load(uid) {
    const [customersSnap, ordersSnap, materialsSnap, userSnap] = await Promise.all([
      getDocs(customersRef(uid)),
      getDocs(ordersRef(uid)),
      getDocs(materialsRef(uid)),
      getDoc(userRef(uid)),
    ]);

    const snapshot: Snapshot = {
      customers: customersSnap.docs.map((entry) => entry.data() as Customer),
      orders: ordersSnap.docs.map((entry) => entry.data() as Order),
      materials: materialsSnap.docs.map((entry) => entry.data() as Material),
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
    // حذف صور الطلب معه حتى لا تبقى معلّقة.
    const photos = await getDocs(query(photosRef(uid), where('orderId', '==', id)));
    await Promise.all(photos.docs.map((entry) => deleteDoc(entry.ref)));
  },

  async saveMaterial(uid, material) {
    await setDoc(doc(materialsRef(uid), material.id), material);
  },

  async deleteMaterial(uid, id) {
    await deleteDoc(doc(materialsRef(uid), id));
  },

  async loadPhotos(uid, orderId) {
    const snap = await getDocs(query(photosRef(uid), where('orderId', '==', orderId)));
    return snap.docs
      .map((entry) => entry.data() as Photo)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  async savePhoto(uid, photo) {
    await setDoc(doc(photosRef(uid), photo.id), photo);
  },

  async deletePhoto(uid, photo) {
    await deleteDoc(doc(photosRef(uid), photo.id));
  },

  async saveProfile(uid, profile) {
    await setDoc(userRef(uid), { albachaProfile: profile }, { merge: true });
  },

  async restore(uid, backup) {
    // حذف الموجود ثم كتابة النسخة، على دفعات لأن الحدّ ٥٠٠ عملية للدفعة.
    const [existingCustomers, existingOrders, existingMaterials] = await Promise.all([
      getDocs(customersRef(uid)),
      getDocs(ordersRef(uid)),
      getDocs(materialsRef(uid)),
    ]);

    type Apply = (batch: ReturnType<typeof writeBatch>) => void;

    const operations: Apply[] = [
      ...[...existingCustomers.docs, ...existingOrders.docs, ...existingMaterials.docs].map(
        (entry): Apply =>
          (batch) => {
            batch.delete(entry.ref);
          },
      ),
      ...backup.customers.map(
        (customer): Apply =>
          (batch) => {
            batch.set(doc(customersRef(uid), customer.id), customer);
          },
      ),
      ...backup.orders.map(
        (order): Apply =>
          (batch) => {
            batch.set(doc(ordersRef(uid), order.id), order);
          },
      ),
      ...(backup.materials ?? []).map(
        (material): Apply =>
          (batch) => {
            batch.set(doc(materialsRef(uid), material.id), material);
          },
      ),
    ];

    for (let index = 0; index < operations.length; index += 400) {
      const batch = writeBatch(requireDb());
      operations.slice(index, index + 400).forEach((apply) => apply(batch));
      await batch.commit();
    }

    await setDoc(userRef(uid), { albachaProfile: backup.profile }, { merge: true });
  },
};
