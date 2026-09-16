/**
 * حسابات محلية على الجهاز: تسجيل بالهاتف أو بالبريد مع كلمة مرور ومهنة.
 *
 * تُستعمل عندما لا تكون إعدادات Firebase موجودة (وهي حالة النسخة المنشورة حالياً)،
 * فيبقى للتطبيق تسجيل دخول حقيقي وبيانات منفصلة لكل حساب على الجهاز نفسه.
 *
 * حدود هذا الأسلوب بصراحة: كلمة المرور تُخزَّن مُلبّدة (PBKDF2‑SHA256) لا نصّاً
 * صريحاً، لكنّ الحساب كلّه داخل هذا المتصفّح — فهو يمنع الفضولي لا من يملك الجهاز
 * وخبرة تقنية. المزامنة والحماية الحقيقية تأتيان بربط Firebase.
 */
import { newId } from '@/lib/id';
import { normalizeEmail, normalizePhone } from '@/lib/phone';
import type { Craft, UserType } from '@/lib/types';

const KEY_PREFIX = 'herfah-pro:v1';
const ACCOUNTS_KEY = `${KEY_PREFIX}:accounts`;
const SESSION_KEY = `${KEY_PREFIX}:session`;
/** المعرّف المحلي القديم — قبل وجود الحسابات كان للجهاز مستخدم واحد. */
const LEGACY_UID_KEY = `${KEY_PREFIX}:local-uid`;

export type IdentKind = 'phone' | 'email';

export interface LocalAccount {
  uid: string;
  kind: IdentKind;
  /** الهاتف بالصيغة الدولية أو البريد بأحرف صغيرة — مفتاح الحساب. */
  ident: string;
  displayName: string;
  userType: UserType;
  craft: Craft;
  /** ملح وتلبيدة كلمة المرور بترميز base64. */
  salt: string;
  hash: string;
  createdAt: number;
  lastSignInAt: number;
}

/* ------------------------------------------------------------- قراءة وكتابة */

const readAccounts = (): LocalAccount[] => {
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as LocalAccount[]) : [];
  } catch {
    return [];
  }
};

const writeAccounts = (accounts: LocalAccount[]): void => {
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
};

export const listAccounts = (): LocalAccount[] =>
  readAccounts().sort((a, b) => (b.lastSignInAt || 0) - (a.lastSignInAt || 0));

export const hasAccounts = (): boolean => readAccounts().length > 0;

/* ------------------------------------------------------------ تلبيد كلمة المرور */

const subtle = (): SubtleCrypto => {
  const value = globalThis.crypto?.subtle;
  if (!value) {
    throw new Error(
      'هذا المتصفّح لا يدعم إنشاء حساب محفوظ بكلمة مرور. تابع بدون حساب، أو افتح التطبيق من رابطه الآمن (https).',
    );
  }
  return value;
};

const toBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const fromBase64 = (value: string): Uint8Array =>
  Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

const ITERATIONS = 150_000;

const derive = async (password: string, salt: Uint8Array): Promise<string> => {
  const key = await subtle().importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await subtle().deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  );
  return toBase64(new Uint8Array(bits));
};

/** مقارنة ثابتة الزمن، فلا يُستدلّ على التلبيدة من مدّة المقارنة. */
const equals = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

/* ------------------------------------------------------------------ المعرّف */

export interface IdentResult {
  kind: IdentKind;
  ident: string;
}

/**
 * يفهم ما أدخله المستخدم: رقم هاتف أم بريد إلكتروني، ويعيده بصيغة موحّدة.
 * يعيد null إذا لم يكن أيّاً منهما بصيغة صحيحة.
 */
export const parseIdent = (input: string): IdentResult | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.includes('@')) {
    const email = normalizeEmail(trimmed);
    return email ? { kind: 'email', ident: email } : null;
  }
  const phone = normalizePhone(trimmed);
  return phone ? { kind: 'phone', ident: phone } : null;
};

export const findAccount = (ident: string): LocalAccount | null =>
  readAccounts().find((account) => account.ident === ident) ?? null;

/* ----------------------------------------------------------------- الجلسة */

export const getSession = (): string | null => {
  try {
    const uid = window.localStorage.getItem(SESSION_KEY);
    if (!uid) return null;
    // جلسة لحساب محذوف لا قيمة لها.
    return readAccounts().some((account) => account.uid === uid) ? uid : null;
  } catch {
    return null;
  }
};

