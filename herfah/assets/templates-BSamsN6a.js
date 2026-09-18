import{d as u,o as b}from"./calc-BbD_RZj7.js";import{x as c,Q as $,A as x,z as y,g as h,o as v,i as w,t as _}from"./index-Cre_wE0J.js";const d=t=>String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),k=`
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
`,g=(t,s)=>`<!doctype html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8"><title>${d(t)}</title><style>${k}</style></head>
<body><div class="doc">${s}</div></body>
</html>`,P=(t,s)=>{const n=g(t,s),a=document.createElement("iframe");a.setAttribute("aria-hidden","true"),a.style.position="fixed",a.style.inset="0",a.style.width="0",a.style.height="0",a.style.border="0",a.style.opacity="0",document.body.appendChild(a);const o=()=>{window.setTimeout(()=>{a.remove()},1e3)};a.onload=()=>{const p=a.contentWindow;if(!p){o();return}p.focus(),p.onafterprint=o,window.setTimeout(()=>{try{p.print()}catch{o()}},120)};const e=a.contentDocument;if(!e){o();return}e.open(),e.write(n),e.close()},z=(t,s,n)=>{const a=new Blob([g(t,s)],{type:"text/html;charset=utf-8"}),o=URL.createObjectURL(a),e=document.createElement("a");e.href=o,e.download=n.endsWith(".html")?n:`${n}.html`,document.body.appendChild(e),e.click(),e.remove(),window.setTimeout(()=>{URL.revokeObjectURL(o)},2e3)},r=(t,s,n)=>`
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
        ${n?`<div>رقم: ${d(n)}</div>`:""}
        <div>التاريخ: ${d(h(_()))}</div>
      </div>
    </div>
  </div>`,m=(t,s)=>`
  <div class="doc__foot">
    <span>${d(s??"شكراً لتعاملكم معنا")}</span>
    <span>${d(t.businessName||"ورشتي")}</span>
  </div>`,i=(t,s)=>d(w(t,s.currency)),D=(t,s)=>{const n=b(t),a=(t.items??[]).length?t.items.map((o,e)=>`
        <tr>
          <td class="num">${e+1}</td>
          <td>${d(o.name)}</td>
          <td class="num">${d(c(o.qty))}</td>
          <td class="num">${i(o.unitPrice,s)}</td>
          <td class="num">${i(o.qty*o.unitPrice,s)}</td>
        </tr>`).join(""):'<tr><td colspan="5" style="text-align:center;color:#6b7280">لا توجد بنود مفصّلة</td></tr>';return`
    ${r(s,"فاتورة",$(t.id))}
    <div class="block">
      <p class="block__title">بيانات الزبون</p>
      <div class="kv">
        <div><span>الاسم:</span><span>${d(t.customerName||"—")}</span></div>
        <div><span>الهاتف:</span><span>${d(t.phone||"—")}</span></div>
        <div><span>العنوان:</span><span>${d(t.address||"—")}</span></div>
        <div><span>التسليم:</span><span>${d(t.dueDate?h(t.dueDate):"—")}</span></div>
        <div><span>الطلبية:</span><span>${d(t.title||"—")}</span></div>
        <div><span>الحالة:</span><span class="pill">${d(v(t.status))}</span></div>
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
          <tr><td>مجموع البنود</td><td>${i(n.itemsTotal,s)}</td></tr>
          <tr><td>أجور ومصاريف إضافية</td><td>${i(n.extraCharges,s)}</td></tr>
          <tr><td>الخصم</td><td>${i(n.discount,s)}</td></tr>
          <tr class="grand"><td>الإجمالي المستحق</td><td>${i(n.total,s)}</td></tr>
          <tr><td>المدفوع</td><td>${i(n.paid,s)}</td></tr>
          <tr><td>المتبقّي</td><td>${i(n.remaining,s)}</td></tr>
        </tbody>
      </table>
    </div>
    ${t.notes?`<div class="block"><p class="block__title">ملاحظات</p><div class="note">${d(t.notes)}</div></div>`:""}
    <div class="sign"><div>توقيع الزبون</div><div>توقيع صاحب العمل</div></div>
    ${m(s)}`},j=(t,s,n)=>{const a=t.reduce((e,p)=>{const l=b(p);return{total:e.total+l.total,paid:e.paid+l.paid,remaining:e.remaining+l.remaining}},{total:0,paid:0,remaining:0}),o=t.length?t.map((e,p)=>{const l=b(e);return`
          <tr>
            <td class="num">${p+1}</td>
            <td>${d(e.title||"—")}</td>
            <td>${d(e.customerName||"—")}</td>
            <td><span class="pill">${d(v(e.status))}</span></td>
            <td class="num">${d(e.dueDate?h(e.dueDate):"—")}</td>
            <td class="num">${i(l.total,s)}</td>
            <td class="num">${i(l.paid,s)}</td>
            <td class="num">${i(l.remaining,s)}</td>
          </tr>`}).join(""):'<tr><td colspan="8" style="text-align:center;color:#6b7280">لا توجد طلبيات</td></tr>';return`
    ${r(s,"كشف الطلبيات","")}
    <div class="block">
      <p class="block__title">${d(n)}</p>
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
            <td class="num">${i(a.total,s)}</td>
            <td class="num">${i(a.paid,s)}</td>
            <td class="num">${i(a.remaining,s)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    ${m(s,"كشف حساب داخلي")}`},N=(t,s,n)=>{const a=t.reduce((e,p)=>{const l=u(p);return{amount:e.amount+l.amount,paid:e.paid+l.paid,remaining:e.remaining+l.remaining}},{amount:0,paid:0,remaining:0}),o=t.length?t.map((e,p)=>{const l=u(e);return`
          <tr>
            <td class="num">${p+1}</td>
            <td>${d(e.customerName||"—")}</td>
            <td class="num">${d(e.phone||"—")}</td>
            <td>${d(e.address||"—")}</td>
            <td>${d(e.goods||"—")}</td>
            <td class="num">${i(l.amount,s)}</td>
            <td class="num">${i(l.paid,s)}</td>
            <td class="num">${i(l.remaining,s)}</td>
            <td class="num">${d(e.dueDate?h(e.dueDate):"—")}</td>
          </tr>`}).join(""):'<tr><td colspan="9" style="text-align:center;color:#6b7280">لا توجد ديون مسجّلة</td></tr>';return`
    ${r(s,"سجل الديون","")}
    <div class="block">
      <p class="block__title">${d(n)}</p>
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
            <td class="num">${i(a.amount,s)}</td>
            <td class="num">${i(a.paid,s)}</td>
            <td class="num">${i(a.remaining,s)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
    ${m(s,"سجل ديون داخلي")}`},T=(t,s)=>{const n=u(t),a=(t.payments??[]).length?t.payments.map((o,e)=>`
        <tr>
          <td class="num">${e+1}</td>
          <td class="num">${d(h(o.date))}</td>
          <td class="num">${i(o.amount,s)}</td>
          <td>${d(o.note||"—")}</td>
        </tr>`).join(""):'<tr><td colspan="4" style="text-align:center;color:#6b7280">لا توجد دفعات</td></tr>';return`
    ${r(s,"كشف دين",$(t.id))}
    <div class="block">
      <p class="block__title">بيانات الزبون</p>
      <div class="kv">
        <div><span>الاسم:</span><span>${d(t.customerName||"—")}</span></div>
        <div><span>الهاتف:</span><span>${d(t.phone||"—")}</span></div>
        <div><span>العنوان:</span><span>${d(t.address||"—")}</span></div>
        <div><span>الاستحقاق:</span><span>${d(t.dueDate?h(t.dueDate):"—")}</span></div>
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
          <tr><td>أصل الدين</td><td>${i(n.amount,s)}</td></tr>
          <tr><td>المسدّد</td><td>${i(n.paid,s)}</td></tr>
          <tr class="grand"><td>المتبقّي</td><td>${i(n.remaining,s)}</td></tr>
        </tbody>
      </table>
    </div>
    ${t.notes?`<div class="block"><div class="note">${d(t.notes)}</div></div>`:""}
    <div class="sign"><div>توقيع الزبون</div><div>توقيع صاحب العمل</div></div>
    ${m(s,"كشف دين")}`},R=(t,s)=>{const n=(t.materials??[]).length?t.materials.map((a,o)=>`
        <tr>
          <td class="num">${o+1}</td>
          <td>${d(a.name)}</td>
          <td class="num">${d(c(a.qty))}</td>
          <td class="num">${i(a.unitPrice,s)}</td>
          <td class="num">${i(a.qty*a.unitPrice,s)}</td>
        </tr>`).join(""):'<tr><td colspan="5" style="text-align:center;color:#6b7280">لا توجد مواد</td></tr>';return`
    ${r(s,"ورقة تسعير",$(t.id))}
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
        <tbody>${n}</tbody>
      </table>
      <table class="totals">
        <tbody>
          <tr><td>تكلفة المواد (مع الهالك ${d(c(t.wastePct))}٪)</td><td>${i(t.materialsCost,s)}</td></tr>
          <tr><td>أجور العمل (${d(c(t.laborHours))} ساعة)</td><td>${i(t.laborCost,s)}</td></tr>
          <tr><td>مصاريف عامة</td><td>${i(t.overhead,s)}</td></tr>
          <tr><td>إجمالي التكلفة</td><td>${i(t.totalCost,s)}</td></tr>
          <tr><td>الربح (${d(c(t.marginPct))}٪)</td><td>${i(t.profit,s)}</td></tr>
          <tr class="grand"><td>السعر المقترح</td><td>${i(t.suggestedPrice,s)}</td></tr>
        </tbody>
      </table>
    </div>
    ${t.notes?`<div class="block"><div class="note">${d(t.notes)}</div></div>`:""}
    ${m(s,"ورقة تسعير داخلية")}`},q=(t,s)=>{const n=t.length?t.map((a,o)=>`
        <tr>
          <td class="num">${o+1}</td>
          <td>${d(a.title||"—")}</td>
          <td class="num">${i(a.totalCost,s)}</td>
          <td class="num">${d(c(a.marginPct))}٪</td>
          <td class="num">${i(a.profit,s)}</td>
          <td class="num">${i(a.suggestedPrice,s)}</td>
        </tr>`).join(""):'<tr><td colspan="6" style="text-align:center;color:#6b7280">لا توجد حسابات محفوظة</td></tr>';return`
    ${r(s,"سجل التسعير","")}
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
        <tbody>${n}</tbody>
      </table>
    </div>
    ${m(s,"سجل تسعير داخلي")}`},S=(t,s,n,a)=>{const o=[s.widthCm?`العرض ${c(s.widthCm)} سم`:"",s.heightCm?`الارتفاع ${c(s.heightCm)} سم`:"",s.depthCm?`العمق ${c(s.depthCm)} سم`:""].filter(Boolean).join(" × ");return`
    ${r(a,"عرض سعر",$(t.id))}
    <div class="block">
      <p class="block__title">${d(t.name)}</p>
      <div class="kv">
        <div><span>الحرفة:</span><span>${d(x(t.craft,a.customCraft))}</span></div>
        <div><span>التسعير:</span><span>${d(y(t.basis))}</span></div>
        ${o?`<div><span>المقاس:</span><span>${d(o)}</span></div>`:""}
        ${t.basis==="unit"?"":`<div><span>المقدار:</span><span>${d(c(n.measure))} ${d(n.measureUnit)} للقطعة</span></div>`}
        <div><span>الكمية:</span><span>${d(c(n.quantity))} قطعة</span></div>
      </div>
    </div>
    <div class="block">
      <p class="block__title">تفصيل السعر</p>
      <table>
        <thead>
          <tr>
            <th>البند</th>
            <th class="num" style="width:140px">للقطعة الواحدة</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${t.basis==="unit"?"قيمة المادة":`قيمة المادة (${d(c(n.measure))} ${d(n.measureUnit)} × ${i(t.unitPrice,a)})`}</td>
            <td class="num">${i(n.materialCost,a)}</td>
          </tr>
          ${n.wasteCost>0?`<tr><td>الهالك (${d(c(t.wastePct))}٪)</td><td class="num">${i(n.wasteCost,a)}</td></tr>`:""}
          ${n.fittings>0?`<tr><td>إكسسوارات</td><td class="num">${i(n.fittings,a)}</td></tr>`:""}
          ${n.labor>0?`<tr><td>أجرة العمل</td><td class="num">${i(n.labor,a)}</td></tr>`:""}
        </tbody>
      </table>
      <table class="totals">
        <tbody>
          <tr><td>تكلفة القطعة</td><td>${i(n.unitCost,a)}</td></tr>
          <tr><td>الربح (${d(c(t.marginPct))}٪)</td><td>${i(n.unitProfit,a)}</td></tr>
          <tr><td>سعر القطعة</td><td>${i(n.unitTotal,a)}</td></tr>
          <tr class="grand"><td>الإجمالي (${d(c(n.quantity))} قطعة)</td><td>${i(n.total,a)}</td></tr>
        </tbody>
      </table>
    </div>
    ${t.notes?`<div class="block"><p class="block__title">ملاحظات</p><div class="note">${d(t.notes)}</div></div>`:""}
    <div class="sign"><div>توقيع الزبون</div><div>توقيع صاحب العمل</div></div>
    ${m(a,"عرض سعر — صالح حسب أسعار المواد وقت إصداره")}`};export{R as a,D as b,S as c,N as d,T as e,z as f,q as g,j as h,P as p};
