/**
 * المهن وما يبنيه التطبيق عليها.
 *
 * المهنة تُختار مرّة عند إنشاء الحساب (وتُغيَّر لاحقاً من الإعدادات)، وتقرّر:
 * قوالب المنتجات التي تُزرع، وأصناف المواد في مؤشّر الأسعار، وأجرة الساعة ونسبة
 * الربح الافتراضيتين، والكلمات المعروضة في الواجهة.
 *
 * ومهنة 'other' ليست «لا شيء»: صاحبها يكتب اسمها ومادّته وطريقة تسعيره، فتُبنى
 * له نفس البداية باسمه هو — قالب تسعير بأساسه، وصنف مواد باسم مادّته.
 */
import {
  AluminiumIcon,
  BlacksmithIcon,
  BuilderIcon,
  CarpenterIcon,
  MechanicIcon,
  PlusIcon,
  TailorIcon,
} from '@/components/icons';
import type { Craft, MaterialKind, PricingBasis, UserType } from './types';

export interface TradeChoice {
  craft: Craft;
  /** اسم المهنة حين يكون صاحبها حرفياً. */
  craftLabel: string;
  /** اسمها حين يكون صاحبها تاجراً. */
  merchantLabel: string;
  /** أصناف المواد التي تهمّ هذه المهنة — الأوّل هو المقترَح عند إضافة سعر. */
  materials: MaterialKind[];
  Icon: typeof CarpenterIcon;
  /** قوالب المنتجات التي تُزرع لهذه المهنة — تُعرض بالاسم في شاشة التسجيل. */
  products: string[];
  /** أسطر مؤشّر الأسعار التي تُزرع. */
  prices: string[];
  defaultLaborRate: number;
  defaultMarginPct: number;
  /** true للبطاقة المفتوحة التي يكتب فيها صاحبها مهنته. */
  isCustom?: boolean;
}

export const TRADE_CHOICES: TradeChoice[] = [
  {
    craft: 'carpenter',
    craftLabel: 'نجّار',
    merchantLabel: 'تاجر خشب',
    materials: ['wood'],
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
    materials: ['iron'],
    Icon: BlacksmithIcon,
    products: ['باب حديد', 'دربزين حديد'],
    prices: ['حديد تسليح ١٢ ملم', 'مقطع حديد مربّع'],
    defaultLaborRate: 6000,
    defaultMarginPct: 22,
  },
  {
    craft: 'aluminium',
    craftLabel: 'ألمنيوم وزجاج',
    merchantLabel: 'تاجر ألمنيوم وزجاج',
    materials: ['aluminium', 'glass'],
    Icon: AluminiumIcon,
    products: ['نافذة ألمنيوم', 'باب ألمنيوم بزجاج', 'واجهة زجاجية'],
    prices: ['مقطع ألمنيوم', 'زجاج ٤ ملم', 'زجاج مزدوج'],
    defaultLaborRate: 6000,
    defaultMarginPct: 24,
  },
  {
    craft: 'mechanic',
    craftLabel: 'ميكانيكي',
    merchantLabel: 'تاجر قطع غيار',
    materials: ['parts'],
    Icon: MechanicIcon,
    products: ['تغيير زيت وفلتر', 'تصليح الفرامل', 'تشخيص العطب'],
    prices: ['زيت محرّك ٥ لتر', 'فلتر زيت', 'طقم فرامل أمامي'],
    defaultLaborRate: 4000,
    defaultMarginPct: 30,
  },
  {
    craft: 'builder',
    craftLabel: 'بنّاء',
    merchantLabel: 'تاجر مواد بناء',
    materials: ['building'],
    Icon: BuilderIcon,
    products: ['بناء جدار آجر', 'صبّ خرسانة'],
    prices: ['كيس إسمنت ٥٠ كغ', 'رمل', 'آجر'],
    defaultLaborRate: 4500,
    defaultMarginPct: 18,
  },
  {
    craft: 'tailor',
    craftLabel: 'خيّاط',
    merchantLabel: 'تاجر أقمشة',
    materials: ['fabric'],
    Icon: TailorIcon,
    products: ['ستارة قماش', 'بدلة عمل'],
    prices: ['قماش قطن', 'قماش جبردين'],
    defaultLaborRate: 3000,
    defaultMarginPct: 30,
  },
  {
    craft: 'other',
    craftLabel: 'مهنة أخرى',
    merchantLabel: 'تجارة أخرى',
    materials: ['other'],
    Icon: PlusIcon,
    products: [],
    prices: [],
    defaultLaborRate: 5000,
    defaultMarginPct: 25,
    isCustom: true,
  },
];

