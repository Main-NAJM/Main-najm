/** مخزن Firestore: كل بيانات المستخدم تحت المسار users/{uid}/… */
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, } from 'firebase/firestore';
import { db } from '@/lib/firebase';
const requireDb = () => {
    if (!db)
        throw new Error('لم تُضبط إعدادات Firebase.');
    return db;
};
/** يحوّل Timestamp من Firestore إلى رقم بالمللي ثانية. */
const toMillis = (value, fallback) => {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    if (value && typeof value.toMillis === 'function') {
        return value.toMillis();
    }
    return fallback;
};
const mapDoc = (snapshot) => {
    const data = snapshot.data();
    const fallback = Date.now();
    return {
        ...data,
        id: snapshot.id,
        createdAt: toMillis(data.createdAt, fallback),
        updatedAt: toMillis(data.updatedAt, fallback),
    };
};
const userCollection = (uid, name) => collection(requireDb(), 'users', uid, name);
export const firestoreStore = {
    kind: 'firestore',
    watch(uid, name, onChange, onError) {
        const q = query(userCollection(uid, name), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snapshot) => {
            onChange(snapshot.docs.map((d) => mapDoc(d)));
        }, (error) => {
            onError(error);
        });
    },
    async create(uid, name, data) {
        const ref = await addDoc(userCollection(uid, name), {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return ref.id;
    },
    async update(uid, name, id, patch) {
        await updateDoc(doc(requireDb(), 'users', uid, name, id), {
            ...patch,
            updatedAt: serverTimestamp(),
        });
    },
    async remove(uid, name, id) {
        await deleteDoc(doc(requireDb(), 'users', uid, name, id));
    },
    watchProfile(uid, onChange, onError) {
        return onSnapshot(doc(requireDb(), 'users', uid), (snapshot) => {
            const data = snapshot.data();
            if (!data || !data.profile) {
                onChange(null);
                return;
            }
            const profile = data.profile;
            onChange({ ...profile, updatedAt: toMillis(profile.updatedAt, Date.now()) });
        }, (error) => {
            onError(error);
        });
    },
    async saveProfile(uid, profile) {
        await setDoc(doc(requireDb(), 'users', uid), { profile: { ...profile, updatedAt: Date.now() }, updatedAt: serverTimestamp() }, { merge: true });
    },
};
