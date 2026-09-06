import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import {
  Badge,
  ConfirmDialog,
  EmptyState,
  LineItems,
  Modal,
  NumberInput,
  Select,
  TextArea,
  TextInput,
} from '@/components/ui';
import { orderTotals } from '@/lib/calc';
import { ORDER_STATUSES, orderStatusLabel, orderStatusTone } from '@/lib/constants';
import {
  formatDate,
  formatMoney,
  relativeDayLabel,
  telHref,
  toNumber,
  todayIso,
} from '@/lib/format';
import type { NewRecord } from '@/data/store';
import type { Order, OrderItem, OrderStatus } from '@/lib/types';
import { buildInvoice } from '@/print/templates';
import { printHtml } from '@/print/print';

type Filter = OrderStatus | 'all';

const emptyOrder = (): NewRecord<Order> => ({
  title: '',
  customerName: '',
  phone: '',
  address: '',
  notes: '',
  status: 'in_progress',
  items: [{ name: '', qty: 1, unitPrice: 0 }],
  extraCharges: 0,
  discount: 0,
  paid: 0,
  dueDate: todayIso(),
});

export default function Orders() {
  const { orders, profile, create, update, remove } = useData();
  const { notify, notifyError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Order | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState<NewRecord<Order>>(emptyOrder);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Order | null>(null);

  // فتح نموذج طلبية جديدة عبر اختصار التطبيق (?new=1).
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditing(null);
      setDraft(emptyOrder());
      setFormOpen(true);
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const counts = useMemo(() => {
    const base: Record<Filter, number> = {
      all: orders.length,
      in_progress: 0,
      pending: 0,
      completed: 0,
    };
    orders.forEach((order) => {
      base[order.status] += 1;
    });
    return base;
  }, [orders]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (filter !== 'all' && order.status !== filter) return false;
      if (!term) return true;
      return [order.title, order.customerName, order.phone, order.address, order.notes]
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  }, [orders, filter, search]);

  const openNew = () => {
    setEditing(null);
    setDraft({ ...emptyOrder(), items: [{ name: '', qty: 1, unitPrice: 0 }] });
    setFormOpen(true);
  };

  const openEdit = (order: Order) => {
    setEditing(order);
    setDraft({
      title: order.title,
      customerName: order.customerName,
      phone: order.phone,
      address: order.address,
      notes: order.notes,
      status: order.status,
      items: order.items?.length ? order.items.map((item) => ({ ...item })) : [{ name: '', qty: 1, unitPrice: 0 }],
      extraCharges: order.extraCharges,
      discount: order.discount,
      paid: order.paid,
      dueDate: order.dueDate,
    });
    setFormOpen(true);
  };

  const patchDraft = (patch: Partial<NewRecord<Order>>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const patchItem = (index: number, patch: Partial<OrderItem>) => {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  };

  const addItem = () => {
    setDraft((current) => ({
      ...current,
      items: [...current.items, { name: '', qty: 1, unitPrice: 0 }],
    }));
  };

  const removeItem = (index: number) => {
    setDraft((current) => ({
      ...current,
      items: current.items.filter((_, i) => i !== index),
    }));
  };

  const draftTotals = orderTotals({
    ...(draft as Order),
    items: draft.items.filter((item) => item.name.trim() || item.unitPrice > 0),
  });

  const save = async () => {
    if (!draft.title.trim() && !draft.customerName.trim()) {
      notify('أدخل عنوان الطلبية أو اسم الزبون على الأقل.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload: NewRecord<Order> = {
        ...draft,
        title: draft.title.trim() || draft.customerName.trim(),
        customerName: draft.customerName.trim(),
        phone: draft.phone.trim(),
        address: draft.address.trim(),
        notes: draft.notes.trim(),
        items: draft.items
          .filter((item) => item.name.trim() || item.qty > 0 || item.unitPrice > 0)
          .map((item) => ({
            name: item.name.trim() || 'بند',
            qty: item.qty || 0,
            unitPrice: item.unitPrice || 0,
          })),
      };
      if (editing) {
        await update('orders', editing.id, payload);
        notify('حُفظت تعديلات الطلبية.');
      } else {
        await create('orders', payload);
        notify('أُضيفت الطلبية.');
      }
      setFormOpen(false);
      setEditing(null);
    } catch (error) {
      notifyError(error);
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (order: Order, status: OrderStatus) => {
    try {
      await update('orders', order.id, { status });
      notify(`الطلبية الآن: ${orderStatusLabel(status)}`);
    } catch (error) {
      notifyError(error);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove('orders', toDelete.id);
      notify('حُذفت الطلبية.');
    } catch (error) {
      notifyError(error);
    } finally {
      setToDelete(null);
    }
  };

  const printInvoice = (order: Order) => {
    printHtml(`فاتورة - ${order.title}`, buildInvoice(order, profile));
  };

  const filterChips: { value: Filter; label: string }[] = [
    { value: 'all', label: 'الكل' },
    ...ORDER_STATUSES.map((status) => ({ value: status.value as Filter, label: status.label })),
  ];

  return (
    <>
      <div className="search-bar">
        <span className="search-bar__icon">⌕</span>
        <input
          className="input"
          type="search"
          placeholder="ابحث باسم الزبون أو الطلبية أو الهاتف"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
          }}
        />
      </div>

      <div className="filters">
        {filterChips.map((chip) => (
          <button
            key={chip.value}
            type="button"
            className={`chip${filter === chip.value ? ' is-active' : ''}`}
            onClick={() => {
              setFilter(chip.value);
            }}
          >
            {chip.label} ({counts[chip.value]})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={orders.length === 0 ? 'لا توجد طلبيات بعد' : 'لا نتائج مطابقة'}
          description={
            orders.length === 0
              ? 'أضف أول طلبية لتتابع حالتها ومبالغها ومواعيد تسليمها.'
              : 'جرّب تغيير كلمة البحث أو الفلتر.'
          }
          action={
            orders.length === 0 ? (
              <button type="button" className="btn" onClick={openNew}>
                إضافة طلبية
              </button>
            ) : null
          }
        />
      ) : (
        <div className="list">
          {visible.map((order) => {
            const totals = orderTotals(order);
            const tel = telHref(order.phone);
            const late =
              order.status !== 'completed' &&
              order.dueDate &&
              relativeDayLabel(order.dueDate).startsWith('متأخر');
            return (
              <article key={order.id} className="card">
                <div className="card__head">
                  <div>
                    <h3 className="card__title">{order.title}</h3>
                    <p className="card__sub">{order.customerName || 'بدون اسم زبون'}</p>
                  </div>
                  <Badge tone={orderStatusTone(order.status)}>
                    {orderStatusLabel(order.status)}
                  </Badge>
                </div>

                <div className="card__meta">
                  <span>
                    الإجمالي <strong>{formatMoney(totals.total, profile.currency)}</strong>
                  </span>
                  <span>
                    المتبقّي <strong>{formatMoney(totals.remaining, profile.currency)}</strong>
                  </span>
                  {order.dueDate ? (
                    <span>
                      التسليم <strong>{formatDate(order.dueDate)}</strong>
                      {late ? <Badge tone="danger"> {relativeDayLabel(order.dueDate)}</Badge> : null}
                    </span>
                  ) : null}
                  {order.phone ? (
                    <span>
                      الهاتف{' '}
                      {tel ? (
                        <a href={tel}>
                          <strong>{order.phone}</strong>
                        </a>
                      ) : (
                        <strong>{order.phone}</strong>
                      )}
                    </span>
                  ) : null}
                </div>

                {totals.total > 0 ? (
                  <div className="progress" aria-hidden="true">
                    <div
                      className="progress__bar"
                      style={{ width: `${Math.min(100, (totals.paid / totals.total) * 100)}%` }}
                    />
                  </div>
                ) : null}

                <div className="card__actions">
                  <select
                    className="input input--select"
                    style={{ maxWidth: 130, padding: '6px 10px', fontSize: 13 }}
                    value={order.status}
                    onChange={(event) => {
                      void changeStatus(order, event.target.value as OrderStatus);
                    }}
                    aria-label="حالة الطلبية"
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => {
                      openEdit(order);
                    }}
                  >
                    تعديل
                  </button>
                  <button
                    type="button"
                    className="btn btn--soft btn--sm"
                    onClick={() => {
                      printInvoice(order);
                    }}
                  >
                    طباعة فاتورة
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => {
                      setToDelete(order);
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
        + طلبية جديدة
      </button>

      <Modal
        open={formOpen}
        wide
        title={editing ? 'تعديل الطلبية' : 'طلبية جديدة'}
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
          label="عنوان الطلبية"
          value={draft.title}
          onChange={(value) => {
            patchDraft({ title: value });
          }}
          placeholder="مثال: خزانة ملابس بابين"
          autoFocus
        />
        <div className="grid-2">
          <TextInput
            label="اسم الزبون"
            value={draft.customerName}
            onChange={(value) => {
              patchDraft({ customerName: value });
            }}
          />
          <TextInput
            label="رقم الهاتف"
            type="tel"
            inputMode="tel"
            value={draft.phone}
            onChange={(value) => {
              patchDraft({ phone: value });
            }}
          />
        </div>
        <TextInput
          label="العنوان"
          value={draft.address}
          onChange={(value) => {
            patchDraft({ address: value });
          }}
        />
        <div className="grid-2">
          <Select
            label="الحالة"
            value={draft.status}
            options={ORDER_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
            onChange={(value) => {
              patchDraft({ status: value });
            }}
          />
          <TextInput
            label="تاريخ التسليم"
            type="date"
            value={draft.dueDate}
            onChange={(value) => {
              patchDraft({ dueDate: value });
            }}
          />
        </div>

        <div className="section-title">
          <h2>بنود الطلبية</h2>
          <button type="button" className="btn btn--soft btn--sm" onClick={addItem}>
            + بند
          </button>
        </div>
        <LineItems
          rows={draft.items}
          nameLabel="الوصف"
          namePlaceholder="مثال: ألواح خشب"
          onPatch={patchItem}
          onRemove={removeItem}
          toNumber={(value) => toNumber(value)}
        />

        <div className="grid-3 mt-12">
          <NumberInput
            label="أجور إضافية"
            value={draft.extraCharges}
            onChange={(value) => {
              patchDraft({ extraCharges: toNumber(value) });
            }}
          />
          <NumberInput
            label="خصم"
            value={draft.discount}
            onChange={(value) => {
              patchDraft({ discount: toNumber(value) });
            }}
          />
          <NumberInput
            label="المدفوع"
            value={draft.paid}
            onChange={(value) => {
              patchDraft({ paid: toNumber(value) });
            }}
          />
        </div>

        <div className="summary-box mt-8">
          <div className="summary-row">
            <span>مجموع البنود</span>
            <span>{formatMoney(draftTotals.itemsTotal, profile.currency)}</span>
          </div>
          <div className="summary-row">
            <span>المدفوع</span>
            <span>{formatMoney(draftTotals.paid, profile.currency)}</span>
          </div>
          <div className="summary-row">
            <span>المتبقّي</span>
            <span>{formatMoney(draftTotals.remaining, profile.currency)}</span>
          </div>
          <div className="summary-row summary-row--total">
            <span>الإجمالي</span>
            <span>{formatMoney(draftTotals.total, profile.currency)}</span>
          </div>
        </div>

        <TextArea
          label="ملاحظات"
          value={draft.notes}
          onChange={(value) => {
            patchDraft({ notes: value });
          }}
          placeholder="تفاصيل الخامات، المقاسات، أو أي اتفاق مع الزبون"
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="حذف الطلبية"
        message={`سيُحذف سجل «${toDelete?.title ?? ''}» نهائياً. هل تريد المتابعة؟`}
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
