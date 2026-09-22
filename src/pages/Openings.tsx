import { useMemo, useState } from 'react';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { NumberInput, SectionTitle } from '@/components/ui';
import {
  OPENING_KINDS,
  computeOpeningPrice,
  openingKindLabel,
} from '@/lib/calc';
import { formatMoney, formatNumber, toNumber } from '@/lib/format';
import type { OpeningKind } from '@/lib/types';

/**
 * حاسبة الأبواب والنوافذ.
 *
 * السعران يُدخلان مرّة ويُحفظان في ملف الورشة، فلا يُعاد كتابتهما مع كل قطعة.
 * ثم مقاسان ونوع، فيخرج الثمن مفصّلاً: كم مترًا طوليًا من البروفيل وكم مترًا
 * مربّعًا من الزجاج — كي يُراجَع الرقم لا أن يُوثق به.
 */
export default function Openings() {
  const { profile, saveProfile } = useData();
  const { notify, notifyError } = useToast();

  const [kind, setKind] = useState<OpeningKind>('door');
  const [lengthCm, setLengthCm] = useState(200);
  const [widthCm, setWidthCm] = useState(100);
  const [quantity, setQuantity] = useState(1);

  const [rate, setRate] = useState(profile.openingRate || 0);
  const [sheetRate, setSheetRate] = useState(profile.openingSheetRate || 0);
  const [saving, setSaving] = useState(false);

  const money = (value: number) => formatMoney(value, profile.currency);

  const result = useMemo(
    () => computeOpeningPrice({ lengthCm, widthCm, quantity, rate, sheetRate }),
    [lengthCm, widthCm, quantity, rate, sheetRate],
  );

  const ratesChanged =
    rate !== (profile.openingRate || 0) || sheetRate !== (profile.openingSheetRate || 0);

  const saveRates = async () => {
    setSaving(true);
    try {
      await saveProfile({ ...profile, openingRate: rate, openingSheetRate: sheetRate });
      notify('حُفظ السعران، فلن تعيد كتابتهما.');
    } catch (error) {
      notifyError(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="card">
        <SectionTitle>الأسعار</SectionTitle>
        <p className="small muted">تُدخل مرّة واحدة وتبقى محفوظة لكل حساباتك.</p>
        <div className="grid-2 mt-12">
          <NumberInput
            label="سعر المتر للقطعة"
            value={rate}
            onChange={(v) => {
              setRate(toNumber(v));
            }}
            suffix={profile.currency}
            hint="البروفيل — العادي ١٨٠٠ · الملوّن ٢٥٠٠"
          />
          <NumberInput
            label="سعر المتر المربّع للزجاج أو الصفيحة"
            value={sheetRate}
            onChange={(v) => {
              setSheetRate(toNumber(v));
            }}
            suffix={profile.currency}
            hint="اتركه صفراً إن لم تحاسب على الزجاج"
          />
        </div>
        {ratesChanged ? (
          <button type="button" className="btn btn--soft btn--sm mt-12" onClick={saveRates} disabled={saving}>
            {saving ? 'جارٍ…' : 'حفظ السعرين'}
          </button>
        ) : null}
      </div>

      <div className="card mt-16">
        <SectionTitle>القطعة</SectionTitle>

        <div className="chips mt-12" role="group" aria-label="نوع القطعة">
          {OPENING_KINDS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`chip${kind === option.value ? ' is-active' : ''}`}
              aria-pressed={kind === option.value}
              onClick={() => {
                setKind(option.value);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="grid-2 mt-12">
          <NumberInput
            label="الطول"
            value={lengthCm}
            onChange={(v) => {
              setLengthCm(toNumber(v));
            }}
            suffix="سم"
          />
          <NumberInput
            label="العرض"
            value={widthCm}
            onChange={(v) => {
              setWidthCm(toNumber(v));
            }}
            suffix="سم"
          />
        </div>
        <NumberInput
          label="الكمية"
          value={quantity}
          onChange={(v) => {
            setQuantity(toNumber(v));
          }}
          suffix="قطعة"
        />

        <div className="summary-box mt-16">
          <div className="summary-row">
            <span>المحيط</span>
            <span>{formatNumber(result.perimeter)} م.ط</span>
          </div>
          <div className="summary-row">
            <span>المساحة</span>
            <span>{formatNumber(result.area)} م²</span>
          </div>
          <div className="summary-row">
            <span>
              البروفيل ({formatNumber(result.perimeter)} م.ط × {money(rate)})
            </span>
            <span>{money(result.profileCost)}</span>
          </div>
          {result.sheetCost > 0 ? (
            <div className="summary-row">
              <span>
                الزجاج ({formatNumber(result.area)} م² × {money(sheetRate)})
              </span>
              <span>{money(result.sheetCost)}</span>
            </div>
          ) : null}
          <div className="summary-row summary-row--strong">
            <span>ثمن {openingKindLabel(kind)} الواحد</span>
            <span>{money(result.unitTotal)}</span>
          </div>
          {result.quantity > 1 ? (
            <div className="summary-row summary-row--total">
              <span>الإجمالي ({formatNumber(result.quantity)} قطعة)</span>
              <span>{money(result.total)}</span>
            </div>
          ) : null}
        </div>

        {rate <= 0 ? (
          <div className="notice notice--warn mt-12">
            أدخل سعر المتر للقطعة أعلاه ليظهر الثمن.
          </div>
        ) : null}
      </div>
    </>
  );
}
