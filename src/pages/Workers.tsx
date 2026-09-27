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
import { workerTotals, workersDue } from '@/lib/calc';
import {
  formatDate,
  formatInt,
  formatMoney,
  telHref,
  toNumber,
  todayIso,
  whatsappHref,
} from '@/lib/format';
import { newId } from '@/lib/id';
import { buildWorkerStatement } from '@/print/templates';
import { printHtml } from '@/print/print';
import type { NewRecord } from '@/data/store';
import type { Worker, WorkerJob, WorkerPayment } from '@/lib/types';

type Filter = 'all' | 'due' | 'settled' | 'stopped';

const emptyWorker = (): NewRecord<Worker> => ({
  name: '',
  phone: '',
  role: '',
  jobs: [],
  payments: [],
  active: true,
  notes: '',
});

const emptyJob = () => ({ title: '', date: todayIso(), wage: 0, orderId: '', notes: '' });

export default function Workers() {
  const { workers, orders, profile, create, update, remove } = useData();
  const { notify, notifyError } = useToast();

  const [filter, setFilter] = useState<Filter>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Worker | null>(null);
  const [draft, setDraft] = useState<NewRecord<Worker>>(emptyWorker);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Worker | null>(null);

  const [jobFor, setJobFor] = useState<Worker | null>(null);
  const [jobDraft, setJobDraft] = useState(emptyJob);
  const [payFor, setPayFor] = useState<Worker | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [sheetFor, setSheetFor] = useState<Worker | null>(null);

  const money = (value: number) => formatMoney(value, profile.currency);

  const totals = useMemo(
    () => ({
      count: workers.filter((w) => w.active).length,
      earned: workers.reduce((sum, w) => sum + workerTotals(w).earned, 0),
      due: workersDue(workers),
    }),
    [workers],
  );

  // من له مستحقّ أوّلاً — هو ما يحتاج صاحب الورشة تذكّره.
  const visible = useMemo(() => {
    const rows = workers.filter((worker) => {
      const t = workerTotals(worker);
      if (filter === 'due') return !t.isSettled;
      if (filter === 'settled') return t.isSettled && worker.active;
      if (filter === 'stopped') return !worker.active;
      return true;
    });
    return rows.sort((a, b) => {
      const dueDiff = workerTotals(b).due - workerTotals(a).due;
      return dueDiff !== 0 ? dueDiff : a.name.localeCompare(b.name, 'ar');
    });
  }, [workers, filter]);

  const openNew = () => {
    setEditing(null);
    setDraft(emptyWorker());
    setFormOpen(true);
  };

  const openEdit = (worker: Worker) => {
    setEditing(worker);
    setDraft({
      name: worker.name,
      phone: worker.phone,
      role: worker.role,
      jobs: worker.jobs,
      payments: worker.payments,
      active: worker.active,
      notes: worker.notes,
    });
    setFormOpen(true);
    setSheetFor(null);
  };

  const patch = (value: Partial<NewRecord<Worker>>) => {
    setDraft((current) => ({ ...current, ...value }));
  };

  const save = async () => {
    if (!draft.name.trim()) {
      notify('اكتب اسم العامل.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload: NewRecord<Worker> = {
        ...draft,
        name: draft.name.trim(),
        phone: draft.phone.trim(),
        role: draft.role.trim(),
        notes: draft.notes.trim(),
      };
      if (editing) {
        await update('workers', editing.id, payload);
        notify('حُفظ العامل.');
      } else {
        await create('workers', payload);
        notify('أُضيف العامل إلى السجل.');
      }
      setFormOpen(false);
      setEditing(null);
    } catch (error) {
      notifyError(error);
    } finally {
      setSaving(false);
    }
  };

  const addJob = async () => {
    if (!jobFor) return;
    if (!jobDraft.title.trim()) {
      notify('اكتب ما قام به العامل.', 'error');
      return;
    }
    const wage = toNumber(String(jobDraft.wage), Number.NaN);
    if (!Number.isFinite(wage) || wage < 0) {
      notify('أدخل أجرة صحيحة.', 'error');
      return;
    }
    const job: WorkerJob = {
      id: newId(),
      title: jobDraft.title.trim(),
      date: jobDraft.date || todayIso(),
      wage,
      orderId: jobDraft.orderId || null,
      notes: jobDraft.notes.trim(),
    };
    try {
      await update('workers', jobFor.id, { jobs: [...(jobFor.jobs ?? []), job] });
      notify(`سُجّل العمل، وأُضيف ${money(wage)} إلى مستحقّ ${jobFor.name}.`);
      setJobFor(null);
      setJobDraft(emptyJob());
    } catch (error) {
      notifyError(error);
    }
  };

  const addPayment = async () => {
    if (!payFor) return;
    const amount = toNumber(payAmount, Number.NaN);
    if (!Number.isFinite(amount) || amount <= 0) {
      notify('أدخل مبلغاً أكبر من صفر.', 'error');
      return;
    }
    const payment: WorkerPayment = {
      id: newId(),
      amount,
      date: todayIso(),
      note: payNote.trim(),
    };
    try {
      await update('workers', payFor.id, {
        payments: [...(payFor.payments ?? []), payment],
      });
      notify(`سُلّم ${money(amount)} إلى ${payFor.name}.`);
      setPayFor(null);
      setPayAmount('');
      setPayNote('');
    } catch (error) {
      notifyError(error);
    }
  };

  /** حذف سطر واحد من أعمال العامل أو دفعاته. */
  const removeRow = async (worker: Worker, kind: 'jobs' | 'payments', id: string) => {
    try {
      const next =
        kind === 'jobs'
          ? { jobs: (worker.jobs ?? []).filter((row) => row.id !== id) }
          : { payments: (worker.payments ?? []).filter((row) => row.id !== id) };
      await update('workers', worker.id, next);
      setSheetFor({ ...worker, ...next });
      notify(kind === 'jobs' ? 'حُذف العمل.' : 'حُذفت الدفعة.');
    } catch (error) {
      notifyError(error);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove('workers', toDelete.id);
      notify('حُذف العامل وسجلّه.');
    } catch (error) {
      notifyError(error);
    } finally {
      setToDelete(null);
    }
  };

  const chips: { value: Filter; label: string }[] = [
    { value: 'all', label: `الكل (${formatInt(workers.length)})` },
    {
      value: 'due',
      label: `له مستحقّ (${formatInt(workers.filter((w) => !workerTotals(w).isSettled).length)})`,
    },
    { value: 'settled', label: 'مسدَّد' },
    { value: 'stopped', label: 'متوقّف' },
  ];

  if (workers.length === 0) {
    return (
      <>
        <EmptyState
          title="لا عمّال في السجل"
          description="سجّل من يعمل معك، ثم دوّن كل عمل يقوم به وأجرته عليه — فيعرف كلاكما ما له وما قُبض."
          action={
            <button type="button" className="btn" onClick={openNew}>
              إضافة عامل
            </button>
          }
        />
        <WorkerForm
          open={formOpen}
          editing={editing}
          draft={draft}
          saving={saving}
          onPatch={patch}
          onClose={() => {
            setFormOpen(false);
          }}
          onSave={() => {
            void save();
          }}
        />
      </>
    );
  }

  return (
    <>
      <div className="stat-grid">
        <StatCard
          wide
          label="المستحقّ عليك للعمّال"
          value={money(totals.due)}
          tone={totals.due > 0 ? 'warn' : 'ok'}
          sub={totals.due > 0 ? 'لم يُسلَّم بعد' : 'كل الحسابات مسدَّدة'}
        />
        <StatCard label="عمّال يعملون" value={formatInt(totals.count)} tone="info" />
        <StatCard label="إجمالي الأجور" value={money(totals.earned)} sub="منذ البداية" />
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
      </div>

      <p className="small muted">
        ما تسلّمه للعامل يدخل مصاريف الشهر تلقائياً في باب الأجور — فلا تسجّله مرّة أخرى في
        صفحة المصاريف.
      </p>

      <SectionTitle
        action={
          <button type="button" className="btn btn--sm" onClick={openNew}>
            <PlusIcon width={16} height={16} /> عامل
          </button>
        }
      >
        العمّال
      </SectionTitle>

      {visible.length === 0 ? (
        <EmptyState title="لا عامل في هذا التصنيف" description="جرّب تصنيفاً آخر." />
      ) : (
        <div className="list">
          {visible.map((worker) => {
            const t = workerTotals(worker);
            const tel = telHref(worker.phone);
            const wa = whatsappHref(worker.phone);
            const recent = [...(worker.jobs ?? [])]
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 2);
            return (
              <article key={worker.id} className="card">
                <div className="card__head">
                  <div>
                    <h3 className="card__title">{worker.name}</h3>
                    <p className="card__sub">
                      {worker.role || 'عامل'} · {formatInt(t.jobsCount)} عمل
                    </p>
                  </div>
                  {!worker.active ? (
                    <Badge tone="muted">متوقّف</Badge>
                  ) : t.isSettled ? (
                    <Badge tone="ok">مسدَّد</Badge>
                  ) : (
                    <Badge tone="warn">{money(t.due)}</Badge>
                  )}
                </div>

                <div className="card__meta">
                  <span>
                    الأجور <strong>{money(t.earned)}</strong>
                  </span>
                  <span>
                    المُسلَّم <strong>{money(t.paid)}</strong>
                  </span>
                  <span>
                    المستحقّ <strong>{money(t.due)}</strong>
                  </span>
                  {worker.phone ? (
                    <span>
                      الهاتف{' '}
                      {tel ? (
                        <a href={tel} dir="ltr">
                          <strong>{worker.phone}</strong>
                        </a>
                      ) : (
                        <strong dir="ltr">{worker.phone}</strong>
                      )}
                    </span>
                  ) : null}
                </div>

                {recent.length > 0 ? (
                  <ul className="mini-log">
                    {recent.map((job) => (
                      <li key={job.id}>
                        <span>{job.title}</span>
                        <span className="mini-log__meta">
                          {formatDate(job.date)} · {money(job.wage)}
                        </span>
                      </li>
                    ))}
                    {t.jobsCount > recent.length ? (
                      <li className="mini-log__more">
                        و{formatInt(t.jobsCount - recent.length)} عمل آخر…
                      </li>
                    ) : null}
                  </ul>
                ) : null}

                {worker.notes ? <p className="small muted mt-8">{worker.notes}</p> : null}

                <div className="card__actions">
                  <button
                    type="button"
                    className="btn btn--soft btn--sm"
                    onClick={() => {
                      setJobFor(worker);
                      setJobDraft(emptyJob());
                    }}
                  >
                    تسجيل عمل
                  </button>
                  <button
                    type="button"
                    className="btn btn--soft btn--sm"
                    disabled={t.isSettled}
                    onClick={() => {
                      setPayFor(worker);
                      setPayAmount(String(t.due));
                      setPayNote('');
                    }}
                  >
                    تسديد
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => {
                      setSheetFor(worker);
                    }}
                  >
                    السجل
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
                </div>
              </article>
            );
          })}
        </div>
      )}

      <WorkerForm
        open={formOpen}
        editing={editing}
        draft={draft}
        saving={saving}
        onPatch={patch}
        onClose={() => {
          setFormOpen(false);
        }}
        onSave={() => {
          void save();
        }}
      />

      {/* تسجيل عمل */}
      <Modal
        open={Boolean(jobFor)}
        title={`تسجيل عمل — ${jobFor?.name ?? ''}`}
        onClose={() => {
          setJobFor(null);
        }}
        footer={
          <>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setJobFor(null);
              }}
            >
              إلغاء
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                void addJob();
              }}
            >
              حفظ
            </button>
          </>
        }
      >
        <TextInput
          label="ما الذي قام به"
          value={jobDraft.title}
          onChange={(value) => {
            setJobDraft((d) => ({ ...d, title: value }));
          }}
          placeholder="مثال: تركيب باب في بيت الزبون"
        />
        <div className="grid-2">
          <NumberInput
            label={`أجرته على هذا العمل (${profile.currency})`}
            value={jobDraft.wage}
            onChange={(value) => {
              setJobDraft((d) => ({ ...d, wage: toNumber(value) }));
            }}
          />
          <TextInput
            label="التاريخ"
            type="date"
            value={jobDraft.date}
            onChange={(value) => {
              setJobDraft((d) => ({ ...d, date: value }));
            }}
          />
        </div>
        <Select
          label="على أيّ طلبية (اختياري)"
          value={jobDraft.orderId}
          options={[
            { value: '', label: 'بلا ربط' },
            ...orders.map((order) => ({
              value: order.id,
              label: order.title || order.customerName || 'طلبية',
            })),
          ]}
          onChange={(value) => {
            setJobDraft((d) => ({ ...d, orderId: value }));
          }}
        />
        <TextArea
          label="ملاحظات"
          rows={2}
          value={jobDraft.notes}
          onChange={(value) => {
            setJobDraft((d) => ({ ...d, notes: value }));
          }}
        />
      </Modal>

      {/* تسديد */}
      <Modal
        open={Boolean(payFor)}
        title={`تسديد — ${payFor?.name ?? ''}`}
        onClose={() => {
          setPayFor(null);
        }}
        footer={
          <>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setPayFor(null);
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
              تسليم
            </button>
          </>
        }
      >
        <p className="modal__message">
          المستحقّ لـ<strong>{payFor?.name}</strong>:{' '}
          <strong>{payFor ? money(workerTotals(payFor).due) : ''}</strong>
        </p>
        <NumberInput
          label={`المبلغ المُسلَّم (${profile.currency})`}
          value={payAmount}
          onChange={setPayAmount}
        />
        <TextInput
          label="ملاحظة"
          value={payNote}
          onChange={setPayNote}
          placeholder="نقداً، تحويل…"
        />
      </Modal>

      {/* السجل الكامل */}
      <Modal
        open={Boolean(sheetFor)}
        wide
        title={`سجل ${sheetFor?.name ?? ''}`}
        onClose={() => {
          setSheetFor(null);
        }}
        footer={
          <>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                if (sheetFor) setToDelete(sheetFor);
                setSheetFor(null);
              }}
            >
              حذف العامل
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                if (sheetFor) openEdit(sheetFor);
              }}
            >
              تعديل
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                if (!sheetFor) return;
                printHtml(
                  `كشف ${sheetFor.name}`,
                  buildWorkerStatement(sheetFor, profile),
                );
              }}
            >
              طباعة
            </button>
          </>
        }
      >
        {sheetFor ? <WorkerSheet worker={sheetFor} money={money} onRemove={removeRow} /> : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="حذف العامل"
        message={`سيُحذف «${toDelete?.name ?? ''}» وكل أعماله ودفعاته نهائياً.`}
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

/* ------------------------------------------------------- سجل عامل واحد */

function WorkerSheet({
  worker,
  money,
  onRemove,
}: {
  worker: Worker;
  money: (value: number) => string;
  onRemove: (worker: Worker, kind: 'jobs' | 'payments', id: string) => Promise<void>;
}) {
  const t = workerTotals(worker);
  const jobs = [...(worker.jobs ?? [])].sort((a, b) => b.date.localeCompare(a.date));
  const payments = [...(worker.payments ?? [])].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <div className="summary-box">
        <div className="summary-row">
          <span>مجموع الأجور</span>
          <span>{money(t.earned)}</span>
        </div>
        <div className="summary-row">
          <span>المُسلَّم</span>
          <span>{money(t.paid)}</span>
        </div>
        <div className="summary-row summary-row--total">
          <span>المستحقّ له</span>
          <span>{money(t.due)}</span>
        </div>
      </div>

      <SectionTitle>الأعمال</SectionTitle>
      {jobs.length === 0 ? (
        <p className="small muted">لم يُسجَّل له عمل بعد.</p>
      ) : (
        <ul className="ledger">
          {jobs.map((job) => (
            <li key={job.id}>
              <div>
                <strong>{job.title}</strong>
                <span className="ledger__meta">{formatDate(job.date)}</span>
                {job.notes ? <span className="ledger__meta">{job.notes}</span> : null}
              </div>
              <div className="ledger__end">
                <strong>{money(job.wage)}</strong>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`حذف ${job.title}`}
                  onClick={() => {
                    void onRemove(worker, 'jobs', job.id);
                  }}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <SectionTitle>الدفعات</SectionTitle>
      {payments.length === 0 ? (
        <p className="small muted">لم يُسلَّم له شيء بعد.</p>
      ) : (
        <ul className="ledger">
          {payments.map((payment) => (
            <li key={payment.id}>
              <div>
                <strong>{payment.note || 'دفعة'}</strong>
                <span className="ledger__meta">{formatDate(payment.date)}</span>
              </div>
              <div className="ledger__end">
                <strong>{money(payment.amount)}</strong>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="حذف الدفعة"
                  onClick={() => {
                    void onRemove(worker, 'payments', payment.id);
                  }}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/* ------------------------------------------------------------ نموذج العامل */

function WorkerForm({
  open,
  editing,
  draft,
  saving,
  onPatch,
  onClose,
  onSave,
}: {
  open: boolean;
  editing: Worker | null;
  draft: NewRecord<Worker>;
  saving: boolean;
  onPatch: (value: Partial<NewRecord<Worker>>) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal
      open={open}
      title={editing ? 'تعديل عامل' : 'عامل جديد'}
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
        label="اسم العامل"
        value={draft.name}
        onChange={(value) => {
          onPatch({ name: value });
        }}
        placeholder="مثال: كريم بن عمر"
      />
      <div className="grid-2">
        <TextInput
          label="صفته"
          value={draft.role}
          onChange={(value) => {
            onPatch({ role: value });
          }}
          placeholder="نجّار مساعد، لحّام…"
        />
        <TextInput
          label="رقم الهاتف"
          type="tel"
          inputMode="tel"
          dir="ltr"
          value={draft.phone}
          onChange={(value) => {
            onPatch({ phone: value });
          }}
          placeholder="0551234567"
        />
      </div>
      <label className="check">
        <input
          type="checkbox"
          checked={draft.active}
          onChange={(event) => {
            onPatch({ active: event.target.checked });
          }}
        />
        <span>
          يعمل معك الآن
          <em>ألغِ العلامة لمن توقّف — يبقى سجلّه للمراجعة ويخرج من قائمة العاملين</em>
        </span>
      </label>
      <TextArea
        label="ملاحظات"
        rows={2}
        value={draft.notes}
        onChange={(value) => {
          onPatch({ notes: value });
        }}
      />
    </Modal>
  );
}
