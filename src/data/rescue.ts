/**
 * حماية بيانات الجهاز واستعادتها.
 *
 * بيانات حرفة برو تعيش في تخزين المتصفّح. هذا التخزين قابل للفقدان بثلاث طرق
 * رأيناها فعلاً:
 *
 *   ١. المتصفّح يحذف بيانات الموقع وحده حين تضيق مساحة الهاتف، ما لم يُطلب منه
 *      صراحةً اعتبارها «دائمة». الطلب يتمّ في requestPersistence أدناه.
 *   ٢. صاحب الجهاز ينشئ حساباً ثانياً (برقم بدل بريد مثلاً) فيفتح على دفتر فارغ
 *      بينما دفتره الأوّل سليم تحت معرّف آخر. scanDevice يجده ويعيده.
 *   ٣. حذف التطبيق أو مسح بيانات التصفّح يمحو كل شيء. لا يحمي منه إلا ملف نسخة
 *      احتياطية خارج الجهاز، ولذلك يُلحّ التطبيق عليه.
 *
 * ولأنّ خللاً في التطبيق نفسه قد يُفرغ مجموعة، تُحفظ لقطة تلقائية آخر يوم
 * (snapshot) ولا تُستبدل أبداً بلقطة أفقر منها — فالفارغ لا يطمس الممتلئ.
 */
import { COLLECTIONS } from './store';
import type { CollectionName } from '@/lib/types';

const KEY_PREFIX = 'herfah-pro:v1';
const SNAPSHOT_PREFIX = `${KEY_PREFIX}:snapshot:`;
const BACKUP_AT_KEY = `${KEY_PREFIX}:last-backup-at`;

/* --------------------------------------------------------- تخزين دائم */

export type PersistState = 'persisted' | 'denied' | 'unsupported';

/**
 * يطلب من المتصفّح ألّا يحذف بيانات هذا الموقع تلقائياً عند ضيق المساحة.
 * الرفض ليس خطأً: بعض المتصفّحات تمنحه فقط بعد تثبيت التطبيق أو تكرار زيارته.
 */
export const requestPersistence = async (): Promise<PersistState> => {
  try {
    if (!navigator.storage?.persist) return 'unsupported';
    if (await navigator.storage.persisted()) return 'persisted';
    return (await navigator.storage.persist()) ? 'persisted' : 'denied';
  } catch {
    return 'unsupported';
  }
};

export const persistenceState = async (): Promise<PersistState> => {
  try {
    if (!navigator.storage?.persisted) return 'unsupported';
    return (await navigator.storage.persisted()) ? 'persisted' : 'denied';
  } catch {
    return 'unsupported';
  }
};

/* ------------------------------------------------------- مسح الجهاز */

export interface DeviceDataSet {
  uid: string;
  /** عدد السجلات في كل مجموعة، بلا المجموعات الفارغة. */
  counts: { name: CollectionName; label: string; count: number }[];
  total: number;
  /** السجلات التي أدخلها صاحب الدفتر بنفسه — بلا القوالب والأسعار المزروعة
   *  تلقائياً لكل حساب جديد، فوجودها لا يدلّ على عمل محفوظ. */
  workTotal: number;
  /** اسم الورشة المحفوظ مع هذه البيانات، إن وُجد — يعرّف صاحبها. */
  businessName: string;
  /** آخر تعديل معروف على أي سجل. */
  updatedAt: number;
  source: 'account' | 'snapshot';
}

/** مجموعات تُزرع تلقائياً عند إنشاء أي حساب، فلا تُحتسب «عملاً محفوظاً». */
const SEEDED: CollectionName[] = ['products', 'marketPrices'];

const COLLECTION_LABELS: Record<CollectionName, string> = {
  orders: 'طلبية',
  products: 'قالب تسعير',
  inventory: 'سلعة',
  expenses: 'مصروف',
  workers: 'عامل',
  appointments: 'موعد',
  calculations: 'حساب تكلفة',
  marketPrices: 'سعر مادة',
  debts: 'دين',
};

const readJson = <T>(key: string, fallback: T): T => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

type Row = { id?: string; updatedAt?: number; createdAt?: number };

