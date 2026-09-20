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
  StatCard,
  TextArea,
  TextInput,
} from '@/components/ui';
import { PlusIcon } from '@/components/icons';
import { inventoryTotals, stockLevel, type StockLevel } from '@/lib/calc';
import { formatInt, formatMoney, formatNumber, toNumber } from '@/lib/format';
import type { NewRecord } from '@/data/store';
import type { InventoryItem } from '@/lib/types';

type Filter = 'all' | 'low' | 'out';

const emptyItem = (): NewRecord<InventoryItem> => ({
  name: '',
  unit: 'قطعة',
  qty: 0,
  lowAt: 0,
  costPrice: 0,
  salePrice: 0,
  supplier: '',
  notes: '',
});

const LEVEL_BADGE: Record<StockLevel, { tone: string; label: string }> = {
  out: { tone: 'danger', label: 'نفد' },
  low: { tone: 'warn', label: 'منخفض' },
  ok: { tone: 'ok', label: 'متوفّر' },
};

export default function Inventory() {
  const { inventory, profile, create, update, remove } = useData();
  const { notify, notifyError } = useToast();

  const [filter, setFilter] = useState<Filter>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [draft, setDraft] = useState<NewRecord<InventoryItem>>(emptyItem);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<InventoryItem | null>(null);
  const [moving, setMoving] = useState<{ item: InventoryItem; direction: 'in' | 'out' } | null>(
    null,
  );
  const [moveQty, setMoveQty] = useState('');

  const money = (value: number) => formatMoney(value, profile.currency);
  const totals = useMemo(() => inventoryTotals(inventory), [inventory]);

  // الأكثر إلحاحاً أوّلاً: ما نفد، ثم ما انخفض، ثم الباقي بالاسم.
  const visible = useMemo(() => {
    const rank: Record<StockLevel, number> = { out: 0, low: 1, ok: 2 };
    return inventory
      .filter((item) => {
        const level = stockLevel(item);
        if (filter === 'low') return level !== 'ok';
        if (filter === 'out') return level === 'out';
        return true;
      })
      .sort((a, b) => {
        const diff = rank[stockLevel(a)] - rank[stockLevel(b)];
        return diff !== 0 ? diff : a.name.localeCompare(b.name, 'ar');
      });
  }, [inventory, filter]);

  const openNew = () => {
    setEditing(null);
    setDraft(emptyItem());
    setFormOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setDraft({
      name: item.name,
      unit: item.unit,
      qty: item.qty,
      lowAt: item.lowAt,
      costPrice: item.costPrice,
      salePrice: item.salePrice,
      supplier: item.supplier,
      notes: item.notes,
    });
    setFormOpen(true);
  };

  const patch = (value: Partial<NewRecord<InventoryItem>>) => {
    setDraft((current) => ({ ...current, ...value }));
  };

  const save = async () => {
    if (!draft.name.trim()) {
      notify('اكتب اسم السلعة.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload: NewRecord<InventoryItem> = {
        ...draft,
        name: draft.name.trim(),
        unit: draft.unit.trim() || 'قطعة',
        supplier: draft.supplier.trim(),
        notes: draft.notes.trim(),
      };
      if (editing) {
        await update('inventory', editing.id, payload);
        notify('حُفظت السلعة.');
      } else {
        await create('inventory', payload);
        notify('أُضيفت السلعة إلى المخزون.');
      }
      setFormOpen(false);
      setEditing(null);
    } catch (error) {
      notifyError(error);
    } finally {
      setSaving(false);
    }
  };

  /** إدخال أو إخراج كمية. الرصيد لا ينزل تحت الصفر. */
  const applyMove = async () => {
    if (!moving) return;
    const amount = toNumber(moveQty, Number.NaN);
    if (!Number.isFinite(amount) || amount <= 0) {
      notify('أدخل كمية أكبر من صفر.', 'error');
      return;
    }
    const current = Math.max(0, moving.item.qty || 0);
    const next = moving.direction === 'in' ? current + amount : Math.max(0, current - amount);
    if (moving.direction === 'out' && amount > current) {
      notify(`لا يوجد إلا ${formatNumber(current)} ${moving.item.unit} — أُخرج المتاح كلّه.`);
    }
    try {
      await update('inventory', moving.item.id, { qty: next });
      notify(
        moving.direction === 'in'
          ? `أُضيف ${formatNumber(amount)} ${moving.item.unit}.`
          : `أُخرج ${formatNumber(current - next)} ${moving.item.unit}.`,
      );
      setMoving(null);
      setMoveQty('');
    } catch (error) {
      notifyError(error);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove('inventory', toDelete.id);
      notify('حُذفت السلعة.');
    } catch (error) {
      notifyError(error);
    } finally {
      setToDelete(null);
    }
  };

  const chips: { value: Filter; label: string }[] = [
    { value: 'all', label: `الكل (${formatInt(totals.items)})` },
    { value: 'low', label: `تحتاج تموين (${formatInt(totals.needsRestock)})` },
    { value: 'out', label: `نفدت (${formatInt(totals.outOfStock)})` },
  ];

  if (inventory.length === 0) {
    return (
      <>
        <EmptyState
          title="المخزون فارغ"
          description="سجّل السلع التي تشتريها وتبيعها، وضع لكل سلعة حدّ تنبيه — ينبّهك التطبيق قبل أن تنفد."
          action={
            <button type="button" className="btn" onClick={openNew}>
              إضافة سلعة
            </button>
          }
        />
        <ItemForm
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
      </>
    );
  }

  return (
    <>
      {totals.needsRestock > 0 ? (
        <div className="notice notice--warn">
          <strong>{formatInt(totals.needsRestock)}</strong> سلعة تحتاج تموين
          {totals.outOfStock > 0 ? ` (منها ${formatInt(totals.outOfStock)} نفدت تماماً)` : ''}.
        </div>
      ) : null}

      <div className="stat-grid">
        <StatCard label="عدد السلع" value={formatInt(totals.items)} />
        <StatCard
          label="تحتاج تموين"
          value={formatInt(totals.needsRestock)}
          tone={totals.needsRestock > 0 ? 'warn' : 'ok'}
        />
        <StatCard label="قيمة المخزون" value={money(totals.value)} tone="info" sub="بسعر الشراء" />
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

      <SectionTitle
        action={
          <button type="button" className="btn btn--sm" onClick={openNew}>
            <PlusIcon width={16} height={16} /> سلعة
          </button>
        }
      >
        السلع
      </SectionTitle>

      {visible.length === 0 ? (
        <EmptyState title="لا توجد سلع في هذا التصنيف" description="جرّب تصنيفاً آخر." />
      ) : (
        <div className="list">
          {visible.map((item) => {
            const level = stockLevel(item);
            const badge = LEVEL_BADGE[level];
            return (
              <article key={item.id} className="card">
                <div className="card__head">
                  <div>
                    <h3 className="card__title">{item.name}</h3>
                    <p className="card__sub">
                      {formatNumber(item.qty)} {item.unit}
                      {item.supplier ? ` · ${item.supplier}` : ''}
                    </p>
                  </div>
                  <Badge tone={badge.tone}>{badge.label}</Badge>
                </div>

                <div className="card__meta">
                  {item.lowAt > 0 ? (
                    <span>
                      حدّ التنبيه{' '}
                      <strong>
                        {formatNumber(item.lowAt)} {item.unit}
                      </strong>
                    </span>
                  ) : null}
                  {item.costPrice > 0 ? (
                    <span>
                      الشراء <strong>{money(item.costPrice)}</strong>
                    </span>
                  ) : null}
                  {item.salePrice > 0 ? (
                    <span>
                      البيع <strong>{money(item.salePrice)}</strong>
                    </span>
                  ) : null}
                  {item.costPrice > 0 ? (
                    <span>
                      قيمة الرصيد <strong>{money(item.qty * item.costPrice)}</strong>
                    </span>
                  ) : null}
                </div>

                {item.notes ? <p className="small muted mt-8">{item.notes}</p> : null}

                <div className="card__actions">
                  <button
                    type="button"
                    className="btn btn--soft btn--sm"
                    onClick={() => {
                      setMoving({ item, direction: 'in' });
                      setMoveQty('');
                    }}
                  >
                    إدخال
                  </button>
                  <button
                    type="button"
                    className="btn btn--soft btn--sm"
                    disabled={item.qty <= 0}
                    onClick={() => {
                      setMoving({ item, direction: 'out' });
                      setMoveQty('');
                    }}
                  >
                    إخراج
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
      )}

      <ItemForm
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

      <Modal
        open={Boolean(moving)}
        title={moving?.direction === 'in' ? 'إدخال إلى المخزون' : 'إخراج من المخزون'}
        onClose={() => {
          setMoving(null);
        }}
        footer={
          <>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setMoving(null);
              }}
            >
              إلغاء
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                void applyMove();
              }}
            >
              حفظ
            </button>
          </>
        }
      >
        <p className="modal__message">
          <strong>{moving?.item.name}</strong> — الرصيد الحالي{' '}
          <strong>
            {formatNumber(moving?.item.qty ?? 0)} {moving?.item.unit}
          </strong>
        </p>
        <NumberInput
          label={moving?.direction === 'in' ? 'الكمية الداخلة' : 'الكمية الخارجة'}
          value={moveQty}
          onChange={setMoveQty}
          suffix={moving?.item.unit}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="حذف السلعة"
        message={`ستُحذف «${toDelete?.name ?? ''}» من المخزون نهائياً.`}
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

/* ------------------------------------------------------------ نموذج السلعة */

function ItemForm({
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
  editing: InventoryItem | null;
  draft: NewRecord<InventoryItem>;
  saving: boolean;
  currency: string;
  onPatch: (value: Partial<NewRecord<InventoryItem>>) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal
      open={open}
      title={editing ? 'تعديل سلعة' : 'سلعة جديدة'}
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
        label="اسم السلعة"
        value={draft.name}
        onChange={(value) => {
          onPatch({ name: value });
        }}
        placeholder="مثال: لوح MDF ١٨ ملم"
      />
      <div className="grid-2">
        <TextInput
          label="وحدة العدّ"
          value={draft.unit}
          onChange={(value) => {
            onPatch({ unit: value });
          }}
          placeholder="قطعة، متر، كيس…"
        />
        <TextInput
          label="المورّد"
          value={draft.supplier}
          onChange={(value) => {
            onPatch({ supplier: value });
          }}
          placeholder="اسم المحل أو التاجر"
        />
      </div>
      <div className="grid-2">
        <NumberInput
          label="الكمية الحالية"
          value={draft.qty}
          suffix={draft.unit}
          onChange={(value) => {
            onPatch({ qty: toNumber(value) });
          }}
        />
        <NumberInput
          label="حدّ التنبيه"
          value={draft.lowAt}
          suffix={draft.unit}
          hint="ينبّهك التطبيق متى نزل الرصيد إليه"
          onChange={(value) => {
            onPatch({ lowAt: toNumber(value) });
          }}
        />
      </div>
      <div className="grid-2">
        <NumberInput
          label={`سعر الشراء (${currency})`}
          value={draft.costPrice}
          onChange={(value) => {
            onPatch({ costPrice: toNumber(value) });
          }}
        />
        <NumberInput
          label={`سعر البيع (${currency})`}
          value={draft.salePrice}
          onChange={(value) => {
            onPatch({ salePrice: toNumber(value) });
          }}
        />
      </div>
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
