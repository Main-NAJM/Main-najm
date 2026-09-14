import { useEffect, useMemo, useState } from 'react';
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
  TextArea,
  TextInput,
} from '@/components/ui';
import { basisUnit, computeProductPrice, type ProductDimensions } from '@/lib/calc';
import {
  CRAFTS,
  DENSITY_HINTS,
  PRICING_BASES,
  basisLabel,
  basisNeeds,
  craftLabel,
} from '@/lib/constants';
import { formatMoney, formatNumber, percent, toNumber } from '@/lib/format';
import type { NewRecord } from '@/data/store';
import type { Craft, PricingBasis, ProductTemplate } from '@/lib/types';
import { buildProductQuote } from '@/print/templates';
import { printHtml } from '@/print/print';

const emptyProduct = (craft: Craft): NewRecord<ProductTemplate> => ({
  name: '',
  craft,
  basis: 'area',
  unitPrice: 0,
  density: 0,
  wastePct: 5,
  fittings: 0,
  labor: 0,
  marginPct: 25,
  defaultWidth: 100,
  defaultHeight: 200,
  defaultDepth: 0,
  notes: '',
});

export default function ProductPricing() {
  const { products, profile, create, update, remove } = useData();
  const { notify, notifyError } = useToast();

  const [selectedId, setSelectedId] = useState<string>('');
  const [dims, setDims] = useState<ProductDimensions>({
    widthCm: 0,
    heightCm: 0,
    depthCm: 0,
    quantity: 1,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductTemplate | null>(null);
  const [draft, setDraft] = useState<NewRecord<ProductTemplate>>(() => emptyProduct(profile.craft));
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<ProductTemplate | null>(null);

  // ترتيب المنتجات: حرفة المستخدم أولاً، فهي الأقرب إلى عمله.
  const ordered = useMemo(() => {
    return [...products].sort((a, b) => {
      const mine = (p: ProductTemplate) => (p.craft === profile.craft ? 0 : 1);
      return mine(a) - mine(b) || a.name.localeCompare(b.name, 'ar');
    });
  }, [products, profile.craft]);

  const selected = ordered.find((p) => p.id === selectedId) ?? null;

  // عند اختيار منتج تُملأ مقاساته الافتراضية، فيبدأ الحساب من رقم معقول.
  useEffect(() => {
    if (!selected) return;
    setDims((current) => ({
      widthCm: selected.defaultWidth || 0,
      heightCm: selected.defaultHeight || 0,
      depthCm: selected.defaultDepth || 0,
      quantity: current.quantity || 1,
    }));
  }, [selected]);

  // أول منتج يُختار تلقائياً كي لا تبدأ الشاشة فارغة.
  useEffect(() => {
    if (!selectedId && ordered.length > 0) setSelectedId(ordered[0].id);
  }, [ordered, selectedId]);

  const result = selected ? computeProductPrice(selected, dims) : null;
  const needs = selected ? basisNeeds(selected.basis) : [];
  const money = (value: number) => formatMoney(value, profile.currency);

  /* ------------------------------------------------------- إدارة القوالب */

  const openNew = () => {
    setEditing(null);
    setDraft(emptyProduct(profile.craft));
    setFormOpen(true);
  };

  const openEdit = (product: ProductTemplate) => {
    setEditing(product);
    setDraft({
      name: product.name,
      craft: product.craft,
      basis: product.basis,
      unitPrice: product.unitPrice,
      density: product.density,
      wastePct: product.wastePct,
      fittings: product.fittings,
      labor: product.labor,
      marginPct: product.marginPct,
      defaultWidth: product.defaultWidth,
      defaultHeight: product.defaultHeight,
      defaultDepth: product.defaultDepth,
      notes: product.notes,
    });
    setFormOpen(true);
  };

  const patch = (value: Partial<NewRecord<ProductTemplate>>) => {
    setDraft((current) => ({ ...current, ...value }));
  };

  const save = async () => {
    if (!draft.name.trim()) {
      notify('اكتب اسم المنتج.', 'error');
      return;
    }
    if (draft.basis === 'weight' && !(draft.density > 0)) {
      notify('التسعير بالوزن يحتاج كثافة المادة.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload: NewRecord<ProductTemplate> = {
        ...draft,
        name: draft.name.trim(),
        notes: draft.notes.trim(),
      };
      if (editing) {
        await update('products', editing.id, payload);
        notify('حُفظ المنتج.');
      } else {
        const id = await create('products', payload);
        setSelectedId(id);
        notify('أُضيف المنتج.');
      }
      setFormOpen(false);
      setEditing(null);
    } catch (error) {
      notifyError(error);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove('products', toDelete.id);
      if (selectedId === toDelete.id) setSelectedId('');
      notify('حُذف المنتج.');
    } catch (error) {
      notifyError(error);
    } finally {
      setToDelete(null);
    }
  };

  /* --------------------------------------------- تحويل النتيجة إلى طلبية */

  const createOrder = async () => {
    if (!selected || !result) return;
    try {
      await create('orders', {
        title: selected.name,
        customerName: '',
        phone: '',
        address: '',
        notes: [
          `المقاس: ${formatNumber(dims.widthCm)}×${formatNumber(dims.heightCm)}${
            dims.depthCm ? `×${formatNumber(dims.depthCm)}` : ''
          } سم`,
          `${formatNumber(result.measure)} ${result.measureUnit} للقطعة`,
          selected.notes,
        ]
          .filter(Boolean)
          .join(' — '),
        status: 'pending',
        items: [
          {
            name: `${selected.name} (${formatNumber(result.measure)} ${result.measureUnit})`,
            qty: result.quantity,
            unitPrice: result.unitTotal,
          },
        ],
        extraCharges: 0,
        discount: 0,
        paid: 0,
        dueDate: '',
      });
      notify('أُنشئت طلبية بهذا السعر. أكمل بيانات الزبون من صفحة الطلبيات.');
    } catch (error) {
      notifyError(error);
    }
  };

  /* --------------------------------------------------------------- عرض */

  if (products.length === 0) {
    return (
      <>
        <EmptyState
          title="لا توجد منتجات بعد"
          description="أضف منتجاً وحدّد كيف تسعّره: بالمتر المربّع أو الطولي أو بالقطعة. بعدها يكفي أن تدخل المقاس ليظهر السعر."
          action={
            <button type="button" className="btn" onClick={openNew}>
              إضافة منتج
            </button>
          }
        />
        <ProductForm
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
      <div className="card">
        <Select
          label="المنتج"
          value={selectedId}
          options={ordered.map((p) => ({
            value: p.id,
            label: `${p.name} — ${craftLabel(p.craft)}`,
          }))}
          onChange={setSelectedId}
          hint={selected ? `يُسعَّر ${basisLabel(selected.basis)}` : undefined}
        />

        {selected ? (
          <>
            <SectionTitle>المقاسات</SectionTitle>
            <p className="small muted">كل المقاسات بالسنتيمتر.</p>

            <div className="grid-3 mt-12">
              {needs.includes('width') ? (
                <NumberInput
                  label="العرض"
                  suffix="سم"
                  value={dims.widthCm}
                  onChange={(v) => {
                    setDims((c) => ({ ...c, widthCm: toNumber(v) }));
                  }}
                />
              ) : null}
              {needs.includes('height') ? (
                <NumberInput
                  label="الارتفاع"
                  suffix="سم"
                  value={dims.heightCm}
                  onChange={(v) => {
                    setDims((c) => ({ ...c, heightCm: toNumber(v) }));
                  }}
                />
              ) : null}
              {needs.includes('depth') ? (
                <NumberInput
                  label="العمق"
                  suffix="سم"
                  value={dims.depthCm}
                  onChange={(v) => {
                    setDims((c) => ({ ...c, depthCm: toNumber(v) }));
                  }}
                />
              ) : null}
              <NumberInput
                label="الكمية"
                suffix="قطعة"
                value={dims.quantity}
                onChange={(v) => {
                  setDims((c) => ({ ...c, quantity: toNumber(v) }));
                }}
              />
            </div>

            {needs.length === 0 ? (
              <div className="notice notice--info">
                هذا المنتج يُسعَّر بالقطعة، فلا يحتاج مقاسات. غيّر الكمية فقط.
              </div>
            ) : null}

            {result ? (
              <>
                <div className="summary-box mt-12">
                  {selected.basis !== 'unit' ? (
                    <div className="summary-row">
                      <span>المقدار للقطعة ({basisUnit(selected.basis)})</span>
                      <span>{formatNumber(result.measure)}</span>
                    </div>
                  ) : null}
                  <div className="summary-row">
                    <span>قيمة المادة</span>
                    <span>{money(result.materialCost)}</span>
                  </div>
                  {result.wasteCost > 0 ? (
                    <div className="summary-row">
                      <span>الهالك ({percent(selected.wastePct)})</span>
                      <span>{money(result.wasteCost)}</span>
                    </div>
                  ) : null}
                  {result.fittings > 0 ? (
                    <div className="summary-row">
                      <span>إكسسوارات</span>
                      <span>{money(result.fittings)}</span>
                    </div>
                  ) : null}
                  {result.labor > 0 ? (
                    <div className="summary-row">
                      <span>أجرة العمل</span>
                      <span>{money(result.labor)}</span>
                    </div>
                  ) : null}
                  <div className="summary-row">
                    <span>تكلفة القطعة</span>
                    <span>{money(result.unitCost)}</span>
                  </div>
                  <div className="summary-row">
                    <span>الربح ({percent(selected.marginPct)})</span>
                    <span>{money(result.unitProfit)}</span>
                  </div>
                  <div className="summary-row">
                    <span>سعر القطعة</span>
                    <span>{money(result.unitTotal)}</span>
                  </div>
                  <div className="summary-row summary-row--total">
                    <span>الإجمالي ({formatNumber(result.quantity)} قطعة)</span>
                    <span>{money(result.total)}</span>
                  </div>
                  <p className="small muted mt-8">
                    ربحك من هذه الصفقة: {money(result.totalProfit)}
                  </p>
                </div>

                <div className="card__actions">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      void createOrder();
                    }}
                  >
                    تحويلها إلى طلبية
                  </button>
                  <button
                    type="button"
                    className="btn btn--soft btn--sm"
                    onClick={() => {
                      printHtml(
                        `عرض سعر - ${selected.name}`,
                        buildProductQuote(selected, dims, result, profile),
                      );
                    }}
                  >
                    طباعة عرض سعر
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => {
                      openEdit(selected);
                    }}
                  >
                    تعديل المنتج
                  </button>
                </div>
              </>
            ) : null}
          </>
        ) : null}
      </div>

      <SectionTitle
        action={
          <button type="button" className="btn btn--soft btn--sm" onClick={openNew}>
            + منتج
          </button>
        }
      >
        منتجاتي ({products.length})
      </SectionTitle>

      <div className="list">
        {ordered.map((product) => (
          <article key={product.id} className="card">
            <div className="card__head">
              <div>
                <h3 className="card__title">{product.name}</h3>
                <p className="card__sub">
                  {craftLabel(product.craft)} · {basisLabel(product.basis)}
                </p>
              </div>
              {product.id === selectedId ? <Badge tone="ok">مختار</Badge> : null}
            </div>
            <div className="card__meta">
              <span>
                سعر الوحدة{' '}
                <strong>
                  {money(product.unitPrice)} / {basisUnit(product.basis)}
                </strong>
              </span>
              {product.fittings > 0 ? (
                <span>
                  إكسسوارات <strong>{money(product.fittings)}</strong>
                </span>
              ) : null}
              {product.labor > 0 ? (
                <span>
                  أجرة <strong>{money(product.labor)}</strong>
                </span>
              ) : null}
              <span>
                الربح <strong>{formatNumber(product.marginPct)}٪</strong>
              </span>
            </div>
            <div className="card__actions">
              <button
                type="button"
                className="btn btn--soft btn--sm"
                onClick={() => {
                  setSelectedId(product.id);
                }}
              >
                احسب بهذا
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  openEdit(product);
                }}
              >
                تعديل
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  setToDelete(product);
                }}
              >
                حذف
              </button>
            </div>
          </article>
        ))}
      </div>

      <ProductForm
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
        title="حذف المنتج"
        message={`سيُحذف قالب «${toDelete?.name ?? ''}» نهائياً. الطلبيات المسجّلة لا تتأثّر.`}
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

