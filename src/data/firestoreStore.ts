/** مخزن Firestore: كل بيانات المستخدم تحت المسار users/{uid}/… */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { CollectionMap, CollectionName, Profile } from '@/lib/types';
import type { Store } from './store';

const requireDb = () => {
  if (!db) throw new Error('لم تُضبط إعدادات Firebase.');
  return db;
};

/** يحوّل Timestamp من Firestore إلى رقم بالمللي ثانية. */
const toMillis = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value && typeof (value as Timestamp).toMillis === 'function') {
    return (value as Timestamp).toMillis();
  }
  return fallback;
};

const mapDoc = <K extends CollectionName>(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): CollectionMap[K] => {
  const data = snapshot.data();
  const fallback = Date.now();
  return {
    ...data,
    id: snapshot.id,
    createdAt: toMillis(data.createdAt, fallback),
    updatedAt: toMillis(data.updatedAt, fallback),
  } as CollectionMap[K];
};

const userCollection = (uid: string, name: CollectionName) =>
  collection(requireDb(), 'users', uid, name);

export const firestoreStore: Store = {
  kind: 'firestore',

  watch(uid, name, onChange, onError) {
    const q = query(userCollection(uid, name), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        onChange(snapshot.docs.map((d) => mapDoc<typeof name>(d)));
      },
      (error) => {
        onError(error);
      },
    );
  },

  async create(uid, name, data) {
    const ref = await addDoc(userCollection(uid, name), {
      ...(data as object),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  async update(uid, name, id, patch) {
    await updateDoc(doc(requireDb(), 'users', uid, name, id), {
      ...(patch as object),
      updatedAt: serverTimestamp(),
    });
  },

  async remove(uid, name, id) {
    await deleteDoc(doc(requireDb(), 'users', uid, name, id));
  },

  watchProfile(uid, onChange, onError) {
    return onSnapshot(
      doc(requireDb(), 'users', uid),
      (snapshot) => {
        const data = snapshot.data();
        if (!data || !data.profile) {
          onChange(null);
          return;
        }
        const profile = data.profile as Profile;
        onChange({ ...profile, updatedAt: toMillis(profile.updatedAt, Date.now()) });
      },
      (error) => {
        onError(error);
      },
    );
  },

  async saveProfile(uid, profile) {
    await setDoc(
      doc(requireDb(), 'users', uid),
      { profile: { ...profile, updatedAt: Date.now() }, updatedAt: serverTimestamp() },
      { merge: true },
    );
  },
};
