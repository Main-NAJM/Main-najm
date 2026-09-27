import{d as u,o as v}from"./calc-Cn0i55th.js";import{y as p,X as $,D as x,A as w,h as m,o as g,k as _,t as k,K as b,J as C}from"./index-Bsm7EFY8.js";const d=t=>String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),f=`
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
`,y=(t,s)=>`<!doctype html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8"><title>${d(t)}</title><style>${f}</style></head>
<body><div class="doc">${s}</div></body>
</html>`,j=(t,s)=>{const a=y(t,s),n=document.createElement("iframe");n.setAttribute("aria-hidden","true"),n.style.position="fixed",n.style.inset="0",n.style.width="0",n.style.height="0",n.style.border="0",n.style.opacity="0",document.body.appendChild(n);const o=()=>{window.setTimeout(()=>{n.remove()},1e3)};n.onload=()=>{const l=n.contentWindow;if(!l){o();return}l.focus(),l.onafterprint=o,window.setTimeout(()=>{try{l.print()}catch{o()}},120)};const e=n.contentDocument;if(!e){o();return}e.open(),e.write(a),e.close()},z=(t,s,a)=>{const n=new Blob([y(t,s)],{type:"text/html;charset=utf-8"}),o=URL.createObjectURL(n),e=document.createElement("a");e.href=o,e.download=a.endsWith(".html")?a:`${a}.html`,document.body.appendChild(e),e.click(),e.remove(),window.setTimeout(()=>{URL.revokeObjectURL(o)},2e3)},r=(t,s,a)=>`
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
        <div>التاريخ: ${d(m(k()))}</div>
      </div>
    </div>
  </div>`,h=(t,s)=>`
  <div class="doc__foot">
    <span>${d(s??"شكراً لتعاملكم معنا")}</span>
    <span>${d(t.businessName||"ورشتي")}</span>
  </div>`,i=(t,s)=>d(_(t,s.currency)),N=(t,s)=>{const a=v(t),n=(t.items??[]).length?t.items.map((o,e)=>`
        <tr>
          <td class="num">${e+1}</td>
          <td>${d(o.name)}</td>
          <td class="num">${d(p(o.qty))}</td>
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
        <div><span>التسليم:</span><span>${d(t.dueDate?m(t.dueDate):"—")}</span></div>
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
        <tbody>${n}</tbody>
      </table>
      <table class="totals">
        <tbody>
          <tr><td>مجموع البنود</td><td>${i(a.itemsTotal,s)}</td></tr>
          <tr><td>أجور ومصاريف إضافية</td><td>${i(a.extraCharges,s)}</td></tr>
          <tr><td>الخصم</td><td>${i(a.discount,s)}</td></tr>
          <tr class="grand"><td>الإجمالي المستحق</td><td>${i(a.total,s)}</td></tr>
          <tr><td>المدفوع</td><td>${i(a.paid,s)}</td></tr>
          <tr><td>المتبقّي</td><td>${i(a.remaining,s)}</td></tr>
        </tbody>
      </table>
    </div>
    ${t.notes?`<div class="block"><p class="block__title">ملاحظات</p><div class="note">${d(t.notes)}</div></div>`:""}
    <div class="sign"><div>توقيع الزبون</div><div>توقيع صاحب العمل</div></div>
    ${h(s)}`},R=(t,s,a)=>{const n=t.reduce((e,l)=>{const c=v(l);return{total:e.total+c.total,paid:e.paid+c.paid,remaining:e.remaining+c.remaining}},{total:0,paid:0,remaining:0}),o=t.length?t.map((e,l)=>{const c=v(e);return`
          <tr>
            <td class="num">${l+1}</td>
            <td>${d(e.title||"—")}</td>
            <td>${d(e.customerName||"—")}</td>
            <td><span class="pill">${d(g(e.status))}</span></td>
            <td class="num">${d(e.dueDate?m(e.dueDate):"—")}</td>
            <td class="num">${i(c.total,s)}</td>
            <td class="num">${i(c.paid,s)}</td>
            <td class="num">${i(c.remaining,s)}</td>
          </tr>`}).join(""):'<tr><td colspan="8" style="text-align:center;color:#6b7280">لا توجد طلبيات</td></tr>';return`
    ${r(s,"كشف الطلبيات","")}
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
        <tbody>${o}</tbody>
        <tfoot>
          <tr>
            <td colspan="5">المجموع</td>
            <td class="num">${i(n.total,s)}</td>
            <td class="num">${i(n.paid,s)}</td>
            <td class="num">${i(n.remaining,s)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    ${h(s,"كشف حساب داخلي")}`},T=(t,s,a)=>{const n=t.reduce((e,l)=>{const c=u(l);return{amount:e.amount+c.amount,paid:e.paid+c.paid,remaining:e.remaining+c.remaining}},{amount:0,paid:0,remaining:0}),o=t.length?t.map((e,l)=>{const c=u(e);return`
          <tr>
            <td class="num">${l+1}</td>
            <td>${d(e.customerName||"—")}</td>
            <td class="num">${d(e.phone||"—")}</td>
            <td>${d(e.address||"—")}</td>
            <td>${d(e.goods||"—")}</td>
            <td class="num">${i(c.amount,s)}</td>
            <td class="num">${i(c.paid,s)}</td>
            <td class="num">${i(c.remaining,s)}</td>
            <td class="num">${d(e.dueDate?m(e.dueDate):"—")}</td>
          </tr>`}).join(""):'<tr><td colspan="9" style="text-align:center;color:#6b7280">لا توجد ديون مسجّلة</td></tr>';return`
    ${r(s,"سجل الديون","")}
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
        <tbody>${o}</tbody>
        <tfoot>
          <tr>
            <td colspan="5">المجموع</td>
            <td class="num">${i(n.amount,s)}</td>
            <td class="num">${i(n.paid,s)}</td>
            <td class="num">${i(n.remaining,s)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
    ${h(s,"سجل ديون داخلي")}`},L=(t,s)=>{const a=u(t),n=(t.payments??[]).length?t.payments.map((o,e)=>`
        <tr>
          <td class="num">${e+1}</td>
          <td class="num">${d(m(o.date))}</td>
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
        <div><span>الاستحقاق:</span><span>${d(t.dueDate?m(t.dueDate):"—")}</span></div>
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
        <tbody>${n}</tbody>
      </table>
      <table class="totals">
        <tbody>
          <tr><td>أصل الدين</td><td>${i(a.amount,s)}</td></tr>
          <tr><td>المسدّد</td><td>${i(a.paid,s)}</td></tr>
          <tr class="grand"><td>المتبقّي</td><td>${i(a.remaining,s)}</td></tr>
        </tbody>
      </table>
    </div>
    ${t.notes?`<div class="block"><div class="note">${d(t.notes)}</div></div>`:""}
    <div class="sign"><div>توقيع الزبون</div><div>توقيع صاحب العمل</div></div>
    ${h(s,"كشف دين")}`},q=(t,s)=>{const a=(t.materials??[]).length?t.materials.map((n,o)=>`
        <tr>
          <td class="num">${o+1}</td>
          <td>${d(n.name)}</td>
          <td class="num">${d(p(n.qty))}</td>
          <td class="num">${i(n.unitPrice,s)}</td>
          <td class="num">${i(n.qty*n.unitPrice,s)}</td>
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
        <tbody>${a}</tbody>
      </table>
      <table class="totals">
        <tbody>
          <tr><td>تكلفة المواد (مع الهالك ${d(p(t.wastePct))}٪)</td><td>${i(t.materialsCost,s)}</td></tr>
          <tr><td>أجور العمل (${d(p(t.laborHours))} ساعة)</td><td>${i(t.laborCost,s)}</td></tr>
          <tr><td>مصاريف عامة</td><td>${i(t.overhead,s)}</td></tr>
          <tr><td>إجمالي التكلفة</td><td>${i(t.totalCost,s)}</td></tr>
          <tr><td>الربح (${d(p(t.marginPct))}٪)</td><td>${i(t.profit,s)}</td></tr>
          <tr class="grand"><td>السعر المقترح</td><td>${i(t.suggestedPrice,s)}</td></tr>
        </tbody>
      </table>
    </div>
    ${t.notes?`<div class="block"><div class="note">${d(t.notes)}</div></div>`:""}
    ${h(s,"ورقة تسعير داخلية")}`},S=(t,s)=>{const a=t.length?t.map((n,o)=>`
        <tr>
          <td class="num">${o+1}</td>
          <td>${d(n.title||"—")}</td>
          <td class="num">${i(n.totalCost,s)}</td>
          <td class="num">${d(p(n.marginPct))}٪</td>
          <td class="num">${i(n.profit,s)}</td>
          <td class="num">${i(n.suggestedPrice,s)}</td>
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
        <tbody>${a}</tbody>
      </table>
    </div>
    ${h(s,"سجل تسعير داخلي")}`},U=(t,s,a,n)=>{const o=[s.widthCm?`العرض ${p(s.widthCm)} سم`:"",s.heightCm?`الارتفاع ${p(s.heightCm)} سم`:"",s.depthCm?`العمق ${p(s.depthCm)} سم`:""].filter(Boolean).join(" × ");return`
    ${r(n,"عرض سعر",$(t.id))}
    <div class="block">
      <p class="block__title">${d(t.name)}</p>
      <div class="kv">
        <div><span>الحرفة:</span><span>${d(x(t.craft,n.customCraft))}</span></div>
        <div><span>التسعير:</span><span>${d(w(t.basis))}</span></div>
        ${o?`<div><span>المقاس:</span><span>${d(o)}</span></div>`:""}
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
            <td>${t.basis==="unit"?"قيمة المادة":`قيمة المادة (${d(p(a.measure))} ${d(a.measureUnit)} × ${i(t.unitPrice,n)})`}</td>
            <td class="num">${i(a.materialCost,n)}</td>
          </tr>
          ${a.wasteCost>0?`<tr><td>الهالك (${d(p(t.wastePct))}٪)</td><td class="num">${i(a.wasteCost,n)}</td></tr>`:""}
          ${a.fittings>0?`<tr><td>إكسسوارات</td><td class="num">${i(a.fittings,n)}</td></tr>`:""}
          ${a.labor>0?`<tr><td>أجرة العمل</td><td class="num">${i(a.labor,n)}</td></tr>`:""}
        </tbody>
      </table>
      <table class="totals">
        <tbody>
          <tr><td>تكلفة القطعة</td><td>${i(a.unitCost,n)}</td></tr>
          <tr><td>الربح (${d(p(t.marginPct))}٪)</td><td>${i(a.unitProfit,n)}</td></tr>
          <tr><td>سعر القطعة</td><td>${i(a.unitTotal,n)}</td></tr>
          <tr class="grand"><td>الإجمالي (${d(p(a.quantity))} قطعة)</td><td>${i(a.total,n)}</td></tr>
        </tbody>
      </table>
    </div>
    ${t.notes?`<div class="block"><p class="block__title">ملاحظات</p><div class="note">${d(t.notes)}</div></div>`:""}
    <div class="sign"><div>توقيع الزبون</div><div>توقيع صاحب العمل</div></div>
    ${h(n,"عرض سعر — صالح حسب أسعار المواد وقت إصداره")}`},A=(t,s,a)=>{const n=s.length?[...s].sort((e,l)=>e.date.localeCompare(l.date)).map((e,l)=>`
          <tr>
            <td class="num">${l+1}</td>
            <td class="num">${d(m(e.date))}</td>
            <td>${d(e.title||"—")}</td>
            <td>${d(b(e.category))}</td>
            <td class="num">${i(e.amount,a)}</td>
          </tr>`).join(""):'<tr><td colspan="5" style="text-align:center;color:#6b7280">لا مصاريف في هذا الشهر</td></tr>',o=t.byCategory.map(e=>`
      <div><span>${d(b(e.category))}:</span>
      <span>${i(e.amount,a)}</span></div>`).join("");return`
    ${r(a,`كشف ${C(t.month)}`,"")}

    <div class="block">
      <h2 class="block__title">الخلاصة</h2>
      <div class="kv">
        <div><span>المقبوض من طلبيات الشهر:</span><span>${i(t.fromOrders,a)}</span></div>
        <div><span>دفعات الديون في الشهر:</span><span>${i(t.fromDebts,a)}</span></div>
        <div><span>جملة الدخل:</span><span>${i(t.income,a)}</span></div>
        <div><span>جملة المصاريف:</span><span>${i(t.expenses,a)}</span></div>
      </div>
      <div class="total-row">
        <span>${t.net<0?"خسارة الشهر":"ربح الشهر الصافي"}</span>
        <strong>${i(Math.abs(t.net),a)}</strong>
      </div>
      ${t.unpaid>0?`<p class="note">طلبيات الشهر مجموعها ${i(t.billed,a)}، بقي منها
             ${i(t.unpaid,a)} عند الزبائن لم يُقبض بعد، فلا يدخل في الصافي.</p>`:""}
    </div>

    ${o?`<div class="block">
             <h2 class="block__title">أبواب المصاريف</h2>
             <div class="kv">${o}</div>
           </div>`:""}

    <div class="block">
      <h2 class="block__title">تفصيل المصاريف</h2>
      <table>
        <thead>
          <tr><th>#</th><th>التاريخ</th><th>الوصف</th><th>الباب</th><th>المبلغ</th></tr>
        </thead>
        <tbody>${n}</tbody>
      </table>
    </div>

    ${h(a,"الربح نقديّ: ما قُبض ناقص ما صُرف")}`};export{q as a,N as b,U as c,A as d,T as e,L as f,z as g,S as h,R as i,j as p};
