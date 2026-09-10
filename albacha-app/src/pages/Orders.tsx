import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '@/context/DataContext';
import { itemTotal, itemsTotal, orderRemaining, orderTotal, paidTotal } from '@/lib/calc';
import {
  MATERIAL_LABEL,
  STATUS_LABEL,
  STATUS_TONE,
  UNIT_LABEL,
  decimal,
  formatDate,
  money,
  newId,
  todayISO,
} from '@/lib/format';
import {
  Badge,
  ConfirmDialog,
  EmptyState,
  Modal,
  SectionTitle,
  Select,
  Spinner,
  TextArea,
  TextInput,
} from '@/components/ui';
import type { MaterialKind, Order, OrderItem, OrderStatus, Photo, PricingUnit } from '@/lib/types';
import { compressImage } from '@/lib/photo';
import { orderWhatsAppLink } from '@/lib/whatsapp';

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = (
  ['quote', 'confirmed', 'ready', 'installed', 'cancelled'] as OrderStatus[]
).map((value) => ({ value, label: STATUS_LABEL[value] }));

const MATERIAL_OPTIONS: { value: MaterialKind; label: string }[] = (
  ['aluminium', 'iron', 'mixed'] as MaterialKind[]
).map((value) => ({ value, label: MATERIAL_LABEL[value] }));

const UNIT_OPTIONS: { value: PricingUnit; label: string }[] = (
  ['m2', 'piece'] as PricingUnit[]
).map((value) => ({ value, label: UNIT_LABEL[value] }));

const FILTERS: { id: OrderStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'الكل' },
  ...STATUS_OPTIONS.map((option) => ({ id: option.value, label: option.label })),
];

const emptyItem = (): OrderItem => ({
  id: newId(),
  label: '',
  unit: 'm2',
  width: 0,
  height: 0,
  qty: 1,
  unitPrice: 0,
});

