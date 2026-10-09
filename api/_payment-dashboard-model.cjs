(function(root){
'use strict';
const labels={WEEKLY:'Weekly',EVERY_TWO_WEEKS:'Every 2 weeks',THIRTY_DAYS:'Every 30 days',SIXTY_DAYS:'Every 60 days',NINETY_DAYS:'Every 90 days',MONTHLY:'Monthly',EVERY_TWO_MONTHS:'Every 2 months',QUARTERLY:'Quarterly',EVERY_FOUR_MONTHS:'Every 4 months',EVERY_SIX_MONTHS:'Every 6 months',ANNUAL:'Yearly',DAILY:'Daily',TWICE_A_MONTH:'Twice a month'};
const norm=x=>String(x||'').trim().toLowerCase();
const day=x=>Date.parse(x+'T12:00:00Z');
function cadence(dates){
 const a=[...new Set(dates.filter(Boolean))].sort();if(a.length<3)return null;
 const gaps=a.slice(1).map((v,k)=>(day(v)-day(a[k]))/86400000);
 if(gaps.every(x=>x===7))return 'Weekly';if(gaps.every(x=>x===14))return 'Every 2 weeks';
 if(gaps.every(x=>x>=28&&x<=31))return 'Monthly';
 if(gaps.every(x=>x>=13&&x<=16))return 'Twice a month / custom';
 return 'Custom / irregular';
}
function setupState(r){
 if(r.balance===0)return 'Complete · paid in full';
 if(r.frequency==='Pay in full · receipt unconfirmed')return 'Confirm check receipt';
 const info=r.setupInfo;
 if(!info)return r.frequency==='Not recorded'?'Setup needed':r.frequencySource.includes('invoice dates')?'Confirm selected frequency':'Plan recorded';
 if(!info.selection)return info.email_sent?'Email sent · awaiting choice':'Draft ready · not sent';
 return ({active:'Plan saved · links ready',preparing:'Choices saved · preparing links',payment_links_pending:'Choices saved · retry needed',needs_review:'Arrangement saved · needs review',preview_saved:'Fictional choices saved'})[info.status]||'Choices saved';
}
function build(db,sq,today){
 const rows=[],byId=new Map(),byEmail=new Map(),byCustomer=new Map(),coh=new Map(db.cohorts.map(x=>[x.id,x]));
 const ensure=(key,name,email,studentId)=>{let r=rows.find(x=>x.key===key);if(!r){r={key,name:name||email||'Unmatched Square customer',email:email||'',studentId,cohorts:[],payments:[],invoices:[],subscriptions:[],records:[],enrollmentNotes:[],issues:[],enrolled:false};rows.push(r);}return r;};
 for(const p of db.profiles){if(p.is_admin||p.is_instructor||/test@|^test\b|\btest$/i.test([p.email,p.first_name,p.last_name].join(' ')))continue;const r=ensure('student:'+p.id,[p.first_name,p.last_name].filter(Boolean).join(' '),p.email,p.id);byId.set(p.id,r);if(p.email)byEmail.set(norm(p.email),r);}
 for(const e of db.enrollments){if(/cancel|withdraw|dropped|refunded/i.test(e.status||''))continue;let r=byId.get(e.student_id);if(!r&&e.student_name)r=ensure('enrollment:'+e.id,e.student_name,'',e.student_id);if(!r)continue;r.enrolled=true;if(e.notes)r.enrollmentNotes.push(e.notes);if(e.student_name&&!r.name.includes(' '))r.name=e.student_name;const c=coh.get(e.cohort_id);if(c&&!r.cohorts.some(x=>x.id===c.id))r.cohorts.push(c);}
 function find(x){const c=x.customer_id&&sq.customers[x.customer_id];const email=norm(x.email||c?.email);let r=byEmail.get(email);if(!r&&x.customer_id)r=byCustomer.get(x.customer_id);if(!r){const name=norm(x.name||c?.name);const matches=rows.filter(z=>name&&norm(z.name)===name);if(matches.length===1){r=matches[0];r.issues.push('Square linked by exact name; verify identity.');}}
  if(!r)r=ensure(x.customer_id?'square:'+x.customer_id:email?'email:'+email:'payment:'+x.id,x.name||c?.name,email,null);
  if(x.customer_id)byCustomer.set(x.customer_id,r);return r;
 }
 const recByPayment=new Map();for(const p of db.purchases){for(const id of [p.square_payment_id,p.external_payment_id].filter(Boolean))recByPayment.set(id,p);}
 const seen=new Set();for(const p of sq.payments){const rec=recByPayment.get(p.id);let r=rec&&byId.get(rec.student_id);r=r||find(p);if(p.customer_id)byCustomer.set(p.customer_id,r);r.payments.push({...p,product:rec?.product_label||p.note,product_key:rec?.product_key});seen.add(p.id);}
 for(const p of db.purchases){let r=byId.get(p.student_id)||byEmail.get(norm(p.contact_email));if(!r&&p.contact_email)r=ensure('email:'+norm(p.contact_email),'',p.contact_email,null);if(!r)continue;r.records.push(p);if(!seen.has(p.square_payment_id)&&!seen.has(p.external_payment_id)){r.payments.push({id:p.id,status:String(p.status).toUpperCase(),amount_cents:p.amount_cents||p.metadata?.payment_transaction?.amount_paid||0,created_at:p.created_at,product:p.product_label,product_key:p.product_key,dbOnly:true,metadata:p.metadata});}}
 for(const i of sq.invoices)find(i).invoices.push(i);
 for(const s of sq.subscriptions)find(s).subscriptions.push(s);
 for(const r of rows){
   r.setupInfo=(db.setupRecords||[]).find(x=>x.student_id===r.studentId);
   const selected=r.setupInfo?.selection;const saved=selected&&['weekly','monthly'].includes(selected.cadence)?{total_cents:r.setupInfo.total_cents,cadence:selected.cadence,installment_count:selected.count,source:'Student selected · '+r.setupInfo.status,schedule:selected.schedule}:null;
   r.plan=(db.plans||[]).find(x=>x.student_id===r.studentId)||saved;
   r.invoices=r.invoices.filter(x=>!/study pack|cheat sheet|exam prep|exam pro/i.test(x.title+' '+x.description));
   const tuition=p=>!(/study_pack|exam_pro|exam_prep|cheat sheet|study pack/i.test((p.product_key||'')+' '+(p.product||'')));
   const payments=r.payments.filter(tuition);r.paid=payments.filter(x=>x.status==='COMPLETED').reduce((a,x)=>a+Math.max(0,x.amount_cents-(x.refunded_cents||0)),0);
   r.history=payments.filter(x=>x.status==='COMPLETED').sort((a,b)=>a.created_at.localeCompare(b.created_at));r.lastPaid=r.history.at(-1)?.created_at;
   r.paymentMethods=[...new Set(r.history.map(x=>x.source_type==='CARD'?(x.card_type==='CREDIT'?'Credit card':x.card_type==='DEBIT'?'Debit card':'Card'):x.source_type==='CASH'?'Cash':x.source_type==='BANK_ACCOUNT'?'Bank transfer':x.source_type==='EXTERNAL'?'External payment':x.dbOnly?'PDA record':x.source_type||'Not recorded'))];
   r.schedule=r.invoices.flatMap(i=>i.requests.map(q=>({...q,invoice:i.id,number:i.number,title:i.title,status:i.status,url:i.url,remaining:q.amount_cents===null?null:Math.max(0,q.amount_cents-q.paid_cents)}))).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'));
   const collectible=q=>!['DRAFT','CANCELED','FAILED','REFUNDED','PARTIALLY_REFUNDED','PAID'].includes(q.status);
   r.open=r.schedule.filter(q=>collectible(q)&&q.remaining>0);r.invoiced=r.open.reduce((a,x)=>a+x.remaining,0);
   r.overdue=r.open.filter(q=>q.due&&q.due<today).reduce((a,x)=>a+x.remaining,0);r.dueToday=r.open.filter(q=>q.due===today).reduce((a,x)=>a+x.remaining,0);
   r.next=r.open.find(q=>q.due>=today)||r.open.find(q=>q.due);r.oldest=r.open.find(q=>q.due<today);r.lastDue=r.open.filter(q=>q.due).at(-1)?.due;
   const active=r.subscriptions.filter(x=>['ACTIVE','PENDING'].includes(x.status));const candidates=active.length?active:r.subscriptions;
   r.phases=candidates.flatMap(s=>(sq.plans[s.plan_variation_id]?.phases||[]).map(p=>({...p,amount_cents:s.price_override_cents??p.amount_cents,subscription:s.id,status:s.status,planName:sq.plans[s.plan_variation_id]?.name})));
   const explicit=r.phases.map(p=>labels[p.cadence]||p.cadence).filter(Boolean);
   if(explicit.length){r.frequency=[...new Set(explicit)].join(' → ');r.frequencySource=active.length?'Square subscription':'Square historical subscription';}
   else if(r.plan){r.frequency=labels[String(r.plan.cadence).toUpperCase()]||r.plan.cadence;r.frequencySource=r.plan.source||'Saved PDA plan';}
   else if(r.records.some(x=>/^(daily|weekly|monthly|biweekly)$/i.test(x.metadata?.cadence||''))){const c=r.records.find(x=>/^(daily|weekly|monthly|biweekly)$/i.test(x.metadata?.cadence||'')).metadata.cadence;r.frequency=c.toLowerCase()==='biweekly'?'Every 2 weeks':labels[c.toUpperCase()];r.frequencySource='Saved selected cadence';}
   else if(selected?.cadence==='other'){r.frequency='Other arrangement · needs review';r.frequencySource='Student submitted details for Amanda';}
   else if(r.enrollmentNotes.some(x=>/chose to pay in full/i.test(x))){r.frequency='Pay in full · receipt unconfirmed';r.frequencySource='PDA roster note; verify payment receipt';}
   else if(r.records.some(x=>/biweekly|weekly|monthly/i.test(x.metadata?.plan||''))){const text=r.records.find(x=>/biweekly|weekly|monthly/i.test(x.metadata?.plan||'')).metadata.plan;r.frequency=/biweekly/i.test(text)?'Every 2 weeks':/weekly/i.test(text)?'Weekly':'Monthly';r.frequencySource='Recorded payment arrangement';}
   else{r.frequency=cadence(r.schedule.filter(q=>q.type!=='DEPOSIT'&&q.status!=='DRAFT'&&q.status!=='CANCELED').map(q=>q.due));r.frequencySource=r.frequency?'Square invoice dates; verify selected plan':'Plan choice not returned by Square';}
   const m=r.records.map(x=>x.metadata).find(m=>m?.total_cents>0);
   r.total=r.plan?.total_cents??m?.total_cents??null;
   r.balance=r.total===null?null:Math.max(0,r.total-r.paid);
   r.proposedBalance=r.balance===null&&!selected&&r.setupInfo?.total_cents>0?Math.max(0,r.setupInfo.total_cents-r.paid):null;
   const pif=payments.some(p=>p.status==='COMPLETED'&&/paid in full/i.test((p.product||'')+' '+(p.note||'')));
   const onlinePif=r.records.some(p=>/online/i.test(p.product_key||p.product_label||'')&&p.payment_type==='one_time'&&p.status==='completed'&&p.amount_cents>0);
   if((pif||onlinePif)&&!r.open.length&&!active.length){r.balance=0;r.proposedBalance=null;r.total=r.paid;r.frequency='Paid in full';r.frequencySource='Completed payment record';}
   if(r.total!==null&&r.invoiced>r.balance){r.issues.push('Open invoices exceed the recorded tuition balance. Review duplicate or old invoices.');}
   const amounts=[...new Set((r.phases.length?r.phases.map(x=>x.amount_cents):(r.open.length?r.open:r.schedule.filter(q=>q.status!=='DRAFT'&&q.status!=='CANCELED')).filter(x=>x.type!=='DEPOSIT').map(x=>x.amount_cents)).filter(x=>x!==null&&x!==undefined))];r.amounts=amounts.length?amounts:[...new Set((saved?.schedule||[]).map(x=>x.amount_cents))];
   if(saved?.schedule?.length){const last=saved.schedule.at(-1).due;r.lastDue=[r.lastDue,last].filter(Boolean).sort().at(-1);if(!r.open.some(x=>x.due>=today)){const upcoming=saved.schedule.find(x=>x.due>=today&&!r.schedule.some(q=>q.due===x.due&&q.status==='PAID'));if(upcoming&&r.balance!==0)r.next={...upcoming,remaining:upcoming.amount_cents,saved:true};}}
   r.customerIds=[...byCustomer].filter(([id,row])=>row===r).map(([id])=>id);
   r.status=r.overdue?'Overdue':r.dueToday?'Due today':r.open.length?'Scheduled':r.balance===0?'Paid in full':active.length?'Subscription active':'Needs plan review';
   if(!r.frequency)r.frequency='Not recorded';
   if(!r.open.length&&r.balance!==0&&r.setupInfo){if(!selected)r.status='Awaiting plan choice';else if(r.setupInfo.status==='preparing')r.status='Preparing payment links';else if(r.setupInfo.status==='payment_links_pending')r.status='Payment links need retry';else if(r.setupInfo.status==='active')r.status='Plan active';}
   if(r.balance===null)r.issues.push('Total tuition agreement is not recorded; open invoices are shown separately.');
   if(r.schedule.some(x=>x.status==='DRAFT'))r.issues.push('Draft invoices are excluded from amounts due.');
   if(!sq.complete)r.issues.push('Square history is incomplete.');
 }
 return rows.filter(r=>!(/test@|^test\b|\btest$/i.test([r.email,r.name].join(' ')))).filter(r=>r.enrolled||r.invoices.length||r.subscriptions.length||r.records.some(p=>/program|rdaWeekly/i.test(p.product_key||''))||r.payments.some(p=>/tuition|program|rda/i.test(p.product||''))).sort((a,b)=>b.overdue-a.overdue||a.name.localeCompare(b.name));
}
const api={build,cadence,labels,setupState};if(typeof module!=='undefined')module.exports=api;else root.PDAPaymentModel=api;
})(typeof window!=='undefined'?window:globalThis);
