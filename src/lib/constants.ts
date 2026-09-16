import type { MaterialKind, OrderStatus, PricingBasis, UserType } from './types';

export const APP_NAME = 'حرفة برو';

export const USER_TYPES: { value: UserType; label: string }[] = [
  { value: 'craftsman', label: 'حرفي' },
  { value: 'merchant', label: 'تاجر' },
];

export const ORDER_STATUSES: { value: OrderStatus; label: string; tone: string }[] = [
  { value: 'in_progress', label: 'جاري', tone: 'info' },
  { value: 'pending', label: 'معلّق', tone: 'warn' },
  { value: 'completed', label: 'مكتمل', tone: 'ok' },
];

export const MATERIAL_KINDS: { value: MaterialKind; label: string; unit: string }[] = [
  { value: 'wood', label: 'خشب', unit: 'متر مكعّب' },
  { value: 'iron', label: 'حديد', unit: 'طن' },
  { value: 'aluminium', label: 'ألمنيوم', unit: 'متر' },
  { value: 'glass', label: 'زجاج', unit: 'متر مربّع' },
  { value: 'fabric', label: 'قماش', unit: 'متر' },
  { value: 'building', label: 'مواد بناء', unit: 'وحدة' },
  { value: 'parts', label: 'قطع غيار', unit: 'قطعة' },
  { value: 'other', label: 'مواد أخرى', unit: 'وحدة' },
];

export const CURRENCIES = [
  { code: 'د.ع', label: 'دينار عراقي (د.ع)' },
  { code: 'ر.س', label: 'ريال سعودي (ر.س)' },
  { code: 'د.إ', label: 'درهم إماراتي (د.إ)' },
  { code: 'ج.م', label: 'جنيه مصري (ج.م)' },
  { code: 'د.أ', label: 'دينار أردني (د.أ)' },
  { code: 'ل.س', label: 'ليرة سورية (ل.س)' },
  { code: 'د.ك', label: 'دينار كويتي (د.ك)' },
  { code: 'ر.ي', label: 'ريال يمني (ر.ي)' },
  { code: 'د.ت', label: 'دينار تونسي (د.ت)' },
  { code: 'د.ج', label: 'دينار جزائري (د.ج)' },
  { code: 'د.ل', label: 'دينار ليبي (د.ل)' },
  { code: 'د.م', label: 'درهم مغربي (د.م)' },
  { code: 'ر.ع', label: 'ريال عُماني (ر.ع)' },
  { code: 'د.ب', label: 'دينار بحريني (د.ب)' },
  { code: 'ر.ق', label: 'ريال قطري (ر.ق)' },
  { code: 'USD', label: 'دولار أمريكي (USD)' },
];

export const orderStatusLabel = (status: OrderStatus): string =>
  ORDER_STATUSES.find((s) => s.value === status)?.label ?? status;

export const orderStatusTone = (status: OrderStatus): string =>
  ORDER_STATUSES.find((s) => s.value === status)?.tone ?? 'muted';

export const userTypeLabel = (type: UserType): string =>
  USER_TYPES.find((t) => t.value === type)?.label ?? type;

/**
 * اسم صنف المادة. صنف «مواد أخرى» يحمل الاسم الذي كتبه صاحب الحساب لمادّته
 * (جلد، رخام، بلاستيك…) متى كتبه، فتُعرض صفحاته بلغته لا بكلمة عامّة.
 */
export const materialKindLabel = (kind: MaterialKind, custom?: string): string => {
  const typed = custom?.trim();
  if (kind === 'other' && typed) return typed;
  return MATERIAL_KINDS.find((m) => m.value === kind)?.label ?? kind;
};

/* ------------------------------------------------- أسس تسعير المنتجات */

export const PRICING_BASES: {
  value: PricingBasis;
  label: string;
  unit: string;
  /** المقاسات التي يحتاجها هذا الأساس فعلاً. */
  needs: ('width' | 'height' | 'depth')[];
  hint: string;
}[] = [
  {
    value: 'area',
    label: 'بالمتر المربّع',
    unit: 'م²',
    needs: ['width', 'height'],
    hint: 'العرض × الارتفاع — أبواب، نوافذ، خزائن، ستائر',
  },
  {
    value: 'length',
    label: 'بالمتر الطولي',
    unit: 'م.ط',
    needs: ['width'],
    hint: 'العرض وحده — دربزين، إفريز، حواف',
  },
  {
    value: 'volume',
    label: 'بالمتر المكعّب',
    unit: 'م³',
    needs: ['width', 'height', 'depth'],
    hint: 'العرض × الارتفاع × العمق — كتل ومقاطع خشبية',
  },
  {
    value: 'weight',
    label: 'بالوزن (كغ)',
    unit: 'كغ',
    needs: ['width', 'height', 'depth'],
    hint: 'يُحسب الحجم ثم يُضرب في كثافة المادة — حديد بالوزن',
  },
  {
    value: 'unit',
    label: 'بالقطعة',
    unit: 'قطعة',
    needs: [],
    hint: 'سعر ثابت لا يتبع المقاس',
  },
];

export const basisLabel = (basis: PricingBasis): string =>
  PRICING_BASES.find((b) => b.value === basis)?.label ?? basis;

export const basisNeeds = (basis: PricingBasis): ('width' | 'height' | 'depth')[] =>
  PRICING_BASES.find((b) => b.value === basis)?.needs ?? [];

/** كثافات تقريبية (كغ/م³) تُقترح عند اختيار التسعير بالوزن. */
export const DENSITY_HINTS: { label: string; value: number }[] = [
  { label: 'حديد', value: 7850 },
  { label: 'ألمنيوم', value: 2700 },
  { label: 'خشب صلب', value: 700 },
  { label: 'خشب MDF', value: 750 },
  { label: 'زجاج', value: 2500 },
  { label: 'خرسانة', value: 2400 },
];
