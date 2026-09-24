/** طباعة المستندات عبر إطار مخفي، يعمل على الموبايل والويب. */
export const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
const PRINT_CSS = `
  @page { size: A4; margin: 14mm 12mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Segoe UI", Tahoma, "Noto Naskh Arabic", "Amiri", sans-serif;
    direction: rtl;
    color: #111827;
    margin: 0;
    font-size: 12.5px;
    line-height: 1.6;
  }
  .doc { padding: 4px; }
  .doc__head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    border-bottom: 2px solid #0f766e;
    padding-bottom: 10px;
    margin-bottom: 14px;
  }
  .doc__brand { font-size: 19px; font-weight: 700; color: #0f766e; margin: 0 0 2px; }
  .doc__meta { font-size: 11.5px; color: #4b5563; }
  .doc__meta div { margin-top: 2px; }
  .doc__title { font-size: 15px; font-weight: 700; margin: 0 0 2px; }
  .doc__ref { font-size: 11.5px; color: #4b5563; }
  .block { margin-bottom: 14px; }
  .block__title {
    font-size: 12.5px;
    font-weight: 700;
    color: #0f766e;
    margin: 0 0 6px;
    border-right: 3px solid #0f766e;
    padding-right: 7px;
  }
  .kv { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px 18px; }
  .kv div { display: flex; gap: 6px; }
  .kv span:first-child { color: #6b7280; min-width: 74px; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: right; }
  th { background: #f0fdfa; font-weight: 700; color: #115e59; font-size: 12px; }
  td.num, th.num { text-align: left; font-variant-numeric: tabular-nums; white-space: nowrap; }
  tfoot td { font-weight: 700; background: #f9fafb; }
  .totals { margin-top: 10px; margin-right: auto; width: 58%; }
  .totals td { border: none; padding: 3px 8px; }
  .totals tr.grand td { border-top: 2px solid #0f766e; font-size: 14px; font-weight: 700; padding-top: 6px; }
  .totals td:last-child { text-align: left; font-variant-numeric: tabular-nums; }
  .note { background: #f9fafb; border: 1px solid #e5e7eb; padding: 8px 10px; border-radius: 6px; }
  .doc__foot {
    margin-top: 20px;
    padding-top: 8px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #6b7280;
  }
  .sign { margin-top: 26px; display: flex; justify-content: space-between; gap: 30px; }
  .sign div { flex: 1; border-top: 1px dashed #9ca3af; padding-top: 5px; text-align: center; font-size: 11.5px; color: #4b5563; }
  .pill { display: inline-block; border: 1px solid #d1d5db; border-radius: 999px; padding: 1px 9px; font-size: 11px; }
  tr { break-inside: avoid; }
`;
const buildDocument = (title, body) => `<!doctype html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${PRINT_CSS}</style></head>
<body><div class="doc">${body}</div></body>
</html>`;
/** يفتح حوار الطباعة لمستند HTML. */
export const printHtml = (title, body) => {
    const html = buildDocument(title, body);
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.inset = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    document.body.appendChild(iframe);
    const cleanup = () => {
        window.setTimeout(() => {
            iframe.remove();
        }, 1000);
    };
    iframe.onload = () => {
        const frameWindow = iframe.contentWindow;
        if (!frameWindow) {
            cleanup();
            return;
        }
        frameWindow.focus();
        frameWindow.onafterprint = cleanup;
        // مهلة قصيرة حتى يكتمل تخطيط الصفحة قبل الطباعة.
        window.setTimeout(() => {
            try {
                frameWindow.print();
            }
            catch {
                cleanup();
            }
        }, 120);
    };
    const doc = iframe.contentDocument;
    if (!doc) {
        cleanup();
        return;
    }
    doc.open();
    doc.write(html);
    doc.close();
};
/** يحفظ المستند كملف HTML قابل للفتح والطباعة لاحقاً. */
export const downloadHtml = (title, body, fileName) => {
    const blob = new Blob([buildDocument(title, body)], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.endsWith('.html') ? fileName : `${fileName}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 2000);
};
