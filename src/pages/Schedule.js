import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { Badge, ConfirmDialog, EmptyState, Modal, NumberInput, Select, TextArea, TextInput, } from '@/components/ui';
import { addDays, formatDate, formatTime, formatWeekday, relativeDayLabel, telHref, toNumber, todayIso, whatsappHref, } from '@/lib/format';
import { appointmentReminder } from '@/lib/messages';
const emptyAppointment = (date) => ({
    title: '',
    date,
    time: '09:00',
    durationMin: 60,
    customerName: '',
    phone: '',
    location: '',
    notes: '',
    orderId: null,
    done: false,
});
const sortByDateTime = (a, b) => {
    const key = (item) => `${item.date} ${item.time}`;
    return key(a).localeCompare(key(b));
};
export default function Schedule() {
    const { appointments, orders, profile, create, update, remove } = useData();
    const { notify, notifyError } = useToast();
    const [range, setRange] = useState('today');
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [draft, setDraft] = useState(() => emptyAppointment(todayIso()));
    const [saving, setSaving] = useState(false);
    const [toDelete, setToDelete] = useState(null);
    const today = todayIso();
    const visible = useMemo(() => {
        const rows = [...appointments].sort(sortByDateTime);
        switch (range) {
            case 'today':
                return rows.filter((item) => item.date === today && !item.done);
            case 'upcoming':
                return rows.filter((item) => item.date > today && !item.done);
            case 'done':
                return rows.filter((item) => item.done).reverse();
            default:
                return rows;
        }
    }, [appointments, range, today]);
    const grouped = useMemo(() => {
        const map = new Map();
        visible.forEach((item) => {
            const list = map.get(item.date) ?? [];
            list.push(item);
            map.set(item.date, list);
        });
        return [...map.entries()];
    }, [visible]);
    const counts = useMemo(() => ({
        today: appointments.filter((a) => a.date === today && !a.done).length,
        upcoming: appointments.filter((a) => a.date > today && !a.done).length,
        all: appointments.length,
        done: appointments.filter((a) => a.done).length,
    }), [appointments, today]);
    const openNew = (date = today) => {
        setEditing(null);
        setDraft(emptyAppointment(date));
        setFormOpen(true);
    };
    const openEdit = (item) => {
        setEditing(item);
        setDraft({
            title: item.title,
            date: item.date,
            time: item.time,
            durationMin: item.durationMin,
            customerName: item.customerName,
            phone: item.phone,
            location: item.location,
            notes: item.notes,
            orderId: item.orderId,
            done: item.done,
        });
        setFormOpen(true);
    };
    const patch = (value) => {
        setDraft((current) => ({ ...current, ...value }));
    };
    const save = async () => {
        if (!draft.title.trim()) {
            notify('اكتب عنوان الموعد.', 'error');
            return;
        }
        if (!draft.date) {
            notify('اختر تاريخ الموعد.', 'error');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...draft,
                title: draft.title.trim(),
                customerName: draft.customerName.trim(),
                phone: draft.phone.trim(),
                location: draft.location.trim(),
                notes: draft.notes.trim(),
            };
            if (editing) {
                await update('appointments', editing.id, payload);
                notify('حُفظ الموعد.');
            }
            else {
                await create('appointments', payload);
                notify('أُضيف الموعد.');
            }
            setFormOpen(false);
            setEditing(null);
        }
        catch (error) {
            notifyError(error);
        }
        finally {
            setSaving(false);
        }
    };
    const toggleDone = async (item) => {
        try {
            await update('appointments', item.id, { done: !item.done });
            notify(item.done ? 'أُعيد الموعد إلى قائمة الانتظار.' : 'تم إنجاز الموعد.');
        }
        catch (error) {
            notifyError(error);
        }
    };
    const confirmDelete = async () => {
        if (!toDelete)
            return;
        try {
            await remove('appointments', toDelete.id);
            notify('حُذف الموعد.');
        }
        catch (error) {
            notifyError(error);
        }
        finally {
            setToDelete(null);
        }
    };
    const orderOptions = useMemo(() => [
        { value: '', label: 'بدون ربط بطلبية' },
        ...orders.map((order) => ({ value: order.id, label: order.title || order.customerName })),
    ], [orders]);
    const chips = [
        { value: 'today', label: `اليوم (${counts.today})` },
        { value: 'upcoming', label: `قادمة (${counts.upcoming})` },
        { value: 'all', label: `الكل (${counts.all})` },
        { value: 'done', label: `منجزة (${counts.done})` },
    ];
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "filters", children: chips.map((chip) => (_jsx("button", { type: "button", className: `chip${range === chip.value ? ' is-active' : ''}`, onClick: () => {
                        setRange(chip.value);
                    }, children: chip.label }, chip.value))) }), _jsx("div", { className: "card", children: _jsxs("div", { className: "row-between", children: [_jsxs("div", { children: [_jsx("strong", { children: formatDate(today) }), _jsx("p", { className: "small muted", children: formatWeekday(today) })] }), _jsxs("div", { className: "cluster", children: [_jsx("button", { type: "button", className: "btn btn--soft btn--sm", onClick: () => {
                                        openNew(today);
                                    }, children: "\u0645\u0648\u0639\u062F \u0627\u0644\u064A\u0648\u0645" }), _jsx("button", { type: "button", className: "btn btn--ghost btn--sm", onClick: () => {
                                        openNew(addDays(today, 1));
                                    }, children: "\u0645\u0648\u0639\u062F \u0627\u0644\u063A\u062F" })] })] }) }), grouped.length === 0 ? (_jsx("div", { className: "mt-16", children: _jsx(EmptyState, { title: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u0648\u0627\u0639\u064A\u062F \u0641\u064A \u0647\u0630\u0647 \u0627\u0644\u0642\u0627\u0626\u0645\u0629", description: "\u0646\u0638\u0651\u0645 \u064A\u0648\u0645\u0643 \u0628\u0625\u0636\u0627\u0641\u0629 \u0645\u0648\u0627\u0639\u064A\u062F \u0627\u0644\u0642\u064A\u0627\u0633 \u0648\u0627\u0644\u062A\u0633\u0644\u064A\u0645 \u0648\u0627\u0644\u0632\u064A\u0627\u0631\u0627\u062A.", action: _jsx("button", { type: "button", className: "btn", onClick: () => {
                            openNew();
                        }, children: "\u0625\u0636\u0627\u0641\u0629 \u0645\u0648\u0639\u062F" }) }) })) : (grouped.map(([date, items]) => (_jsxs("section", { children: [_jsxs("div", { className: "day-group__head", children: [_jsx("span", { className: "day-group__title", children: formatDate(date) }), _jsxs("span", { className: "day-group__sub", children: [formatWeekday(date), " \u00B7 ", relativeDayLabel(date)] })] }), _jsx("div", { className: "list", children: items.map((item) => {
                            const tel = telHref(item.phone);
                            // تذكير جاهز في واتساب — يُفتح مكتوباً ولا يُرسل حتى يضغط صاحبه إرسال.
                            const wa = item.done
                                ? null
                                : whatsappHref(item.phone, appointmentReminder(item, profile));
                            const linkedOrder = item.orderId
                                ? orders.find((order) => order.id === item.orderId)
                                : null;
                            return (_jsxs("article", { className: "card", children: [_jsxs("div", { className: "card__head", children: [_jsxs("div", { children: [_jsx("h3", { className: "card__title", children: item.title }), _jsxs("p", { className: "card__sub", children: [formatTime(item.time), item.durationMin ? ` · ${item.durationMin} دقيقة` : '', item.customerName ? ` · ${item.customerName}` : ''] })] }), item.done ? _jsx(Badge, { tone: "ok", children: "\u0645\u0646\u062C\u0632" }) : _jsx(Badge, { tone: "info", children: "\u0642\u0627\u062F\u0645" })] }), _jsxs("div", { className: "card__meta", children: [item.location ? _jsxs("span", { children: ["\u0627\u0644\u0645\u0643\u0627\u0646: ", _jsx("strong", { children: item.location })] }) : null, item.phone ? (_jsxs("span", { children: ["\u0627\u0644\u0647\u0627\u062A\u0641:", ' ', tel ? (_jsx("a", { href: tel, children: _jsx("strong", { children: item.phone }) })) : (_jsx("strong", { children: item.phone }))] })) : null, linkedOrder ? _jsxs("span", { children: ["\u0627\u0644\u0637\u0644\u0628\u064A\u0629: ", _jsx("strong", { children: linkedOrder.title })] }) : null] }), item.notes ? _jsx("p", { className: "small muted mt-8", children: item.notes }) : null, _jsxs("div", { className: "card__actions", children: [_jsx("button", { type: "button", className: "btn btn--soft btn--sm", onClick: () => {
                                                    void toggleDone(item);
                                                }, children: item.done ? 'إرجاع' : 'تم الإنجاز' }), wa ? (_jsx("a", { className: "btn btn--ghost btn--sm", href: wa, target: "_blank", rel: "noreferrer noopener", children: "\u062A\u0630\u0643\u064A\u0631 \u0628\u0648\u0627\u062A\u0633\u0627\u0628" })) : null, _jsx("button", { type: "button", className: "btn btn--ghost btn--sm", onClick: () => {
                                                    openEdit(item);
                                                }, children: "\u062A\u0639\u062F\u064A\u0644" }), _jsx("button", { type: "button", className: "btn btn--ghost btn--sm", onClick: () => {
                                                    setToDelete(item);
                                                }, children: "\u062D\u0630\u0641" })] })] }, item.id));
                        }) })] }, date)))), _jsx("button", { type: "button", className: "fab", onClick: () => {
                    openNew();
                }, children: "+ \u0645\u0648\u0639\u062F \u062C\u062F\u064A\u062F" }), _jsxs(Modal, { open: formOpen, title: editing ? 'تعديل الموعد' : 'موعد جديد', onClose: () => {
                    setFormOpen(false);
                }, footer: _jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "btn btn--ghost", onClick: () => {
                                setFormOpen(false);
                            }, children: "\u0625\u0644\u063A\u0627\u0621" }), _jsx("button", { type: "button", className: "btn", disabled: saving, onClick: () => {
                                void save();
                            }, children: saving ? 'جارٍ الحفظ…' : 'حفظ' })] }), children: [_jsx(TextInput, { label: "\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0645\u0648\u0639\u062F", value: draft.title, onChange: (value) => {
                            patch({ title: value });
                        }, placeholder: "\u0645\u062B\u0627\u0644: \u0623\u062E\u0630 \u0642\u064A\u0627\u0633\u0627\u062A\u060C \u062A\u0633\u0644\u064A\u0645 \u0628\u0636\u0627\u0639\u0629", autoFocus: true }), _jsxs("div", { className: "grid-3", children: [_jsx(TextInput, { label: "\u0627\u0644\u062A\u0627\u0631\u064A\u062E", type: "date", value: draft.date, onChange: (value) => {
                                    patch({ date: value });
                                } }), _jsx(TextInput, { label: "\u0627\u0644\u0648\u0642\u062A", type: "time", value: draft.time, onChange: (value) => {
                                    patch({ time: value });
                                } }), _jsx(NumberInput, { label: "\u0627\u0644\u0645\u062F\u0629", suffix: "\u062F\u0642\u064A\u0642\u0629", value: draft.durationMin, onChange: (value) => {
                                    patch({ durationMin: toNumber(value) });
                                } })] }), _jsxs("div", { className: "grid-2", children: [_jsx(TextInput, { label: "\u0627\u0633\u0645 \u0627\u0644\u0632\u0628\u0648\u0646", value: draft.customerName, onChange: (value) => {
                                    patch({ customerName: value });
                                } }), _jsx(TextInput, { label: "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641", type: "tel", inputMode: "tel", value: draft.phone, onChange: (value) => {
                                    patch({ phone: value });
                                } })] }), _jsx(TextInput, { label: "\u0627\u0644\u0645\u0643\u0627\u0646", value: draft.location, onChange: (value) => {
                            patch({ location: value });
                        }, placeholder: "\u0627\u0644\u0648\u0631\u0634\u0629\u060C \u0628\u064A\u062A \u0627\u0644\u0632\u0628\u0648\u0646\u060C \u0627\u0644\u0633\u0648\u0642\u2026" }), _jsx(Select, { label: "\u0645\u0631\u062A\u0628\u0637 \u0628\u0637\u0644\u0628\u064A\u0629", value: draft.orderId ?? '', options: orderOptions, onChange: (value) => {
                            patch({ orderId: value || null });
                        } }), _jsx(TextArea, { label: "\u0645\u0644\u0627\u062D\u0638\u0627\u062A", value: draft.notes, onChange: (value) => {
                            patch({ notes: value });
                        } })] }), _jsx(ConfirmDialog, { open: Boolean(toDelete), title: "\u062D\u0630\u0641 \u0627\u0644\u0645\u0648\u0639\u062F", message: `سيُحذف موعد «${toDelete?.title ?? ''}» نهائياً.`, onCancel: () => {
                    setToDelete(null);
                }, onConfirm: () => {
                    void confirmDelete();
                } })] }));
}
