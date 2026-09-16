/** توحيد صيغة رقم الهاتف — يُستعمل في الدخول بالهاتف وفي الحسابات المحلية. */

/** رمز الدولة المفترض حين يُدخل الرقم بصيغة محلية. */
export const DEFAULT_COUNTRY_CODE = '+213'; // الجزائر

/**
 * يعيد الرقم بالصيغة الدولية (‎+213…‎) التي يشترطها Firebase وتصلح مفتاحاً للحساب.
 * يقبل: ‎0673232932‎ و ‎00213673232932‎ و ‎+213 673 23 29 32‎ والأرقام العربية.
 * يعيد null إذا تعذّر فهم الرقم.
 */
export const normalizePhone = (input: string): string | null => {
  // الأرقام العربية‑الهندية (٠١٢…) تُكتب على لوحات مفاتيح كثيرة، فتُحوّل أولاً.
  const latin = input.replace(/[٠-٩۰-۹]/g, (digit) =>
    String(
      digit.charCodeAt(0) >= 0x06f0
        ? digit.charCodeAt(0) - 0x06f0
        : digit.charCodeAt(0) - 0x0660,
    ),
  );
  const compact = latin.replace(/[\s‎‏()-]/g, '');
  if (!compact) return null;

  let value = compact;
  if (value.startsWith('00')) value = `+${value.slice(2)}`;
  else if (value.startsWith('0')) value = `${DEFAULT_COUNTRY_CODE}${value.slice(1)}`;
  else if (!value.startsWith('+')) value = `${DEFAULT_COUNTRY_CODE}${value}`;

  // الصيغة الدولية: + ثم ٨ إلى ١٥ رقماً.
  return /^\+\d{8,15}$/.test(value) ? value : null;
};

/** يعرض الرقم الدولي مقروءاً: ‎+213 673 23 29 32‎. */
export const formatPhone = (phone: string): string => {
  const match = /^\+(\d{1,3})(\d+)$/.exec(phone);
  if (!match) return phone;
  const rest = match[2].replace(/(\d{3})(?=\d)/g, '$1 ');
  return `+${match[1]} ${rest}`;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const normalizeEmail = (input: string): string | null => {
  const value = input.trim().toLowerCase();
  return EMAIL_RE.test(value) ? value : null;
};
