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
import { localStore } from '@/data/localStore';
import { firestoreStore } from '@/data/firestoreStore';
import { DEFAULT_PROFILE, type Store } from '@/data/store';
import type { Backup, Customer, Order, WorkshopProfile } from '@/lib/types';

interface DataContextValue {
  customers: Customer[];
  orders: Order[];
  profile: WorkshopProfile;
  loading: boolean;
  error: string | null;
  storeKind: 'local' | 'firestore';
  saveCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  saveOrder: (order: Order) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  saveProfile: (profile: WorkshopProfile) => Promise<void>;
  exportBackup: () => Backup;
  importBackup: (backup: Backup) => Promise<void>;
  reload: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

const sortByCreated = <T extends { createdAt: number }>(list: T[]): T[] =>
  list.slice().sort((a, b) => b.createdAt - a.createdAt);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const isLocal = Boolean(user?.isLocal);
  const store: Store = isLocal ? localStore : firestoreStore;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<WorkshopProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!uid) {
      setCustomers([]);
      setOrders([]);
      setProfile(DEFAULT_PROFILE);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const snapshot = await store.load(uid);
      setCustomers(sortByCreated(snapshot.customers));
      setOrders(sortByCreated(snapshot.orders));
      setProfile(snapshot.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر تحميل البيانات.');
    } finally {
      setLoading(false);
    }
  }, [store, uid]);

  useEffect(() => {
    void load();
  }, [load]);

  // كل عملية تُحدّث الحالة فوراً ثم تُحفظ، فتبقى الواجهة سريعة.
  const saveCustomer = useCallback(
    async (customer: Customer) => {
      if (!uid) return;
      setCustomers((list) => {
        const index = list.findIndex((entry) => entry.id === customer.id);
        if (index < 0) return [customer, ...list];
        const copy = list.slice();
        copy[index] = customer;
        return copy;
      });
      await store.saveCustomer(uid, customer);
    },
    [store, uid],
  );

  const deleteCustomer = useCallback(
    async (id: string) => {
      if (!uid) return;
      setCustomers((list) => list.filter((entry) => entry.id !== id));
      await store.deleteCustomer(uid, id);
    },
    [store, uid],
  );

  const saveOrder = useCallback(
    async (order: Order) => {
      if (!uid) return;
      setOrders((list) => {
        const index = list.findIndex((entry) => entry.id === order.id);
        if (index < 0) return [order, ...list];
        const copy = list.slice();
        copy[index] = order;
        return copy;
      });
      await store.saveOrder(uid, order);
    },
    [store, uid],
  );

  const deleteOrder = useCallback(
    async (id: string) => {
      if (!uid) return;
      setOrders((list) => list.filter((entry) => entry.id !== id));
      await store.deleteOrder(uid, id);
    },
    [store, uid],
  );

  const saveProfile = useCallback(
    async (next: WorkshopProfile) => {
      if (!uid) return;
      setProfile(next);
      await store.saveProfile(uid, next);
    },
    [store, uid],
  );

  const exportBackup = useCallback(
    (): Backup => ({
      version: 1,
      exportedAt: Date.now(),
      customers,
      orders,
      profile,
    }),
    [customers, orders, profile],
  );

  const importBackup = useCallback(
    async (backup: Backup) => {
      if (!uid) return;
      await store.restore(uid, backup);
      setCustomers(sortByCreated(backup.customers));
      setOrders(sortByCreated(backup.orders));
      setProfile(backup.profile);
    },
    [store, uid],
  );

  const value = useMemo<DataContextValue>(
    () => ({
      customers,
      orders,
      profile,
      loading,
      error,
      storeKind: isLocal ? 'local' : 'firestore',
      saveCustomer,
      deleteCustomer,
      saveOrder,
      deleteOrder,
      saveProfile,
      exportBackup,
      importBackup,
      reload: load,
    }),
    [
      customers,
      orders,
      profile,
      loading,
      error,
      isLocal,
      saveCustomer,
      deleteCustomer,
      saveOrder,
      deleteOrder,
      saveProfile,
      exportBackup,
      importBackup,
      load,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = (): DataContextValue => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData يجب أن يُستخدم داخل DataProvider.');
  return context;
};