/* ------------------------------------------------------ نموذج قالب المنتج */

function ProductForm({
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
  editing: ProductTemplate | null;
  draft: NewRecord<ProductTemplate>;
  saving: boolean;
  currency: string;
  onPatch: (value: Partial<NewRecord<ProductTemplate>>) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const needs = basisNeeds(draft.basis);
  const basisInfo = PRICING_BASES.find((b) => b.value === draft.basis);

  return (
    <Modal
      open={open}
      wide
      title={editing ? 'تعديل المنتج' : 'منتج جديد'}
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
        label="اسم المنتج"
        value={draft.name}
        onChange={(v) => {
          onPatch({ name: v });
        }}
        placeholder="مثال: باب خشب داخلي"
        autoFocus
      />

      <div className="grid-2">
        <Select
          label="الحرفة"
          value={draft.craft}
          options={CRAFTS.map((c) => ({ value: c.value, label: c.label }))}
          onChange={(v) => {
            onPatch({ craft: v as Craft });
          }}
        />
        <Select
          label="طريقة التسعير"
          value={draft.basis}
          options={PRICING_BASES.map((b) => ({ value: b.value, label: b.label }))}
          onChange={(v) => {
            onPatch({ basis: v as PricingBasis });
          }}
        />
      </div>

      {basisInfo ? <p className="small muted mt-0">{basisInfo.hint}</p> : null}

      <div className="grid-2 mt-12">
        <NumberInput
          label={`سعر الوحدة (${basisUnit(draft.basis)})`}
          value={draft.unitPrice}
          onChange={(v) => {
            onPatch({ unitPrice: toNumber(v) });
          }}
          suffix={currency}
        />
        {draft.basis === 'weight' ? (
          <NumberInput
            label="كثافة المادة"
            suffix="كغ/م³"
            value={draft.density}
            onChange={(v) => {
              onPatch({ density: toNumber(v) });
            }}
            hint={DENSITY_HINTS.map((d) => `${d.label} ${formatNumber(d.value)}`).join(' · ')}
          />
        ) : (
          <NumberInput
            label="نسبة الهالك"
            suffix="٪"
            value={draft.wastePct}
            onChange={(v) => {
              onPatch({ wastePct: toNumber(v) });
            }}
          />
        )}
      </div>

      {draft.basis === 'weight' ? (
        <NumberInput
          label="نسبة الهالك"
          suffix="٪"
          value={draft.wastePct}
          onChange={(v) => {
            onPatch({ wastePct: toNumber(v) });
          }}
        />
      ) : null}

      <div className="grid-3">
        <NumberInput
          label="إكسسوارات للقطعة"
          value={draft.fittings}
          onChange={(v) => {
            onPatch({ fittings: toNumber(v) });
          }}
          hint="أقفال، مفصّلات، تركيب"
        />
        <NumberInput
          label="أجرة العمل للقطعة"
          value={draft.labor}
          onChange={(v) => {
            onPatch({ labor: toNumber(v) });
          }}
        />
        <NumberInput
          label="نسبة الربح"
          suffix="٪"
          value={draft.marginPct}
          onChange={(v) => {
            onPatch({ marginPct: toNumber(v) });
          }}
        />
      </div>

      {needs.length > 0 ? (
        <>
          <SectionTitle>مقاسات افتراضية</SectionTitle>
          <p className="small muted">تُملأ تلقائياً عند اختيار المنتج، ويمكن تغييرها وقت الحساب.</p>
          <div className="grid-3 mt-12">
            {needs.includes('width') ? (
              <NumberInput
                label="العرض"
                suffix="سم"
                value={draft.defaultWidth}
                onChange={(v) => {
                  onPatch({ defaultWidth: toNumber(v) });
                }}
              />
            ) : null}
            {needs.includes('height') ? (
              <NumberInput
                label="الارتفاع"
                suffix="سم"
                value={draft.defaultHeight}
                onChange={(v) => {
                  onPatch({ defaultHeight: toNumber(v) });
                }}
              />
            ) : null}
            {needs.includes('depth') ? (
              <NumberInput
                label="العمق"
                suffix="سم"
                value={draft.defaultDepth}
                onChange={(v) => {
                  onPatch({ defaultDepth: toNumber(v) });
                }}
              />
            ) : null}
          </div>
        </>
      ) : null}

      <TextArea
        label="ملاحظات"
        value={draft.notes}
        onChange={(v) => {
          onPatch({ notes: v });
        }}
      />
    </Modal>
  );
}
