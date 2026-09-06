/** قوالب المستندات المطبوعة: فاتورة، كشف حساب، سجل ديون، سجل تسعير. */
import { debtTotals, orderTotals } from '@/lib/calc';
import { orderStatusLabel } from '@/lib/constants';
import { formatDate, formatMoney, formatNumber, todayIso } from '@/lib/format';
import { shortRef } from '@/lib/id';
import type { Calculation, Debt, Order, Profile } from '@/lib/types';
import { escapeHtml } from './print';

const head = (profile: Profile, title: string, ref: string): string => `
  <div class="doc__head">
    <div>
      <p class="doc__brand">${escapeHtml(profile.businessName || 'ورشتي')}</p>
      <div class="doc__meta">
        ${profile.ownerName ? `<div>${escapeHtml(profile.ownerName)}</div>` : ''}
        ${profile.phone ? `<div>هاتف: ${escapeHtml(profile.phone)}</div>` : ''}
        ${profile.address ? `<div>${escapeHtml(profile.address)}</div>` : ''}
      </div>
    </div>
    <div style="text-align:left">
      <p class="doc__title">${escapeHtml(title)}</p>
      <div class="doc__ref">
        ${ref ? `<div>رقم: ${escapeHtml(ref)}</div>` : ''}
        <div>التاريخ: ${escapeHtml(formatDate(todayIso()))}</div>
      </div>
    </div>
  </div>`;

const foot = (profile: Profile, note?: string): string => `
  <div class="doc__foot">
    <span>${escapeHtml(note ?? 'شكراً لتعاملكم معنا')}</span>
    <span>${escapeHtml(profile.businessName || 'ورشتي')}</span>
  </div>`;

const money = (value: number, profile: Profile) => escapeHtml(formatMoney(value, profile.currency));

/* ---------------------------------------------------------------- فاتورة */

export const invoiceTitle = (order: Order): string => `فاتورة ${order.title || 'طلبية'}`;

export const buildInvoice = (order: Order, profile: Profile): string => {
  const totals = orderTotals(order);
  const rows = (order.items ?? []).length
    ? order.items
        .map(
          (item, index) => `
        <tr>
          <td class="num">${index + 1}</td>
          <td>${escapeHtml(item.name)}</td>
          <td class="num">${escapeHtml(formatNumber(item.qty))}</td>
          <td class="num">${money(item.unitPrice, profile)}</td>
          <td class="num">${money(item.qty * item.unitPrice, profile)}</td>
        </tr>`,
        )
        .join('')
    : `<tr><td colspan="5" style="text-align:center;color:#6b7280">لا توجد بنود مفصّلة</td></tr>`;

  return `
    ${head(profile, 'فاتورة', shortRef(order.id))}
    <div class="block">
      <p class="block__title">بيانات الزبون</p>
      <div class="kv">
        <div><span>الاسم:</span><span>${escapeHtml(order.customerName || '—')}</span></div>
        <div><span>الهاتف:</span><span>${escapeHtml(order.phone || '—')}</span></div>
        <div><span>العنوان:</span><span>${escapeHtml(order.address || '—')}</span></div>
        <div><span>التسليم:</span><span>${escapeHtml(order.dueDate ? formatDate(order.dueDate) : '—')}</span></div>
        <div><span>الطلبية:</span><span>${escapeHtml(order.title || '—')}</span></div>
        <div><span>الحالة:</span><span class="pill">${escapeHtml(orderStatusLabel(order.status))}</span></div>
      </div>
    </div>
    <div class="block">
      <p class="block__title">البنود</p>
      <table>
        <thead>
          <tr>
            <th class="num" style="width:34px">#</th>
            <th>الوصف</th>
            <th class="num" style="width:70px">الكمية</th>
            <th class="num" style="width:110px">سعر الوحدة</th>
            <th class="num" style="width:120px">الإجمالي</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <table class="totals">
        <tbody>
          <tr><td>مجموع البنود</td><td>${money(totals.itemsTotal, profile)}</td></tr>
          <tr><td>أجور ومصاريف إضافية</td><td>${money(totals.extraCharges, profile)}</td></tr>
          <tr><td>الخصم</td><td>${money(totals.discount, profile)}</td></tr>
          <tr class="grand"><td>الإجمالي المستحق</td><td>${money(totals.total, profile)}</td></tr>
          <tr><td>المدفوع</td><td>${money(totals.paid, profile)}</td></tr>
          <tr><td>المتبقّي</td><td>${money(totals.remaining, profile)}</td></tr>
        </tbody>
      </table>
    </div>
    ${
      order.notes
        ? `<div class="block"><p class="block__title">ملاحظات</p><div class="note">${escapeHtml(order.notes)}</div></div>`
        : ''
    }
    <div class="sign"><div>توقيع الزبون</div><div>توقيع صاحب العمل</div></div>
    ${foot(profile)}`;
};