const emptyOrder = (): Order => ({
  id: newId(),
  customerId: '',
  customerName: '',
  customerPhone: '',
  title: '',
  material: 'aluminium',
  status: 'quote',
  items: [emptyItem()],
  laborFee: 0,
  discount: 0,
  cost: 0,
  payments: [],
  dueDate: '',
  note: '',
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

/** حقل رقمي يقبل الفراغ أثناء الكتابة ولا يجبر المستخدم على مسح الصفر. */
const numberValue = (value: number): string => (value === 0 ? '' : String(value));
const toNumber = (value: string): number => {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

export default function Orders() {
  const { orders, customers, profile, loading, saveOrder, deleteOrder, loadPhotos, savePhoto, deletePhoto } =
    useData();
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Order | null>(null);
  const [paying, setPaying] = useState<Order | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [removing, setRemoving] = useState<Order | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [gallery, setGallery] = useState<Order | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const visible = useMemo(() => {
    const term = search.trim();
    return orders.filter((order) => {
      if (filter !== 'all' && order.status !== filter) return false;
      if (!term) return true;
      return (
        order.customerName.includes(term) ||
        order.title.includes(term) ||
        order.customerPhone.includes(term)
      );
    });
  }, [orders, filter, search]);

  const openNew = () => {
    setFormError(null);
    const first = customers[0];
    setEditing({
      ...emptyOrder(),
      customerId: first?.id ?? '',
      customerName: first?.name ?? '',
      customerPhone: first?.phone ?? '',
    });
  };

  const patch = (changes: Partial<Order>) => {
    setEditing((current) => (current ? { ...current, ...changes } : current));
  };

  const patchItem = (id: string, changes: Partial<OrderItem>) => {
    setEditing((current) =>
      current
        ? {
            ...current,
            items: current.items.map((item) => (item.id === id ? { ...item, ...changes } : item)),
          }
        : current,
    );
  };

  const submit = async () => {
    if (!editing) return;
    if (!editing.customerId) {
      setFormError('اختر الزبون أولاً — أضفه من صفحة الزبائن إن لم يكن مسجّلاً.');
      return;
    }
    const items = editing.items.filter(
      (item) => item.label.trim() || item.unitPrice > 0 || item.qty > 1,
    );
    if (items.length === 0) {
      setFormError('أضف بنداً واحداً على الأقل بسعره.');
      return;
    }
    await saveOrder({ ...editing, items, updatedAt: Date.now() });
    setEditing(null);
    setFormError(null);
  };

  const addPayment = async () => {
    if (!paying) return;
    const amount = toNumber(payAmount);
    if (amount <= 0) return;
    await saveOrder({
      ...paying,
      payments: [
        ...paying.payments,
        { id: newId(), amount, date: todayISO(), note: payNote.trim() },
      ],
      updatedAt: Date.now(),
    });
    setPaying(null);
    setPayAmount('');
    setPayNote('');
  };

  // صور الطلب تُقرأ عند فتح المعرض فقط لأنها ثقيلة.
  useEffect(() => {
    if (!gallery) {
      setPhotos([]);
      return;
    }
    let active = true;
    setPhotoError(null);
    void loadPhotos(gallery.id).then((list) => {
      if (active) setPhotos(list);
    });
    return () => {
      active = false;
    };
  }, [gallery, loadPhotos]);

  const addPhoto = async (file: File) => {
    if (!gallery) return;
    setPhotoBusy(true);
    setPhotoError(null);
    try {
      const dataUrl = await compressImage(file);
      const photo: Photo = {
        id: newId(),
        orderId: gallery.id,
        dataUrl,
        caption: '',
        createdAt: Date.now(),
      };
      await savePhoto(photo);
      setPhotos((list) => [photo, ...list]);
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : 'تعذّرت إضافة الصورة.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = async (photo: Photo) => {
    setPhotos((list) => list.filter((entry) => entry.id !== photo.id));
    await deletePhoto(photo);
  };

  if (loading) return <Spinner />;

  return (
    <>
      <SectionTitle
        action={
          <button type="button" className="btn btn--sm" onClick={openNew}>
            طلب جديد
          </button>
        }
      >
        الطلبات ({orders.length})
      </SectionTitle>

      <input
        className="input"
        placeholder="ابحث باسم الزبون أو عنوان الطلب…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <div className="chips">
        {FILTERS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`chip${filter === option.id ? ' is-active' : ''}`}
            onClick={() => setFilter(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {customers.length === 0 ? (
        <div className="notice notice--warn">
          لا يوجد زبائن بعد. أضف زبوناً من صفحة «الزبائن» ثم سجّل له طلباً.
        </div>
      ) : null}

      {visible.length === 0 ? (
        <EmptyState title="لا توجد طلبات مطابقة" hint="جرّب تغيير التصفية أو البحث." />
      ) : (
        <div className="list">
          {visible.map((order) => {
            const remaining = orderRemaining(order);
            return (
              <div key={order.id} className="card">
                <div className="card__head">
                  <div>
                    <div className="card__title">{order.title || 'طلب بدون عنوان'}</div>
                    <div className="card__meta">
                      <span>{order.customerName}</span>
                      <span>{MATERIAL_LABEL[order.material]}</span>
                      {order.dueDate ? <span>التسليم {formatDate(order.dueDate)}</span> : null}
                    </div>
                  </div>
                  <Badge tone={STATUS_TONE[order.status]}>{STATUS_LABEL[order.status]}</Badge>
                </div>

                <div className="totals">
                  <div>
                    <span>الإجمالي</span>
                    <span>{money(orderTotal(order), profile.currency)}</span>
                  </div>
                  <div>
                    <span>المدفوع</span>
                    <span>{money(paidTotal(order), profile.currency)}</span>
                  </div>
                  <div className="is-grand">
                    <span>الباقي</span>
                    <span>{money(Math.max(0, remaining), profile.currency)}</span>
                  </div>
                </div>

                <div className="card__actions">
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => {
                      setFormError(null);
                      setEditing(order);
                    }}
                  >
                    تعديل
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => {
                      setPayAmount('');
                      setPayNote('');
                      setPaying(order);
                    }}
                  >
                    تسجيل دفعة
                  </button>
                  {orderWhatsAppLink(order, profile) ? (
                    <a
                      className="btn btn--ghost btn--sm"
                      href={orderWhatsAppLink(order, profile) as string}
                      target="_blank"
                      rel="noopener"
                    >
                      {order.status === 'quote'
                        ? 'إرسال العرض بواتساب'
                        : order.status === 'ready'
                          ? 'إشعار «جاهز» بواتساب'
                          : 'إرسال الحساب بواتساب'}
                    </a>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => setGallery(order)}
                  >
                    الصور
                  </button>
                  <Link className="btn btn--ghost btn--sm" to={`/print/${order.id}`}>
                    {order.status === 'quote' ? 'طباعة العرض' : 'طباعة الفاتورة'}
                  </Link>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => setRemoving(order)}
                  >
                    حذف
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------------------------- نموذج الطلب ---------------------------- */}
      <Modal
        open={Boolean(editing)}
        wide
        title={editing && orders.some((o) => o.id === editing.id) ? 'تعديل الطلب' : 'طلب جديد'}
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

            <Select
              label="الزبون"
              value={editing.customerId}
              onChange={(value) => {
                const customer = customers.find((entry) => entry.id === value);
                patch({
                  customerId: value,
                  customerName: customer?.name ?? '',
                  customerPhone: customer?.phone ?? '',
                });
              }}
              options={[
                { value: '', label: '— اختر الزبون —' },
                ...customers.map((customer) => ({ value: customer.id, label: customer.name })),
              ]}
            />

            <TextInput
              label="عنوان الطلب"
              value={editing.title}
              onChange={(value) => patch({ title: value })}
              placeholder="مثال: نوافذ الطابق الأول"
            />

            <div className="row">
              <Select
                label="المادة"
                value={editing.material}
                onChange={(value) => patch({ material: value })}
                options={MATERIAL_OPTIONS}
              />
              <Select
                label="الحالة"
                value={editing.status}
                onChange={(value) => patch({ status: value })}
                options={STATUS_OPTIONS}
              />
            </div>

            <TextInput
              label="تاريخ التسليم"
              type="date"
              value={editing.dueDate}
              onChange={(value) => patch({ dueDate: value })}
            />

            <SectionTitle
              action={
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => patch({ items: [...editing.items, emptyItem()] })}
                >
                  إضافة بند
                </button>
              }
            >
              البنود
            </SectionTitle>

            <div className="items">
              {editing.items.map((item, index) => (
                <div key={item.id} className="item-row">
                  <div className="item-row__head">
                    <strong className="small">بند {index + 1}</strong>
                    <span className="item-row__total">
                      {money(itemTotal(item), profile.currency)}
                    </span>
                  </div>

                  <TextInput
                    label="الوصف"
                    value={item.label}
                    onChange={(value) => patchItem(item.id, { label: value })}
                    placeholder="مثال: نافذة ألمنيوم مزدوجة"
                  />

                  <Select
                    label="طريقة التسعير"
                    value={item.unit}
                    onChange={(value) => patchItem(item.id, { unit: value })}
                    options={UNIT_OPTIONS}
                  />

                  {item.unit === 'm2' ? (
                    <div className="row--3 row">
                      <TextInput
                        label="العرض (م)"
                        inputMode="decimal"
                        value={numberValue(item.width)}
                        onChange={(value) => patchItem(item.id, { width: toNumber(value) })}
                      />
                      <TextInput
                        label="الارتفاع (م)"
                        inputMode="decimal"
                        value={numberValue(item.height)}
                        onChange={(value) => patchItem(item.id, { height: toNumber(value) })}
                      />
                      <TextInput
                        label="العدد"
                        inputMode="numeric"
                        value={numberValue(item.qty)}
                        onChange={(value) => patchItem(item.id, { qty: toNumber(value) })}
                      />
                    </div>
                  ) : (
                    <TextInput
                      label="العدد"
                      inputMode="numeric"
                      value={numberValue(item.qty)}
                      onChange={(value) => patchItem(item.id, { qty: toNumber(value) })}
                    />
                  )}

                  <TextInput
                    label={item.unit === 'm2' ? 'سعر المتر المربّع' : 'سعر القطعة'}
                    inputMode="numeric"
                    value={numberValue(item.unitPrice)}
                    onChange={(value) => patchItem(item.id, { unitPrice: toNumber(value) })}
                    hint={
                      item.unit === 'm2' && item.width && item.height
                        ? `المساحة ${decimal(item.width * item.height * item.qty)} م²`
                        : undefined
                    }
                  />

                  {editing.items.length > 1 ? (
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() =>
                        patch({ items: editing.items.filter((entry) => entry.id !== item.id) })
                      }
                    >
                      حذف البند
                    </button>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="row mt-8">
              <TextInput
                label="أجرة التركيب والنقل"
                inputMode="numeric"
                value={numberValue(editing.laborFee)}
                onChange={(value) => patch({ laborFee: toNumber(value) })}
              />
              <TextInput
                label="الخصم"
                inputMode="numeric"
                value={numberValue(editing.discount)}
                onChange={(value) => patch({ discount: toNumber(value) })}
              />
            </div>

            <TextInput
              label="تكلفة المواد والتنفيذ"
              inputMode="numeric"
              value={numberValue(editing.cost ?? 0)}
              onChange={(value) => patch({ cost: toNumber(value) })}
              hint="تُستعمل لحساب الربح في التقرير الشهري، ولا تظهر للزبون."
            />

            <TextArea
              label="ملاحظات"
              value={editing.note}
              onChange={(value) => patch({ note: value })}
              placeholder="لون الألمنيوم، نوع الزجاج، تفاصيل التركيب…"
            />

            <div className="totals">
              <div>
                <span>مجموع البنود</span>
                <span>{money(itemsTotal(editing.items), profile.currency)}</span>
              </div>
              <div>
                <span>الأجرة</span>
                <span>{money(editing.laborFee, profile.currency)}</span>
              </div>
              <div>
                <span>الخصم</span>
                <span>− {money(editing.discount, profile.currency)}</span>
              </div>
              <div className="is-grand">
                <span>الإجمالي</span>
                <span>{money(orderTotal(editing), profile.currency)}</span>
              </div>
            </div>
          </>
        ) : null}
      </Modal>

      {/* ----------------------------- الدفعات ----------------------------- */}
      <Modal
        open={Boolean(paying)}
        title="تسجيل دفعة"
        onClose={() => setPaying(null)}
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setPaying(null)}>
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
        {paying ? (
          <>
            <div className="totals" style={{ marginTop: 0, borderTop: 'none' }}>
              <div>
                <span>الإجمالي</span>
                <span>{money(orderTotal(paying), profile.currency)}</span>
              </div>
              <div className="is-grand">
                <span>الباقي قبل الدفعة</span>
                <span>{money(Math.max(0, orderRemaining(paying)), profile.currency)}</span>
              </div>
            </div>

            <TextInput
              label="المبلغ"
              inputMode="numeric"
              value={payAmount}
              onChange={setPayAmount}
              placeholder="0"
              autoFocus
            />
            <TextInput
              label="ملاحظة"
              value={payNote}
              onChange={setPayNote}
              placeholder="نقداً، تحويل، عربون…"
            />

            {paying.payments.length ? (
              <>
                <SectionTitle>الدفعات السابقة</SectionTitle>
                <div className="list">
                  {paying.payments.map((payment) => (
                    <div key={payment.id} className="card__meta">
                      <span>{formatDate(payment.date)}</span>
                      <strong>{money(payment.amount, profile.currency)}</strong>
                      {payment.note ? <span className="muted">{payment.note}</span> : null}
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </>
        ) : null}
      </Modal>

      {/* ----------------------------- الصور ------------------------------ */}
      <Modal
        open={Boolean(gallery)}
        title={`صور: ${gallery?.title || 'الطلب'}`}
        onClose={() => setGallery(null)}
        footer={
          <button type="button" className="btn btn--ghost" onClick={() => setGallery(null)}>
            إغلاق
          </button>
        }
      >
        {gallery ? (
          <>
            <p className="small muted">
              صور القياسات قبل التنفيذ والعمل بعد التركيب. تُصغَّر الصورة تلقائياً قبل الحفظ.
            </p>
            {photoError ? <div className="notice notice--danger mt-8">{photoError}</div> : null}

            <label className="btn btn--block mt-8" style={{ cursor: 'pointer' }}>
              {photoBusy ? 'جارٍ الحفظ…' : 'إضافة صورة'}
              <input
                type="file"
                accept="image/*"
                hidden
                disabled={photoBusy}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void addPhoto(file);
                  event.target.value = '';
                }}
              />
            </label>

            {photos.length === 0 ? (
              <p className="small muted mt-8">لا صور لهذا الطلب بعد.</p>
            ) : (
              <div className="gallery mt-8">
                {photos.map((photo) => (
                  <figure key={photo.id} className="gallery__item">
                    <img src={photo.dataUrl} alt={photo.caption || 'صورة العمل'} loading="lazy" />
                    <button
                      type="button"
                      className="gallery__remove"
                      aria-label="حذف الصورة"
                      onClick={() => {
                        void removePhoto(photo);
                      }}
                    >
                      ✕
                    </button>
                  </figure>
                ))}
              </div>
            )}
          </>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(removing)}
        title="حذف الطلب"
        message={`سيُحذف الطلب «${removing?.title || 'بدون عنوان'}» ودفعاته نهائياً.`}
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) void deleteOrder(removing.id);
          setRemoving(null);
        }}
      />
    </>
  );
}
