/**
 * بيانات الموقع التعريفي العامّة: معرض الأعمال وإعداداته.
 *
 * تُقرأ من الموقع نفسه بلا تسجيل دخول، فهي خارج users/{uid}، ويكتبها المالك
 * وحده حسب قواعد firestore.rules. ولأنها عامّة فهي تحتاج Firebase — لا تعمل
 * في «وضع الجهاز».
 */
import { deleteDoc, doc, getDoc, getDocs, collection, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SiteConfig, SitePhoto } from '@/lib/types';

const requireDb = () => {
  if (!db) throw new Error('إدارة الموقع تحتاج ربط Firebase.');
  return db;
};

const configRef = () => doc(requireDb(), 'siteConfig', 'main');
const galleryRef = () => collection(requireDb(), 'siteGallery');

export interface SiteState {
  config: SiteConfig | null;
  photos: SitePhoto[];
}

export const loadSite = async (): Promise<SiteState> => {
  const [configSnap, gallerySnap] = await Promise.all([getDoc(configRef()), getDocs(galleryRef())]);
  return {
    config: configSnap.exists() ? (configSnap.data() as SiteConfig) : null,
    photos: gallerySnap.docs
      .map((entry) => entry.data() as SitePhoto)
      .sort((a, b) => b.createdAt - a.createdAt),
  };
};

/** أول مطالبة بالموقع: تثبّت الحساب الحالي مالكاً. تنجح مرّة واحدة فقط. */
export const claimSite = async (uid: string): Promise<SiteConfig> => {
  const config: SiteConfig = {
    ownerUid: uid,
    whatsapp: '',
    galleryNote: '',
    updatedAt: Date.now(),
  };
  await setDoc(configRef(), config);
  return config;
};

export const saveSiteConfig = async (config: SiteConfig): Promise<void> => {
  await updateDoc(configRef(), { ...config, updatedAt: Date.now() });
};

export const saveSitePhoto = async (photo: SitePhoto): Promise<void> => {
  await setDoc(doc(galleryRef(), photo.id), photo);
};

export const deleteSitePhoto = async (id: string): Promise<void> => {
  await deleteDoc(doc(galleryRef(), id));
};
