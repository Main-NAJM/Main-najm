/**
 * مخزن محلي داخل المتصفّح (localStorage) يُستخدم عندما لا تكون إعدادات Firebase
 * موجودة، أو عند اختيار «تجربة بدون حساب». نفس واجهة مخزن Firestore.
 */
import { newId } from '@/lib/id';
import type { CollectionMap, CollectionName, Profile } from '@/lib/types';
import { COLLECTIONS, type NewRecord, type PatchRecord, type Store, type Unsubscribe } from './store';

const KEY_PREFIX = 'herfah-pro:v1';

const dataKey = (uid: string, name: string) => `${KEY_PREFIX}:${uid}:${name}`;

type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();

const notify = (key: string) => {
  listeners.get(key)?.forEach((fn) => {
    fn();
  });
};

const subscribeKey = (key: string, fn: Listener): Unsubscribe => {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(fn);
  return () => {
    set?.delete(fn);
  };
};

const readRaw = <T>(key: string, fallback: T): T => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeRaw = (key: string, value: unknown): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // امتلاء مساحة التخزين أو وضع التصفّح الخاص.
    console.warn('تعذّر الحفظ محلياً', error);
    throw new Error('تعذّر الحفظ على هذا الجهاز، قد تكون مساحة التخزين ممتلئة.');
  }
  notify(key);
};

/** يزامن التبويبات المفتوحة على نفس الجهاز. */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key && event.key.startsWith(KEY_PREFIX)) notify(event.key);
  });
}

const sortRows = <T extends { createdAt: number }>(rows: T[]): T[] =>
  [...rows].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

export const localStore: Store = {
  kind: 'local',

  watch(uid, name, onChange, onError) {
    const key = dataKey(uid, name);
    const emit = () => {
      try {
        onChange(sortRows(readRaw<CollectionMap[typeof name][]>(key, [])));
      } catch (error) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    };
    emit();
    return subscribeKey(key, emit);
  },

  async create(uid, name, data) {
    const key = dataKey(uid, name);
    const rows = readRaw<Record<string, unknown>[]>(key, []);
    const now = Date.now();
    const id = newId();
    rows.push({ ...(data as object), id, createdAt: now, updatedAt: now });
    writeRaw(key, rows);
    return id;
  },

  async update(uid, name, id, patch) {
    const key = dataKey(uid, name);
    const rows = readRaw<Record<string, unknown>[]>(key, []);
    const index = rows.findIndex((row) => row.id === id);
    if (index === -1) throw new Error('السجل غير موجود.');
    rows[index] = { ...rows[index], ...(patch as object), updatedAt: Date.now() };
    writeRaw(key, rows);
  },

  async remove(uid, name, id) {
    const key = dataKey(uid, name);
    const rows = readRaw<Record<string, unknown>[]>(key, []);
    writeRaw(key, rows.filter((row) => row.id !== id));
  },

  watchProfile(uid, onChange, onError) {
    const key = dataKey(uid, 'profile');
    const emit = () => {
      try {
        onChange(readRaw<Profile | null>(key, null));
      } catch (error) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    };
    emit();
    return subscribeKey(key, emit);
  },

  async saveProfile(uid, profile) {
    writeRaw(dataKey(uid, 'profile'), profile);
  },
};

/** قراءة فورية لملف العمل — تُستعمل لمعرفة هل للحساب ملف محفوظ أصلاً. */
export const readLocalProfile = (uid: string): Profile | null =>
  readRaw<Profile | null>(dataKey(uid, 'profile'), null);

/** يحذف كل بيانات مستخدم محلي (يُستخدم في الإعدادات). */
export const clearLocalData = (uid: string): void => {
  [...COLLECTIONS, 'profile' as const].forEach((name) => {
    const key = dataKey(uid, name as CollectionName);
    window.localStorage.removeItem(key);
    notify(key);
  });
};

/** يصدّر كل بيانات المستخدم المحلي كنص JSON للنسخ الاحتياطي. */
export const exportLocalData = (uid: string): string => {
  const payload: Record<string, unknown> = { version: 1, exportedAt: Date.now() };
  COLLECTIONS.forEach((name) => {
    payload[name] = readRaw(dataKey(uid, name), []);
  });
  payload.profile = readRaw(dataKey(uid, 'profile'), null);
  return JSON.stringify(payload, null, 2);
};

/** استيراد نسخة احتياطية سبق تصديرها. يستبدل البيانات الحالية. */
export const importLocalData = (uid: string, json: string): void => {
  const parsed = JSON.parse(json) as Record<string, unknown>;
  COLLECTIONS.forEach((name) => {
    if (Array.isArray(parsed[name])) writeRaw(dataKey(uid, name), parsed[name]);
  });
  if (parsed.profile && typeof parsed.profile === 'object') {
    writeRaw(dataKey(uid, 'profile'), parsed.profile);
  }
};

/** يُنشئ حساباً محلياً ثابتاً لهذا الجهاز. */
export const localUidKey = `${KEY_PREFIX}:local-uid`;

export const getLocalUid = (): string => {
  try {
    const existing = window.localStorage.getItem(localUidKey);
    if (existing) return existing;
    const uid = `local-${newId()}`;
    window.localStorage.setItem(localUidKey, uid);
    return uid;
  } catch {
    return 'local-session';
  }
};

/** هل يوجد أي سجل محفوظ لهذا المستخدم؟ يُستخدم لتقرير زرع بيانات تجريبية. */
export const hasLocalData = (uid: string): boolean =>
  COLLECTIONS.some((name) => readRaw<unknown[]>(dataKey(uid, name), []).length > 0);

/**
 * علامة «جُهّز هذا الحساب مرّة». لا يكفي فحص وجود بيانات: حساب حرفة «أخرى»
 * يبدأ فارغاً عمداً، فلولا هذه العلامة لأُعيد تجهيزه في كل فتح وطُمس ما عدّله.
 */
const initKey = (uid: string) => dataKey(uid, 'initialized');

export const isLocalInitialized = (uid: string): boolean => {
  try {
    return window.localStorage.getItem(initKey(uid)) === '1';
  } catch {
    return false;
  }
};

export const markLocalInitialized = (uid: string): void => {
  try {
    window.localStorage.setItem(initKey(uid), '1');
  } catch {
    /* التخزين ممنوع: يُعاد التجهيز في الزيارة القادمة وهو مقبول */
  }
};

/** كتابة مجموعة سجلات دفعة واحدة (تُستخدم عند زرع البيانات التجريبية). */
export const seedLocalCollection = <K extends CollectionName>(
  uid: string,
  name: K,
  rows: NewRecord<CollectionMap[K]>[],
): void => {
  const now = Date.now();
  const withMeta = rows.map((row, index) => ({
    ...(row as object),
    id: newId(),
    createdAt: now - index * 1000,
    updatedAt: now - index * 1000,
  }));
  writeRaw(dataKey(uid, name), withMeta);
};

export type { NewRecord, PatchRecord };
