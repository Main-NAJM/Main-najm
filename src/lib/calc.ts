/** حسابات الطلبيات والديون وحاسبة التكلفة. */
import { round2 } from './format';
import type {
  Calculation,
  Debt,
  Order,
  PricingBasis,
  ProductTemplate,
} from './types';

export interface OrderTotals {
  itemsTotal: number;
  extraCharges: number;
  discount: number;
  total: number;
  paid: number;
  remaining: number;
}

export const orderTotals = (order: Order): OrderTotals => {
  const itemsTotal = (order.items ?? []).reduce(
    (sum, item) => sum + (item.qty || 0) * (item.unitPrice || 0),
    0,
  );
  const extraCharges = order.extraCharges || 0;
  const discount = order.discount || 0;
  const total = Math.max(0, itemsTotal + extraCharges - discount);
  const paid = Math.min(order.paid || 0, total);
  return {
    itemsTotal: round2(itemsTotal),
    extraCharges: round2(extraCharges),
    discount: round2(discount),
    total: round2(total),
    paid: round2(paid),
    remaining: round2(Math.max(0, total - paid)),
  };
};

export interface DebtTotals {
  amount: number;
  paid: number;
  remaining: number;
  isSettled: boolean;
}

export const debtTotals = (debt: Debt): DebtTotals => {
  const amount = debt.amount || 0;
  const paid = (debt.payments ?? []).reduce((sum, p) => sum + (p.amount || 0), 0);
  const remaining = Math.max(0, amount - paid);
  return {
    amount: round2(amount),
    paid: round2(paid),
    remaining: round2(remaining),
    isSettled: remaining <= 0.009,
  };
};

export type CalcInput = Pick<
  Calculation,
  'materials' | 'laborHours' | 'laborRate' | 'overhead' | 'wastePct' | 'marginPct'
>;

export interface CalcResult {
  materialsCost: number;
  wasteCost: number;
  laborCost: number;
  overhead: number;
  totalCost: number;
  profit: number;
  suggestedPrice: number;
  /** هامش الربح كنسبة من سعر البيع. */
  marginOfPrice: number;
}

export const computeCalculation = (input: CalcInput): CalcResult => {
  const rawMaterials = (input.materials ?? []).reduce(
    (sum, m) => sum + (m.qty || 0) * (m.unitPrice || 0),
    0,
  );
  const wasteCost = rawMaterials * ((input.wastePct || 0) / 100);
  const materialsCost = rawMaterials + wasteCost;
  const laborCost = (input.laborHours || 0) * (input.laborRate || 0);
  const overhead = input.overhead || 0;
  const totalCost = materialsCost + laborCost + overhead;
  const profit = totalCost * ((input.marginPct || 0) / 100);
  const suggestedPrice = totalCost + profit;
  return {
    materialsCost: round2(materialsCost),
    wasteCost: round2(wasteCost),
    laborCost: round2(laborCost),
    overhead: round2(overhead),
    totalCost: round2(totalCost),
    profit: round2(profit),
    suggestedPrice: round2(suggestedPrice),
    marginOfPrice: suggestedPrice > 0 ? round2((profit / suggestedPrice) * 100) : 0,
  };
};

/** نسبة التغيّر بين سعرين، أو null إذا لا يوجد سعر سابق. */
export const priceChangePct = (
  price: number,
  previous: number | null,
): number | null => {
  if (previous === null || previous === undefined || previous <= 0) return null;
  return round2(((price - previous) / previous) * 100);
};

/* ------------------------------------------------- تسعير المنتج بالمقاسات */

export interface ProductDimensions {
  /** بالسنتيمتر — أقرب إلى ما يقيسه الحرفي على الأرض. */
  widthCm: number;
  heightCm: number;
  depthCm: number;
  quantity: number;
}

export type ProductPricingInput = Pick<
  ProductTemplate,
  'basis' | 'unitPrice' | 'density' | 'wastePct' | 'fittings' | 'labor' | 'marginPct'
>;

export interface ProductPriceResult {
  /** المقدار المحسوب من المقاسات بوحدة أساس التسعير، للقطعة الواحدة. */
  measure: number;
  measureUnit: string;
  /** قيمة المادة قبل الهالك، للقطعة الواحدة. */
  materialCost: number;
  wasteCost: number;
  fittings: number;
  labor: number;
  /** تكلفة القطعة الواحدة بعد الهالك والإضافات. */
  unitCost: number;
  unitProfit: number;
  /** سعر القطعة الواحدة بعد الربح. */
  unitTotal: number;
  quantity: number;
  /** الإجمالي لكل الكمية. */
  total: number;
  totalCost: number;
  totalProfit: number;
}

const BASIS_UNITS: Record<PricingBasis, string> = {
  area: 'م²',
  length: 'م.ط',
  volume: 'م³',
  weight: 'كغ',
  unit: 'قطعة',
};

export const basisUnit = (basis: PricingBasis): string => BASIS_UNITS[basis] ?? '';

/** يحوّل المقاسات إلى مقدار بوحدة أساس التسعير (للقطعة الواحدة). */
export const measureFor = (
  basis: PricingBasis,
  dims: ProductDimensions,
  density = 0,
): number => {
  const w = Math.max(0, dims.widthCm || 0) / 100;
  const h = Math.max(0, dims.heightCm || 0) / 100;
  const d = Math.max(0, dims.depthCm || 0) / 100;
  switch (basis) {
    case 'area':
      return w * h;
    case 'length':
      return w;
    case 'volume':
      return w * h * d;
    case 'weight':
      return w * h * d * Math.max(0, density || 0);
    case 'unit':
    default:
      return 1;
  }
};

export const computeProductPrice = (
  product: ProductPricingInput,
  dims: ProductDimensions,
): ProductPriceResult => {
  const measure = measureFor(product.basis, dims, product.density);
  const materialCost = measure * (product.unitPrice || 0);
  const wasteCost = materialCost * ((product.wastePct || 0) / 100);
  const fittings = product.fittings || 0;
  const labor = product.labor || 0;
  const unitCost = materialCost + wasteCost + fittings + labor;
  const unitProfit = unitCost * ((product.marginPct || 0) / 100);
  const unitTotal = unitCost + unitProfit;
  const quantity = Math.max(0, dims.quantity || 0);

  return {
    measure: round2(measure),
    measureUnit: basisUnit(product.basis),
    materialCost: round2(materialCost),
    wasteCost: round2(wasteCost),
    fittings: round2(fittings),
    labor: round2(labor),
    unitCost: round2(unitCost),
    unitProfit: round2(unitProfit),
    unitTotal: round2(unitTotal),
    quantity,
    total: round2(unitTotal * quantity),
    totalCost: round2(unitCost * quantity),
    totalProfit: round2(unitProfit * quantity),
  };
};
