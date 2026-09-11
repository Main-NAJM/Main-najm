import{d as u,o as b}from"./calc-C9OxMrtm.js";import{w as r,D as $,g as p,o as g,i as x,t as y}from"./index-Bptj_WH0.js";const d=t=>String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),w=`
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
`,v=(t,s)=>`<!doctype html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8"><title>${d(t)}</title><style>${w}</style></head>
<body><div class="doc">${s}</div></body>
</html>`,f=(t,s)=>{const i=v(t,s),a=document.createElement("iframe");a.setAttribute("aria-hidden","true"),a.style.position="fixed",a.style.inset="0",a.style.width="0",a.style.height="0",a.style.border="0",a.style.opacity="0",document.body.appendChild(a);const o=()=>{window.setTimeout(()=>{a.remove()},1e3)};a.onload=()=>{const c=a.contentWindow;if(!c){o();return}c.focus(),c.onafterprint=o,window.setTimeout(()=>{try{c.print()}catch{o()}},120)};const n=a.contentDocument;if(!n){o();return}n.open(),n.write(i),n.close()},D=(t,s,i)=>{const a=new Blob([v(t,s)],{type:"text/html;charset=utf-8"}),o=URL.createObjectURL(a),n=document.createElement("a");n.href=o,n.download=i.endsWith(".html")?i:`${i}.html`,document.body.appendChild(n),n.click(),n.remove(),window.setTimeout(()=>{URL.revokeObjectURL(o)},2e3)},m=(t,s,i)=>`
  <div class="doc__head">
    <div>
      <p class="doc__brand">${d(t.businessName||"ورشتي")}</p>
      <div class="doc__meta">
        ${t.ownerName?`<div>${d(t.ownerName)}</div>`:""}
        ${t.phone?`<div>هاتف: ${d(t.phone)}</div>`:""}
        ${t.address?`<div>${d(t.address)}</div>`:""}
      </div>
    </div>
    <div style="text-align:left">
      <p class="doc__title">${d(s)}</p>
      <div class="doc__ref">
        ${i?`<div>رقم: ${d(i)}</div>`:""}
        <div>التاريخ: ${d(p(y()))}</div>
      </div>
    </div>
  </div>`,h=(t,s)=>`
  <div class="doc__foot">
    <span>${d(s??"شكراً لتعاملكم معنا")}</span>
    <span>${d(t.businessName||"ورشتي")}</span>
  </div>`,e=(t,s)=>d(x(t,s.currency)),z=(t,s)=>{const i=b(t),a=(t.items??[]).length?t.items.map((o,n)=>`
        <tr>
          <td class="num">${n+1}</td>
          <td>${d(o.name)}</td>
          <td class="num">${d(r(o.qty))}</td>
          <td class="num">${e(o.unitPrice,s)}</td>
          <td class="num">${e(o.qty*o.unitPrice,s)}</td>
        </tr>`).join(""):'<tr><td colspan="5" style="text-align:center;color:#6b7280">لا توجد بنود مفصّلة</td></tr>';return`
    ${m(s,"فاتورة",$(t.id))}
    <div class="block">
      <p class="block__title">بيانات الزبون</p>
      <div class="kv">
        <div><span>الاسم:</span><span>${d(t.customerName||"—")}</span></div>
        <div><span>الهاتف:</span><span>${d(t.phone||"—")}</span></div>
        <div><span>العنوان:</span><span>${d(t.address||"—")}</span></div>
        <div><span>التسليم:</span><span>${d(t.dueDate?p(t.dueDate):"—")}</span></div>
        <div><span>الطلبية:</span><span>${d(t.title||"—")}</span></div>
        <div><span>الحالة:</span><span class="pill">${d(g(t.status))}</span></div>
      </div>
    </div>
    <div class="block">
      <p class="block__title">البنود</p>
      <table>
        <thead>
          <tr>
            <th class="num" style="width:34px">#</th>
            <th>الوصف</th>
            <th class="num" style="width:70px">الكمية</th>
            <th class="num" style="width:110px">سعر الوحدة</th>
            <th class="num" style="width:120px">الإجمالي</th>
          </tr>
        </thead>
        <tbody>${a}</tbody>
      </table>
      <table class="totals">
        <tbody>
          <tr><td>مجموع البنود</td><td>${e(i.itemsTotal,s)}</td></tr>
          <tr><td>أجور ومصاريف إضافية</td><td>${e(i.extraCharges,s)}</td></tr>
          <tr><td>الخصم</td><td>${e(i.discount,s)}</td></tr>
          <tr class="grand"><td>الإجمالي المستحق</td><td>${e(i.total,s)}</td></tr>
          <tr><td>المدفوع</td><td>${e(i.paid,s)}</td></tr>
          <tr><td>المتبقّي</td><td>${e(i.remaining,s)}</td></tr>
        </tbody>
      </table>
    </div>
    ${t.notes?`<div class="block"><p class="block__title">ملاحظات</p><div class="note">${d(t.notes)}</div></div>`:""}
    <div class="sign"><div>توقيع الزبون</div><div>توقيع صاحب العمل</div></div>
    ${h(s)}`},j=(t,s,i)=>{const a=t.reduce((n,c)=>{const l=b(c);return{total:n.total+l.total,paid:n.paid+l.paid,remaining:n.remaining+l.remaining}},{total:0,paid:0,remaining:0}),o=t.length?t.map((n,c)=>{const l=b(n);return`
          <tr>
            <td class="num">${c+1}</td>
            <td>${d(n.title||"—")}</td>
            <td>${d(n.customerName||"—")}</td>
            <td><span class="pill">${d(g(n.status))}</span></td>
            <td class="num">${d(n.dueDate?p(n.dueDate):"—")}</td>
            <td class="num">${e(l.total,s)}</td>
            <td class="num">${e(l.paid,s)}</td>
            <td class="num">${e(l.remaining,s)}</td>
          </tr>`}).join(""):'<tr><td colspan="8" style="text-align:center;color:#6b7280">لا توجد طلبيات</td></tr>';return`
    ${m(s,"كشف الطلبيات","")}
    <div class="block">
      <p class="block__title">${d(i)}</p>
      <table>
        <thead>
          <tr>
            <th class="num" style="width:34px">#</th>
            <th>الطلبية</th>
            <th>الزبون</th>
            <th style="width:64px">الحالة</th>
            <th class="num" style="width:104px">التسليم</th>
            <th class="num">الإجمالي</th>
            <th class="num">المدفوع</th>
            <th class="num">المتبقّي</th>
          </tr>
        </thead>
        <tbody>${o}</tbody>
        <tfoot>
          <tr>
            <td colspan="5">المجموع</td>
            <td class="num">${e(a.total,s)}</td>
            <td class="num">${e(a.paid,s)}</td>
            <td class="num">${e(a.remaining,s)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    ${h(s,"كشف حساب داخلي")}`},C=(t,s,i)=>{const a=t.reduce((n,c)=>{const l=u(c);return{amount:n.amount+l.amount,paid:n.paid+l.paid,remaining:n.remaining+l.remaining}},{amount:0,paid:0,remaining:0}),o=t.length?t.map((n,c)=>{const l=u(n);return`
          <tr>
            <td class="num">${c+1}</td>
            <td>${d(n.customerName||"—")}</td>
            <td class="num">${d(n.phone||"—")}</td>
            <td>${d(n.address||"—")}</td>
            <td>${d(n.goods||"—")}</td>
            <td class="num">${e(l.amount,s)}</td>
            <td class="num">${e(l.paid,s)}</td>
            <td class="num">${e(l.remaining,s)}</td>
            <td class="num">${d(n.dueDate?p(n.dueDate):"—")}</td>
          </tr>`}).join(""):'<tr><td colspan="9" style="text-align:center;color:#6b7280">لا توجد ديون مسجّلة</td></tr>';return`
    ${m(s,"سجل الديون","")}
    <div class="block">
      <p class="block__title">${d(i)}</p>
      <table>
        <thead>
          <tr>
            <th class="num" style="width:32px">#</th>
            <th>اسم الزبون</th>
            <th class="num" style="width:96px">الهاتف</th>
            <th>العنوان</th>
            <th>البضاعة</th>
            <th class="num">المبلغ</th>
            <th class="num">المسدّد</th>
            <th class="num">المتبقّي</th>
            <th class="num" style="width:96px">الاستحقاق</th>
          </tr>
        </thead>
        <tbody>${o}</tbody>
        <tfoot>
          <tr>
            <td colspan="5">المجموع</td>
            <td class="num">${e(a.amount,s)}</td>
            <td class="num">${e(a.paid,s)}</td>
            <td class="num">${e(a.remaining,s)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
    ${h(s,"سجل ديون داخلي")}`},N=(t,s)=>{const i=u(t),a=(t.payments??[]).length?t.payments.map((o,n)=>`
        <tr>
          <td class="num">${n+1}</td>
          <td class="num">${d(p(o.date))}</td>
          <td class="num">${e(o.amount,s)}</td>
          <td>${d(o.note||"—")}</td>
        </tr>`).join(""):'<tr><td colspan="4" style="text-align:center;color:#6b7280">لا توجد دفعات</td></tr>';return`
    ${m(s,"كشف دين",$(t.id))}
    <div class="block">
      <p class="block__title">بيانات الزبون</p>
      <div class="kv">
        <div><span>الاسم:</span><span>${d(t.customerName||"—")}</span></div>
        <div><span>الهاتف:</span><span>${d(t.phone||"—")}</span></div>
        <div><span>العنوان:</span><span>${d(t.address||"—")}</span></div>
        <div><span>الاستحقاق:</span><span>${d(t.dueDate?p(t.dueDate):"—")}</span></div>
        <div><span>البضاعة:</span><span>${d(t.goods||"—")}</span></div>
      </div>
    </div>
    <div class="block">
      <p class="block__title">الدفعات</p>
      <table>
        <thead>
          <tr>
            <th class="num" style="width:34px">#</th>
            <th class="num" style="width:120px">التاريخ</th>
            <th class="num" style="width:130px">المبلغ</th>
            <th>ملاحظة</th>
          </tr>
        </thead>
        <tbody>${a}</tbody>
      </table>
      <table class="totals">
        <tbody>
          <tr><td>أصل الدين</td><td>${e(i.amount,s)}</td></tr>
          <tr><td>المسدّد</td><td>${e(i.paid,s)}</td></tr>
          <tr class="grand"><td>المتبقّي</td><td>${e(i.remaining,s)}</td></tr>
        </tbody>
      </table>
    </div>
    ${t.notes?`<div class="block"><div class="note">${d(t.notes)}</div></div>`:""}
    <div class="sign"><div>توقيع الزبون</div><div>توقيع صاحب العمل</div></div>
    ${h(s,"كشف دين")}`},P=(t,s)=>{const i=(t.materials??[]).length?t.materials.map((a,o)=>`
        <tr>
          <td class="num">${o+1}</td>
          <td>${d(a.name)}</td>
          <td class="num">${d(r(a.qty))}</td>
          <td class="num">${e(a.unitPrice,s)}</td>
          <td class="num">${e(a.qty*a.unitPrice,s)}</td>
        </tr>`).join(""):'<tr><td colspan="5" style="text-align:center;color:#6b7280">لا توجد مواد</td></tr>';return`
    ${m(s,"ورقة تسعير",$(t.id))}
    <div class="block">
      <p class="block__title">${d(t.title||"حساب تكلفة")}</p>
      <table>
        <thead>
          <tr>
            <th class="num" style="width:34px">#</th>
            <th>المادة</th>
            <th class="num" style="width:70px">الكمية</th>
            <th class="num" style="width:110px">سعر الوحدة</th>
            <th class="num" style="width:120px">الإجمالي</th>
          </tr>
        </thead>
        <tbody>${i}</tbody>
      </table>
      <table class="totals">
        <tbody>
          <tr><td>تكلفة المواد (مع الهالك ${d(r(t.wastePct))}٪)</td><td>${e(t.materialsCost,s)}</td></tr>
          <tr><td>أجور العمل (${d(r(t.laborHours))} ساعة)</td><td>${e(t.laborCost,s)}</td></tr>
          <tr><td>مصاريف عامة</td><td>${e(t.overhead,s)}</td></tr>
          <tr><td>إجمالي التكلفة</td><td>${e(t.totalCost,s)}</td></tr>
          <tr><td>الربح (${d(r(t.marginPct))}٪)</td><td>${e(t.profit,s)}</td></tr>
          <tr class="grand"><td>السعر المقترح</td><td>${e(t.suggestedPrice,s)}</td></tr>
        </tbody>
      </table>
    </div>
    ${t.notes?`<div class="block"><div class="note">${d(t.notes)}</div></div>`:""}
    ${h(s,"ورقة تسعير داخلية")}`},R=(t,s)=>{const i=t.length?t.map((a,o)=>`
        <tr>
          <td class="num">${o+1}</td>
          <td>${d(a.title||"—")}</td>
          <td class="num">${e(a.totalCost,s)}</td>
          <td class="num">${d(r(a.marginPct))}٪</td>
          <td class="num">${e(a.profit,s)}</td>
          <td class="num">${e(a.suggestedPrice,s)}</td>
        </tr>`).join(""):'<tr><td colspan="6" style="text-align:center;color:#6b7280">لا توجد حسابات محفوظة</td></tr>';return`
    ${m(s,"سجل التسعير","")}
    <div class="block">
      <p class="block__title">كل عمليات حساب التكلفة والربح</p>
      <table>
        <thead>
          <tr>
            <th class="num" style="width:34px">#</th>
            <th>العنوان</th>
            <th class="num">التكلفة</th>
            <th class="num" style="width:70px">الربح ٪</th>
            <th class="num">الربح</th>
            <th class="num">السعر المقترح</th>
          </tr>
        </thead>
        <tbody>${i}</tbody>
      </table>
    </div>
    ${h(s,"سجل تسعير داخلي")}`};export{P as a,z as b,C as c,N as d,D as e,R as f,j as g,f as p};
