/**
 * نقل دفتر الجهاز إلى الحساب السحابي، وتجهيز حساب سحابي جديد.
 *
 * الرفع يستعمل **نفس معرّف السجل** الذي كان على الجهاز، فإعادة الرفع لا تُنشئ
 * نسخة ثانية بل تكتب فوق نفس الوثيقة. ولا يُحذف من الجهاز شيء: تبقى النسخة
 * المحلية كما هي حتى يطمئنّ صاحبها أن كل شيء وصل.
 */
import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from './store';
import { defaultProfile, seedCustomProduct, seedMarketPrices, seedProducts } from './seed';
import type { Craft, CollectionName, PricingBasis, Profile, UserType } from '@/lib/types';

const KEY_PREFIX = 'herfah-pro:v1';

/** حدّ Firestore لعمليات الدفعة الواحدة؛ نبقى دونه بهامش. */
const BATCH_LIMIT = 400;

const requireDb = () => {
  if (!db) throw new Error('لم تُضبط إعدادات Firebase.');
  return db;
};

const readRows = (uid: string, name: CollectionName): Record<string, unknown>[] => {
  try {
    const raw = window.localStorage.getItem(`${KEY_PREFIX}:${uid}:${name}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : [];
  } catch {
    return [];
  }
};

const readLocalProfileRaw = (uid: string): Profile | null => {
  try {
    const raw = window.localStorage.getItem(`${KEY_PREFIX}:${uid}:profile`);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
};

export interface UploadResult {
  uploaded: number;
  profileMoved: boolean;
  /** مجموعات رفضها الخادم — تبقى على الجهاز سليمة حتى تُفتح لها الصلاحية. */
  refused: CollectionName[];
}

/**
 * يرفع كل سجلات دفتر محلي إلى حساب سحابي.
 *
 * الرفع مجزّأ مجموعةً مجموعة لا دفعةً واحدة: لو رفض الخادمُ مجموعةً (لأنّ قواعد
 * الأمان في المشروع أقدم من التطبيق ولا تعرفها بعد) وصل الباقي كاملاً بدل أن
 * تسقط الدفعة كلّها معها. ويُعاد اسم كل مجموعة مرفوضة ليُقال لصاحبها ما بقي.
 */
export const uploadToCloud = async (localUid: string, cloudUid: string): Promise<UploadResult> => {
  const database = requireDb();
  let uploaded = 0;
  const refused: CollectionName[] = [];

  for (const name of COLLECTIONS) {
    const rows = readRows(localUid, name).filter(
      (row) => typeof row.id === 'string' && row.id.length > 0,
    );
    if (rows.length === 0) continue;

    try {
      for (let start = 0; start < rows.length; start += BATCH_LIMIT) {
        const batch = writeBatch(database);
        for (const row of rows.slice(start, start + BATCH_LIMIT)) {
          // المعرّف يُنزع من جسم الوثيقة: Firestore يحمله في اسمها لا في حقولها،
          // واستعماله كاسم يجعل إعادة الرفع تكتب فوق نفسها بلا ازدواج.
          const { id, ...fields } = row;
          batch.set(doc(database, 'users', cloudUid, name, id as string), {
            ...fields,
            updatedAt: serverTimestamp(),
          });
        }
        await batch.commit();
        uploaded += Math.min(BATCH_LIMIT, rows.length - start);
      }
    } catch {
      refused.push(name);
    }
  }

  // ملف الورشة لا يُنقل إلا إذا كان الحساب السحابي بلا ملف — فلا يُطمس ما ضُبط هناك.
  let profileMoved = false;
  const localProfile = readLocalProfileRaw(localUid);
  if (localProfile) {
    try {
      const userRef = doc(database, 'users', cloudUid);
      const existing = await getDoc(userRef);
      if (!existing.exists() || !existing.data()?.profile) {
        const profileBatch = writeBatch(database);
        profileBatch.set(
          userRef,
          { profile: { ...localProfile, updatedAt: Date.now() }, updatedAt: serverTimestamp() },
          { merge: true },
        );
        await profileBatch.commit();
        profileMoved = true;
      }
    } catch {
      /* ملف العمل يُضبط من الإعدادات، وفشله لا يمنع وصول السجلات */
    }
  }

  return { uploaded, profileMoved, refused };
};

/* ------------------------------------------------ تجهيز حساب سحابي جديد */

export interface CloudTrade {
  displayName: string;
  userType: UserType;
  craft: Craft;
  customCraft: string;
  customMaterial: string;
  customBasis: PricingBasis;
}

/**
 * أوّل فتح لحساب سحابي: يُكتب ملف العمل من بيانات التسجيل، وتُزرع قوالب
 * التسعير وأسعار المواد التي تخصّ مهنته — نفس ما يحصل للحساب المحلي، حتى
 * يتكيّف التطبيق مع مهنته أيًّا كان مكان الحفظ.
 */
export const initCloudAccount = async (uid: string, trade: CloudTrade): Promise<void> => {
  const database = requireDb();
  const userRef = doc(database, 'users', uid);
  const existing = await getDoc(userRef);
  if (existing.exists() && existing.data()?.profile) return; // حساب مُجهَّز سابقاً

  const products =
    trade.craft === 'other'
      ? trade.userType === 'merchant'
        ? []
        : seedCustomProduct(
            trade.customCraft,
            trade.customBasis,
            defaultProfile({ craft: trade.craft }).defaultMarginPct,
          )
      : seedProducts(trade.craft);
  const prices = seedMarketPrices(trade.craft, trade.customMaterial);

  const now = Date.now();
  const stamp = (index: number) => now - index * 1000;

  const seedInto = async (name: CollectionName, rows: Record<string, unknown>[], prefix: string) => {
    if (rows.length === 0) return;
    const batch = writeBatch(database);
    rows.forEach((row, index) => {
      batch.set(doc(database, 'users', uid, name, `${prefix}-${index}`), {
        ...row,
        createdAt: stamp(index),
        updatedAt: stamp(index),
      });
    });
    // مجموعة يرفضها الخادم لا تمنع الحساب من الفتح — تُضبط يدوياً من صفحتها.
    await batch.commit().catch(() => undefined);
  };

  await seedInto('products', products as Record<string, unknown>[], 'seed-product');
  await seedInto('marketPrices', prices as Record<string, unknown>[], 'seed-price');

  const batch = writeBatch(database);
  batch.set(
    userRef,
    {
      profile: {
        ...defaultProfile({
          businessName: trade.displayName,
          userType: trade.userType,
          craft: trade.craft,
          customCraft: trade.customCraft,
          customMaterial: trade.customMaterial,
          customBasis: trade.customBasis,
        }),
        updatedAt: now,
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  await batch.commit();
};
