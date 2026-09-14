import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { firestoreStore } from '@/data/firestoreStore';
import { hasLocalData, localStore, seedLocalCollection } from '@/data/localStore';
import {
  defaultProfile,
  seedAppointments,
  seedCalculations,
  seedDebts,
  seedMarketPrices,
  seedOrders,
  seedProducts,
} from '@/data/seed';
import type { NewRecord, PatchRecord, Store } from '@/data/store';
import type {
  Appointment,
  Calculation,
  CollectionMap,
  CollectionName,
  Debt,
  MarketPrice,
  Order,
  Profile,
  ProductTemplate,
} from '@/lib/types';

interface DataContextValue {
  ready: boolean;
  error: string | null;
  storeKind: Store['kind'];
  orders: Order[];
  appointments: Appointment[];
  calculations: Calculation[];
  marketPrices: MarketPrice[];
  products: ProductTemplate[];
  debts: Debt[];
  profile: Profile;
  profileLoaded: boolean;
  create: <K extends CollectionName>(
    name: K,
    data: NewRecord<CollectionMap[K]>,
  ) => Promise<string>;
  update: <K extends CollectionName>(
    name: K,
    id: string,
    patch: PatchRecord<CollectionMap[K]>,
  ) => Promise<void>;
  remove: (name: CollectionName, id: string) => Promise<void>;
  saveProfile: (profile: Profile) => Promise<void>;
  /** يزرع بيانات تجريبية في الوضع المحلي. */
  seedDemoData: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

const emptyState = {
  orders: [] as Order[],
  appointments: [] as Appointment[],
  calculations: [] as Calculation[],
  marketPrices: [] as MarketPrice[],
  products: [] as ProductTemplate[],
  debts: [] as Debt[],
};

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const store: Store = user?.isLocal ? localStore : firestoreStore;

  const [collections, setCollections] = useState(emptyState);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const seedDemoData = useCallback(() => {
    if (!uid || !user?.isLocal) return;
    seedLocalCollection(uid, 'orders', seedOrders());
    seedLocalCollection(uid, 'appointments', seedAppointments());
    seedLocalCollection(uid, 'calculations', seedCalculations());
    seedLocalCollection(uid, 'marketPrices', seedMarketPrices());
    seedLocalCollection(uid, 'products', seedProducts());
    seedLocalCollection(uid, 'debts', seedDebts());
  }, [uid, user?.isLocal]);

  useEffect(() => {
    if (!uid) {
      setCollections(emptyState);
      setProfile(defaultProfile());
      setProfileLoaded(false);
      setLoadedCount(0);
      return;
    }

    setCollections(emptyState);
    setLoadedCount(0);
    setProfileLoaded(false);
    setError(null);

    const seen = new Set<string>();
    const markLoaded = (name: string) => {
      if (seen.has(name)) return;
      seen.add(name);
      setLoadedCount((count) => count + 1);
    };

    const handleError = (err: Error) => {
      setError(err.message || 'تعذّر تحميل البيانات.');
    };

    const names: CollectionName[] = [
      'orders',
      'appointments',
      'calculations',
      'marketPrices',
      'debts',
      'products',
    ];

    const unsubscribes = names.map((name) =>
      store.watch(
        uid,
        name,
        (rows) => {
          setCollections((current) => ({ ...current, [name]: rows }));
          markLoaded(name);
        },
        handleError,
      ),
    );

    const unsubProfile = store.watchProfile(
      uid,
      (saved) => {
        setProfile(saved ? { ...defaultProfile(), ...saved } : defaultProfile());
        setProfileLoaded(true);
      },
      handleError,
    );

    return () => {
      unsubscribes.forEach((fn) => {
        fn();
      });
      unsubProfile();
    };
  }, [uid, store]);

  const create = useCallback<DataContextValue['create']>(
    async (name, data) => {
      if (!uid) throw new Error('لا يوجد مستخدم مسجّل.');
      return store.create(uid, name, data);
    },
    [uid, store],
  );

  const update = useCallback<DataContextValue['update']>(
    async (name, id, patch) => {
      if (!uid) throw new Error('لا يوجد مستخدم مسجّل.');
      await store.update(uid, name, id, patch);
    },
    [uid, store],
  );

  const remove = useCallback<DataContextValue['remove']>(
    async (name, id) => {
      if (!uid) throw new Error('لا يوجد مستخدم مسجّل.');
      await store.remove(uid, name, id);
    },
    [uid, store],
  );

  const saveProfile = useCallback(
    async (next: Profile) => {
      if (!uid) throw new Error('لا يوجد مستخدم مسجّل.');
      await store.saveProfile(uid, { ...next, updatedAt: Date.now() });
      setProfile(next);
    },
    [uid, store],
  );

  const value = useMemo<DataContextValue>(
    () => ({
      ready: loadedCount >= 6,
      error,
      storeKind: store.kind,
      ...collections,
      profile,
      profileLoaded,
      create,
      update,
      remove,
      saveProfile,
      seedDemoData,
    }),
    [
      loadedCount,
      error,
      store.kind,
      collections,
      profile,
      profileLoaded,
      create,
      update,
      remove,
      saveProfile,
      seedDemoData,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = (): DataContextValue => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData يجب أن يُستخدم داخل DataProvider.');
  return context;
};

/** يتحقّق ما إذا كان الجهاز يحتاج زرع بيانات تجريبية (الوضع المحلي فقط). */
export const shouldOfferSeed = (uid: string | null, isLocal: boolean): boolean =>
  Boolean(uid) && isLocal && !hasLocalData(uid as string);