const FALLBACK = TRADE_CHOICES[TRADE_CHOICES.length - 1];

export const tradeFor = (craft: Craft): TradeChoice =>
  TRADE_CHOICES.find((choice) => choice.craft === craft) ?? FALLBACK;

/** ما يعرّف مهنة صاحب الحساب: الاختيار الجاهز، أو ما كتبه بنفسه. */
export interface TradeInfo {
  userType: UserType;
  craft: Craft;
  customCraft?: string;
  customMaterial?: string;
  customBasis?: PricingBasis;
}

/**
 * اسم المهنة كما يُعرض. ما كتبه صاحبها يسبق كل شيء، ثم تختلف التسمية بين
 * الحرفي والتاجر.
 */
export const tradeLabel = (trade: TradeInfo): string => {
  const typed = trade.customCraft?.trim();
  if (trade.craft === 'other' && typed) return typed;
  const choice = tradeFor(trade.craft);
  return trade.userType === 'merchant' ? choice.merchantLabel : choice.craftLabel;
};

/**
 * اسم الحرفة وحدها (بلا تفريق بين حرفي وتاجر) — لوسم قوالب المنتجات.
 * قالب مهنة مكتوبة يحمل الاسم الذي كتبه صاحبها.
 */
export const craftName = (craft: Craft, customCraft?: string): string => {
  const typed = customCraft?.trim();
  if (craft === 'other' && typed) return typed;
  return tradeFor(craft).craftLabel;
};

/** صنف المواد المقترَح لهذه المهنة في مؤشّر الأسعار. */
export const tradeMaterial = (craft: Craft): MaterialKind => tradeFor(craft).materials[0];

/** كل أصناف المواد التي تخصّ المهنة. */
export const tradeMaterials = (craft: Craft): MaterialKind[] => tradeFor(craft).materials;

export interface TradeSummary {
  label: string;
  /** ما سيجده المستخدم جاهزاً عند أوّل فتح — يطابق ما يزرعه data/seed. */
  prepares: string[];
}

/** وصف ما يجهّزه التطبيق لهذه المهنة — يُعرض قبل تأكيد إنشاء الحساب. */
export const tradeChoice = (trade: TradeInfo): TradeSummary => {
  const choice = tradeFor(trade.craft);
  const label = tradeLabel(trade);
  const prepares: string[] = [];

  if (choice.isCustom) {
    const material = trade.customMaterial?.trim();
    prepares.push(
      trade.customCraft?.trim()
        ? `كل ما في التطبيق باسم «${label}»`
        : 'اكتب اسم مهنتك ليبني التطبيق عليه',
    );
    if (material) prepares.push(`صنف مواد باسم «${material}» في مؤشّر الأسعار`);
    if (trade.userType !== 'merchant' && trade.customCraft?.trim()) {
      prepares.push(`قالب تسعير أوّل ${basisPhrase(trade.customBasis ?? 'unit')} تعدّل أرقامه`);
    }
    prepares.push('باقي الصفحات تبدأ فارغة، تملؤها بأسعارك أنت');
    return { label, prepares };
  }

  if (choice.products.length > 0 && trade.userType !== 'merchant') {
    prepares.push(`قوالب تسعير جاهزة: ${choice.products.join('، ')}`);
  }
  if (choice.prices.length > 0) {
    prepares.push(`أسعار ${materialsWord(choice.materials)}: ${choice.prices.join('، ')}`);
  }
  prepares.push(
    trade.userType === 'merchant'
      ? 'سجلّ ديون وفواتير باسم متجرك'
      : `نسبة ربح ${choice.defaultMarginPct}٪ وأجرة ساعة مبدئية في الحاسبة`,
  );
  return { label, prepares };
};

const basisPhrase = (basis: PricingBasis): string => {
  switch (basis) {
    case 'area':
      return 'بالمتر المربّع';
    case 'length':
      return 'بالمتر الطولي';
    case 'volume':
      return 'بالمتر المكعّب';
    case 'weight':
      return 'بالوزن';
    case 'unit':
    default:
      return 'بالقطعة';
  }
};

const MATERIAL_WORDS: Record<MaterialKind, string> = {
  wood: 'الخشب',
  iron: 'الحديد',
  aluminium: 'الألمنيوم',
  glass: 'الزجاج',
  fabric: 'القماش',
  building: 'مواد البناء',
  parts: 'قطع الغيار',
  other: 'المواد',
};

const materialsWord = (materials: MaterialKind[]): string =>
  materials.map((material) => MATERIAL_WORDS[material]).join(' و');
