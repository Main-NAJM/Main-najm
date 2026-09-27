/**
 * المظهر: فاتح، داكن، أو تابع للجهاز.
 *
 * الرموز اللونية في `global.css` تعرف الوضعين أصلاً: تتبدّل تلقائياً مع
 * `prefers-color-scheme`، وتُجبَر بـ`data-theme` على عنصر الصفحة. هذا الملف
 * يمسك المفتاح اليدوي: يقرأ الاختيار، يكتبه على `<html>`، ويحفظه في الجهاز.
 *
 * والحفظ في الجهاز لا في الحساب عن قصد: الهاتف في اليد مساءً والحاسوب في
 * الورشة نهاراً، ولكلٍّ مظهره وإن كان صاحبهما واحداً.
 */
export const THEME_KEY = 'herfah.theme';
export const THEME_CHOICES = [
    { value: 'auto', label: 'تلقائي', hint: 'يتبع إعداد هاتفك' },
    { value: 'light', label: 'فاتح', hint: 'أبيض دائماً' },
    { value: 'dark', label: 'داكن', hint: 'كحلي دائماً' },
];
/** ألوان شريط النظام أعلى الشاشة — مطابقة لـ‎--bar‎ في كل وضع. */
const BAR_LIGHT = '#0f172a';
const BAR_DARK = '#0b1324';
const isChoice = (value) => value === 'auto' || value === 'light' || value === 'dark';
/**
 * القراءة قد ترمي في وضع التصفّح الخاص أو حين تُمنع بيانات الموقع، فتُحاط
 * بـtry دائماً — ومظهر افتراضي أهون من شاشة بيضاء.
 */
export const readTheme = () => {
    try {
        const saved = localStorage.getItem(THEME_KEY);
        if (isChoice(saved))
            return saved;
    }
    catch {
        /* التخزين محجوب — نكمل بالتلقائي */
    }
    return 'auto';
};
export const saveTheme = (choice) => {
    try {
        if (choice === 'auto')
            localStorage.removeItem(THEME_KEY);
        else
            localStorage.setItem(THEME_KEY, choice);
    }
    catch {
        /* التخزين محجوب — الاختيار يبقى لهذه الجلسة وحدها */
    }
};
/** هل الشاشة داكنة فعلاً الآن؟ يفيد في اختيار لون شريط النظام. */
export const isDarkNow = (choice) => {
    if (choice === 'dark')
        return true;
    if (choice === 'light')
        return false;
    return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
};
/**
 * شريط النظام أعلى الهاتف يقرأ ‎<meta name="theme-color">‎. الوسمان الموجودان في
 * `index.html` مشروطان بإعداد الجهاز، فلا يتبعان اختياراً يدنياً يخالفه — لذا
 * يُستبدلان هنا بوسم واحد صريح حين يُجبَر المظهر، ويعودان عند «تلقائي».
 */
const applyThemeColor = (choice) => {
    const head = document.head;
    head.querySelectorAll('meta[name="theme-color"]').forEach((node) => {
        node.remove();
    });
    const add = (content, media) => {
        const meta = document.createElement('meta');
        meta.name = 'theme-color';
        meta.content = content;
        if (media)
            meta.media = media;
        head.appendChild(meta);
    };
    if (choice === 'auto') {
        add(BAR_LIGHT, '(prefers-color-scheme: light)');
        add(BAR_DARK, '(prefers-color-scheme: dark)');
    }
    else {
        add(choice === 'dark' ? BAR_DARK : BAR_LIGHT);
    }
};
/** يكتب الاختيار على عنصر الصفحة. `auto` تُزيل الإجبار فتعود للجهاز. */
export const applyTheme = (choice) => {
    const root = document.documentElement;
    if (choice === 'auto')
        root.removeAttribute('data-theme');
    else
        root.setAttribute('data-theme', choice);
    applyThemeColor(choice);
};