const readRows = (uid: string, name: CollectionName): Row[] => {
  const rows = readJson<unknown>(`${KEY_PREFIX}:${uid}:${name}`, []);
  return Array.isArray(rows) ? (rows as Row[]) : [];
};

const describe = (
  uid: string,
  read: (name: CollectionName) => Row[],
  source: DeviceDataSet['source'],
): DeviceDataSet => {
  let total = 0;
  let workTotal = 0;
  let updatedAt = 0;
  const counts: DeviceDataSet['counts'] = [];
  COLLECTIONS.forEach((name) => {
    const rows = read(name);
    if (rows.length === 0) return;
    total += rows.length;
    if (!SEEDED.includes(name)) workTotal += rows.length;
    rows.forEach((row) => {
      const stamp = row.updatedAt ?? row.createdAt ?? 0;
      if (stamp > updatedAt) updatedAt = stamp;
    });
    counts.push({ name, label: COLLECTION_LABELS[name], count: rows.length });
  });
  const profile = readJson<{ businessName?: string } | null>(`${KEY_PREFIX}:${uid}:profile`, null);
  return {
    uid,
    counts,
    total,
    workTotal,
    businessName: profile?.businessName ?? '',
    updatedAt,
    source,
  };
};

/**
 * كل مجموعة بيانات محفوظة على هذا الجهاز لا تخصّ الحساب المفتوح الآن: دفاتر
 * حسابات أخرى، أو دفتر «تجربة بدون حساب» القديم، أو لقطة تلقائية لحساب مُفرَّغ.
 */
export const scanDevice = (currentUid: string): DeviceDataSet[] => {
  const found = new Map<string, DeviceDataSet>();
  try {
    const uids = new Set<string>();
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(`${KEY_PREFIX}:`)) continue;
      const rest = key.slice(KEY_PREFIX.length + 1);
      const split = rest.lastIndexOf(':');
      if (split <= 0) continue;
      const uid = rest.slice(0, split);
      const tail = rest.slice(split + 1);
      if (uid === currentUid) continue;
      if (!COLLECTIONS.includes(tail as CollectionName)) continue;
      uids.add(uid);
    }
    uids.forEach((uid) => {
      const set = describe(uid, (name) => readRows(uid, name), 'account');
      if (set.total > 0) found.set(uid, set);
    });

    // لقطة الحساب الحالي: تُعرض فقط إن كانت أغنى مما يراه صاحبها الآن.
    const live = describe(currentUid, (name) => readRows(currentUid, name), 'account');
    const snapshot = readSnapshot(currentUid);
    if (snapshot && snapshot.workTotal > live.workTotal) {
      found.set(`${currentUid}#snapshot`, snapshot);
    }
  } catch {
    /* التخزين محجوب — لا شيء نعرضه */
  }
  return [...found.values()].sort((a, b) => b.updatedAt - a.updatedAt);
};

/* ------------------------------------------------------ اللقطة التلقائية */

interface Snapshot {
  at: number;
  data: Record<string, Row[]>;
  profile: unknown;
}

const readSnapshotRaw = (uid: string): Snapshot | null => {
  const value = readJson<Snapshot | null>(`${SNAPSHOT_PREFIX}${uid}`, null);
  return value && typeof value === 'object' && value.data ? value : null;
};

export const readSnapshot = (uid: string): DeviceDataSet | null => {
  const snapshot = readSnapshotRaw(uid);
  if (!snapshot) return null;
  const set = describe(
    uid,
    (name) => (Array.isArray(snapshot.data[name]) ? snapshot.data[name] : []),
    'snapshot',
  );
  if (set.workTotal === 0) return null;
  return { ...set, uid: `${uid}#snapshot`, updatedAt: snapshot.at };
};

/**
 * يحفظ لقطة لبيانات الحساب مرّة كل يوم على الأكثر.
 *
 * القاعدة التي تجعلها مفيدة: لا تُكتب لقطة أفقر من المحفوظة. لو أفرغ خللٌ
 * البياناتِ ثم فُتح التطبيق، تبقى اللقطة السابقة سليمة تنتظر الاستعادة.
 */
