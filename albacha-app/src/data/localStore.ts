/** تخزين على الجهاز — يُستعمل في وضع «بدون حساب» وعند غياب إعدادات Firebase. */
import type { Customer, Order, WorkshopProfile } from '@/lib/types';
import { newId } from '@/lib/format';
import { DEFAULT_PROFILE, type Snapshot, type Store } from './store';

const PREFIX = 'albacha:v1';
const UID_KEY = `${PREFIX}:uid`;

const key = (uid: string, name: string) => `${PREFIX}:${uid}:${name}`;

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
  } catch {
    /* التخزين ممتلئ أو محظور — تبقى البيانات في الذاكرة لهذه الجلسة */
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

export const hasLocalData = (uid: string): boolean =>
  read<Customer[]>(key(uid, 'customers'), []).length > 0 ||
  read<Order[]>(key(uid, 'orders'), []).length > 0;

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
      profile: { ...DEFAULT_PROFILE, ...read<Partial<WorkshopProfile>>(key(uid, 'profile'), {}) },
    };
    return snapshot;
  },

  async saveCustomer(uid, customer) {
    write(key(uid, 'customers'), upsert(read<Customer[]>(key(uid, 'customers'), []), customer));
  },

  async deleteCustomer(uid, id) {
    const list = read<Customer[]>(key(uid, 'customers'), []).filter((item) => item.id !== id);
    write(key(uid, 'customers'), list);
  },

  async saveOrder(uid, order) {
    write(key(uid, 'orders'), upsert(read<Order[]>(key(uid, 'orders'), []), order));
  },

  async deleteOrder(uid, id) {
    const list = read<Order[]>(key(uid, 'orders'), []).filter((item) => item.id !== id);
    write(key(uid, 'orders'), list);
  },

  async saveProfile(uid, profile) {
    write(key(uid, 'profile'), profile);
  },

  async restore(uid, backup) {
    write(key(uid, 'customers'), backup.customers);
    write(key(uid, 'orders'), backup.orders);
    write(key(uid, 'profile'), backup.profile);
  },
};
