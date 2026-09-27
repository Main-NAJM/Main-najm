import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { NumberInput, SectionTitle, Stepper } from '@/components/ui';
import { OPENING_KINDS, computeOpeningPrice, openingKindLabel, } from '@/lib/calc';
import { formatMoney, formatNumber, toNumber } from '@/lib/format';
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
    const [kind, setKind] = useState('door');
    const [lengthCm, setLengthCm] = useState(200);
    const [widthCm, setWidthCm] = useState(100);
    const [quantity, setQuantity] = useState(1);
    const [rate, setRate] = useState(profile.openingRate || 0);
    const [sheetRate, setSheetRate] = useState(profile.openingSheetRate || 0);
    const [saving, setSaving] = useState(false);
    // عدد القطع يختلف بين نوع وآخر، ويُحفظ لكل نوع على حدة.
    const piecesField = {
        fanlight: 'openingPiecesFanlight',
        window: 'openingPiecesWindow',
        door: 'openingPiecesDoor',
    };
    const savedPieces = profile[piecesField[kind]] || 0;
    const [piecesByKind, setPiecesByKind] = useState({
        fanlight: profile.openingPiecesFanlight || 0,
        window: profile.openingPiecesWindow || 0,
        door: profile.openingPiecesDoor || 0,
    });
    const pieces = piecesByKind[kind];
    const money = (value) => formatMoney(value, profile.currency);
    const result = useMemo(() => computeOpeningPrice({ lengthCm, widthCm, quantity, pieces, rate, sheetRate }), [lengthCm, widthCm, quantity, pieces, rate, sheetRate]);
    const ratesChanged = rate !== (profile.openingRate || 0) ||
        sheetRate !== (profile.openingSheetRate || 0) ||
        pieces !== savedPieces;
    const saveRates = async () => {
        setSaving(true);
        try {
            await saveProfile({
                ...profile,
                openingRate: rate,
                openingSheetRate: sheetRate,
                openingPiecesFanlight: piecesByKind.fanlight,
                openingPiecesWindow: piecesByKind.window,
                openingPiecesDoor: piecesByKind.door,
            });
            notify('حُفظت الأرقام، فلن تعيد كتابتها.');
        }
        catch (error) {
            notifyError(error);
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "card", children: [_jsx(SectionTitle, { children: "\u0627\u0644\u0623\u0633\u0639\u0627\u0631" }), _jsx("p", { className: "small muted", children: "\u062A\u064F\u062F\u062E\u0644 \u0645\u0631\u0651\u0629 \u0648\u0627\u062D\u062F\u0629 \u0648\u062A\u0628\u0642\u0649 \u0645\u062D\u0641\u0648\u0638\u0629 \u0644\u0643\u0644 \u062D\u0633\u0627\u0628\u0627\u062A\u0643." }), _jsxs("div", { className: "grid-2 mt-12", children: [_jsx(NumberInput, { label: "\u0633\u0639\u0631 \u0627\u0644\u0645\u062A\u0631 \u0644\u0644\u0642\u0637\u0639\u0629", value: rate, onChange: (v) => {
                                    setRate(toNumber(v));
                                }, suffix: profile.currency, hint: "\u0627\u0644\u0628\u0631\u0648\u0641\u064A\u0644 \u2014 \u0627\u0644\u0639\u0627\u062F\u064A \u0661\u0668\u0660\u0660 \u00B7 \u0627\u0644\u0645\u0644\u0648\u0651\u0646 \u0662\u0665\u0660\u0660" }), _jsx(NumberInput, { label: "\u0633\u0639\u0631 \u0627\u0644\u0645\u062A\u0631 \u0627\u0644\u0645\u0631\u0628\u0651\u0639 \u0644\u0644\u0632\u062C\u0627\u062C \u0623\u0648 \u0627\u0644\u0635\u0641\u064A\u062D\u0629", value: sheetRate, onChange: (v) => {
                                    setSheetRate(toNumber(v));
                                }, suffix: profile.currency, hint: "\u0627\u062A\u0631\u0643\u0647 \u0635\u0641\u0631\u0627\u064B \u0625\u0646 \u0644\u0645 \u062A\u062D\u0627\u0633\u0628 \u0639\u0644\u0649 \u0627\u0644\u0632\u062C\u0627\u062C" })] }), ratesChanged ? (_jsx("button", { type: "button", className: "btn btn--soft btn--sm mt-12", onClick: saveRates, disabled: saving, children: saving ? 'جارٍ…' : 'حفظ الأرقام' })) : null] }), _jsxs("div", { className: "card mt-16", children: [_jsx(SectionTitle, { children: "\u0627\u0644\u0642\u0637\u0639\u0629" }), _jsx("div", { className: "chips mt-12", role: "group", "aria-label": "\u0646\u0648\u0639 \u0627\u0644\u0642\u0637\u0639\u0629", children: OPENING_KINDS.map((option) => (_jsx("button", { type: "button", className: `chip${kind === option.value ? ' is-active' : ''}`, "aria-pressed": kind === option.value, onClick: () => {
                                setKind(option.value);
                            }, children: option.label }, option.value))) }), _jsx(Stepper, { label: `عدد القطع في ${openingKindLabel(kind)}`, value: pieces, onChange: (v) => {
                            setPiecesByKind((current) => ({ ...current, [kind]: v }));
                        }, suffix: "\u0642\u0637\u0639\u0629", hint: "\u0642\u0637\u0639 \u0627\u0644\u0628\u0631\u0648\u0641\u064A\u0644: \u0627\u0644\u0625\u0637\u0627\u0631 \u0648\u0627\u0644\u0636\u0644\u0641 \u0648\u0627\u0644\u0642\u0636\u0628\u0627\u0646. \u0646\u0627\u0641\u0630\u0629 \u0661\u00D7\u0661 \u0641\u064A\u0647\u0627 \u0661\u0661 \u0639\u0627\u062F\u0629\u064B \u2014 \u0632\u0650\u062F \u0623\u0648 \u0623\u0646\u0642\u0635 \u0628\u062D\u0633\u0628 \u0642\u0637\u0639\u062A\u0643." }), _jsxs("div", { className: "grid-2 mt-12", children: [_jsx(NumberInput, { label: "\u0627\u0644\u0637\u0648\u0644", value: lengthCm, onChange: (v) => {
                                    setLengthCm(toNumber(v));
                                }, suffix: "\u0633\u0645" }), _jsx(NumberInput, { label: "\u0627\u0644\u0639\u0631\u0636", value: widthCm, onChange: (v) => {
                                    setWidthCm(toNumber(v));
                                }, suffix: "\u0633\u0645" })] }), _jsx(NumberInput, { label: "\u0627\u0644\u0643\u0645\u064A\u0629", value: quantity, onChange: (v) => {
                            setQuantity(toNumber(v));
                        }, suffix: "\u0642\u0637\u0639\u0629" }), _jsxs("div", { className: "summary-box mt-16", children: [_jsxs("div", { className: "summary-row", children: [_jsx("span", { children: "\u0627\u0644\u0628\u0631\u0648\u0641\u064A\u0644" }), _jsxs("span", { children: [formatNumber(result.pieces), " \u0642\u0637\u0639\u0629 \u00D7 ", formatNumber(result.pieceLength), " \u0645 =", ' ', formatNumber(result.profileMetres), " \u0645.\u0637"] })] }), _jsxs("div", { className: "summary-row", children: [_jsx("span", { children: "\u0627\u0644\u0645\u0633\u0627\u062D\u0629" }), _jsxs("span", { children: [formatNumber(result.area), " \u0645\u00B2"] })] }), _jsxs("div", { className: "summary-row", children: [_jsxs("span", { children: ["\u0642\u064A\u0645\u0629 \u0627\u0644\u0628\u0631\u0648\u0641\u064A\u0644 (", formatNumber(result.profileMetres), " \u0645.\u0637 \u00D7 ", money(rate), ")"] }), _jsx("span", { children: money(result.profileCost) })] }), result.sheetCost > 0 ? (_jsxs("div", { className: "summary-row", children: [_jsxs("span", { children: ["\u0627\u0644\u0632\u062C\u0627\u062C (", formatNumber(result.area), " \u0645\u00B2 \u00D7 ", money(sheetRate), ")"] }), _jsx("span", { children: money(result.sheetCost) })] })) : null, _jsxs("div", { className: "summary-row summary-row--strong", children: [_jsxs("span", { children: ["\u062B\u0645\u0646 ", openingKindLabel(kind), " \u0627\u0644\u0648\u0627\u062D\u062F"] }), _jsx("span", { children: money(result.unitTotal) })] }), result.quantity > 1 ? (_jsxs("div", { className: "summary-row summary-row--total", children: [_jsxs("span", { children: ["\u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A (", formatNumber(result.quantity), " \u0642\u0637\u0639\u0629)"] }), _jsx("span", { children: money(result.total) })] })) : null] }), rate <= 0 || pieces <= 0 ? (_jsx("div", { className: "notice notice--warn mt-12", children: "\u0623\u062F\u062E\u0644 \u0633\u0639\u0631 \u0627\u0644\u0645\u062A\u0631 \u0644\u0644\u0642\u0637\u0639\u0629 \u0648\u0639\u062F\u062F \u0627\u0644\u0642\u0637\u0639 \u0644\u064A\u0638\u0647\u0631 \u0627\u0644\u062B\u0645\u0646." })) : null] })] }));
}
