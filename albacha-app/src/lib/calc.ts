import type { Order, OrderItem } from './types';

/** مساحة البند بالمتر المربّع (العرض × الارتفاع × الكمية). */
export const itemArea = (item: OrderItem): number =>
  item.unit === 'm2' ? item.width * item.height * item.qty : 0;

/** قيمة البند: بالمتر المربّع أو بالقطعة. */
export const itemTotal = (item: OrderItem): number =>
  item.unit === 'm2' ? itemArea(item) * item.unitPrice : item.qty * item.unitPrice;

export const itemsTotal = (items: OrderItem[]): number =>
  items.reduce((sum, item) => sum + itemTotal(item), 0);

export const paidTotal = (order: Pick<Order, 'payments'>): number =>
  order.payments.reduce((sum, payment) => sum + payment.amount, 0);

/** الإجمالي المستحقّ: البنود + الأجرة − الخصم (لا ينزل تحت الصفر). */
export const orderTotal = (order: Pick<Order, 'items' | 'laborFee' | 'discount'>): number =>
  Math.max(0, itemsTotal(order.items) + order.laborFee - order.discount);

export const orderRemaining = (
  order: Pick<Order, 'items' | 'laborFee' | 'discount' | 'payments'>,
): number => orderTotal(order) - paidTotal(order);

/** الطلبات المحتسبة في الأرصدة: كل ما ليس عرض سعر ولا ملغى. */
export const isActiveOrder = (order: Order): boolean =>
  order.status !== 'quote' && order.status !== 'cancelled';

/** متأخّر: تجاوز تاريخ التسليم ولم يُركَّب بعد. */
export const isOverdue = (order: Order, today = new Date()): boolean => {
  if (!order.dueDate) return false;
  if (order.status === 'installed' || order.status === 'cancelled') return false;
  const due = new Date(`${order.dueDate}T23:59:59`);
  return due.getTime() < today.getTime();
};
