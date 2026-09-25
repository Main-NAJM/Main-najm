/** حسابات الطلبيات والديون وحاسبة التكلفة. */
import { round2 } from './format';
export const orderTotals = (order) => {
    const itemsTotal = (order.items ?? []).reduce((sum, item) => sum + (item.qty || 0) * (item.unitPrice || 0), 0);
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
export const debtTotals = (debt) => {
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
export const computeCalculation = (input) => {
    const rawMaterials = (input.materials ?? []).reduce((sum, m) => sum + (m.qty || 0) * (m.unitPrice || 0), 0);
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
export const priceChangePct = (price, previous) => {
    if (previous === null || previous === undefined || previous <= 0)
        return null;
    return round2(((price - previous) / previous) * 100);
};
const BASIS_UNITS = {
    area: 'م²',
    length: 'م.ط',
    frame: 'م.ط',
    volume: 'م³',
    weight: 'كغ',
    unit: 'قطعة',
};
export const basisUnit = (basis) => BASIS_UNITS[basis] ?? '';
/** يحوّل المقاسات إلى مقدار بوحدة أساس التسعير (للقطعة الواحدة). */
export const measureFor = (basis, dims, density = 0) => {
    const w = Math.max(0, dims.widthCm || 0) / 100;
    const h = Math.max(0, dims.heightCm || 0) / 100;
    const d = Math.max(0, dims.depthCm || 0) / 100;
    switch (basis) {
        case 'area':
            return w * h;
        case 'length':
            return w;
        // الإطار يدور حول القطعة كلها، فالمقدار محيطها لا ضلع واحد منها:
        // بابٌ 100×200 سم يلزمه 6 أمتار طولية من البروفيل لا مترٌ واحد.
        case 'frame':
            return 2 * (w + h);
        case 'volume':
            return w * h * d;
        case 'weight':
            return w * h * d * Math.max(0, density || 0);
        case 'unit':
        default:
            return 1;
    }
};
export const computeProductPrice = (product, dims) => {
    const measure = measureFor(product.basis, dims, product.density);
    const materialCost = measure * (product.unitPrice || 0);
    // الصفيحة (زجاج، لوح) تُحسب بمساحتها دائماً، أيّاً كان أساس الإطار.
    const sheetRate = Math.max(0, product.sheetPrice || 0);
    const sheetArea = sheetRate > 0 ? measureFor('area', dims) : 0;
    const sheetCost = sheetArea * sheetRate;
    // الهالك يطال المادتين معاً: قصّ البروفيل وقصّ الزجاج كلاهما يُهدر.
    const wasteCost = (materialCost + sheetCost) * ((product.wastePct || 0) / 100);
    const fittings = product.fittings || 0;
    const labor = product.labor || 0;
    const unitCost = materialCost + sheetCost + wasteCost + fittings + labor;
    const unitProfit = unitCost * ((product.marginPct || 0) / 100);
    const unitTotal = unitCost + unitProfit;
    const quantity = Math.max(0, dims.quantity || 0);
    return {
        measure: round2(measure),
        measureUnit: basisUnit(product.basis),
        materialCost: round2(materialCost),
        sheetArea: round2(sheetArea),
        sheetCost: round2(sheetCost),
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
export const stockLevel = (item) => {
    const qty = Math.max(0, item.qty || 0);
    if (qty <= 0)
        return 'out';
    // حدّ تنبيه غير مضبوط (صفر) لا يجعل كل شيء منخفضاً.
    return (item.lowAt || 0) > 0 && qty <= item.lowAt ? 'low' : 'ok';
};
export const inventoryTotals = (items) => {
    let needsRestock = 0;
    let outOfStock = 0;
    let value = 0;
    items.forEach((item) => {
        const level = stockLevel(item);
        if (level === 'out')
            outOfStock += 1;
        if (level !== 'ok')
            needsRestock += 1;
        value += Math.max(0, item.qty || 0) * Math.max(0, item.costPrice || 0);
    });
    return { items: items.length, needsRestock, outOfStock, value: round2(value) };
};
/* --------------------------------------------- حاسبة الأبواب والنوافذ */
/**
 * تسعير فتحة (طاقة، نافذة، باب) من مقاسين وسعرين وعدد قطع.
 *
 * الفتحة ليست إطاراً واحداً حول محيطها: نافذة ١×١ فيها ١١ قطعة بروفيل —
 * الإطار الخارجي وضلفتاها وقضبانها — لا أربع. فالبروفيل يُحسب بعدد القطع
 * لا بالمحيط، وهذا فرق يزيد ثمن النافذة الواحدة أكثر من الضعف.
 *
 * وطول القطعة يتبع المقاس، فتُقدَّر بمتوسط الضلعين: في فتحة ١×١ متر تكون
 * القطعة متراً، فيصير ١١ قطعة = ١١ م.ط = ما تحسبه الورشة فعلاً.
 *
 * والزجاج أو الصفيحة تملأ الفتحة فتُحسب بمساحتها بالمتر المربّع.
 */
export const OPENING_KINDS = [
    { value: 'fanlight', label: 'طاقة' },
    { value: 'window', label: 'نافذة' },
    { value: 'door', label: 'باب كامل' },
];
export const openingKindLabel = (kind) => OPENING_KINDS.find((k) => k.value === kind)?.label ?? kind;
export const computeOpeningPrice = (input) => {
    const l = Math.max(0, input.lengthCm || 0) / 100;
    const w = Math.max(0, input.widthCm || 0) / 100;
    const pieces = Math.max(0, input.pieces || 0);
    const pieceLength = (l + w) / 2;
    const profileMetres = pieces * pieceLength;
    const area = l * w;
    const profileCost = profileMetres * Math.max(0, input.rate || 0);
    const sheetCost = area * Math.max(0, input.sheetRate || 0);
    const unitTotal = profileCost + sheetCost;
    const quantity = Math.max(0, input.quantity || 0);
    return {
        pieces,
        pieceLength: round2(pieceLength),
        profileMetres: round2(profileMetres),
        area: round2(area),
        profileCost: round2(profileCost),
        sheetCost: round2(sheetCost),
        unitTotal: round2(unitTotal),
        quantity,
        total: round2(unitTotal * quantity),
    };
};
