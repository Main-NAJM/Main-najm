import { useEffect, useId, useState, type ChangeEvent, type ReactNode } from 'react';
import { latinDigits } from '@/lib/format';

interface FieldProps {
  label: string;
  hint?: string;
  children: (id: string) => ReactNode;
}

export function Field({ label, hint, children }: FieldProps) {
  const id = useId();
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {children(id)}
      {hint ? <p className="field__hint">{hint}</p> : null}
    </div>
  );
}

interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'tel' | 'email' | 'password' | 'date' | 'number';
  placeholder?: string;
  hint?: string;
  inputMode?: 'text' | 'tel' | 'numeric' | 'decimal' | 'email';
  disabled?: boolean;
  autoFocus?: boolean;
}

export function TextInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  hint,
  inputMode,
  disabled,
  autoFocus,
}: TextInputProps) {
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <input
          id={id}
          className="input"
          type={type}
          value={value}
          placeholder={placeholder}
          inputMode={inputMode}
          disabled={disabled}
          autoFocus={autoFocus}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        />
      )}
    </Field>
  );
}

/**
 * يوحّد ما يكتبه المستخدم فعلاً على الهاتف: الأرقام العربية (٠١٢٣) والفارسية،
 * والفاصلة العشرية بأشكالها الثلاثة (، ٫ ,)، ويطرح ما سواها.
 * لوحة مفاتيح عربية تكتب «١٢٠٠» وNumber لا يفهمها — فتضيع كل ضغطة بلا هذا.
 */
export const normalizeNumeric = (raw: string): string =>
  latinDigits(raw)
    .replace(/[،٫,]/g, '.')
    .replace(/[^\d.]/g, '');

/** رقم من نصّ المستخدم: يقبل الأرقام العربية والفواصل، والفراغ يساوي صفراً. */
export const parseNumeric = (raw: string): number => {
  const parsed = Number(normalizeNumeric(raw));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  /** يسمح بالفاصلة العشرية — للمقاسات والكميات دون الأسعار الصحيحة. */
  decimals?: boolean;
  placeholder?: string;
  hint?: string;
  autoFocus?: boolean;
}

/**
 * حقل رقمي يكتب فيه المستخدم بحرّية.
 *
 * الحقل المربوط مباشرةً برقم لا يُكتب فيه: ما إن تُطبع «1.» حتى يحوّلها Number
 * إلى 1 فتختفي الفاصلة، و«0» تصير صفراً فيُمسح، والأرقام العربية تصير NaN فتضيع
 * كل ضغطة. لذا يُحتفظ هنا بنصّ المستخدم كما كتبه أثناء الكتابة، ولا يُشتقّ من
 * الرقم إلا بعد مغادرة الحقل.
 */
export function NumberInput({
  label,
  value,
  onChange,
  decimals = false,
  placeholder,
  hint,
  autoFocus,
}: NumberInputProps) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <input
          id={id}
          className="input"
          type="text"
          inputMode={decimals ? 'decimal' : 'numeric'}
          value={draft ?? (value === 0 ? '' : String(value))}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            let text = normalizeNumeric(event.target.value);
            if (!decimals) text = text.replace(/\./g, '');
            // فاصلة عشرية واحدة: ما بعدها يلتحق بالكسر.
            const parts = text.split('.');
            if (parts.length > 2) text = `${parts.shift()}.${parts.join('')}`;
            setDraft(text);
            onChange(parseNumeric(text));
          }}
          onBlur={() => setDraft(null)}
        />
      )}
    </Field>
  );
}

interface TextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  hint?: string;
}

export function TextArea({ label, value, onChange, rows = 3, placeholder, hint }: TextAreaProps) {
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <textarea
          id={id}
          className="input"
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </Field>
  );
}

interface SelectProps<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  hint?: string;
}

export function Select<T extends string>({ label, value, onChange, options, hint }: SelectProps<T>) {
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <select
          id={id}
          className="input"
          value={value}
          onChange={(event) => onChange(event.target.value as T)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function Badge({ tone, children }: { tone: string; children: ReactNode }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

export function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: string;
}) {
  return (
    <div className={`stat${tone ? ` stat--${tone}` : ''}`}>
      <span className="stat__label">{label}</span>
      <strong className="stat__value">{value}</strong>
      {hint ? <span className="stat__hint">{hint}</span> : null}
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <p className="empty__title">{title}</p>
      {hint ? <p className="empty__hint">{hint}</p> : null}
      {action}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="section-title">
      <h2>{children}</h2>
      {action}
    </div>
  );
}

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

export function Modal({ open, title, onClose, children, footer, wide }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="modal__backdrop" aria-label="إغلاق" onClick={onClose} />
      <div className={`modal__panel${wide ? ' modal__panel--wide' : ''}`}>
        <div className="modal__head">
          <h3>{title}</h3>
          <button type="button" className="modal__close" onClick={onClose} aria-label="إغلاق">
            ✕
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer ? <div className="modal__foot">{footer}</div> : null}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'حذف',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            تراجع
          </button>
          <button type="button" className="btn btn--danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}

export function Spinner({ label = 'جارٍ التحميل…' }: { label?: string }) {
  return (
    <div className="spinner" role="status">
      <span className="spinner__dot" />
      <span>{label}</span>
    </div>
  );
}
