import type { Craft, MaterialKind, OrderStatus, UserType } from './types';

export const APP_NAME = 'حرفة برو';

export const USER_TYPES: { value: UserType; label: string }[] = [
  { value: 'craftsman', label: 'حرفي' },
  { value: 'merchant', label: 'تاجر' },
];

export const CRAFTS: { value: Craft; label: string; material: MaterialKind }[] = [
  { value: 'carpenter', label: 'نجّار', material: 'wood' },
  { value: 'blacksmith', label: 'حدّاد', material: 'iron' },
  { value: 'tailor', label: 'خيّاط', material: 'fabric' },
  { value: 'other', label: 'حرفة أخرى', material: 'other' },
];

export const ORDER_STATUSES: { value: OrderStatus; label: string; tone: string }[] = [
  { value: 'in_progress', label: 'جاري', tone: 'info' },
  { value: 'pending', label: 'معلّق', tone: 'warn' },
  { value: 'completed', label: 'مكتمل', tone: 'ok' },
];

export const MATERIAL_KINDS: { value: MaterialKind; label: string; unit: string }[] = [
  { value: 'wood', label: 'خشب', unit: 'متر مكعّب' },
  { value: 'iron', label: 'حديد', unit: 'طن' },
  { value: 'fabric', label: 'قماش', unit: 'متر' },
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

export const craftLabel = (craft: Craft): string =>
  CRAFTS.find((c) => c.value === craft)?.label ?? craft;

export const userTypeLabel = (type: UserType): string =>
  USER_TYPES.find((t) => t.value === type)?.label ?? type;

export const materialKindLabel = (kind: MaterialKind): string =>
  MATERIAL_KINDS.find((m) => m.value === kind)?.label ?? kind;