/* --------------------------------------------------------- كشف الطلبيات */

export const buildOrdersReport = (
  orders: Order[],
  profile: Profile,
  subtitle: string,
): string => {
  const totals = orders.reduce(
    (acc, order) => {
      const t = orderTotals(order);
      return {
        total: acc.total + t.total,
        paid: acc.paid + t.paid,
        remaining: acc.remaining + t.remaining,
      };
    },
    { total: 0, paid: 0, remaining: 0 },
  );

  const rows = orders.length
    ? orders
        .map((order, index) => {
          const t = orderTotals(order);
          return `
          <tr>
            <td class="num">${index + 1}</td>
            <td>${escapeHtml(order.title || '—')}</td>
            <td>${escapeHtml(order.customerName || '—')}</td>
            <td><span class="pill">${escapeHtml(orderStatusLabel(order.status))}</span></td>
            <td class="num">${escapeHtml(order.dueDate ? formatDate(order.dueDate) : '—')}</td>
            <td class="num">${money(t.total, profile)}</td>
            <td class="num">${money(t.paid, profile)}</td>
            <td class="num">${money(t.remaining, profile)}</td>
          </tr>`;
        })
        .join('')
    : `<tr><td colspan="8" style="text-align:center;color:#6b7280">لا توجد طلبيات</td></tr>`;

  return `
    ${head(profile, 'كشف الطلبيات', '')}
    <div class="block">
      <p class="block__title">${escapeHtml(subtitle)}</p>
      <table>
        <thead>
          <tr>
            <th class="num" style="width:34px">#</th>
            <th>الطلبية</th>
            <th>الزبون</th>
            <th style="width:64px">الحالة</th>
            <th class="num" style="width:104px">التسليم</th>
            <th class="num">الإجمالي</th>
            <th class="num">المدفوع</th>
            <th class="num">المتبقّي</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td colspan="5">المجموع</td>
            <td class="num">${money(totals.total, profile)}</td>
            <td class="num">${money(totals.paid, profile)}</td>
            <td class="num">${money(totals.remaining, profile)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    ${foot(profile, 'كشف حساب داخلي')}`;
};

/* ------------------------------------------------------------ سجل الديون */

