import {
  useEffect,
  useId,
  useRef,
  type ChangeEvent,
  type ReactNode,
} from 'react';

/* ------------------------------------------------------------------ حقول */

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
  type?: 'text' | 'tel' | 'email' | 'password' | 'date' | 'time';
  placeholder?: string;
  hint?: string;
  required?: boolean;
  autoFocus?: boolean;
  inputMode?: 'text' | 'tel' | 'numeric' | 'decimal' | 'email';
  disabled?: boolean;
}

export function TextInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  hint,
  required,
  autoFocus,
  inputMode,
  disabled,
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
          required={required}
          autoFocus={autoFocus}
          inputMode={inputMode}
          disabled={disabled}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onChange(event.target.value);
          }}
        />
      )}
    </Field>
  );
}

interface NumberInputProps {
  label: string;
  value: number | string;
  onChange: (value: string) => void;
  hint?: string;
  suffix?: string;
  min?: number;
  step?: number;
}

export function NumberInput({
  label,
  value,
  onChange,
  hint,
  suffix,
  min = 0,
  step,
}: NumberInputProps) {
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <div className="input-wrap">
          <input
            id={id}
            className="input"
            type="number"
            inputMode="decimal"
            min={min}
            step={step ?? 'any'}
            value={value}
            onChange={(event) => {
              onChange(event.target.value);
            }}
          />
          {suffix ? <span className="input-wrap__suffix">{suffix}</span> : null}
        </div>
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
          className="input input--area"
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        />
      )}
    </Field>
  );
}

interface SelectProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  hint?: string;
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
}: SelectProps<T>) {
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <select
          id={id}
          className="input input--select"
          value={value}
          onChange={(event) => {
            onChange(event.target.value as T);
          }}
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

/* --------------------------------------------------- صفوف البنود والمواد */

export interface LineRow {
  name: string;
  qty: number;
  unitPrice: number;
}

interface LineItemsProps {
  rows: LineRow[];
  nameLabel: string;
  namePlaceholder: string;
  onPatch: (index: number, patch: Partial<LineRow>) => void;
  onRemove: (index: number) => void;
  toNumber: (value: string) => number;
}

/** محرّر صفوف (وصف + كمية + سعر) بعناوين واضحة على الهاتف والحاسوب. */
export function LineItems({
  rows,
  nameLabel,
  namePlaceholder,
  onPatch,
  onRemove,
  toNumber: parse,
}: LineItemsProps) {
  return (
    <div className="line-items">
      <div className="line-item line-item--head" aria-hidden="true">
        <span>{nameLabel}</span>
        <span>الكمية</span>
        <span>سعر الوحدة</span>
        <span />
      </div>
      {rows.map((row, index) => (
        <div className="line-item" key={index}>
          <label className="li-field">
            <span className="li-field__caption">{nameLabel}</span>
            <input
              className="input"
              placeholder={namePlaceholder}
              value={row.name}
              onChange={(event) => {
                onPatch(index, { name: event.target.value });
              }}
            />
          </label>
          <label className="li-field">
            <span className="li-field__caption">الكمية</span>
            <input
              className="input"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={row.qty}
              onChange={(event) => {
                onPatch(index, { qty: parse(event.target.value) });
              }}
            />
          </label>
          <label className="li-field">
            <span className="li-field__caption">سعر الوحدة</span>
            <input
              className="input"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={row.unitPrice}
              onChange={(event) => {
                onPatch(index, { unitPrice: parse(event.target.value) });
              }}
            />
          </label>
          <button
            type="button"
            className="icon-btn li-remove"
            aria-label={`حذف السطر ${index + 1}`}
            onClick={() => {
              onRemove(index);
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ نافذة */

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

export function Modal({ open, title, onClose, children, footer, wide }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`modal${wide ? ' modal--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={panelRef}
      >
        <header className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="إغلاق">
            ✕
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer ? <footer className="modal__footer">{footer}</footer> : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ عناصر */

export function Badge({ tone, children }: { tone: string; children: ReactNode }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty__mark" aria-hidden="true">
        ⌁
      </div>
      <h3 className="empty__title">{title}</h3>
      <p className="empty__text">{description}</p>
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

export function StatCard({
  label,
  value,
  tone = 'default',
  sub,
}: {
  label: string;
  value: string;
  tone?: string;
  sub?: string;
}) {
  return (
    <div className={`stat stat--${tone}`}>
      <span className="stat__label">{label}</span>
      <strong className="stat__value">{value}</strong>
      {sub ? <span className="stat__sub">{sub}</span> : null}
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
            إلغاء
          </button>
          <button type="button" className="btn btn--danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="modal__message">{message}</p>
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
