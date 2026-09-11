/** تخزين على الجهاز — يُستعمل في وضع «بدون حساب» وعند غياب إعدادات Firebase. */
import type { Backup, Customer, Material, Order, Photo, WorkshopProfile } from '@/lib/types';
import { newId } from '@/lib/format';
import { DEFAULT_PROFILE, type Snapshot, type Store } from './store';

const PREFIX = 'albacha:v1';
const UID_KEY = `${PREFIX}:uid`;

const key = (uid: string, name: string) => `${PREFIX}:${uid}:${name}`;
const photosKey = (uid: string, orderId: string) => key(uid, `photos:${orderId}`);

const read = <T>(storageKey: string, fallback: T): T => {
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = (storageKey: string, value: unknown): void => {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  } catch (error) {
    // امتلاء التخزين مهمّ للمستخدم أن يعرفه — خاصّة مع الصور.
    const name = (error as { name?: string })?.name ?? '';
    if (name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      throw new Error('امتلأت مساحة التخزين على هذا الجهاز. احذف بعض الصور أو سجّل الدخول للمزامنة.');
    }
    throw error instanceof Error ? error : new Error('تعذّر الحفظ على هذا الجهاز.');
  }
};

/** معرّف ثابت لهذا الجهاز حتى تبقى البيانات بعد إعادة الفتح. */
export const getLocalUid = (): string => {
  const existing = read<string | null>(UID_KEY, null);
  if (typeof existing === 'string' && existing) return existing;
  const uid = `local-${newId()}`;
  write(UID_KEY, uid);
  return uid;
};

/** معرّف الجهاز إن وُجد، بلا إنشاء واحد جديد — للاطّلاع لا للاستعمال. */
const peekLocalUid = (): string | null => {
  const existing = read<string | null>(UID_KEY, null);
  return typeof existing === 'string' && existing ? existing : null;
};

/**
 * بيانات أُدخلت على هذا الجهاز قبل ربط الحساب، أو null إن لم يكن فيه شيء.
 *
 * من استعمل التطبيق قبل تفعيل Firebase حُفظت بياناته تحت هوية جهاز، فلمّا صار
 * الدخول بحساب بقيت محفوظة لكن خارج ما يقرأه التطبيق. هذه هي نافذتها.
 */
export const readDeviceBackup = (): Backup | null => {
  const uid = peekLocalUid();
  if (!uid) return null;
  const customers = read<Customer[]>(key(uid, 'customers'), []);
  const orders = read<Order[]>(key(uid, 'orders'), []);
  const materials = read<Material[]>(key(uid, 'materials'), []);
  if (!customers.length && !orders.length && !materials.length) return null;
  return {
    version: 1,
    exportedAt: Date.now(),
    customers,
    orders,
    materials,
    profile: { ...DEFAULT_PROFILE, ...read<Partial<WorkshopProfile>>(key(uid, 'profile'), {}) },
  };
};

/** صور طلب محفوظة على الجهاز، لتُنقل مع بياناته. */
export const readDevicePhotos = (orderId: string): Photo[] => {
  const uid = peekLocalUid();
  return uid ? read<Photo[]>(photosKey(uid, orderId), []) : [];
};

const upsert = <T extends { id: string }>(list: T[], item: T): T[] => {
  const index = list.findIndex((entry) => entry.id === item.id);
  if (index < 0) return [item, ...list];
  const copy = list.slice();
  copy[index] = item;
  return copy;
};

export const localStore: Store = {
  async load(uid) {
    const snapshot: Snapshot = {
      customers: read<Customer[]>(key(uid, 'customers'), []),
      orders: read<Order[]>(key(uid, 'orders'), []),
      materials: read<Material[]>(key(uid, 'materials'), []),
      profile: { ...DEFAULT_PROFILE, ...read<Partial<WorkshopProfile>>(key(uid, 'profile'), {}) },
    };
    return snapshot;
  },

  async saveCustomer(uid, customer) {
    write(key(uid, 'customers'), upsert(read<Customer[]>(key(uid, 'customers'), []), customer));
  },

  async deleteCustomer(uid, id) {
    write(
      key(uid, 'customers'),
      read<Customer[]>(key(uid, 'customers'), []).filter((item) => item.id !== id),
    );
  },

  async saveOrder(uid, order) {
    write(key(uid, 'orders'), upsert(read<Order[]>(key(uid, 'orders'), []), order));
  },

  async deleteOrder(uid, id) {
    write(
      key(uid, 'orders'),
      read<Order[]>(key(uid, 'orders'), []).filter((item) => item.id !== id),
    );
    try {
      window.localStorage.removeItem(photosKey(uid, id));
    } catch {
      /* لا شيء لحذفه */
    }
  },

  async saveMaterial(uid, material) {
    write(key(uid, 'materials'), upsert(read<Material[]>(key(uid, 'materials'), []), material));
  },

  async deleteMaterial(uid, id) {
    write(
      key(uid, 'materials'),
      read<Material[]>(key(uid, 'materials'), []).filter((item) => item.id !== id),
    );
  },

  async loadPhotos(uid, orderId) {
    return read<Photo[]>(photosKey(uid, orderId), []);
  },

  async savePhoto(uid, photo) {
    const list = read<Photo[]>(photosKey(uid, photo.orderId), []);
    write(photosKey(uid, photo.orderId), upsert(list, photo));
  },

  async deletePhoto(uid, photo) {
    const list = read<Photo[]>(photosKey(uid, photo.orderId), []).filter(
      (item) => item.id !== photo.id,
    );
    write(photosKey(uid, photo.orderId), list);
  },

  async saveProfile(uid, profile) {
    write(key(uid, 'profile'), profile);
  },

  async restore(uid, backup) {
    write(key(uid, 'customers'), backup.customers);
    write(key(uid, 'orders'), backup.orders);
    write(key(uid, 'materials'), backup.materials ?? []);
    write(key(uid, 'profile'), backup.profile);
  },
};
