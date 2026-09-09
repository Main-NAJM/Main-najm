import { useMemo, useState } from 'react';
import { useData } from '@/context/DataContext';
import { isActiveOrder, orderRemaining } from '@/lib/calc';
import { money, newId, waNumber } from '@/lib/format';
import {
  ConfirmDialog,
  EmptyState,
  Modal,
  SectionTitle,
  Spinner,
  TextArea,
  TextInput,
} from '@/components/ui';
import type { Customer } from '@/lib/types';

const emptyCustomer = (): Customer => ({
  id: newId(),
  name: '',
  phone: '',
  address: '',
  note: '',
  createdAt: Date.now(),
});

export default function Customers() {
  const { customers, orders, profile, loading, saveCustomer, deleteCustomer } = useData();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Customer | null>(null);
  const [removing, setRemoving] = useState<Customer | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const balances = useMemo(() => {
    const map = new Map<string, { count: number; due: number }>();
    orders.forEach((order) => {
      const entry = map.get(order.customerId) ?? { count: 0, due: 0 };
      entry.count += 1;
      if (isActiveOrder(order)) entry.due += Math.max(0, orderRemaining(order));
      map.set(order.customerId, entry);
    });
    return map;
  }, [orders]);

  const visible = useMemo(() => {
    const term = search.trim();
    if (!term) return customers;
    return customers.filter(
      (customer) => customer.name.includes(term) || customer.phone.includes(term),
    );
  }, [customers, search]);

  const submit = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      setFormError('اسم الزبون مطلوب.');
      return;
    }
    await saveCustomer({ ...editing, name: editing.name.trim(), phone: editing.phone.trim() });
    setEditing(null);
    setFormError(null);
  };

  if (loading) return <Spinner />;

  return (
    <>
      <SectionTitle
        action={
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => {
              setFormError(null);
              setEditing(emptyCustomer());
            }}
          >
            زبون جديد
          </button>
        }
      >
        الزبائن ({customers.length})
      </SectionTitle>

      <input
        className="input"
        placeholder="ابحث بالاسم أو الهاتف…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {visible.length === 0 ? (
        <EmptyState
          title={customers.length ? 'لا نتائج للبحث' : 'لا يوجد زبائن بعد'}
          hint={customers.length ? undefined : 'أضف أول زبون لتبدأ بتسجيل طلباته.'}
        />
      ) : (
        <div className="list">
          {visible.map((customer) => {
            const stat = balances.get(customer.id) ?? { count: 0, due: 0 };
            return (
              <div key={customer.id} className="card">
                <div className="card__head">
                  <div>
                    <div className="card__title">{customer.name}</div>
                    <div className="card__meta">
                      {customer.phone ? <span dir="ltr">{customer.phone}</span> : null}
                      {customer.address ? <span>{customer.address}</span> : null}
                      <span>{stat.count} طلب</span>
                    </div>
                  </div>
                  {stat.due > 0 ? (
                    <span className="badge badge--danger">{money(stat.due, profile.currency)}</span>
                  ) : (
                    <span className="badge badge--ok">لا مستحقّات</span>
                  )}
                </div>

                {customer.note ? <p className="small muted mt-8">{customer.note}</p> : null}

                <div className="card__actions">
                  {customer.phone ? (
                    <>
                      <a className="btn btn--ghost btn--sm" href={`tel:${customer.phone}`}>
                        اتصال
                      </a>
                      <a
                        className="btn btn--ghost btn--sm"
                        href={`https://wa.me/${waNumber(customer.phone)}`}
                        target="_blank"
                        rel="noopener"
                      >
                        واتساب
                      </a>
                    </>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => {
                      setFormError(null);
                      setEditing(customer);
                    }}
                  >
                    تعديل
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => setRemoving(customer)}
                  >
                    حذف
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(editing)}
        title={editing && customers.some((c) => c.id === editing.id) ? 'تعديل زبون' : 'زبون جديد'}
        onClose={() => setEditing(null)}
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setEditing(null)}>
              إلغاء
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                void submit();
              }}
            >
              حفظ
            </button>
          </>
        }
      >
        {editing ? (
          <>
            {formError ? <div className="notice notice--danger">{formError}</div> : null}
            <TextInput
              label="الاسم"
              value={editing.name}
              onChange={(value) => setEditing({ ...editing, name: value })}
              placeholder="مثال: عمّي محمد"
              autoFocus
            />
            <TextInput
              label="الهاتف"
              type="tel"
              inputMode="tel"
              value={editing.phone}
              onChange={(value) => setEditing({ ...editing, phone: value })}
              placeholder="0673232932"
            />
            <TextInput
              label="العنوان"
              value={editing.address}
              onChange={(value) => setEditing({ ...editing, address: value })}
              placeholder="الحي، البلدية"
            />
            <TextArea
              label="ملاحظات"
              value={editing.note}
              onChange={(value) => setEditing({ ...editing, note: value })}
              placeholder="تفضيلات الزبون، مواعيد الزيارة…"
            />
          </>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(removing)}
        title="حذف الزبون"
        message={`سيُحذف «${removing?.name ?? ''}» من القائمة. طلباته تبقى محفوظة باسمه.`}
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) void deleteCustomer(removing.id);
          setRemoving(null);
        }}
      />
    </>
  );
}
