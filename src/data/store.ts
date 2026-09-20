import type { CollectionMap, CollectionName, Profile } from '@/lib/types';

export type Unsubscribe = () => void;

/** حقول يملؤها المخزن تلقائياً عند الإنشاء. */
export type NewRecord<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type PatchRecord<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;

/** واجهة موحّدة للتخزين، تطبّقها نسخة Firestore والنسخة المحلية. */
export interface Store {
  readonly kind: 'firestore' | 'local';
  watch<K extends CollectionName>(
    uid: string,
    name: K,
    onChange: (rows: CollectionMap[K][]) => void,
    onError: (error: Error) => void,
  ): Unsubscribe;
  create<K extends CollectionName>(
    uid: string,
    name: K,
    data: NewRecord<CollectionMap[K]>,
  ): Promise<string>;
  update<K extends CollectionName>(
    uid: string,
    name: K,
    id: string,
    patch: PatchRecord<CollectionMap[K]>,
  ): Promise<void>;
  remove(uid: string, name: CollectionName, id: string): Promise<void>;
  watchProfile(
    uid: string,
    onChange: (profile: Profile | null) => void,
    onError: (error: Error) => void,
  ): Unsubscribe;
  saveProfile(uid: string, profile: Profile): Promise<void>;
}

export const COLLECTIONS: CollectionName[] = [
  'orders',
  'products',
  'inventory',
  'appointments',
  'calculations',
  'marketPrices',
  'debts',
];
