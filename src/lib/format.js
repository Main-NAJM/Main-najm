/** أدوات التنسيق: أرقام، عملة، تواريخ، هواتف. */
import { normalizePhone } from './phone';
const numberFormatter = new Intl.NumberFormat('ar-EG-u-nu-latn', {
    maximumFractionDigits: 2,
});
const intFormatter = new Intl.NumberFormat('ar-EG-u-nu-latn', {
    maximumFractionDigits: 0,
});
export const formatNumber = (value) => {
    if (!Number.isFinite(value))
        return '0';
    return numberFormatter.format(value);
};
export const formatInt = (value) => {
    if (!Number.isFinite(value))
        return '0';
    return intFormatter.format(value);
};
export const formatMoney = (value, currency) => `${formatNumber(round2(value))} ${currency}`;
export const round2 = (value) => Math.round(value * 100) / 100;
/** يحوّل أي مُدخل إلى رقم صالح، ويعيد الافتراضي عند الفشل. */
export const toNumber = (value, fallback = 0) => {
    if (typeof value === 'number')
        return Number.isFinite(value) ? value : fallback;
    if (typeof value !== 'string')
        return fallback;
    const normalized = value
        .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
        .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
        .replace(/[,\s٬]/g, '')
        .replace('٫', '.');
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
};
const dateFormatter = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
});
const shortDateFormatter = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
    month: 'short',
    day: 'numeric',
});
const weekdayFormatter = new Intl.DateTimeFormat('ar-EG', { weekday: 'long' });
/** يحوّل YYYY-MM-DD إلى تاريخ محلي بدون انزياح المنطقة الزمنية. */
export const parseDate = (iso) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
    if (!match)
        return null;
    const [, y, m, d] = match;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return Number.isNaN(date.getTime()) ? null : date;
};
export const formatDate = (iso) => {
    const date = parseDate(iso);
    return date ? dateFormatter.format(date) : '—';
};
export const formatShortDate = (iso) => {
    const date = parseDate(iso);
    return date ? shortDateFormatter.format(date) : '—';
};
export const formatWeekday = (iso) => {
    const date = parseDate(iso);
    return date ? weekdayFormatter.format(date) : '';
};
export const formatDateTime = (ms) => {
    if (!Number.isFinite(ms))
        return '—';
    return new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(ms));
};
/** التاريخ الحالي بصيغة YYYY-MM-DD حسب التوقيت المحلي. */
export const todayIso = () => toIsoDate(new Date());
export const toIsoDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};
export const addDays = (iso, days) => {
    const date = parseDate(iso) ?? new Date();
    date.setDate(date.getDate() + days);
    return toIsoDate(date);
};
/** الفرق بالأيام بين تاريخ ISO واليوم (سالب = متأخر). */
export const daysFromToday = (iso) => {
    const date = parseDate(iso);
    if (!date)
        return null;
    const today = parseDate(todayIso());
    if (!today)
        return null;
    return Math.round((date.getTime() - today.getTime()) / 86_400_000);
};
export const relativeDayLabel = (iso) => {
    const diff = daysFromToday(iso);
    if (diff === null)
        return '—';
    if (diff === 0)
        return 'اليوم';
    if (diff === 1)
        return 'غداً';
    if (diff === -1)
        return 'أمس';
    if (diff > 1)
        return `بعد ${formatInt(diff)} يوم`;
    return `متأخر ${formatInt(Math.abs(diff))} يوم`;
};
export const formatTime = (time) => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(time ?? '');
    if (!match)
        return '—';
    const hour = Number(match[1]);
    const minute = match[2];
    const period = hour < 12 ? 'ص' : 'م';
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${h12}:${minute} ${period}`;
};
/** رابط اتصال آمن من رقم هاتف حرّ التنسيق. */
export const telHref = (phone) => {
    const cleaned = (phone ?? '').replace(/[^\d+]/g, '');
    return cleaned.length >= 5 ? `tel:${cleaned}` : null;
};
/**
 * رابط محادثة واتساب. wa.me لا يقبل إلا الرقم الدولي بلا صفر بادئ ولا علامة +،
 * فالرقم المحلي (‎0551234567‎) يُحوّل أوّلاً إلى صيغته الدولية.
 */
export const whatsappHref = (phone, message) => {
    const international = normalizePhone(phone ?? '');
    if (!international)
        return null;
    const number = international.slice(1); // إسقاط علامة +
    const text = message?.trim();
    // wa.me يفتح المحادثة والرسالة مكتوبة في الحقل، ولا يرسلها — الإرسال بيد صاحبها.
    return text
        ? `https://wa.me/${number}?text=${encodeURIComponent(text)}`
        : `https://wa.me/${number}`;
};
export const percent = (value) => `${formatNumber(round2(value))}٪`;
