import { useMemo, useState } from 'react';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import {
  Badge,
  ConfirmDialog,
  EmptyState,
  Modal,
  NumberInput,
  StatCard,
  TextArea,
  TextInput,
} from '@/components/ui';
import { debtTotals } from '@/lib/calc';
import {
  daysFromToday,
  formatDate,
  formatMoney,
  relativeDayLabel,
  telHref,
  toNumber,
  todayIso,
  whatsappHref,
} from '@/lib/format';
import { newId } from '@/lib/id';
import type { NewRecord } from '@/data/store';
import type { Debt, DebtPayment } from '@/lib/types';
import { buildDebtStatement, buildDebtsReport } from '@/print/templates';
import { printHtml } from '@/print/print';

type Filter = 'all' | 'open' | 'overdue' | 'settled';

const emptyDebt = (): NewRecord<Debt> => ({
  customerName: '',
  phone: '',
  address: '',
  goods: '',
  amount: 0,
  payments: [],
  dueDate: todayIso(),
  notes: '',
});

export default function Debts() {
  const { debts, profile, create, update, remove } = useData();
  const { notify, notifyError } = useToast();

  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [draft, setDraft] = useState<NewRecord<Debt>>(emptyDebt);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Debt | null>(null);
  const [payingFor, setPayingFor] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [detail, setDetail] = useState<Debt | null>(null);

  const totals = useMemo(
    () =>
      debts.reduce(
        (acc, debt) => {
          const t = debtTotals(debt);
          return {
            amount: acc.amount + t.amount,
            paid: acc.paid + t.paid,
            remaining: acc.remaining + t.remaining,
            overdue:
              acc.overdue +
              (!t.isSettled && (daysFromToday(debt.dueDate) ?? 1) < 0 ? t.remaining : 0),
          };
        },
        { amount: 0, paid: 0, remaining: 0, overdue: 0 },
      ),
    [debts],
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return debts.filter((debt) => {
      const t = debtTotals(debt);
      const overdue = !t.isSettled && (daysFromToday(debt.dueDate) ?? 1) < 0;
      if (filter === 'open' && t.isSettled) return false;
      if (filter === 'settled' && !t.isSettled) return false;
      if (filter === 'overdue' && !overdue) return false;
      if (!term) return true;
      return [debt.customerName, debt.phone, debt.address, debt.goods, debt.notes]
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  }, [debts, filter, search]);

  const openNew = () => {
    setEditing(null);
    setDraft(emptyDebt());
    setFormOpen(true);
  };

  const openEdit = (debt: Debt) => {
    setEditing(debt);
    setDraft({
      customerName: debt.customerName,
      phone: debt.phone,
      address: debt.address,
      goods: debt.goods,
      amount: debt.amount,
      payments: debt.payments ?? [],
      dueDate: debt.dueDate,
      notes: debt.notes,
    });
    setFormOpen(true);
  };

  const patch = (value: Partial<NewRecord<Debt>>) => {
    setDraft((current) => ({ ...current, ...value }));
  };

  const save = async () => {
    if (!draft.customerName.trim()) {
      notify('اكتب اسم الزبون.', 'error');
      return;
    }
    if (!(draft.amount > 0)) {
      notify('أدخل مبلغ الدين.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload: NewRecord<Debt> = {
        ...draft,
        customerName: draft.customerName.trim(),
        phone: draft.phone.trim(),
        address: draft.address.trim(),
        goods: draft.goods.trim(),
        notes: draft.notes.trim(),
      };
      if (editing) {
        await update('debts', editing.id, payload);
        notify('حُفظ سجل الدين.');
      } else {
        await create('debts', payload);
        notify('أُضيف الدين إلى السجل.');
      }
      setFormOpen(false);
      setEditing(null);
    } catch (error) {
      notifyError(error);
    } finally {
      setSaving(false);
    }
  };

  const addPayment = async () => {
    if (!payingFor) return;
    const amount = toNumber(paymentAmount, Number.NaN);
    if (!Number.isFinite(amount) || amount <= 0) {
      notify('أدخل مبلغ دفعة صحيح.', 'error');
      return;
    }
    const payment: DebtPayment = {
      id: newId(),
      amount,
      date: todayIso(),
      note: paymentNote.trim(),
    };
    try {
      await update('debts', payingFor.id, {
        payments: [...(payingFor.payments ?? []), payment],
      });
      notify('سُجّلت الدفعة.');
      setPayingFor(null);
      setPaymentAmount('');
      setPaymentNote('');
    } catch (error) {
      notifyError(error);
    }
  };

  const removePayment = async (debt: Debt, paymentId: string) => {
    try {
      await update('debts', debt.id, {
        payments: (debt.payments ?? []).filter((p) => p.id !== paymentId),
      });
      notify('حُذفت الدفعة.');
      setDetail((current) =>
        current && current.id === debt.id
          ? { ...current, payments: current.payments.filter((p) => p.id !== paymentId) }
          : current,
      );
    } catch (error) {
      notifyError(error);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove('debts', toDelete.id);
      notify('حُذف سجل الدين.');
    } catch (error) {
      notifyError(error);
    } finally {
      setToDelete(null);
    }
  };

  const money = (value: number) => formatMoney(value, profile.currency);

  const chips: { value: Filter; label: string }[] = [
    { value: 'all', label: 'الكل' },
    { value: 'open', label: 'غير مسدّد' },
    { value: 'overdue', label: 'متأخر' },
    { value: 'settled', label: 'مسدّد' },
  ];

  return (
    <>
      <div className="stat-grid">
        <StatCard label="إجمالي الديون" value={money(totals.amount)} />
        <StatCard label="المسدّد" value={money(totals.paid)} tone="ok" />
        <StatCard label="المتبقّي" value={money(totals.remaining)} tone="warn" />
        <StatCard label="متأخر السداد" value={money(totals.overdue)} tone="danger" />
      </div>

      <div className="search-bar mt-16">
        <span className="search-bar__icon">⌕</span>
        <input
          className="input"
          type="search"
          placeholder="ابحث باسم الزبون أو البضاعة أو الهاتف"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
          }}
        />
      </div>

      <div className="filters">
        {chips.map((chip) => (
          <button
            key={chip.value}
            type="button"
            className={`chip${filter === chip.value ? ' is-active' : ''}`}
            onClick={() => {
              setFilter(chip.value);
            }}
          >
            {chip.label}
          </button>
        ))}
        {debts.length > 0 ? (
          <button
            type="button"
            className="chip"
            onClick={() => {
              printHtml(
                'سجل الديون',
                buildDebtsReport(
                  visible,
                  profile,
                  chips.find((c) => c.value === filter)?.label ?? 'كل الديون',
                ),
              );
            }}
          >
            🖨 طباعة القائمة
          </button>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={debts.length === 0 ? 'لا توجد ديون مسجّلة' : 'لا نتائج مطابقة'}
          description={
            debts.length === 0
              ? 'سجّل ديون الزبائن بالاسم والهاتف والعنوان والبضاعة والمبلغ.'
              : 'جرّب تغيير الفلتر أو كلمة البحث.'
          }
          action={
            debts.length === 0 ? (
              <button type="button" className="btn" onClick={openNew}>
                إضافة دين
              </button>
            ) : null
          }
        />
      ) : (
        <div className="list">
          {visible.map((debt) => {
            const t = debtTotals(debt);
            const overdue = !t.isSettled && (daysFromToday(debt.dueDate) ?? 1) < 0;
            const tel = telHref(debt.phone);
            const wa = whatsappHref(debt.phone);
            return (
              <article key={debt.id} className="card">
                <div className="card__head">
                  <div>
                    <h3 className="card__title">{debt.customerName}</h3>
                    <p className="card__sub">{debt.goods || 'بضاعة غير محدّدة'}</p>
                  </div>
                  {t.isSettled ? (
                    <Badge tone="ok">مسدّد</Badge>
                  ) : overdue ? (
                    <Badge tone="danger">{relativeDayLabel(debt.dueDate)}</Badge>
                  ) : (
                    <Badge tone="warn">{money(t.remaining)}</Badge>
                  )}
                </div>

                <div className="card__meta">
                  <span>
                    المبلغ <strong>{money(t.amount)}</strong>
                  </span>
                  <span>
                    المسدّد <strong>{money(t.paid)}</strong>
                  </span>
                  <span>
                    المتبقّي <strong>{money(t.remaining)}</strong>
                  </span>
                  {debt.dueDate ? (
                    <span>
                      الاستحقاق <strong>{formatDate(debt.dueDate)}</strong>
                    </span>
                  ) : null}
                  {debt.phone ? (
                    <span>
                      الهاتف{' '}
                      {tel ? (
                        <a href={tel}>
                          <strong>{debt.phone}</strong>
                        </a>
                      ) : (
                        <strong>{debt.phone}</strong>
                      )}
                    </span>
                  ) : null}
                  {debt.address ? (
                    <span>
                      العنوان <strong>{debt.address}</strong>
                    </span>
                  ) : null}
                </div>

                {t.amount > 0 ? (
                  <div className="progress" aria-hidden="true">
                    <div
                      className="progress__bar"
                      style={{ width: `${Math.min(100, (t.paid / t.amount) * 100)}%` }}
                    />
                  </div>
                ) : null}

                <div className="card__actions">
                  {!t.isSettled ? (
                    <button
                      type="button"
                      className="btn btn--sm"
                      onClick={() => {
                        setPayingFor(debt);
                        setPaymentAmount(String(t.remaining));
                        setPaymentNote('');
                      }}
                    >
                      تسجيل دفعة
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => {
                      setDetail(debt);
                    }}
                  >
                    الدفعات ({debt.payments?.length ?? 0})
                  </button>
                  <button
                    type="button"
                    className="btn btn--soft btn--sm"
                    onClick={() => {
                      printHtml(`كشف دين - ${debt.customerName}`, buildDebtStatement(debt, profile));
                    }}
                  >
                    طباعة كشف
                  </button>
                  {wa ? (
                    <a
                      className="btn btn--ghost btn--sm"
                      href={wa}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      واتساب
                    </a>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => {
                      openEdit(debt);
                    }}
                  >
                    تعديل
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => {
                      setToDelete(debt);
                    }}
                  >
                    حذف
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <button type="button" className="fab" onClick={openNew}>
        + دين جديد
      </button>

      <Modal
        open={formOpen}
        title={editing ? 'تعديل الدين' : 'دين جديد'}
        onClose={() => {
          setFormOpen(false);
        }}
        footer={
          <>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setFormOpen(false);
              }}
            >
              إلغاء
            </button>
            <button
              type="button"
              className="btn"
              disabled={saving}
              onClick={() => {
                void save();
              }}
            >
              {saving ? 'جارٍ الحفظ…' : 'حفظ'}
            </button>
          </>
        }
      >
        <TextInput
          label="اسم الزبون"
          value={draft.customerName}
          onChange={(value) => {
            patch({ customerName: value });
          }}
          autoFocus
        />
        <div className="grid-2">
          <TextInput
            label="رقم الهاتف"
            type="tel"
            inputMode="tel"
            value={draft.phone}
            onChange={(value) => {
              patch({ phone: value });
            }}
          />
          <TextInput
            label="تاريخ الاستحقاق"
            type="date"
            value={draft.dueDate}
            onChange={(value) => {
              patch({ dueDate: value });
            }}
          />
        </div>
        <TextInput
          label="العنوان"
          value={draft.address}
          onChange={(value) => {
            patch({ address: value });
          }}
        />
        <TextInput
          label="البضاعة"
          value={draft.goods}
          onChange={(value) => {
            patch({ goods: value });
          }}
          placeholder="ما الذي أخذه الزبون؟"
        />
        <NumberInput
          label="المبلغ"
          value={draft.amount}
          onChange={(value) => {
            patch({ amount: toNumber(value) });
          }}
          suffix={profile.currency}
        />
        <TextArea
          label="ملاحظات"
          value={draft.notes}
          onChange={(value) => {
            patch({ notes: value });
          }}
        />
      </Modal>

      <Modal
        open={Boolean(payingFor)}
        title={`تسجيل دفعة — ${payingFor?.customerName ?? ''}`}
        onClose={() => {
          setPayingFor(null);
        }}
        footer={
          <>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setPayingFor(null);
              }}
            >
              إلغاء
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                void addPayment();
              }}
            >
              حفظ الدفعة
            </button>
          </>
        }
      >
        <p className="small muted">
          المتبقّي حالياً:{' '}
          <strong>{payingFor ? money(debtTotals(payingFor).remaining) : ''}</strong>
        </p>
        <div className="mt-12">
          <NumberInput
            label="مبلغ الدفعة"
            value={paymentAmount}
            onChange={setPaymentAmount}
            suffix={profile.currency}
          />
          <TextInput
            label="ملاحظة"
            value={paymentNote}
            onChange={setPaymentNote}
            placeholder="نقداً، تحويل، شيك…"
          />
        </div>
      </Modal>

      <Modal
        open={Boolean(detail)}
        title={`دفعات ${detail?.customerName ?? ''}`}
        onClose={() => {
          setDetail(null);
        }}
      >
        {(detail?.payments?.length ?? 0) === 0 ? (
          <p className="muted small">لا توجد دفعات مسجّلة بعد.</p>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th className="num">المبلغ</th>
                  <th>ملاحظة</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {detail?.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{formatDate(payment.date)}</td>
                    <td className="num">{money(payment.amount)}</td>
                    <td>{payment.note || '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label="حذف الدفعة"
                        onClick={() => {
                          void removePayment(detail, payment.id);
                        }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="حذف الدين"
        message={`سيُحذف سجل «${toDelete?.customerName ?? ''}» وكل دفعاته نهائياً.`}
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
