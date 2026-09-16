/**
 * المهن وما يبنيه التطبيق عليها.
 *
 * المهنة تُختار مرّة عند إنشاء الحساب (وتُغيَّر لاحقاً من الإعدادات)، وتقرّر:
 * قوالب المنتجات التي تُزرع، وصنف المواد في مؤشّر الأسعار، وأجرة الساعة ونسبة
 * الربح الافتراضيتين في الحاسبة، والكلمات المعروضة في الواجهة.
 */
import { BlacksmithIcon, CarpenterIcon, CraftIcon, TailorIcon } from '@/components/icons';
import type { Craft, MaterialKind, UserType } from './types';

interface TradeChoice {
  craft: Craft;
  /** اسم المهنة حين يكون صاحبها حرفياً. */
  craftLabel: string;
  /** اسمها حين يكون صاحبها تاجراً. */
  merchantLabel: string;
  material: MaterialKind;
  Icon: typeof CarpenterIcon;
  /** قوالب المنتجات التي تُزرع لهذه الحرفة — تُعرض بالاسم في شاشة التسجيل. */
  products: string[];
  /** أسطر مؤشّر الأسعار التي تُزرع. */
  prices: string[];
  defaultLaborRate: number;
  defaultMarginPct: number;
}

export const TRADE_CHOICES: TradeChoice[] = [
  {
    craft: 'carpenter',
    craftLabel: 'نجّار',
    merchantLabel: 'تاجر خشب',
    material: 'wood',
    Icon: CarpenterIcon,
    products: ['باب خشب داخلي', 'خزانة ملابس'],
    prices: ['لوح MDF ١٨ ملم', 'خشب زان'],
    defaultLaborRate: 5000,
    defaultMarginPct: 25,
  },
  {
    craft: 'blacksmith',
    craftLabel: 'حدّاد',
    merchantLabel: 'تاجر حديد',
    material: 'iron',
    Icon: BlacksmithIcon,
    products: ['باب حديد', 'دربزين حديد'],
    prices: ['حديد تسليح ١٢ ملم', 'مقطع حديد مربّع'],
    defaultLaborRate: 6000,
    defaultMarginPct: 22,
  },
  {
    craft: 'tailor',
    craftLabel: 'خيّاط',
    merchantLabel: 'تاجر أقمشة',
    material: 'fabric',
    Icon: TailorIcon,
    products: ['ستارة قماش', 'بدلة عمل'],
    prices: ['قماش قطن', 'قماش جبردين'],
    defaultLaborRate: 3000,
    defaultMarginPct: 30,
  },
  {
    craft: 'other',
    craftLabel: 'حرفة أخرى',
    merchantLabel: 'تجارة أخرى',
    material: 'other',
    Icon: CraftIcon,
    products: [],
    prices: [],
    defaultLaborRate: 5000,
    defaultMarginPct: 25,
  },
];

const FALLBACK = TRADE_CHOICES[TRADE_CHOICES.length - 1];

export const tradeFor = (craft: Craft): TradeChoice =>
  TRADE_CHOICES.find((choice) => choice.craft === craft) ?? FALLBACK;

/** اسم المهنة كما يُعرض: يختلف بين الحرفي والتاجر. */
export const tradeLabel = (userType: UserType, craft: Craft): string => {
  const choice = tradeFor(craft);
  return userType === 'merchant' ? choice.merchantLabel : choice.craftLabel;
};

/** صنف المواد الذي يهمّ صاحب هذه المهنة في مؤشّر الأسعار. */
export const tradeMaterial = (craft: Craft): MaterialKind => tradeFor(craft).material;

export interface TradeSummary extends TradeChoice {
  label: string;
  /** ما سيجده المستخدم جاهزاً عند أوّل فتح — يطابق ما يزرعه data/seed. */
  prepares: string[];
}

/** وصف ما يجهّزه التطبيق لهذه المهنة — يُعرض قبل تأكيد إنشاء الحساب. */
export const tradeChoice = (userType: UserType, craft: Craft): TradeSummary => {
  const choice = tradeFor(craft);
  const prepares: string[] = [];

  if (choice.products.length > 0 && userType !== 'merchant') {
    prepares.push(`قوالب تسعير جاهزة: ${choice.products.join('، ')}`);
  }
  if (choice.prices.length > 0) {
    prepares.push(`مؤشّر أسعار ${materialWord(choice.material)}: ${choice.prices.join('، ')}`);
  }
  prepares.push(
    userType === 'merchant'
      ? 'سجلّ ديون وفواتير باسم متجرك'
      : `نسبة ربح ${choice.defaultMarginPct}٪ وأجرة ساعة مبدئية في الحاسبة`,
  );
  if (choice.craft === 'other') {
    prepares.push('صفحات فارغة تضيف إليها قوالبك وأسعارك بنفسك');
  }

  return { ...choice, label: tradeLabel(userType, craft), prepares };
};

const materialWord = (material: MaterialKind): string => {
  switch (material) {
    case 'wood':
      return 'الخشب';
    case 'iron':
      return 'الحديد';
    case 'fabric':
      return 'القماش';
    default:
      return 'المواد';
  }
};
