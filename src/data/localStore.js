/**
 * مخزن محلي داخل المتصفّح (localStorage) يُستخدم عندما لا تكون إعدادات Firebase
 * موجودة، أو عند اختيار «تجربة بدون حساب». نفس واجهة مخزن Firestore.
 */
import { newId } from '@/lib/id';
import { COLLECTIONS } from './store';
const KEY_PREFIX = 'herfah-pro:v1';
const dataKey = (uid, name) => `${KEY_PREFIX}:${uid}:${name}`;
const listeners = new Map();
const notify = (key) => {
    listeners.get(key)?.forEach((fn) => {
        fn();
    });
};
const subscribeKey = (key, fn) => {
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
const readRaw = (key, fallback) => {
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw)
            return fallback;
        return JSON.parse(raw);
    }
    catch {
        return fallback;
    }
};
const writeRaw = (key, value) => {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    }
    catch (error) {
        // امتلاء مساحة التخزين أو وضع التصفّح الخاص.
        console.warn('تعذّر الحفظ محلياً', error);
        throw new Error('تعذّر الحفظ على هذا الجهاز، قد تكون مساحة التخزين ممتلئة.');
    }
    notify(key);
};
/** يزامن التبويبات المفتوحة على نفس الجهاز. */
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        if (event.key && event.key.startsWith(KEY_PREFIX))
            notify(event.key);
    });
}
const sortRows = (rows) => [...rows].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
export const localStore = {
    kind: 'local',
    watch(uid, name, onChange, onError) {
        const key = dataKey(uid, name);
        const emit = () => {
            try {
                onChange(sortRows(readRaw(key, [])));
            }
            catch (error) {
                onError(error instanceof Error ? error : new Error(String(error)));
            }
        };
        emit();
        return subscribeKey(key, emit);
    },
    async create(uid, name, data) {
        const key = dataKey(uid, name);
        const rows = readRaw(key, []);
        const now = Date.now();
        const id = newId();
        rows.push({ ...data, id, createdAt: now, updatedAt: now });
        writeRaw(key, rows);
        return id;
    },
    async update(uid, name, id, patch) {
        const key = dataKey(uid, name);
        const rows = readRaw(key, []);
        const index = rows.findIndex((row) => row.id === id);
        if (index === -1)
            throw new Error('السجل غير موجود.');
        rows[index] = { ...rows[index], ...patch, updatedAt: Date.now() };
        writeRaw(key, rows);
    },
    async remove(uid, name, id) {
        const key = dataKey(uid, name);
        const rows = readRaw(key, []);
        writeRaw(key, rows.filter((row) => row.id !== id));
    },
    watchProfile(uid, onChange, onError) {
        const key = dataKey(uid, 'profile');
        const emit = () => {
            try {
                onChange(readRaw(key, null));
            }
            catch (error) {
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
export const readLocalProfile = (uid) => readRaw(dataKey(uid, 'profile'), null);
/** يحذف كل بيانات مستخدم محلي (يُستخدم في الإعدادات). */
export const clearLocalData = (uid) => {
    [...COLLECTIONS, 'profile'].forEach((name) => {
        const key = dataKey(uid, name);
        window.localStorage.removeItem(key);
        notify(key);
    });
};
/** يصدّر كل بيانات المستخدم المحلي كنص JSON للنسخ الاحتياطي. */
export const exportLocalData = (uid) => {
    const payload = { version: 1, exportedAt: Date.now() };
    COLLECTIONS.forEach((name) => {
        payload[name] = readRaw(dataKey(uid, name), []);
    });
    payload.profile = readRaw(dataKey(uid, 'profile'), null);
    return JSON.stringify(payload, null, 2);
};
/** استيراد نسخة احتياطية سبق تصديرها. يستبدل البيانات الحالية. */
export const importLocalData = (uid, json) => {
    const parsed = JSON.parse(json);
    COLLECTIONS.forEach((name) => {
        if (Array.isArray(parsed[name]))
            writeRaw(dataKey(uid, name), parsed[name]);
    });
    if (parsed.profile && typeof parsed.profile === 'object') {
        writeRaw(dataKey(uid, 'profile'), parsed.profile);
    }
};
/** يُنشئ حساباً محلياً ثابتاً لهذا الجهاز. */
export const localUidKey = `${KEY_PREFIX}:local-uid`;
export const getLocalUid = () => {
    try {
        const existing = window.localStorage.getItem(localUidKey);
        if (existing)
            return existing;
        const uid = `local-${newId()}`;
        window.localStorage.setItem(localUidKey, uid);
        return uid;
    }
    catch {
        return 'local-session';
    }
};
/** هل يوجد أي سجل محفوظ لهذا المستخدم؟ يُستخدم لتقرير زرع بيانات تجريبية. */
export const hasLocalData = (uid) => COLLECTIONS.some((name) => readRaw(dataKey(uid, name), []).length > 0);
/**
 * علامة «جُهّز هذا الحساب مرّة». لا يكفي فحص وجود بيانات: حساب حرفة «أخرى»
 * يبدأ فارغاً عمداً، فلولا هذه العلامة لأُعيد تجهيزه في كل فتح وطُمس ما عدّله.
 */
const initKey = (uid) => dataKey(uid, 'initialized');
export const isLocalInitialized = (uid) => {
    try {
        return window.localStorage.getItem(initKey(uid)) === '1';
    }
    catch {
        return false;
    }
};
export const markLocalInitialized = (uid) => {
    try {
        window.localStorage.setItem(initKey(uid), '1');
    }
    catch {
        /* التخزين ممنوع: يُعاد التجهيز في الزيارة القادمة وهو مقبول */
    }
};
/** كتابة مجموعة سجلات دفعة واحدة (تُستخدم عند زرع البيانات التجريبية). */
export const seedLocalCollection = (uid, name, rows) => {
    const now = Date.now();
    const withMeta = rows.map((row, index) => ({
        ...row,
        id: newId(),
        createdAt: now - index * 1000,
        updatedAt: now - index * 1000,
    }));
    writeRaw(dataKey(uid, name), withMeta);
};
