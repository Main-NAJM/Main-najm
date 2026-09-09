import type { Material, OrderStatus, PricingUnit } from './types';

export const APP_NAME = 'مؤسسة الباشة للمعادن';
export const APP_SHORT = 'الباشة';

/** مبلغ بالعملة المختارة، بلا كسور لأن التعامل بالدينار الجزائري. */
export const money = (value: number, currency = 'د.ج'): string =>
  `${new Intl.NumberFormat('ar-DZ', { maximumFractionDigits: 0 }).format(Math.round(value))} ${currency}`;

export const decimal = (value: number, digits = 2): string =>
  new Intl.NumberFormat('ar-DZ', { maximumFractionDigits: digits }).format(value);

const dateFormatter = new Intl.DateTimeFormat('ar-DZ', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export const formatDate = (value: string | number | null | undefined): string => {
  if (!value) return '—';
  const date = typeof value === 'number' ? new Date(value) : new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
};

export const todayISO = (): string => new Date().toISOString().slice(0, 10);

export const STATUS_LABEL: Record<OrderStatus, string> = {
  quote: 'عرض سعر',
  confirmed: 'قيد التنفيذ',
  ready: 'جاهز للتركيب',
  installed: 'مركّب ومسلّم',
  cancelled: 'ملغى',
};

export const STATUS_TONE: Record<OrderStatus, string> = {
  quote: 'info',
  confirmed: 'warn',
  ready: 'brand',
  installed: 'ok',
  cancelled: 'muted',
};

export const MATERIAL_LABEL: Record<Material, string> = {
  aluminium: 'ألمنيوم',
  iron: 'حديد',
  mixed: 'ألمنيوم وحديد',
};

export const UNIT_LABEL: Record<PricingUnit, string> = {
  m2: 'بالمتر المربّع',
  piece: 'بالقطعة',
};

/** رقم جزائري بصيغة دولية لروابط واتساب: 0673… ← 213673… */
export const waNumber = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('213')) return digits;
  if (digits.startsWith('0')) return `213${digits.slice(1)}`;
  return `213${digits}`;
};

/** معرّف قصير يكفي لمفاتيح محلّية ولوثائق Firestore. */
export const newId = (): string =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
