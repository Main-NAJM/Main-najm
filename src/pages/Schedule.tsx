import { useMemo, useState } from 'react';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import {
  Badge,
  ConfirmDialog,
  EmptyState,
  Modal,
  NumberInput,
  Select,
  TextArea,
  TextInput,
} from '@/components/ui';
import {
  addDays,
  formatDate,
  formatTime,
  formatWeekday,
  relativeDayLabel,
  telHref,
  toNumber,
  todayIso,
} from '@/lib/format';
import type { NewRecord } from '@/data/store';
import type { Appointment } from '@/lib/types';

type Range = 'today' | 'upcoming' | 'all' | 'done';

const emptyAppointment = (date: string): NewRecord<Appointment> => ({
  title: '',
  date,
  time: '09:00',
  durationMin: 60,
  customerName: '',
  phone: '',
  location: '',
  notes: '',
  orderId: null,
  done: false,
});

const sortByDateTime = (a: Appointment, b: Appointment): number => {
  const key = (item: Appointment) => `${item.date} ${item.time}`;
  return key(a).localeCompare(key(b));
};

export default function Schedule() {
  const { appointments, orders, create, update, remove } = useData();
  const { notify, notifyError } = useToast();

  const [range, setRange] = useState<Range>('today');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [draft, setDraft] = useState<NewRecord<Appointment>>(() => emptyAppointment(todayIso()));
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Appointment | null>(null);

  const today = todayIso();

  const visible = useMemo(() => {
    const rows = [...appointments].sort(sortByDateTime);
    switch (range) {
      case 'today':
        return rows.filter((item) => item.date === today && !item.done);
      case 'upcoming':
        return rows.filter((item) => item.date > today && !item.done);
      case 'done':
        return rows.filter((item) => item.done).reverse();
      default:
        return rows;
    }
  }, [appointments, range, today]);

  const grouped = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    visible.forEach((item) => {
      const list = map.get(item.date) ?? [];
      list.push(item);
      map.set(item.date, list);
    });
    return [...map.entries()];
  }, [visible]);

  const counts = useMemo(
    () => ({
      today: appointments.filter((a) => a.date === today && !a.done).length,
      upcoming: appointments.filter((a) => a.date > today && !a.done).length,
      all: appointments.length,
      done: appointments.filter((a) => a.done).length,
    }),
    [appointments, today],
  );

  const openNew = (date = today) => {
    setEditing(null);
    setDraft(emptyAppointment(date));
    setFormOpen(true);
  };

  const openEdit = (item: Appointment) => {
    setEditing(item);
    setDraft({
      title: item.title,
      date: item.date,
      time: item.time,
      durationMin: item.durationMin,
      customerName: item.customerName,
      phone: item.phone,
      location: item.location,
      notes: item.notes,
      orderId: item.orderId,
      done: item.done,
    });
    setFormOpen(true);
  };

  const patch = (value: Partial<NewRecord<Appointment>>) => {
    setDraft((current) => ({ ...current, ...value }));
  };

  const save = async () => {
    if (!draft.title.trim()) {
      notify('اكتب عنوان الموعد.', 'error');
      return;
    }
    if (!draft.date) {
      notify('اختر تاريخ الموعد.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload: NewRecord<Appointment> = {
        ...draft,
        title: draft.title.trim(),
        customerName: draft.customerName.trim(),
        phone: draft.phone.trim(),
        location: draft.location.trim(),
        notes: draft.notes.trim(),
      };
      if (editing) {
        await update('appointments', editing.id, payload);
        notify('حُفظ الموعد.');
      } else {
        await create('appointments', payload);
        notify('أُضيف الموعد.');
      }
      setFormOpen(false);
      setEditing(null);
    } catch (error) {
      notifyError(error);
    } finally {
      setSaving(false);
    }
  };

  const toggleDone = async (item: Appointment) => {
    try {
      await update('appointments', item.id, { done: !item.done });
      notify(item.done ? 'أُعيد الموعد إلى قائمة الانتظار.' : 'تم إنجاز الموعد.');
    } catch (error) {
      notifyError(error);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove('appointments', toDelete.id);
      notify('حُذف الموعد.');
    } catch (error) {
      notifyError(error);
    } finally {
      setToDelete(null);
    }
  };

  const orderOptions = useMemo(
    () => [
      { value: '', label: 'بدون ربط بطلبية' },
      ...orders.map((order) => ({ value: order.id, label: order.title || order.customerName })),
    ],
    [orders],
  );

  const chips: { value: Range; label: string }[] = [
    { value: 'today', label: `اليوم (${counts.today})` },
    { value: 'upcoming', label: `قادمة (${counts.upcoming})` },
    { value: 'all', label: `الكل (${counts.all})` },
    { value: 'done', label: `منجزة (${counts.done})` },
  ];

  return (
    <>
      <div className="filters">
        {chips.map((chip) => (
          <button
            key={chip.value}
            type="button"
            className={`chip${range === chip.value ? ' is-active' : ''}`}
            onClick={() => {
              setRange(chip.value);
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="row-between">
          <div>
            <strong>{formatDate(today)}</strong>
            <p className="small muted">{formatWeekday(today)}</p>
          </div>
          <div className="cluster">
            <button
              type="button"
              className="btn btn--soft btn--sm"
              onClick={() => {
                openNew(today);
              }}
            >
              موعد اليوم
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => {
                openNew(addDays(today, 1));
              }}
            >
              موعد الغد
            </button>
          </div>
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="mt-16">
          <EmptyState
            title="لا توجد مواعيد في هذه القائمة"
            description="نظّم يومك بإضافة مواعيد القياس والتسليم والزيارات."
            action={
              <button
                type="button"
                className="btn"
                onClick={() => {
                  openNew();
                }}
              >
                إضافة موعد
              </button>
            }
          />
        </div>
      ) : (
        grouped.map(([date, items]) => (
          <section key={date}>
            <div className="day-group__head">
              <span className="day-group__title">{formatDate(date)}</span>
              <span className="day-group__sub">
                {formatWeekday(date)} · {relativeDayLabel(date)}
              </span>
            </div>
            <div className="list">
              {items.map((item) => {
                const tel = telHref(item.phone);
                const linkedOrder = item.orderId
                  ? orders.find((order) => order.id === item.orderId)
                  : null;
                return (
                  <article key={item.id} className="card">
                    <div className="card__head">
                      <div>
                        <h3 className="card__title">{item.title}</h3>
                        <p className="card__sub">
                          {formatTime(item.time)}
                          {item.durationMin ? ` · ${item.durationMin} دقيقة` : ''}
                          {item.customerName ? ` · ${item.customerName}` : ''}
                        </p>
                      </div>
                      {item.done ? <Badge tone="ok">منجز</Badge> : <Badge tone="info">قادم</Badge>}
                    </div>

                    <div className="card__meta">
                      {item.location ? <span>المكان: <strong>{item.location}</strong></span> : null}
                      {item.phone ? (
                        <span>
                          الهاتف:{' '}
                          {tel ? (
                            <a href={tel}>
                              <strong>{item.phone}</strong>
                            </a>
                          ) : (
                            <strong>{item.phone}</strong>
                          )}
                        </span>
                      ) : null}
                      {linkedOrder ? <span>الطلبية: <strong>{linkedOrder.title}</strong></span> : null}
                    </div>
                    {item.notes ? <p className="small muted mt-8">{item.notes}</p> : null}

                    <div className="card__actions">
                      <button
                        type="button"
                        className="btn btn--soft btn--sm"
                        onClick={() => {
                          void toggleDone(item);
                        }}
                      >
                        {item.done ? 'إرجاع' : 'تم الإنجاز'}
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => {
                          openEdit(item);
                        }}
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => {
                          setToDelete(item);
                        }}
                      >
                        حذف
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))
      )}

      <button
        type="button"
        className="fab"
        onClick={() => {
          openNew();
        }}
      >
        + موعد جديد
      </button>

      <Modal
        open={formOpen}
        title={editing ? 'تعديل الموعد' : 'موعد جديد'}
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
          label="عنوان الموعد"
          value={draft.title}
          onChange={(value) => {
            patch({ title: value });
          }}
          placeholder="مثال: أخذ قياسات، تسليم بضاعة"
          autoFocus
        />
        <div className="grid-3">
          <TextInput
            label="التاريخ"
            type="date"
            value={draft.date}
            onChange={(value) => {
              patch({ date: value });
            }}
          />
          <TextInput
            label="الوقت"
            type="time"
            value={draft.time}
            onChange={(value) => {
              patch({ time: value });
            }}
          />
          <NumberInput
            label="المدة"
            suffix="دقيقة"
            value={draft.durationMin}
            onChange={(value) => {
              patch({ durationMin: toNumber(value) });
            }}
          />
        </div>
        <div className="grid-2">
          <TextInput
            label="اسم الزبون"
            value={draft.customerName}
            onChange={(value) => {
              patch({ customerName: value });
            }}
          />
          <TextInput
            label="رقم الهاتف"
            type="tel"
            inputMode="tel"
            value={draft.phone}
            onChange={(value) => {
              patch({ phone: value });
            }}
          />
        </div>
        <TextInput
          label="المكان"
          value={draft.location}
          onChange={(value) => {
            patch({ location: value });
          }}
          placeholder="الورشة، بيت الزبون، السوق…"
        />
        <Select
          label="مرتبط بطلبية"
          value={draft.orderId ?? ''}
          options={orderOptions}
          onChange={(value) => {
            patch({ orderId: value || null });
          }}
        />
        <TextArea
          label="ملاحظات"
          value={draft.notes}
          onChange={(value) => {
            patch({ notes: value });
          }}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="حذف الموعد"
        message={`سيُحذف موعد «${toDelete?.title ?? ''}» نهائياً.`}
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