export const buildDebtsReport = (
  debts: Debt[],
  profile: Profile,
  subtitle: string,
): string => {
  const totals = debts.reduce(
    (acc, debt) => {
      const t = debtTotals(debt);
      return {
        amount: acc.amount + t.amount,
        paid: acc.paid + t.paid,
        remaining: acc.remaining + t.remaining,
      };
    },
    { amount: 0, paid: 0, remaining: 0 },
  );

  const rows = debts.length
    ? debts
        .map((debt, index) => {
          const t = debtTotals(debt);
          return `
          <tr>
            <td class="num">${index + 1}</td>
            <td>${escapeHtml(debt.customerName || '—')}</td>
            <td class="num">${escapeHtml(debt.phone || '—')}</td>
            <td>${escapeHtml(debt.address || '—')}</td>
            <td>${escapeHtml(debt.goods || '—')}</td>
            <td class="num">${money(t.amount, profile)}</td>
            <td class="num">${money(t.paid, profile)}</td>
            <td class="num">${money(t.remaining, profile)}</td>
            <td class="num">${escapeHtml(debt.dueDate ? formatDate(debt.dueDate) : '—')}</td>
          </tr>`;
        })
        .join('')
    : `<tr><td colspan="9" style="text-align:center;color:#6b7280">لا توجد ديون مسجّلة</td></tr>`;

  return `
    ${head(profile, 'سجل الديون', '')}
    <div class="block">
      <p class="block__title">${escapeHtml(subtitle)}</p>
      <table>
        <thead>
          <tr>
            <th class="num" style="width:32px">#</th>
            <th>اسم الزبون</th>
            <th class="num" style="width:96px">الهاتف</th>
            <th>العنوان</th>
            <th>البضاعة</th>
            <th class="num">المبلغ</th>
            <th class="num">المسدّد</th>
            <th class="num">المتبقّي</th>
            <th class="num" style="width:96px">الاستحقاق</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td colspan="5">المجموع</td>
            <td class="num">${money(totals.amount, profile)}</td>
            <td class="num">${money(totals.paid, profile)}</td>
            <td class="num">${money(totals.remaining, profile)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
    ${foot(profile, 'سجل ديون داخلي')}`;
};

/** كشف دين واحد مع تفاصيل الدفعات، يصلح للتوقيع من الزبون. */
export const buildDebtStatement = (debt: Debt, profile: Profile): string => {
  const t = debtTotals(debt);
  const rows = (debt.payments ?? []).length
    ? debt.payments
        .map(
          (payment, index) => `
        <tr>
          <td class="num">${index + 1}</td>
          <td class="num">${escapeHtml(formatDate(payment.date))}</td>
          <td class="num">${money(payment.amount, profile)}</td>
          <td>${escapeHtml(payment.note || '—')}</td>
        </tr>`,
        )
        .join('')
    : `<tr><td colspan="4" style="text-align:center;color:#6b7280">لا توجد دفعات</td></tr>`;

  return `
    ${head(profile, 'كشف دين', shortRef(debt.id))}
    <div class="block">
      <p class="block__title">بيانات الزبون</p>
      <div class="kv">
        <div><span>الاسم:</span><span>${escapeHtml(debt.customerName || '—')}</span></div>
        <div><span>الهاتف:</span><span>${escapeHtml(debt.phone || '—')}</span></div>
        <div><span>العنوان:</span><span>${escapeHtml(debt.address || '—')}</span></div>
        <div><span>الاستحقاق:</span><span>${escapeHtml(debt.dueDate ? formatDate(debt.dueDate) : '—')}</span></div>
        <div><span>البضاعة:</span><span>${escapeHtml(debt.goods || '—')}</span></div>
      </div>
    </div>
    <div class="block">
      <p class="block__title">الدفعات</p>
      <table>
        <thead>
          <tr>
            <th class="num" style="width:34px">#</th>
            <th class="num" style="width:120px">التاريخ</th>
            <th class="num" style="width:130px">المبلغ</th>
            <th>ملاحظة</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <table class="totals">
        <tbody>
          <tr><td>أصل الدين</td><td>${money(t.amount, profile)}</td></tr>
          <tr><td>المسدّد</td><td>${money(t.paid, profile)}</td></tr>
          <tr class="grand"><td>المتبقّي</td><td>${money(t.remaining, profile)}</td></tr>
        </tbody>
      </table>
    </div>
    ${debt.notes ? `<div class="block"><div class="note">${escapeHtml(debt.notes)}</div></div>` : ''}
    <div class="sign"><div>توقيع الزبون</div><div>توقيع صاحب العمل</div></div>
    ${foot(profile, 'كشف دين')}`;
};

