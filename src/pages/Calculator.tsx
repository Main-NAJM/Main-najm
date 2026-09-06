import { useMemo, useState } from 'react';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import {
  ConfirmDialog,
  EmptyState,
  LineItems,
  Modal,
  NumberInput,
  SectionTitle,
  TextArea,
  TextInput,
} from '@/components/ui';
import { computeCalculation } from '@/lib/calc';
import { formatDateTime, formatMoney, formatNumber, percent, toNumber } from '@/lib/format';
import type { NewRecord } from '@/data/store';
import type { CalcMaterial, Calculation } from '@/lib/types';
import { buildCalculationSheet } from '@/print/templates';
import { printHtml } from '@/print/print';

interface DraftState {
  title: string;
  materials: CalcMaterial[];
  laborHours: number;
  laborRate: number;
  overhead: number;
  wastePct: number;
  marginPct: number;
  notes: string;
}

export default function Calculator() {
  const { calculations, marketPrices, profile, create, remove } = useData();
  const { notify, notifyError } = useToast();

  const [draft, setDraft] = useState<DraftState>(() => ({
    title: '',
    materials: [{ name: '', qty: 1, unitPrice: 0 }],
    laborHours: 0,
    laborRate: profile.defaultLaborRate,
    overhead: 0,
    wastePct: 5,
    marginPct: profile.defaultMarginPct,
    notes: '',
  }));
  const [saving, setSaving] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Calculation | null>(null);

  const result = useMemo(() => computeCalculation(draft), [draft]);

  const patch = (value: Partial<DraftState>) => {
    setDraft((current) => ({ ...current, ...value }));
  };

  const patchMaterial = (index: number, value: Partial<CalcMaterial>) => {
    setDraft((current) => ({
      ...current,
      materials: current.materials.map((m, i) => (i === index ? { ...m, ...value } : m)),
    }));
  };

  const addMaterial = () => {
    setDraft((current) => ({
      ...current,
      materials: [...current.materials, { name: '', qty: 1, unitPrice: 0 }],
    }));
  };

  const removeMaterial = (index: number) => {
    setDraft((current) => ({
      ...current,
      materials: current.materials.filter((_, i) => i !== index),
    }));
  };

  /** يضيف مادة بسعرها الحالي من مؤشرات السوق. */
  const addFromMarket = (id: string) => {
    const price = marketPrices.find((item) => item.id === id);
    if (!price) return;
    setDraft((current) => ({
      ...current,
      materials: [
        ...current.materials.filter((m) => m.name.trim() || m.unitPrice > 0),
        { name: `${price.name} (${price.unit})`, qty: 1, unitPrice: price.price },
      ],
    }));
    notify(`أُضيفت «${price.name}» بسعر السوق الحالي.`);
  };

  const reset = () => {
    setDraft({
      title: '',
      materials: [{ name: '', qty: 1, unitPrice: 0 }],
      laborHours: 0,
      laborRate: profile.defaultLaborRate,
      overhead: 0,
      wastePct: 5,
      marginPct: profile.defaultMarginPct,
      notes: '',
    });
  };

  const save = async () => {
    const materials = draft.materials.filter((m) => m.name.trim() || m.unitPrice > 0);
    if (!draft.title.trim() && materials.length === 0 && draft.laborHours === 0) {
      notify('أضف عنواناً أو مادة أو ساعات عمل قبل الحفظ.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload: NewRecord<Calculation> = {
        title: draft.title.trim() || 'حساب بدون عنوان',
        materials: materials.map((m) => ({
          name: m.name.trim() || 'مادة',
          qty: m.qty || 0,
          unitPrice: m.unitPrice || 0,
        })),
        laborHours: draft.laborHours,
        laborRate: draft.laborRate,
        overhead: draft.overhead,
        wastePct: draft.wastePct,
        marginPct: draft.marginPct,
        materialsCost: result.materialsCost,
        laborCost: result.laborCost,
        totalCost: result.totalCost,
        profit: result.profit,
        suggestedPrice: result.suggestedPrice,
        notes: draft.notes.trim(),
      };
      await create('calculations', payload);
      notify('حُفظ الحساب في السجل.');
    } catch (error) {
      notifyError(error);
    } finally {
      setSaving(false);
    }
  };

  const loadFromHistory = (calc: Calculation) => {
    setDraft({
      title: calc.title,
      materials: calc.materials?.length
        ? calc.materials.map((m) => ({ ...m }))
        : [{ name: '', qty: 1, unitPrice: 0 }],
      laborHours: calc.laborHours,
      laborRate: calc.laborRate,
      overhead: calc.overhead,
      wastePct: calc.wastePct,
      marginPct: calc.marginPct,
      notes: calc.notes,
    });
    setHistoryOpen(false);
    notify('حُمّل الحساب في النموذج، يمكنك تعديله.');
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove('calculations', toDelete.id);
      notify('حُذف الحساب من السجل.');
    } catch (error) {
      notifyError(error);
    } finally {
      setToDelete(null);
    }
  };

  const money = (value: number) => formatMoney(value, profile.currency);

  return (
    <>
      <div className="card">
        <TextInput
          label="عنوان الحساب"
          value={draft.title}
          onChange={(value) => {
            patch({ title: value });
          }}
          placeholder="مثال: تسعير خزانة بابين"
        />

        <SectionTitle
          action={
            <button type="button" className="btn btn--soft btn--sm" onClick={addMaterial}>
              + مادة
            </button>
          }
        >
          المواد
        </SectionTitle>

        <LineItems
          rows={draft.materials}
          nameLabel="اسم المادة"
          namePlaceholder="مثال: لوح خشب"
          onPatch={patchMaterial}
          onRemove={removeMaterial}
          toNumber={(value) => toNumber(value)}
        />

        {marketPrices.length > 0 ? (
          <div className="mt-12">
            <label className="field__label" htmlFor="market-pick">
              إضافة مادة من مؤشرات السوق
            </label>
            <select
              id="market-pick"
              className="input input--select"
              value=""
              onChange={(event) => {
                if (event.target.value) addFromMarket(event.target.value);
              }}
            >
              <option value="">اختر مادة…</option>
              {marketPrices.map((price) => (
                <option key={price.id} value={price.id}>
                  {price.name} — {money(price.price)} / {price.unit}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <SectionTitle>العمل والمصاريف</SectionTitle>
        <div className="grid-2">
          <NumberInput
            label="ساعات العمل"
            suffix="ساعة"
            value={draft.laborHours}
            onChange={(value) => {
              patch({ laborHours: toNumber(value) });
            }}
          />
          <NumberInput
            label="أجرة الساعة"
            value={draft.laborRate}
            onChange={(value) => {
              patch({ laborRate: toNumber(value) });
            }}
          />
        </div>
        <div className="grid-3">
          <NumberInput
            label="مصاريف عامة"
            value={draft.overhead}
            onChange={(value) => {
              patch({ overhead: toNumber(value) });
            }}
            hint="كهرباء، نقل، إيجار"
          />
          <NumberInput
            label="نسبة الهالك"
            suffix="٪"
            value={draft.wastePct}
            onChange={(value) => {
              patch({ wastePct: toNumber(value) });
            }}
          />
          <NumberInput
            label="نسبة الربح"
            suffix="٪"
            value={draft.marginPct}
            onChange={(value) => {
              patch({ marginPct: toNumber(value) });
            }}
          />
        </div>

        <div className="summary-box mt-12">
          <div className="summary-row">
            <span>تكلفة المواد (مع الهالك)</span>
            <span>{money(result.materialsCost)}</span>
          </div>
          <div className="summary-row">
            <span>أجور العمل</span>
            <span>{money(result.laborCost)}</span>
          </div>
          <div className="summary-row">
            <span>مصاريف عامة</span>
            <span>{money(result.overhead)}</span>
          </div>
          <div className="summary-row">
            <span>إجمالي التكلفة</span>
            <span>{money(result.totalCost)}</span>
          </div>
          <div className="summary-row">
            <span>الربح المتوقّع ({percent(draft.marginPct)} من التكلفة)</span>
            <span>{money(result.profit)}</span>
          </div>
          <div className="summary-row summary-row--total">
            <span>السعر المقترح</span>
            <span>{money(result.suggestedPrice)}</span>
          </div>
          <p className="small muted mt-8">
            هامش الربح من سعر البيع: {percent(result.marginOfPrice)}
          </p>
        </div>

        <TextArea
          label="ملاحظات"
          value={draft.notes}
          onChange={(value) => {
            patch({ notes: value });
          }}
        />

        <div className="card__actions">
          <button
            type="button"
            className="btn"
            disabled={saving}
            onClick={() => {
              void save();
            }}
          >
            {saving ? 'جارٍ الحفظ…' : 'حفظ في السجل'}
          </button>
          <button
            type="button"
            className="btn btn--soft btn--sm"
            onClick={() => {
              printHtml(
                'ورقة تسعير',
                buildCalculationSheet(
                  {
                    id: 'draft',
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    ...draft,
                    materialsCost: result.materialsCost,
                    laborCost: result.laborCost,
                    totalCost: result.totalCost,
                    profit: result.profit,
                    suggestedPrice: result.suggestedPrice,
                  },
                  profile,
                ),
              );
            }}
          >
            طباعة
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={reset}>
            تفريغ
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => {
              setHistoryOpen(true);
            }}
          >
            السجل ({calculations.length})
          </button>
        </div>
      </div>

      <Modal
        open={historyOpen}
        wide
        title="سجل الحسابات السابقة"
        onClose={() => {
          setHistoryOpen(false);
        }}
      >
        {calculations.length === 0 ? (
          <EmptyState
            title="لا توجد حسابات محفوظة"
            description="كل حساب تحفظه يظهر هنا لتعود إليه أو تعيد استخدامه لاحقاً."
          />
        ) : (
          <div className="list">
            {calculations.map((calc) => (
              <article key={calc.id} className="card">
                <div className="card__head">
                  <div>
                    <h3 className="card__title">{calc.title}</h3>
                    <p className="card__sub">{formatDateTime(calc.createdAt)}</p>
                  </div>
                  <strong>{money(calc.suggestedPrice)}</strong>
                </div>
                <div className="card__meta">
                  <span>
                    التكلفة <strong>{money(calc.totalCost)}</strong>
                  </span>
                  <span>
                    الربح <strong>{money(calc.profit)}</strong>
                  </span>
                  <span>
                    النسبة <strong>{formatNumber(calc.marginPct)}٪</strong>
                  </span>
                </div>
                <div className="card__actions">
                  <button
                    type="button"
                    className="btn btn--soft btn--sm"
                    onClick={() => {
                      loadFromHistory(calc);
                    }}
                  >
                    إعادة استخدام
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => {
                      printHtml(`ورقة تسعير - ${calc.title}`, buildCalculationSheet(calc, profile));
                    }}
                  >
                    طباعة
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => {
                      setToDelete(calc);
                    }}
                  >
                    حذف
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="حذف الحساب"
        message={`سيُحذف «${toDelete?.title ?? ''}» من السجل نهائياً.`}
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
