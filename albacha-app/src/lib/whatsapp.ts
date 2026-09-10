/** رسائل واتساب الجاهزة: تُبنى من الطلب نفسه فلا يكتبها صاحب المؤسسة يدوياً. */
import { itemTotal, orderRemaining, orderTotal, paidTotal } from './calc';
import { MATERIAL_LABEL, decimal, formatDate, money, waNumber } from './format';
import type { Order, WorkshopProfile } from './types';

const itemLine = (order: Order, currency: string): string =>
  order.items
    .map((item) => {
      const size =
        item.unit === 'm2' && item.width && item.height
          ? ` (${decimal(item.width)}م × ${decimal(item.height)}م)`
          : '';
      const count = item.qty > 1 ? ` × ${decimal(item.qty, 0)}` : '';
      return `• ${item.label || 'بند'}${size}${count} — ${money(itemTotal(item), currency)}`;
    })
    .join('\n');

/**
 * نصّ الرسالة حسب حالة الطلب:
 * عرض سعر ← تفاصيل العرض، جاهز ← إشعار التركيب، غير ذلك ← ملخّص وحساب.
 */
export const orderMessage = (order: Order, profile: WorkshopProfile): string => {
  const currency = profile.currency;
  const total = orderTotal(order);
  const paid = paidTotal(order);
  const remaining = Math.max(0, orderRemaining(order));
  const greeting = `السلام عليكم ${order.customerName}،`;
  const title = order.title || 'الطلب';

  if (order.status === 'quote') {
    return [
      greeting,
      `عرض سعر من ${profile.name}:`,
      '',
      `الطلب: ${title} — ${MATERIAL_LABEL[order.material]}`,
      itemLine(order, currency),
      order.laborFee ? `• التركيب والنقل — ${money(order.laborFee, currency)}` : '',
      order.discount ? `• خصم — ${money(order.discount, currency)}` : '',
      '',
      `الإجمالي: ${money(total, currency)}`,
      order.dueDate ? `مدّة التنفيذ حتى: ${formatDate(order.dueDate)}` : '',
      '',
      profile.quoteNote,
    ]
      .filter(Boolean)
      .join('\n');
  }

  if (order.status === 'ready') {
    return [
      greeting,
      `طلبك «${title}» جاهز للتركيب في ${profile.name}.`,
      remaining > 0 ? `الباقي من الحساب: ${money(remaining, currency)}` : 'الحساب مسدَّد بالكامل.',
      '',
      'متى يناسبك موعد التركيب؟',
    ].join('\n');
  }

  if (order.status === 'installed') {
    return [
      greeting,
      `تمّ تركيب «${title}» بحمد الله.`,
      remaining > 0
        ? `الباقي من الحساب: ${money(remaining, currency)}`
        : 'الحساب مسدَّد بالكامل، شكراً لثقتك.',
      '',
      `${profile.name}`,
    ].join('\n');
  }

  return [
    greeting,
    `بخصوص طلبك «${title}» لدى ${profile.name}:`,
    `الإجمالي: ${money(total, currency)}`,
    paid > 0 ? `المدفوع: ${money(paid, currency)}` : '',
    `الباقي: ${money(remaining, currency)}`,
    order.dueDate ? `موعد التسليم: ${formatDate(order.dueDate)}` : '',
  ]
    .filter(Boolean)
    .join('\n');
};

/** رابط واتساب جاهز للفتح، أو null إن لم يكن للزبون رقم. */
export const orderWhatsAppLink = (order: Order, profile: WorkshopProfile): string | null => {
  const number = waNumber(order.customerPhone);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(orderMessage(order, profile))}`;
};