export const setSession = (uid: string): void => {
  try {
    window.localStorage.setItem(SESSION_KEY, uid);
  } catch {
    /* التخزين ممنوع: تبقى الجلسة في الذاكرة لهذه الزيارة فقط */
  }
};

export const clearSession = (): void => {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* لا شيء نفعله */
  }
};

export const getAccount = (uid: string): LocalAccount | null =>
  readAccounts().find((account) => account.uid === uid) ?? null;

/* -------------------------------------------------------- إنشاء ودخول وتعديل */

export interface RegisterInput {
  name: string;
  ident: string;
  password: string;
  userType: UserType;
  craft: Craft;
}

/**
 * يُنشئ حساباً جديداً على هذا الجهاز.
 *
 * أوّل حساب يرث معرّف المستخدم المحلي القديم إن وُجد، فلا تضيع بيانات من كان
 * يستعمل التطبيق قبل وجود الحسابات.
 */
export const registerAccount = async (input: RegisterInput): Promise<LocalAccount> => {
  const parsed = parseIdent(input.ident);
  if (!parsed) {
    throw new Error('أدخل رقم هاتف صحيحاً أو بريداً إلكترونياً صحيحاً.');
  }
  if (input.password.length < 4) {
    throw new Error('كلمة المرور يجب أن تكون ٤ خانات على الأقل.');
  }
  const accounts = readAccounts();
  if (accounts.some((account) => account.ident === parsed.ident)) {
    throw new Error('هذا الرقم أو البريد مسجّل على هذا الجهاز. اضغط «دخول» بدل «حساب جديد».');
  }

  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(input.password, salt);
  const now = Date.now();

  const account: LocalAccount = {
    uid: accounts.length === 0 ? adoptLegacyUid() : `local-${newId()}`,
    kind: parsed.kind,
    ident: parsed.ident,
    displayName: input.name.trim(),
    userType: input.userType,
    craft: input.craft,
    salt: toBase64(salt),
    hash,
    createdAt: now,
    lastSignInAt: now,
  };

  writeAccounts([...accounts, account]);
  setSession(account.uid);
  return account;
};

/** المعرّف المحلي القديم إن وُجد، وإلا معرّف جديد يُثبّت مكانه. */
const adoptLegacyUid = (): string => {
  try {
    const existing = window.localStorage.getItem(LEGACY_UID_KEY);
    if (existing) return existing;
  } catch {
    /* التخزين ممنوع */
  }
  return `local-${newId()}`;
};

export const signInAccount = async (
  identInput: string,
  password: string,
): Promise<LocalAccount> => {
  const parsed = parseIdent(identInput);
  const account = parsed ? findAccount(parsed.ident) : null;
  // رسالة واحدة للحالتين، فلا تكشف أيّ الأرقام مسجّل على الجهاز.
  const rejected = new Error('الرقم أو البريد أو كلمة المرور غير صحيحة.');
  if (!account) throw rejected;

  const hash = await derive(password, fromBase64(account.salt));
  if (!equals(hash, account.hash)) throw rejected;

  const updated: LocalAccount = { ...account, lastSignInAt: Date.now() };
  writeAccounts(readAccounts().map((row) => (row.uid === account.uid ? updated : row)));
  setSession(updated.uid);
  return updated;
};

/** تحديث بيانات الحساب (الاسم والمهنة) حين تتغيّر من الإعدادات. */
export const patchAccount = (
  uid: string,
  patch: Partial<Pick<LocalAccount, 'displayName' | 'userType' | 'craft'>>,
): LocalAccount | null => {
  const accounts = readAccounts();
  const index = accounts.findIndex((account) => account.uid === uid);
  if (index === -1) return null;
  const updated = { ...accounts[index], ...patch };
  accounts[index] = updated;
  writeAccounts(accounts);
  return updated;
};

export const changePassword = async (
  uid: string,
  currentPassword: string,
  nextPassword: string,
): Promise<void> => {
  const account = getAccount(uid);
  if (!account) throw new Error('الحساب غير موجود.');
  if (nextPassword.length < 4) {
    throw new Error('كلمة المرور الجديدة يجب أن تكون ٤ خانات على الأقل.');
  }
  const current = await derive(currentPassword, fromBase64(account.salt));
  if (!equals(current, account.hash)) throw new Error('كلمة المرور الحالية غير صحيحة.');

  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(nextPassword, salt);
  writeAccounts(
    readAccounts().map((row) =>
      row.uid === uid ? { ...row, salt: toBase64(salt), hash } : row,
    ),
  );
};
