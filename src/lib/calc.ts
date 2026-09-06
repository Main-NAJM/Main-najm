/** حسابات الطلبيات والديون وحاسبة التكلفة. */
import { round2 } from './format';
import type { Calculation, Debt, Order } from './types';

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
