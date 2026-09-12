import { useMemo, useState } from 'react';
import { useData } from '@/context/DataContext';
import { decimal, formatDate, money, newId, todayISO } from '@/lib/format';
import {
  ConfirmDialog,
  EmptyState,
  Modal,
  NumberInput,
  SectionTitle,
  Select,
  Spinner,
  StatCard,
  TextArea,
  TextInput,
  parseNumeric,
} from '@/components/ui';
import type { Material, MaterialUnit } from '@/lib/types';

const UNIT_LABEL: Record<MaterialUnit, string> = {
  meter: 'متر',
  kg: 'كغ',
  piece: 'قطعة',
  sheet: 'لوح',
  bar: 'قضيب',
};

const UNIT_OPTIONS = (Object.keys(UNIT_LABEL) as MaterialUnit[]).map((value) => ({
  value,
  label: UNIT_LABEL[value],
}));

const emptyMaterial = (): Material => ({
  id: newId(),
  name: '',
  unit: 'meter',
  quantity: 0,
  minQuantity: 0,
  unitCost: 0,
  supplier: '',
  note: '',
  movements: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

const isLow = (material: Material): boolean =>
  material.minQuantity > 0 && material.quantity <= material.minQuantity;

export default function Materials() {
  const { materials, profile, loading, saveMaterial, deleteMaterial } = useData();
  const [editing, setEditing] = useState<Material | null>(null);
  const [moving, setMoving] = useState<Material | null>(null);
  const [moveAmount, setMoveAmount] = useState('');
  const [moveNote, setMoveNote] = useState('');
  const [moveKind, setMoveKind] = useState<'in' | 'out'>('in');
  const [removing, setRemoving] = useState<Material | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(
    () => ({
      value: materials.reduce((sum, item) => sum + item.quantity * item.unitCost, 0),
      low: materials.filter(isLow).length,
    }),
    [materials],
  );

  const submit = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      setError('اسم المادة مطلوب.');
      return;
    }
    await saveMaterial({ ...editing, name: editing.name.trim(), updatedAt: Date.now() });
    setEditing(null);
    setError(null);
  };

  const applyMovement = async () => {
    if (!moving) return;
    const amount = Math.abs(parseNumeric(moveAmount));
    if (amount <= 0) return;
    const delta = moveKind === 'in' ? amount : -amount;
    await saveMaterial({
      ...moving,
      quantity: Math.max(0, moving.quantity + delta),
      movements: [
        { id: newId(), delta, date: todayISO(), note: moveNote.trim() },
        ...moving.movements,
      ].slice(0, 20), // يكفي سجلّ آخر ٢٠ حركة داخل الوثيقة
      updatedAt: Date.now(),
    });
    setMoving(null);
    setMoveAmount('');
    setMoveNote('');
  };

  if (loading) return <Spinner />;

  return (
    <>
      <div className="stats">
        <StatCard label="أصناف المخزون" value={String(materials.length)} />
        <StatCard label="قيمة المخزون" value={money(totals.value, profile.currency)} />
        <StatCard
          label="تحت حدّ التنبيه"
          value={String(totals.low)}
          tone={totals.low ? 'danger' : 'ok'}
          hint={totals.low ? 'يحتاج إعادة شراء' : 'الكميات كافية'}
        />
      </div>

      <SectionTitle
        action={
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => {
              setError(null);
              setEditing(emptyMaterial());
            }}
          >
            مادة جديدة
          </button>
        }
      >
        المخزون
      </SectionTitle>

      {materials.length === 0 ? (
        <EmptyState
          title="لا توجد مواد مسجّلة"
          hint="سجّل الألمنيوم والحديد والزجاج والإكسسوارات لتتابع كمياتها وقيمتها."
        />
      ) : (
        <div className="list">
          {materials.map((material) => (
            <div key={material.id} className="card">
              <div className="card__head">
                <div>
                  <div className="card__title">{material.name}</div>
                  <div className="card__meta">
                    <span>
                      المتوفّر <strong>{decimal(material.quantity)}</strong> {UNIT_LABEL[material.unit]}
                    </span>
                    {material.unitCost ? (
                      <span>سعر الوحدة {money(material.unitCost, profile.currency)}</span>
                    ) : null}
                    {material.supplier ? <span>المورّد {material.supplier}</span> : null}
                  </div>
                </div>
                {isLow(material) ? (
                  <span className="badge badge--danger">أعد الشراء</span>
                ) : (
                  <span className="badge badge--ok">متوفّر</span>
                )}
              </div>

              {material.movements.length ? (
                <p className="small muted mt-8">
                  آخر حركة: {material.movements[0].delta > 0 ? 'استلام' : 'صرف'}{' '}
                  {decimal(Math.abs(material.movements[0].delta))} {UNIT_LABEL[material.unit]} —{' '}
                  {formatDate(material.movements[0].date)}
                </p>
              ) : null}

              <div className="card__actions">
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => {
                    setMoveKind('in');
                    setMoveAmount('');
                    setMoveNote('');
                    setMoving(material);
                  }}
                >
                  حركة مخزون
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => {
                    setError(null);
                    setEditing(material);
                  }}
                >
                  تعديل
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setRemoving(material)}
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(editing)}
        title={editing && materials.some((m) => m.id === editing.id) ? 'تعديل مادة' : 'مادة جديدة'}
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
            {error ? <div className="notice notice--danger">{error}</div> : null}
            <TextInput
              label="اسم المادة"
              value={editing.name}
              onChange={(value) => setEditing({ ...editing, name: value })}
              placeholder="مثال: بروفيل ألمنيوم أبيض"
              autoFocus
            />
            <div className="row">
              <Select
                label="الوحدة"
                value={editing.unit}
                onChange={(value) => setEditing({ ...editing, unit: value })}
                options={UNIT_OPTIONS}
              />
              <NumberInput
                label="الكمية المتوفّرة"
                value={editing.quantity}
                onChange={(value) => setEditing({ ...editing, quantity: value })}
                decimals
              />
            </div>
            <div className="row">
              <NumberInput
                label="حدّ التنبيه"
                value={editing.minQuantity}
                onChange={(value) => setEditing({ ...editing, minQuantity: value })}
                decimals
                hint="تحته يظهر تنبيه الشراء"
              />
              <NumberInput
                label="سعر الوحدة"
                value={editing.unitCost}
                onChange={(value) => setEditing({ ...editing, unitCost: value })}
              />
            </div>
            <TextInput
              label="المورّد"
              value={editing.supplier}
              onChange={(value) => setEditing({ ...editing, supplier: value })}
            />
            <TextArea
              label="ملاحظات"
              value={editing.note}
              onChange={(value) => setEditing({ ...editing, note: value })}
            />
          </>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(moving)}
        title="حركة مخزون"
        onClose={() => setMoving(null)}
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setMoving(null)}>
              إلغاء
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                void applyMovement();
              }}
            >
              تسجيل
            </button>
          </>
        }
      >
        {moving ? (
          <>
            <p className="small muted">
              {moving.name} — المتوفّر حالياً {decimal(moving.quantity)} {UNIT_LABEL[moving.unit]}
            </p>
            <div className="chips mt-8">
              <button
                type="button"
                className={`chip${moveKind === 'in' ? ' is-active' : ''}`}
                onClick={() => setMoveKind('in')}
              >
                استلام (+)
              </button>
              <button
                type="button"
                className={`chip${moveKind === 'out' ? ' is-active' : ''}`}
                onClick={() => setMoveKind('out')}
              >
                صرف للورشة (−)
              </button>
            </div>
            <div className="mt-8">
              <TextInput
                label="الكمية"
                inputMode="decimal"
                value={moveAmount}
                onChange={setMoveAmount}
                autoFocus
              />
              <TextInput
                label="ملاحظة"
                value={moveNote}
                onChange={setMoveNote}
                placeholder="رقم الطلب، اسم المورّد…"
              />
            </div>

            {moving.movements.length ? (
              <>
                <SectionTitle>آخر الحركات</SectionTitle>
                <div className="list">
                  {moving.movements.slice(0, 6).map((movement) => (
                    <div key={movement.id} className="card__meta">
                      <span>{formatDate(movement.date)}</span>
                      <strong className={movement.delta > 0 ? 'badge badge--ok' : 'badge badge--warn'}>
                        {movement.delta > 0 ? '+' : '−'}
                        {decimal(Math.abs(movement.delta))}
                      </strong>
                      {movement.note ? <span className="muted">{movement.note}</span> : null}
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(removing)}
        title="حذف المادة"
        message={`سيُحذف «${removing?.name ?? ''}» وسجلّ حركاته.`}
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          if (removing) void deleteMaterial(removing.id);
          setRemoving(null);
        }}
      />
    </>
  );
}
