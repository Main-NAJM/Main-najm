import{g as w,d as b,o as u}from"./calc-DvXZLJ-a.js";import{y as p,Z as v,F as _,A as k,h,o as y,k as C,t as P,U as g,R as j}from"./index-CcLWXhWN.js";const d=t=>String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),z=`
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
`,x=(t,s)=>`<!doctype html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8"><title>${d(t)}</title><style>${z}</style></head>
<body><div class="doc">${s}</div></body>
</html>`,N=(t,s)=>{const a=x(t,s),i=document.createElement("iframe");i.setAttribute("aria-hidden","true"),i.style.position="fixed",i.style.inset="0",i.style.width="0",i.style.height="0",i.style.border="0",i.style.opacity="0",document.body.appendChild(i);const l=()=>{window.setTimeout(()=>{i.remove()},1e3)};i.onload=()=>{const c=i.contentWindow;if(!c){l();return}c.focus(),c.onafterprint=l,window.setTimeout(()=>{try{c.print()}catch{l()}},120)};const e=i.contentDocument;if(!e){l();return}e.open(),e.write(a),e.close()},T=(t,s,a)=>{const i=new Blob([x(t,s)],{type:"text/html;charset=utf-8"}),l=URL.createObjectURL(i),e=document.createElement("a");e.href=l,e.download=a.endsWith(".html")?a:`${a}.html`,document.body.appendChild(e),e.click(),e.remove(),window.setTimeout(()=>{URL.revokeObjectURL(l)},2e3)},m=(t,s,a)=>`
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
        ${a?`<div>رقم: ${d(a)}</div>`:""}
        <div>التاريخ: ${d(h(P()))}</div>
      </div>
    </div>
  </div>`,r=(t,s)=>`
  <div class="doc__foot">
    <span>${d(s??"شكراً لتعاملكم معنا")}</span>
    <span>${d(t.businessName||"ورشتي")}</span>
  </div>`,n=(t,s)=>d(C(t,s.currency)),f=(t,s)=>{const a=u(t),i=(t.items??[]).length?t.items.map((l,e)=>`
        <tr>
          <td class="num">${e+1}</td>
          <td>${d(l.name)}</td>
          <td class="num">${d(p(l.qty))}</td>
          <td class="num">${n(l.unitPrice,s)}</td>
          <td class="num">${n(l.qty*l.unitPrice,s)}</td>
        </tr>`).join(""):'<tr><td colspan="5" style="text-align:center;color:#6b7280">لا توجد بنود مفصّلة</td></tr>';return`
    ${m(s,"فاتورة",v(t.id))}
    <div class="block">
      <p class="block__title">بيانات الزبون</p>
      <div class="kv">
        <div><span>الاسم:</span><span>${d(t.customerName||"—")}</span></div>
        <div><span>الهاتف:</span><span>${d(t.phone||"—")}</span></div>
        <div><span>العنوان:</span><span>${d(t.address||"—")}</span></div>
        <div><span>التسليم:</span><span>${d(t.dueDate?h(t.dueDate):"—")}</span></div>
        <div><span>الطلبية:</span><span>${d(t.title||"—")}</span></div>
        <div><span>الحالة:</span><span class="pill">${d(y(t.status))}</span></div>
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
        <tbody>${i}</tbody>
      </table>
      <table class="totals">
        <tbody>
          <tr><td>مجموع البنود</td><td>${n(a.itemsTotal,s)}</td></tr>
          <tr><td>أجور ومصاريف إضافية</td><td>${n(a.extraCharges,s)}</td></tr>
          <tr><td>الخصم</td><td>${n(a.discount,s)}</td></tr>
          <tr class="grand"><td>الإجمالي المستحق</td><td>${n(a.total,s)}</td></tr>
          <tr><td>المدفوع</td><td>${n(a.paid,s)}</td></tr>
          <tr><td>المتبقّي</td><td>${n(a.remaining,s)}</td></tr>
        </tbody>
      </table>
    </div>
    ${t.notes?`<div class="block"><p class="block__title">ملاحظات</p><div class="note">${d(t.notes)}</div></div>`:""}
    <div class="sign"><div>توقيع الزبون</div><div>توقيع صاحب العمل</div></div>
    ${r(s)}`},L=(t,s,a)=>{const i=t.reduce((e,c)=>{const o=u(c);return{total:e.total+o.total,paid:e.paid+o.paid,remaining:e.remaining+o.remaining}},{total:0,paid:0,remaining:0}),l=t.length?t.map((e,c)=>{const o=u(e);return`
          <tr>
            <td class="num">${c+1}</td>
            <td>${d(e.title||"—")}</td>
            <td>${d(e.customerName||"—")}</td>
            <td><span class="pill">${d(y(e.status))}</span></td>
            <td class="num">${d(e.dueDate?h(e.dueDate):"—")}</td>
            <td class="num">${n(o.total,s)}</td>
            <td class="num">${n(o.paid,s)}</td>
            <td class="num">${n(o.remaining,s)}</td>
          </tr>`}).join(""):'<tr><td colspan="8" style="text-align:center;color:#6b7280">لا توجد طلبيات</td></tr>';return`
    ${m(s,"كشف الطلبيات","")}
    <div class="block">
      <p class="block__title">${d(a)}</p>
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
        <tbody>${l}</tbody>
        <tfoot>
          <tr>
            <td colspan="5">المجموع</td>
            <td class="num">${n(i.total,s)}</td>
            <td class="num">${n(i.paid,s)}</td>
            <td class="num">${n(i.remaining,s)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    ${r(s,"كشف حساب داخلي")}`},S=(t,s,a)=>{const i=t.reduce((e,c)=>{const o=b(c);return{amount:e.amount+o.amount,paid:e.paid+o.paid,remaining:e.remaining+o.remaining}},{amount:0,paid:0,remaining:0}),l=t.length?t.map((e,c)=>{const o=b(e);return`
          <tr>
            <td class="num">${c+1}</td>
            <td>${d(e.customerName||"—")}</td>
            <td class="num">${d(e.phone||"—")}</td>
            <td>${d(e.address||"—")}</td>
            <td>${d(e.goods||"—")}</td>
            <td class="num">${n(o.amount,s)}</td>
            <td class="num">${n(o.paid,s)}</td>
            <td class="num">${n(o.remaining,s)}</td>
            <td class="num">${d(e.dueDate?h(e.dueDate):"—")}</td>
          </tr>`}).join(""):'<tr><td colspan="9" style="text-align:center;color:#6b7280">لا توجد ديون مسجّلة</td></tr>';return`
    ${m(s,"سجل الديون","")}
    <div class="block">
      <p class="block__title">${d(a)}</p>
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
        <tbody>${l}</tbody>
        <tfoot>
          <tr>
            <td colspan="5">المجموع</td>
            <td class="num">${n(i.amount,s)}</td>
            <td class="num">${n(i.paid,s)}</td>
            <td class="num">${n(i.remaining,s)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
    ${r(s,"سجل ديون داخلي")}`},U=(t,s)=>{const a=b(t),i=(t.payments??[]).length?t.payments.map((l,e)=>`
        <tr>
          <td class="num">${e+1}</td>
          <td class="num">${d(h(l.date))}</td>
          <td class="num">${n(l.amount,s)}</td>
          <td>${d(l.note||"—")}</td>
        </tr>`).join(""):'<tr><td colspan="4" style="text-align:center;color:#6b7280">لا توجد دفعات</td></tr>';return`
    ${m(s,"كشف دين",v(t.id))}
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
        <tbody>${i}</tbody>
      </table>
      <table class="totals">
        <tbody>
          <tr><td>أصل الدين</td><td>${n(a.amount,s)}</td></tr>
          <tr><td>المسدّد</td><td>${n(a.paid,s)}</td></tr>
          <tr class="grand"><td>المتبقّي</td><td>${n(a.remaining,s)}</td></tr>
        </tbody>
      </table>
    </div>
    ${t.notes?`<div class="block"><div class="note">${d(t.notes)}</div></div>`:""}
    <div class="sign"><div>توقيع الزبون</div><div>توقيع صاحب العمل</div></div>
    ${r(s,"كشف دين")}`},q=(t,s)=>{const a=(t.materials??[]).length?t.materials.map((i,l)=>`
        <tr>
          <td class="num">${l+1}</td>
          <td>${d(i.name)}</td>
          <td class="num">${d(p(i.qty))}</td>
          <td class="num">${n(i.unitPrice,s)}</td>
          <td class="num">${n(i.qty*i.unitPrice,s)}</td>
        </tr>`).join(""):'<tr><td colspan="5" style="text-align:center;color:#6b7280">لا توجد مواد</td></tr>';return`
    ${m(s,"ورقة تسعير",v(t.id))}
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
        <tbody>${a}</tbody>
      </table>
      <table class="totals">
        <tbody>
          <tr><td>تكلفة المواد (مع الهالك ${d(p(t.wastePct))}٪)</td><td>${n(t.materialsCost,s)}</td></tr>
          <tr><td>أجور العمل (${d(p(t.laborHours))} ساعة)</td><td>${n(t.laborCost,s)}</td></tr>
          <tr><td>مصاريف عامة</td><td>${n(t.overhead,s)}</td></tr>
          <tr><td>إجمالي التكلفة</td><td>${n(t.totalCost,s)}</td></tr>
          <tr><td>الربح (${d(p(t.marginPct))}٪)</td><td>${n(t.profit,s)}</td></tr>
          <tr class="grand"><td>السعر المقترح</td><td>${n(t.suggestedPrice,s)}</td></tr>
        </tbody>
      </table>
    </div>
    ${t.notes?`<div class="block"><div class="note">${d(t.notes)}</div></div>`:""}
    ${r(s,"ورقة تسعير داخلية")}`},A=(t,s)=>{const a=t.length?t.map((i,l)=>`
        <tr>
          <td class="num">${l+1}</td>
          <td>${d(i.title||"—")}</td>
          <td class="num">${n(i.totalCost,s)}</td>
          <td class="num">${d(p(i.marginPct))}٪</td>
          <td class="num">${n(i.profit,s)}</td>
          <td class="num">${n(i.suggestedPrice,s)}</td>
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
        <tbody>${a}</tbody>
      </table>
    </div>
    ${r(s,"سجل تسعير داخلي")}`},H=(t,s,a,i)=>{const l=[s.widthCm?`العرض ${p(s.widthCm)} سم`:"",s.heightCm?`الارتفاع ${p(s.heightCm)} سم`:"",s.depthCm?`العمق ${p(s.depthCm)} سم`:""].filter(Boolean).join(" × ");return`
    ${m(i,"عرض سعر",v(t.id))}
    <div class="block">
      <p class="block__title">${d(t.name)}</p>
      <div class="kv">
        <div><span>الحرفة:</span><span>${d(_(t.craft,i.customCraft))}</span></div>
        <div><span>التسعير:</span><span>${d(k(t.basis))}</span></div>
        ${l?`<div><span>المقاس:</span><span>${d(l)}</span></div>`:""}
        ${t.basis==="unit"?"":`<div><span>المقدار:</span><span>${d(p(a.measure))} ${d(a.measureUnit)} للقطعة</span></div>`}
        <div><span>الكمية:</span><span>${d(p(a.quantity))} قطعة</span></div>
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
            <td>${t.basis==="unit"?"قيمة المادة":t.basis==="frame"?`البروفيل — المحيط (${d(p(a.measure))} م.ط × ${n(t.unitPrice,i)})`:`قيمة المادة (${d(p(a.measure))} ${d(a.measureUnit)} × ${n(t.unitPrice,i)})`}</td>
            <td class="num">${n(a.materialCost,i)}</td>
          </tr>
          ${a.sheetCost>0?`<tr><td>${d(t.sheetName||"الصفيحة")} (${d(p(a.sheetArea))} م² × ${n(t.sheetPrice,i)})</td><td class="num">${n(a.sheetCost,i)}</td></tr>`:""}
          ${a.wasteCost>0?`<tr><td>الهالك (${d(p(t.wastePct))}٪)</td><td class="num">${n(a.wasteCost,i)}</td></tr>`:""}
          ${a.fittings>0?`<tr><td>إكسسوارات</td><td class="num">${n(a.fittings,i)}</td></tr>`:""}
          ${a.labor>0?`<tr><td>أجرة العمل</td><td class="num">${n(a.labor,i)}</td></tr>`:""}
        </tbody>
      </table>
      <table class="totals">
        <tbody>
          <tr><td>تكلفة القطعة</td><td>${n(a.unitCost,i)}</td></tr>
          <tr><td>الربح (${d(p(t.marginPct))}٪)</td><td>${n(a.unitProfit,i)}</td></tr>
          <tr><td>سعر القطعة</td><td>${n(a.unitTotal,i)}</td></tr>
          <tr class="grand"><td>الإجمالي (${d(p(a.quantity))} قطعة)</td><td>${n(a.total,i)}</td></tr>
        </tbody>
      </table>
    </div>
    ${t.notes?`<div class="block"><p class="block__title">ملاحظات</p><div class="note">${d(t.notes)}</div></div>`:""}
    <div class="sign"><div>توقيع الزبون</div><div>توقيع صاحب العمل</div></div>
    ${r(i,"عرض سعر — صالح حسب أسعار المواد وقت إصداره")}`},I=(t,s,a)=>{const i=s.length?[...s].sort((e,c)=>e.date.localeCompare(c.date)).map((e,c)=>`
          <tr>
            <td class="num">${c+1}</td>
            <td class="num">${d(h(e.date))}</td>
            <td>${d(e.title||"—")}</td>
            <td>${d(g(e.category))}</td>
            <td class="num">${n(e.amount,a)}</td>
          </tr>`).join(""):'<tr><td colspan="5" style="text-align:center;color:#6b7280">لا مصاريف في هذا الشهر</td></tr>',l=t.byCategory.map(e=>`
      <div><span>${d(g(e.category))}:</span>
      <span>${n(e.amount,a)}</span></div>`).join("");return`
    ${m(a,`كشف ${j(t.month)}`,"")}

    <div class="block">
      <h2 class="block__title">الخلاصة</h2>
      <div class="kv">
        <div><span>المقبوض من طلبيات الشهر:</span><span>${n(t.fromOrders,a)}</span></div>
        <div><span>دفعات الديون في الشهر:</span><span>${n(t.fromDebts,a)}</span></div>
        <div><span>جملة الدخل:</span><span>${n(t.income,a)}</span></div>
        <div><span>جملة المصاريف:</span><span>${n(t.expenses,a)}</span></div>
        ${t.wagesPaid>0?`<div><span>منها أجور عمّال:</span><span>${n(t.wagesPaid,a)}</span></div>`:""}
      </div>
      <div class="total-row">
        <span>${t.net<0?"خسارة الشهر":"ربح الشهر الصافي"}</span>
        <strong>${n(Math.abs(t.net),a)}</strong>
      </div>
      ${t.unpaid>0?`<p class="note">طلبيات الشهر مجموعها ${n(t.billed,a)}، بقي منها
             ${n(t.unpaid,a)} عند الزبائن لم يُقبض بعد، فلا يدخل في الصافي.</p>`:""}
    </div>

    ${l?`<div class="block">
             <h2 class="block__title">أبواب المصاريف</h2>
             <div class="kv">${l}</div>
           </div>`:""}

    <div class="block">
      <h2 class="block__title">تفصيل المصاريف</h2>
      <table>
        <thead>
          <tr><th>#</th><th>التاريخ</th><th>الوصف</th><th>الباب</th><th>المبلغ</th></tr>
        </thead>
        <tbody>${i}</tbody>
      </table>
      ${t.wagesPaid>0?`<p class="note">أجور العمّال (${n(t.wagesPaid,a)}) مأخوذة من سجل
             العمّال، وتفصيلها في كشف كلّ عامل على حدة.</p>`:""}
    </div>

    ${r(a,"الربح نقديّ: ما قُبض ناقص ما صُرف")}`},O=(t,s)=>{const a=w(t),i=[...t.jobs??[]].sort((o,$)=>o.date.localeCompare($.date)),l=[...t.payments??[]].sort((o,$)=>o.date.localeCompare($.date)),e=i.length?i.map((o,$)=>`
        <tr>
          <td class="num">${$+1}</td>
          <td class="num">${d(h(o.date))}</td>
          <td>${d(o.title||"—")}${o.notes?`<div style="color:#6b7280;font-size:11px">${d(o.notes)}</div>`:""}</td>
          <td class="num">${n(o.wage,s)}</td>
        </tr>`).join(""):'<tr><td colspan="4" style="text-align:center;color:#6b7280">لا أعمال مسجّلة</td></tr>',c=l.length?l.map((o,$)=>`
        <tr>
          <td class="num">${$+1}</td>
          <td class="num">${d(h(o.date))}</td>
          <td>${d(o.note||"—")}</td>
          <td class="num">${n(o.amount,s)}</td>
        </tr>`).join(""):'<tr><td colspan="4" style="text-align:center;color:#6b7280">لم يُسلَّم له شيء بعد</td></tr>';return`
    ${m(s,"كشف حساب عامل",v(t.id))}

    <div class="block">
      <p class="block__title">بيانات العامل</p>
      <div class="kv">
        <div><span>الاسم:</span><span>${d(t.name||"—")}</span></div>
        <div><span>الصفة:</span><span>${d(t.role||"عامل")}</span></div>
        <div><span>الهاتف:</span><span>${d(t.phone||"—")}</span></div>
        <div><span>الحالة:</span><span>${t.active?"يعمل":"متوقّف"}</span></div>
      </div>
    </div>

    <div class="block">
      <p class="block__title">الأعمال وأجرة كلّ عمل</p>
      <table>
        <thead>
          <tr>
            <th class="num" style="width:34px">#</th>
            <th class="num" style="width:120px">التاريخ</th>
            <th>العمل</th>
            <th class="num" style="width:130px">الأجرة</th>
          </tr>
        </thead>
        <tbody>${e}</tbody>
      </table>
    </div>

    <div class="block">
      <p class="block__title">ما سُلّم له</p>
      <table>
        <thead>
          <tr>
            <th class="num" style="width:34px">#</th>
            <th class="num" style="width:120px">التاريخ</th>
            <th>ملاحظة</th>
            <th class="num" style="width:130px">المبلغ</th>
          </tr>
        </thead>
        <tbody>${c}</tbody>
      </table>
      <table class="totals">
        <tbody>
          <tr><td>مجموع الأجور (${d(p(a.jobsCount))} عمل)</td><td>${n(a.earned,s)}</td></tr>
          <tr><td>المُسلَّم</td><td>${n(a.paid,s)}</td></tr>
          <tr class="grand"><td>المستحقّ له</td><td>${n(a.due,s)}</td></tr>
        </tbody>
      </table>
    </div>

    ${t.notes?`<div class="block"><div class="note">${d(t.notes)}</div></div>`:""}
    <div class="sign"><div>توقيع العامل</div><div>توقيع صاحب العمل</div></div>
    ${r(s,"كشف حساب عامل")}`};export{q as a,f as b,H as c,O as d,I as e,S as f,U as g,T as h,A as i,L as j,N as p};
