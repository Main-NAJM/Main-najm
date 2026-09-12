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
import { localStore, readDeviceBackup, readDevicePhotos } from '@/data/localStore';
import { firestoreStore } from '@/data/firestoreStore';
import { DEFAULT_PROFILE, type Store } from '@/data/store';
import type { Backup, Customer, Material, Order, Photo, WorkshopProfile } from '@/lib/types';

interface DataContextValue {
  customers: Customer[];
  orders: Order[];
  materials: Material[];
  profile: WorkshopProfile;
  loading: boolean;
  error: string | null;
  storeKind: 'local' | 'firestore';
  saveCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  saveOrder: (order: Order) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  saveMaterial: (material: Material) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  loadPhotos: (orderId: string) => Promise<Photo[]>;
  savePhoto: (photo: Photo) => Promise<void>;
  deletePhoto: (photo: Photo) => Promise<void>;
  saveProfile: (profile: WorkshopProfile) => Promise<void>;
  exportBackup: () => Backup;
  importBackup: (backup: Backup) => Promise<void>;
  reload: () => Promise<void>;
  /** بيانات أُدخلت على الجهاز قبل الدخول بحساب، تنتظر قرار صاحبها. */
  deviceBackup: Backup | null;
  adoptDeviceData: () => Promise<void>;
  dismissDeviceData: () => void;
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
  const [materials, setMaterials] = useState<Material[]>([]);
  const [profile, setProfile] = useState<WorkshopProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deviceBackup, setDeviceBackup] = useState<Backup | null>(null);

  const load = useCallback(async () => {
    if (!uid) {
      setCustomers([]);
      setOrders([]);
      setMaterials([]);
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
      setMaterials(snapshot.materials.slice().sort((a, b) => a.name.localeCompare(b.name, 'ar')));
      setProfile(snapshot.profile);
      // حساب فارغ وعلى الجهاز بيانات سابقة: تُعرض على صاحبها بدل أن تضيع منه.
      const empty =
        !snapshot.customers.length && !snapshot.orders.length && !snapshot.materials.length;
      setDeviceBackup(!isLocal && empty ? readDeviceBackup() : null);
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

  const saveMaterial = useCallback(
    async (material: Material) => {
      if (!uid) return;
      await store.saveMaterial(uid, material);
      setMaterials((list) => {
        const index = list.findIndex((entry) => entry.id === material.id);
        const next = index < 0 ? [...list, material] : list.map((e, i) => (i === index ? material : e));
        return next.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
      });
    },
    [store, uid],
  );

  const deleteMaterial = useCallback(
    async (id: string) => {
      if (!uid) return;
      setMaterials((list) => list.filter((entry) => entry.id !== id));
      await store.deleteMaterial(uid, id);
    },
    [store, uid],
  );

  const loadPhotos = useCallback(
    async (orderId: string) => (uid ? store.loadPhotos(uid, orderId) : []),
    [store, uid],
  );

  const savePhoto = useCallback(
    async (photo: Photo) => {
      if (!uid) return;
      await store.savePhoto(uid, photo);
    },
    [store, uid],
  );

  const deletePhoto = useCallback(
    async (photo: Photo) => {
      if (!uid) return;
      await store.deletePhoto(uid, photo);
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
      materials,
      profile,
    }),
    [customers, orders, materials, profile],
  );

  const importBackup = useCallback(
    async (backup: Backup) => {
      if (!uid) return;
      await store.restore(uid, backup);
      setCustomers(sortByCreated(backup.customers));
      setOrders(sortByCreated(backup.orders));
      setMaterials(backup.materials ?? []);
      setProfile(backup.profile);
    },
    [store, uid],
  );

  /** نقل بيانات الجهاز إلى الحساب، ومعها صور الطلبات. */
  const adoptDeviceData = useCallback(async () => {
    if (!uid || !deviceBackup) return;
    await store.restore(uid, deviceBackup);
    for (const order of deviceBackup.orders) {
      for (const photo of readDevicePhotos(order.id)) {
        await store.savePhoto(uid, photo);
      }
    }
    setCustomers(sortByCreated(deviceBackup.customers));
    setOrders(sortByCreated(deviceBackup.orders));
    setMaterials(deviceBackup.materials ?? []);
    setProfile(deviceBackup.profile);
    setDeviceBackup(null);
  }, [store, uid, deviceBackup]);

  // لا تُحذف بيانات الجهاز بالتجاهل — تبقى مكانها ويعود العرض عند الدخول مجدّداً.
  const dismissDeviceData = useCallback(() => setDeviceBackup(null), []);

  const value = useMemo<DataContextValue>(
    () => ({
      customers,
      orders,
      materials,
      profile,
      loading,
      error,
      storeKind: isLocal ? 'local' : 'firestore',
      saveCustomer,
      deleteCustomer,
      saveOrder,
      deleteOrder,
      saveMaterial,
      deleteMaterial,
      loadPhotos,
      savePhoto,
      deletePhoto,
      saveProfile,
      exportBackup,
      importBackup,
      reload: load,
      deviceBackup,
      adoptDeviceData,
      dismissDeviceData,
    }),
    [
      customers,
      orders,
      materials,
      profile,
      loading,
      error,
      isLocal,
      saveCustomer,
      deleteCustomer,
      saveOrder,
      deleteOrder,
      saveMaterial,
      deleteMaterial,
      loadPhotos,
      savePhoto,
      deletePhoto,
      saveProfile,
      exportBackup,
      importBackup,
      load,
      deviceBackup,
      adoptDeviceData,
      dismissDeviceData,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = (): DataContextValue => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData يجب أن يُستخدم داخل DataProvider.');
  return context;
};
