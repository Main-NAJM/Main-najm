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
  TextInput,
} from '@/components/ui';
import { priceChangePct } from '@/lib/calc';
import { MATERIAL_KINDS, materialKindLabel } from '@/lib/constants';
import { tradeMaterial } from '@/lib/trades';
import { formatDate, formatMoney, formatNumber, toNumber, todayIso } from '@/lib/format';
import type { NewRecord } from '@/data/store';
import type { MarketPrice, MaterialKind } from '@/lib/types';

type Filter = MaterialKind | 'all';

const emptyPrice = (kind: MaterialKind): NewRecord<MarketPrice> => ({
  kind,
  name: '',
  unit: MATERIAL_KINDS.find((m) => m.value === kind)?.unit ?? 'وحدة',
  price: 0,
  previousPrice: null,
  source: '',
  priceDate: todayIso(),
});

export default function MarketPrices() {
  const { marketPrices, profile, create, update, remove } = useData();
  const { notify, notifyError } = useToast();

  // صنف المادة الذي يخصّ مهنة صاحب الحساب — يُقترح عند إضافة سعر جديد.
  const defaultKind: MaterialKind = tradeMaterial(profile.craft);

  const [filter, setFilter] = useState<Filter>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MarketPrice | null>(null);
  const [draft, setDraft] = useState<NewRecord<MarketPrice>>(() => emptyPrice(defaultKind));
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<MarketPrice | null>(null);
  const [updating, setUpdating] = useState<MarketPrice | null>(null);
  const [newPrice, setNewPrice] = useState('');

  const visible = useMemo(
    () => (filter === 'all' ? marketPrices : marketPrices.filter((p) => p.kind === filter)),
    [marketPrices, filter],
  );

  const grouped = useMemo(() => {
    const map = new Map<MaterialKind, MarketPrice[]>();
    visible.forEach((price) => {
      const list = map.get(price.kind) ?? [];
      list.push(price);
      map.set(price.kind, list);
    });
    return [...map.entries()].sort(
      (a, b) =>
        MATERIAL_KINDS.findIndex((m) => m.value === a[0]) -
        MATERIAL_KINDS.findIndex((m) => m.value === b[0]),
    );
  }, [visible]);

  const openNew = () => {
    setEditing(null);
    setDraft(emptyPrice(filter === 'all' ? defaultKind : filter));
    setFormOpen(true);
  };

  const openEdit = (price: MarketPrice) => {
    setEditing(price);
    setDraft({
      kind: price.kind,
      name: price.name,
      unit: price.unit,
      price: price.price,
      previousPrice: price.previousPrice,
      source: price.source,
      priceDate: price.priceDate,
    });
    setFormOpen(true);
  };

  const patch = (value: Partial<NewRecord<MarketPrice>>) => {
    setDraft((current) => ({ ...current, ...value }));
  };

  const save = async () => {
    if (!draft.name.trim()) {
      notify('اكتب اسم المادة.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload: NewRecord<MarketPrice> = {
        ...draft,
        name: draft.name.trim(),
        unit: draft.unit.trim() || 'وحدة',
        source: draft.source.trim(),
      };
      if (editing) {
        await update('marketPrices', editing.id, payload);
        notify('حُفظت المادة.');
      } else {
        await create('marketPrices', payload);
        notify('أُضيفت المادة إلى مؤشرات السوق.');
      }
      setFormOpen(false);
      setEditing(null);
    } catch (error) {
      notifyError(error);
    } finally {
      setSaving(false);
    }
  };

  /** تحديث السعر: السعر الحالي يصبح «السعر السابق» لحساب نسبة التغيّر. */
  const applyPriceUpdate = async () => {
    if (!updating) return;
    const value = toNumber(newPrice, Number.NaN);
    if (!Number.isFinite(value) || value < 0) {
      notify('أدخل سعراً صحيحاً.', 'error');
      return;
    }
    try {
      await update('marketPrices', updating.id, {
        previousPrice: updating.price,
        price: value,
        priceDate: todayIso(),
      });
      notify('حُدّث السعر.');
      setUpdating(null);
      setNewPrice('');
    } catch (error) {
      notifyError(error);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove('marketPrices', toDelete.id);
      notify('حُذفت المادة.');
    } catch (error) {
      notifyError(error);
    } finally {
      setToDelete(null);
    }
  };

  const chips: { value: Filter; label: string }[] = [
    { value: 'all', label: 'الكل' },
    ...MATERIAL_KINDS.map((kind) => ({ value: kind.value as Filter, label: kind.label })),
  ];

  return (
    <>
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
        سجّل أسعار المواد التي تشتريها وحدّثها كلما تغيّر السوق. النسبة تُحسب مقارنة بآخر سعر
        مسجّل، ويمكن سحب السعر مباشرة إلى حاسبة التكلفة.
      </p>

      {grouped.length === 0 ? (
        <div className="mt-16">
          <EmptyState
            title="لا توجد أسعار مسجّلة"
            description="أضف المواد التي تستعملها (خشب، حديد، قماش) لتتابع تغيّر أسعارها."
            action={
              <button type="button" className="btn" onClick={openNew}>
                إضافة مادة
              </button>
            }
          />
        </div>
      ) : (
        grouped.map(([kind, prices]) => (
          <section key={kind}>
            <div className="section-title">
              <h2>{materialKindLabel(kind)}</h2>
              <span className="small muted">{prices.length} مادة</span>
            </div>
            <div className="list">
              {prices.map((price) => {
                const change = priceChangePct(price.price, price.previousPrice);
                return (
                  <article key={price.id} className="card">
                    <div className="card__head">
                      <div>
                        <h3 className="card__title">{price.name}</h3>
                        <p className="card__sub">
                          لكل {price.unit}
                          {price.source ? ` · ${price.source}` : ''}
                        </p>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <strong style={{ fontSize: 17 }}>
                          {formatMoney(price.price, profile.currency)}
                        </strong>
                        <div>
                          {change === null ? (
                            <Badge tone="muted">سعر أول</Badge>
                          ) : change > 0 ? (
                            <Badge tone="danger">▲ {formatNumber(change)}٪</Badge>
                          ) : change < 0 ? (
                            <Badge tone="ok">▼ {formatNumber(Math.abs(change))}٪</Badge>
                          ) : (
                            <Badge tone="muted">ثابت</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="card__meta">
                      <span>
                        تاريخ السعر <strong>{formatDate(price.priceDate)}</strong>
                      </span>
                      {price.previousPrice ? (
                        <span>
                          السعر السابق{' '}
                          <strong>{formatMoney(price.previousPrice, profile.currency)}</strong>
                        </span>
                      ) : null}
                    </div>
                    <div className="card__actions">
                      <button
                        type="button"
                        className="btn btn--soft btn--sm"
                        onClick={() => {
                          setUpdating(price);
                          setNewPrice(String(price.price));
                        }}
                      >
                        تحديث السعر
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => {
                          openEdit(price);
                        }}
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => {
                          setToDelete(price);
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

      <button type="button" className="fab" onClick={openNew}>
        + مادة جديدة
      </button>

      <Modal
        open={formOpen}
        title={editing ? 'تعديل المادة' : 'مادة جديدة'}
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
        <Select
          label="نوع المادة"
          value={draft.kind}
          options={MATERIAL_KINDS.map((m) => ({ value: m.value, label: m.label }))}
          onChange={(value) => {
            patch({
              kind: value,
              unit: MATERIAL_KINDS.find((m) => m.value === value)?.unit ?? draft.unit,
            });
          }}
        />
        <TextInput
          label="اسم المادة"
          value={draft.name}
          onChange={(value) => {
            patch({ name: value });
          }}
          placeholder="مثال: لوح MDF ١٨ ملم"
          autoFocus
        />
        <div className="grid-2">
          <TextInput
            label="الوحدة"
            value={draft.unit}
            onChange={(value) => {
              patch({ unit: value });
            }}
            placeholder="متر، طن، لوح…"
          />
          <NumberInput
            label="السعر"
            value={draft.price}
            onChange={(value) => {
              patch({ price: toNumber(value) });
            }}
          />
        </div>
        <div className="grid-2">
          <TextInput
            label="تاريخ السعر"
            type="date"
            value={draft.priceDate}
            onChange={(value) => {
              patch({ priceDate: value });
            }}
          />
          <TextInput
            label="المصدر"
            value={draft.source}
            onChange={(value) => {
              patch({ source: value });
            }}
            placeholder="اسم المحل أو السوق"
          />
        </div>
      </Modal>

      <Modal
        open={Boolean(updating)}
        title={`تحديث سعر ${updating?.name ?? ''}`}
        onClose={() => {
          setUpdating(null);
        }}
        footer={
          <>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setUpdating(null);
              }}
            >
              إلغاء
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                void applyPriceUpdate();
              }}
            >
              حفظ السعر
            </button>
          </>
        }
      >
        <p className="small muted">
          السعر الحالي:{' '}
          <strong>{updating ? formatMoney(updating.price, profile.currency) : ''}</strong> — سيُحفظ
          كسعر سابق لحساب نسبة التغيّر.
        </p>
        <div className="mt-12">
          <NumberInput label="السعر الجديد" value={newPrice} onChange={setNewPrice} />
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="حذف المادة"
        message={`سيُحذف سعر «${toDelete?.name ?? ''}» نهائياً.`}
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
