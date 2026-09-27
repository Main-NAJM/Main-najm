import { useMemo, useState } from 'react';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import {
  Badge,
  ConfirmDialog,
  EmptyState,
  Modal,
  NumberInput,
  SectionTitle,
  Select,
  StatCard,
  TextArea,
  TextInput,
} from '@/components/ui';
import { PlusIcon } from '@/components/icons';
import { activeMonths, monthlyBooks } from '@/lib/calc';
import { EXPENSE_CATEGORIES, expenseCategoryLabel } from '@/lib/constants';
import {
  addMonths,
  currentMonth,
  formatDate,
  formatInt,
  formatMoney,
  monthLabel,
  percent,
  toNumber,
  todayIso,
} from '@/lib/format';
import { buildMonthlyReport } from '@/print/templates';
import { printHtml } from '@/print/print';
import type { NewRecord } from '@/data/store';
import type { Expense, ExpenseCategory } from '@/lib/types';

const emptyExpense = (month: string): NewRecord<Expense> => ({
  title: '',
  category: 'purchases',
  amount: 0,
  // شهر المعروض لا شهر اليوم: من يسجّل مصاريف شهر مضى يريدها فيه.
  date: month === currentMonth() ? todayIso() : `${month}-01`,
  recurring: false,
  notes: '',
});

