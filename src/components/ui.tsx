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
  /** 'ltr' لمحتوى لاتيني (هاتف، بريد) داخل واجهة عربية، مع إبقائه محاذياً لليمين. */
  dir?: 'ltr';
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
  dir,
}: TextInputProps) {
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <input
          id={id}
          className={`input${dir === 'ltr' ? ' input--ltr' : ''}`}
          type={type}
          value={value}
          placeholder={placeholder}
          required={required}
          autoFocus={autoFocus}
          inputMode={inputMode}
          disabled={disabled}
          dir={dir}
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

/**
 * عدّاد: رقم بين زرَّي نقصان وزيادة.
 *
 * يُستعمل حيث يكون الرقم صغيراً ويُعدَّل بخطوة واحدة — عدد قطع البروفيل مثلاً:
 * صاحب الورشة يعرف أنها «إحدى عشرة أو اثنتا عشرة»، فيرفعها بضغطة بدل أن يفتح
 * لوحة المفاتيح الرقمية ويمسح ويكتب. والحقل يبقى قابلاً للكتابة لمن يعرف رقمه.
 */
export function Stepper({
  label,
  value,
  onChange,
  hint,
  suffix,
  min = 0,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  const clamp = (next: number) => {
    const bounded = Math.max(min, max === undefined ? next : Math.min(max, next));
    // كسور الفاصلة العائمة تُنتج ١١٫٠٠٠٠٠٠٠٠٠٠٠٠٢ عند الجمع المتكرّر.
    return Math.round(bounded * 1000) / 1000;
  };

  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <div className="stepper">
          <button
            type="button"
            className="stepper__btn"
            onClick={() => {
              onChange(clamp(value - step));
            }}
            disabled={value <= min}
            aria-label={`نقصان ${label}`}
          >
            −
          </button>
          <div className="input-wrap stepper__field">
            <input
              id={id}
              className="input"
              type="number"
              inputMode="numeric"
              min={min}
              max={max}
              step={step}
              value={value === 0 ? '' : value}
              onFocus={(event) => {
                event.target.select();
              }}
              onChange={(event) => {
                const next = Number(event.target.value);
                onChange(Number.isFinite(next) ? clamp(next) : min);
              }}
            />
            {suffix ? <span className="input-wrap__suffix">{suffix}</span> : null}
          </div>
          <button
            type="button"
            className="stepper__btn"
            onClick={() => {
              onChange(clamp(value + step));
            }}
            disabled={max !== undefined && value >= max}
            aria-label={`زيادة ${label}`}
          >
            +
          </button>
        </div>
      )}
    </Field>
  );
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
            // الصفر يُعرض فارغاً لا رقماً: حقل مبدوء بصفر يجعل الكتابة فيه
            // «05000»، ولا تصحّحه React لأنها تقارن «05000» بـ5000 مقارنة مرنة
            // فتراهما سواء. والفارغ هنا يعني صفراً على أي حال.
            value={value === 0 ? '' : value}
            onFocus={(event) => {
              // تحديد ما في الحقل عند لمسه: من يضغط على مبلغ ليصحّحه يريد كتابته
              // من جديد، لا إلحاق أرقامه بالقديم.
              event.target.select();
            }}
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
              value={row.qty === 0 ? '' : row.qty}
              onFocus={(event) => {
                event.target.select();
              }}
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
              value={row.unitPrice === 0 ? '' : row.unitPrice}
              onFocus={(event) => {
                event.target.select();
              }}
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

  // onClose تُكتب في موضع الاستدعاء كدالّة سهمية، فهويّتها تتغيّر مع كل رسم.
  // حفظها في مرجع يمنع الأثر أدناه من إعادة التشغيل مع كل حرف يُكتب.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // التركيز على اللوحة مرّة واحدة عند الفتح فقط. كان هذا السطر داخل أثرٍ يعتمد
  // على onClose، فيُعاد تشغيله مع كل ضغطة مفتاح فينتزع التركيز من الحقل الذي
  // يكتب فيه صاحبه — فلا يُقبل إلا أوّل حرف.
  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    // العنصر الذي فتح النافذة — يُعاد إليه التركيز عند الإغلاق، وإلا وجد
    // مستخدم لوحة المفاتيح نفسه في أول الصفحة بلا سياق.
    const opener = document.activeElement as HTMLElement | null;

    const onKeyDown = (event: KeyboardEvent) => {
      // closeRef لا onClose: هويّة onClose تتغيّر مع كل رسم، والاعتماد عليها
      // هنا هو ما كان ينتزع التركيز من الحقل بعد أوّل حرف.
      if (event.key === 'Escape') {
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      // حبس التركيز: بدونه يخرج Tab إلى الصفحة خلف النافذة وهي معطّلة بصريًا
      const panel = panelRef.current;
      if (!panel) return;
      const items = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.getClientRects().length > 0);

      if (items.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [open]);

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
