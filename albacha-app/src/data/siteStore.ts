/**
 * بيانات الموقع التعريفي العامّة: معرض الأعمال وإعداداته.
 *
 * تُقرأ من الموقع نفسه بلا تسجيل دخول، فهي خارج users/{uid}، ويكتبها المالك
 * وحده حسب قواعد firestore.rules. ولأنها عامّة فهي تحتاج Firebase — لا تعمل
 * في «وضع الجهاز».
 */
import { deleteDoc, doc, getDoc, getDocs, collection, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SiteConfig, SitePhoto, SiteRequest } from '@/lib/types';

const requireDb = () => {
  if (!db) throw new Error('إدارة الموقع تحتاج ربط Firebase.');
  return db;
};

const configRef = () => doc(requireDb(), 'siteConfig', 'main');
const galleryRef = () => collection(requireDb(), 'siteGallery');
const requestsRef = () => collection(requireDb(), 'siteRequests');

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

/** طلبات عروض الأسعار الواردة من نموذج الموقع، الأحدث أولاً. */
export const loadRequests = async (): Promise<SiteRequest[]> => {
  const snap = await getDocs(requestsRef());
  return snap.docs
    .map((entry) => entry.data() as SiteRequest)
    .sort((a, b) => b.createdAt - a.createdAt);
};

/** عدد الطلبات التي لم تُعالَج بعد — للشارة في الرئيسية والمزيد. */
export const countNewRequests = async (): Promise<number> => {
  const list = await loadRequests();
  return list.filter((entry) => entry.status === 'new').length;
};

export const markRequestDone = async (id: string): Promise<void> => {
  await updateDoc(doc(requestsRef(), id), { status: 'done' });
};

export const deleteRequest = async (id: string): Promise<void> => {
  await deleteDoc(doc(requestsRef(), id));
};