export default function Expenses() {
  const { orders, debts, expenses, profile, create, update, remove } = useData();
  const { notify, notifyError } = useToast();

  const [month, setMonth] = useState<string>(currentMonth);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [draft, setDraft] = useState<NewRecord<Expense>>(() => emptyExpense(currentMonth()));
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Expense | null>(null);

  const money = (value: number) => formatMoney(value, profile.currency);

  const books = useMemo(
    () => monthlyBooks(month, orders, debts, expenses),
    [month, orders, debts, expenses],
  );
  const previous = useMemo(
    () => monthlyBooks(addMonths(month, -1), orders, debts, expenses),
    [month, orders, debts, expenses],
  );
  const months = useMemo(
    () => activeMonths(orders, debts, expenses, currentMonth()),
    [orders, debts, expenses],
  );

  const monthExpenses = useMemo(
    () =>
      expenses
        .filter((expense) => (expense.date ?? '').slice(0, 7) === month)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [expenses, month],
  );

  /** مصاريف متكرّرة سُجّلت في شهر سابق ولم تُسجَّل في هذا الشهر بعد. */
  const missingRecurring = useMemo(() => {
    const here = new Set(monthExpenses.filter((e) => e.recurring).map((e) => e.title.trim()));
    const seen = new Map<string, Expense>();
    expenses
      .filter((e) => e.recurring && (e.date ?? '').slice(0, 7) < month)
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((e) => {
        const key = e.title.trim();
        if (!here.has(key)) seen.set(key, e); // الأحدث يغلب، فسعره أقرب
      });
    return [...seen.values()];
  }, [expenses, monthExpenses, month]);

  const openNew = () => {
    setEditing(null);
    setDraft(emptyExpense(month));
    setFormOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditing(expense);
    setDraft({
      title: expense.title,
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
      recurring: expense.recurring,
      notes: expense.notes,
    });
    setFormOpen(true);
  };

  const patch = (value: Partial<NewRecord<Expense>>) => {
    setDraft((current) => ({ ...current, ...value }));
  };

  const save = async () => {
    if (!draft.title.trim()) {
      notify('اكتب وصف المصروف.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload: NewRecord<Expense> = {
        ...draft,
        title: draft.title.trim(),
        notes: draft.notes.trim(),
        date: draft.date || todayIso(),
      };
      if (editing) {
        await update('expenses', editing.id, payload);
        notify('حُفظ المصروف.');
      } else {
        await create('expenses', payload);
        notify('سُجّل المصروف.');
      }
      setFormOpen(false);
      setEditing(null);
      setMonth(payload.date.slice(0, 7));
    } catch (error) {
      notifyError(error);
    } finally {
      setSaving(false);
    }
  };

  const addRecurring = async () => {
    try {
      for (const source of missingRecurring) {
        await create('expenses', {
          title: source.title,
          category: source.category,
          amount: source.amount,
          date: `${month}-01`,
          recurring: true,
          notes: source.notes,
        });
      }
      notify(`أُضيف ${formatInt(missingRecurring.length)} مصروفاً متكرّراً.`);
    } catch (error) {
      notifyError(error);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove('expenses', toDelete.id);
      notify('حُذف المصروف.');
    } catch (error) {
      notifyError(error);
    } finally {
      setToDelete(null);
    }
  };

  const print = () => {
    printHtml(
      `كشف ${monthLabel(month)}`,
      buildMonthlyReport(books, monthExpenses, profile),
    );
  };

  const netTone = books.net > 0 ? 'ok' : books.net < 0 ? 'danger' : 'default';
  const change =
    previous.net !== 0 ? ((books.net - previous.net) / Math.abs(previous.net)) * 100 : null;

  return (
    <>
      <div className="month-bar">
        <button
          type="button"
          className="month-bar__step"
          onClick={() => {
            setMonth(addMonths(month, -1));
          }}
        >
          الشهر السابق
        </button>
        <select
          className="input input--select month-bar__pick"
          aria-label="اختيار الشهر"
          value={month}
          onChange={(event) => {
            setMonth(event.target.value);
          }}
        >
          {months.map((key) => (
            <option key={key} value={key}>
              {monthLabel(key)}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="month-bar__step"
          disabled={month >= currentMonth()}
          onClick={() => {
            setMonth(addMonths(month, 1));
          }}
        >
          الشهر التالي
        </button>
      </div>

      <div className="stat-grid">
        {/* الصافي أوّلاً وعلى العرض كلّه: هو الرقم المقصود، وما تحته تفصيله. */}
        <StatCard
          wide
          label={books.net < 0 ? 'خسارة الشهر' : 'ربح الشهر الصافي'}
          value={money(Math.abs(books.net))}
          tone={netTone}
          sub={
            change === null
              ? 'الدخل ناقص المصاريف'
              : `${change >= 0 ? '▲' : '▼'} ${percent(Math.abs(change))} عن الشهر الماضي`
          }
        />
        <StatCard
          label="دخل الشهر"
          value={money(books.income)}
          tone="info"
          sub={`طلبيات ${money(books.fromOrders)} · ديون ${money(books.fromDebts)}`}
        />
        <StatCard
          label="مصاريف الشهر"
          value={money(books.expenses)}
          tone="warn"
          sub={`${formatInt(books.expensesCount)} مصروف`}
        />
      </div>

      {books.unpaid > 0 ? (
        <div className="notice notice--info">
          طلبيات هذا الشهر مجموعها <strong>{money(books.billed)}</strong>، قُبض منها{' '}
          <strong>{money(books.fromOrders)}</strong> وبقي لك{' '}
          <strong>{money(books.unpaid)}</strong> عند الزبائن — لا تدخل في ربح الشهر حتى تُقبض.
        </div>
      ) : null}

      <p className="small muted">
        الربح هنا نقديّ: ما دخل جيبك ناقص ما خرج منه. فليكن صحيحاً، سجّل مشترياتك من المواد
        هنا في المصاريف — وإلا ظهر ربحك أكبر مما هو.
      </p>

      {books.byCategory.length > 0 ? (
        <>
          <SectionTitle>أين ذهبت المصاريف</SectionTitle>
          <div className="card">
            <div className="spend-bars">
              {books.byCategory.map((row) => {
                const share = books.expenses > 0 ? (row.amount / books.expenses) * 100 : 0;
                return (
                  <div className="spend-bar" key={row.category}>
                    <div className="spend-bar__head">
                      <span>{expenseCategoryLabel(row.category)}</span>
                      <strong>{money(row.amount)}</strong>
                    </div>
                    <div className="spend-bar__track">
                      <div className="spend-bar__fill" style={{ width: `${share}%` }} />
                    </div>
                    <span className="spend-bar__share">{percent(share)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : null}

      {missingRecurring.length > 0 ? (
        <div className="notice notice--warn">
          لم تُسجّل مصاريفك المتكرّرة لهذا الشهر ({missingRecurring.map((e) => e.title).join('، ')}).{' '}
          <button type="button" className="auth__link" onClick={() => void addRecurring()}>
            أضفها بأسعار آخر مرّة
          </button>
        </div>
      ) : null}

      <SectionTitle
        action={
          <div className="card__actions card__actions--inline">
            {books.expensesCount > 0 || books.income > 0 ? (
              <button type="button" className="btn btn--ghost btn--sm" onClick={print}>
                طباعة الكشف
              </button>
            ) : null}
            <button type="button" className="btn btn--sm" onClick={openNew}>
              <PlusIcon width={16} height={16} /> مصروف
            </button>
          </div>
        }
      >
        مصاريف {monthLabel(month)}
      </SectionTitle>

      {monthExpenses.length === 0 ? (
        <EmptyState
          title="لا مصاريف في هذا الشهر"
          description="سجّل ما تدفعه: كراء، كهرباء، مواد، أجور، وقود. بدونها يبدو ربحك أكبر مما هو."
          action={
            <button type="button" className="btn" onClick={openNew}>
              تسجيل مصروف
            </button>
          }
        />
      ) : (
        <div className="list">
          {monthExpenses.map((expense) => (
            <article key={expense.id} className="card">
              <div className="card__head">
                <div>
                  <h3 className="card__title">{expense.title}</h3>
                  <p className="card__sub">
                    {expenseCategoryLabel(expense.category)} · {formatDate(expense.date)}
                  </p>
                </div>
                <div className="card__amount">
                  <strong>{money(expense.amount)}</strong>
                  {expense.recurring ? (
                    <div>
                      <Badge tone="muted">شهري</Badge>
                    </div>
                  ) : null}
                </div>
              </div>
              {expense.notes ? <p className="small muted mt-8">{expense.notes}</p> : null}
              <div className="card__actions">
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => {
                    openEdit(expense);
                  }}
                >
                  تعديل
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => {
                    setToDelete(expense);
                  }}
                >
                  حذف
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <ExpenseForm
        open={formOpen}
        editing={editing}
        draft={draft}
        saving={saving}
        currency={profile.currency}
        onPatch={patch}
        onClose={() => {
          setFormOpen(false);
        }}
        onSave={() => {
          void save();
        }}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="حذف المصروف"
        message={`سيُحذف «${toDelete?.title ?? ''}» نهائياً، ويتغيّر ربح الشهر تبعاً لذلك.`}
        onCancel={() => {
          setToDelete(null);
        }}
        onConfirm={() => {
          void confirmDelete();
        }}
      />
    </>
  );
}

/* ----------------------------------------------------------- نموذج المصروف */

function ExpenseForm({
  open,
  editing,
  draft,
  saving,
  currency,
  onPatch,
  onClose,
  onSave,
}: {
  open: boolean;
  editing: Expense | null;
  draft: NewRecord<Expense>;
  saving: boolean;
  currency: string;
  onPatch: (value: Partial<NewRecord<Expense>>) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal
      open={open}
      title={editing ? 'تعديل مصروف' : 'مصروف جديد'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            إلغاء
          </button>
          <button type="button" className="btn" disabled={saving} onClick={onSave}>
            {saving ? 'جارٍ الحفظ…' : 'حفظ'}
          </button>
        </>
      }
    >
      <TextInput
        label="وصف المصروف"
        value={draft.title}
        onChange={(value) => {
          onPatch({ title: value });
        }}
        placeholder="مثال: كراء الورشة"
      />
      <div className="grid-2">
        <Select
          label="الباب"
          value={draft.category}
          options={EXPENSE_CATEGORIES}
          onChange={(value) => {
            onPatch({ category: value as ExpenseCategory });
          }}
        />
        <NumberInput
          label={`المبلغ (${currency})`}
          value={draft.amount}
          onChange={(value) => {
            onPatch({ amount: toNumber(value) });
          }}
        />
      </div>
      <TextInput
        label="التاريخ"
        type="date"
        value={draft.date}
        onChange={(value) => {
          onPatch({ date: value });
        }}
        hint="على هذا التاريخ يقع المصروف في شهره"
      />
      <label className="check">
        <input
          type="checkbox"
          checked={draft.recurring}
          onChange={(event) => {
            onPatch({ recurring: event.target.checked });
          }}
        />
        <span>
          مصروف شهري متكرّر
          <em>كراء أو اشتراك — يعرضه التطبيق عليك لتضيفه كل شهر بضغطة</em>
        </span>
      </label>
      <TextArea
        label="ملاحظات"
        value={draft.notes}
        rows={2}
        onChange={(value) => {
          onPatch({ notes: value });
        }}
      />
    </Modal>
  );
}