export const writeSnapshot = (uid: string): void => {
  try {
    const data: Record<string, Row[]> = {};
    let total = 0;
    COLLECTIONS.forEach((name) => {
      const rows = readRows(uid, name);
      data[name] = rows;
      total += rows.length;
    });
    if (total === 0) return;

    const previous = readSnapshotRaw(uid);
    if (previous) {
      const previousTotal = Object.values(previous.data).reduce(
        (sum, rows) => sum + (Array.isArray(rows) ? rows.length : 0),
        0,
      );
      if (total < previousTotal) return; // الفارغ لا يطمس الممتلئ
      if (Date.now() - previous.at < 20 * 60 * 60 * 1000) return; // مرّة في اليوم تكفي
    }

    const payload: Snapshot = {
      at: Date.now(),
      data,
      profile: readJson(`${KEY_PREFIX}:${uid}:profile`, null),
    };
    window.localStorage.setItem(`${SNAPSHOT_PREFIX}${uid}`, JSON.stringify(payload));
  } catch {
    /* المساحة ممتلئة أو التخزين محجوب — اللقطة رفاهية لا تُعطّل العمل */
  }
};

/** الحذف المتعمَّد يحذف اللقطة أيضاً: «حذف كل البيانات» يجب أن يعني ما يقول. */
export const clearSnapshot = (uid: string): void => {
  try {
    window.localStorage.removeItem(`${SNAPSHOT_PREFIX}${uid}`);
  } catch {
    /* لا شيء نفعله */
  }
};

/* ----------------------------------------------------------- الاستعادة */

export interface MergeResult {
  added: number;
  skipped: number;
}

/**
 * يضمّ دفتراً آخر إلى الحساب المفتوح دون أن يمسّ ما فيه: السجل الموجود بنفس
 * المعرّف يُترك كما هو، والباقي يُضاف. فالاستعادة لا تُفقد شيئاً أبداً.
 */
export const mergeInto = (fromUid: string, toUid: string): MergeResult => {
  const snapshotSource = fromUid.endsWith('#snapshot');
  const sourceUid = snapshotSource ? fromUid.slice(0, -'#snapshot'.length) : fromUid;
  const snapshot = snapshotSource ? readSnapshotRaw(sourceUid) : null;
  if (snapshotSource && !snapshot) return { added: 0, skipped: 0 };

  let added = 0;
  let skipped = 0;

  COLLECTIONS.forEach((name) => {
    const incoming = snapshot
      ? Array.isArray(snapshot.data[name])
        ? snapshot.data[name]
        : []
      : readRows(sourceUid, name);
    if (incoming.length === 0) return;

    const targetKey = `${KEY_PREFIX}:${toUid}:${name}`;
    const existing = readRows(toUid, name);
    const ids = new Set(existing.map((row) => row.id));
    const merged = [...existing];
    incoming.forEach((row) => {
      if (row.id && ids.has(row.id)) {
        skipped += 1;
        return;
      }
      merged.push(row);
      if (row.id) ids.add(row.id);
      added += 1;
    });
    window.localStorage.setItem(targetKey, JSON.stringify(merged));
    // localStorage لا يُطلق حدثاً على النافذة التي كتبت فيه، فنُطلقه بأنفسنا
    // ليلتقطه مخزن التطبيق ويُحدّث الشاشة فوراً بلا إعادة تحميل.
    window.dispatchEvent(new StorageEvent('storage', { key: targetKey }));
  });

  return { added, skipped };
};

/* ------------------------------------------------- تذكير النسخة الاحتياطية */

export const markBackupTaken = (): void => {
  try {
    window.localStorage.setItem(BACKUP_AT_KEY, String(Date.now()));
  } catch {
    /* لا شيء نفعله */
  }
};

export const lastBackupAt = (): number | null => {
  try {
    const raw = window.localStorage.getItem(BACKUP_AT_KEY);
    const value = raw ? Number(raw) : 0;
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
};

/** بعد كم يوم تُعدّ النسخة الاحتياطية قديمة ويُذكَّر بها. */
export const BACKUP_STALE_DAYS = 7;

export const backupIsStale = (): boolean => {
  const at = lastBackupAt();
  if (at === null) return true;
  return Date.now() - at > BACKUP_STALE_DAYS * 24 * 60 * 60 * 1000;
};
