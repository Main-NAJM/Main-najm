/**
 * رسائل جاهزة تُفتح في واتساب. تُكتب في حقل الرسالة ولا تُرسل من تلقائها —
 * صاحب الورشة يقرؤها ويعدّلها ويضغط إرسال، فلا تخرج رسالة باسمه بلا إذنه.
 */
import { formatDate, formatTime, relativeDayLabel } from './format';
const lines = (parts) => parts.filter((part) => Boolean(part?.trim())).join('\n');
/** تذكير بموعد: التحية، ثم متى، ثم ماذا وأين، ثم اسم الورشة. */
export const appointmentReminder = (item, profile) => {
    const greeting = item.customerName.trim()
        ? `السلام عليكم ${item.customerName.trim()}،`
        : 'السلام عليكم،';
    const day = relativeDayLabel(item.date);
    const when = `تذكير بموعدنا ${day} ${formatDate(item.date)} الساعة ${formatTime(item.time)}.`;
    const what = item.title.trim() ? `الموضوع: ${item.title.trim()}.` : null;
    const where = item.location.trim() ? `المكان: ${item.location.trim()}.` : null;
    const signature = profile.businessName.trim() ? `\n${profile.businessName.trim()}` : null;
    return lines([greeting, when, what, where, signature]);
};