/* ---------------------------------------------------------- سجل التسعير */

export const buildCalculationSheet = (calc: Calculation, profile: Profile): string => {
  const rows = (calc.materials ?? []).length
    ? calc.materials
        .map(
          (material, index) => `
        <tr>
          <td class="num">${index + 1}</td>
          <td>${escapeHtml(material.name)}</td>
          <td class="num">${escapeHtml(formatNumber(material.qty))}</td>
          <td class="num">${money(material.unitPrice, profile)}</td>
          <td class="num">${money(material.qty * material.unitPrice, profile)}</td>
        </tr>`,
        )
        .join('')
    : `<tr><td colspan="5" style="text-align:center;color:#6b7280">لا توجد مواد</td></tr>`;

  return `
    ${head(profile, 'ورقة تسعير', shortRef(calc.id))}
    <div class="block">
      <p class="block__title">${escapeHtml(calc.title || 'حساب تكلفة')}</p>
      <table>
        <thead>
          <tr>
            <th class="num" style="width:34px">#</th>
            <th>المادة</th>
            <th class="num" style="width:70px">الكمية</th>
            <th class="num" style="width:110px">سعر الوحدة</th>
            <th class="num" style="width:120px">الإجمالي</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <table class="totals">
        <tbody>
          <tr><td>تكلفة المواد (مع الهالك ${escapeHtml(formatNumber(calc.wastePct))}٪)</td><td>${money(calc.materialsCost, profile)}</td></tr>
          <tr><td>أجور العمل (${escapeHtml(formatNumber(calc.laborHours))} ساعة)</td><td>${money(calc.laborCost, profile)}</td></tr>
          <tr><td>مصاريف عامة</td><td>${money(calc.overhead, profile)}</td></tr>
          <tr><td>إجمالي التكلفة</td><td>${money(calc.totalCost, profile)}</td></tr>
          <tr><td>الربح (${escapeHtml(formatNumber(calc.marginPct))}٪)</td><td>${money(calc.profit, profile)}</td></tr>
          <tr class="grand"><td>السعر المقترح</td><td>${money(calc.suggestedPrice, profile)}</td></tr>
        </tbody>
      </table>
    </div>
    ${calc.notes ? `<div class="block"><div class="note">${escapeHtml(calc.notes)}</div></div>` : ''}
    ${foot(profile, 'ورقة تسعير داخلية')}`;
};

/** كشف مجمّع لكل عمليات التسعير المحفوظة. */
export const buildCalculationsReport = (
  calculations: Calculation[],
  profile: Profile,
): string => {
  const rows = calculations.length
    ? calculations
        .map(
          (calc, index) => `
        <tr>
          <td class="num">${index + 1}</td>
          <td>${escapeHtml(calc.title || '—')}</td>
          <td class="num">${money(calc.totalCost, profile)}</td>
          <td class="num">${escapeHtml(formatNumber(calc.marginPct))}٪</td>
          <td class="num">${money(calc.profit, profile)}</td>
          <td class="num">${money(calc.suggestedPrice, profile)}</td>
        </tr>`,
        )
        .join('')
    : `<tr><td colspan="6" style="text-align:center;color:#6b7280">لا توجد حسابات محفوظة</td></tr>`;

  return `
    ${head(profile, 'سجل التسعير', '')}
    <div class="block">
      <p class="block__title">كل عمليات حساب التكلفة والربح</p>
      <table>
        <thead>
          <tr>
            <th class="num" style="width:34px">#</th>
            <th>العنوان</th>
            <th class="num">التكلفة</th>
            <th class="num" style="width:70px">الربح ٪</th>
            <th class="num">الربح</th>
            <th class="num">السعر المقترح</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${foot(profile, 'سجل تسعير داخلي')}`;
};
