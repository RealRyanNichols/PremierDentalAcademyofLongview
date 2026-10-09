// Read-only owner dashboard. Uses the existing PDA auth and Square connection.
import { authUser, bearer, SUPABASE_URL, PUBLISHABLE_KEY } from './_common.mjs';
const BASE='https://connect.squareup.com/v2', LOCATION='2P2ZE3FJNEYTV';
function json(res,status,body){res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body));}
async function owner(req){
  const u=await authUser(bearer(req)); if(!u?.id)return false;
  // Consult the current profile; admin alone does not grant financial access.
  try {const q=new URLSearchParams({id:`eq.${u.id}`,select:'is_owner'});const response=await fetch(SUPABASE_URL+'/rest/v1/profiles?'+q,{headers:{apikey:PUBLISHABLE_KEY,Authorization:'Bearer '+bearer(req)},signal:AbortSignal.timeout(10000)});if(!response.ok)return false;const r=await response.json();return r?.[0]?.is_owner===true;}catch{return false;}
}
async function square(path,body){
  const r=await fetch(BASE+path,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,'Square-Version':'2025-04-16','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});
  const j=await r.json();if(!r.ok)throw new Error(`Square request failed (${r.status})`);return j;
}
async function pages(kind){
  let cursor,rows=[];
  for(let n=0;n<100;n++){
    let j;
    if(kind==='payments'){const q=new URLSearchParams({begin_time:'2000-01-01T00:00:00Z',sort_order:'DESC',limit:'100',location_id:LOCATION});if(cursor)q.set('cursor',cursor);j=await square('/payments?'+q);}
    else {const body={query:{filter:{location_ids:[LOCATION]}},limit:100};if(kind==='invoices')body.query.sort={field:'INVOICE_SORT_DATE',order:'DESC'};if(cursor)body.cursor=cursor;j=await square('/'+kind+'/search',body);}
    rows.push(...(j[kind]||[]));cursor=j.cursor;if(!cursor)return {rows,complete:true};
  }
  return {rows,complete:false};
}
export async function loadSquareHistory(){
    const warnings=[];
    const [p,i,s]=await Promise.all([pages('payments'),pages('invoices'),pages('subscriptions').catch(()=>{warnings.push('Square subscriptions could not be read. Subscription plans are incomplete.');return {rows:[],complete:false};})]);
    if(!p.complete||!i.complete)warnings.push('Square history exceeded the pagination limit. Totals are incomplete.');
    const customers={},plans={};
    const ids=[...new Set([...p.rows,...i.rows,...s.rows].map(x=>x.customer_id||x.primary_recipient?.customer_id).filter(Boolean))];
    for(let n=0;n<ids.length;n+=100){try{const d=await square('/customers/bulk-retrieve',{customer_ids:ids.slice(n,n+100)});for(const [id,r] of Object.entries(d.responses||{})){const c=r.customer;if(c)customers[id]={name:[c.given_name,c.family_name].filter(Boolean).join(' '),email:(c.email_address||'').toLowerCase(),note:c.note||''};}}catch{warnings.push('Some Square customer names could not be read.');}}
    const planIds=[...new Set(s.rows.map(x=>x.plan_variation_id||x.plan_id).filter(Boolean))];
    for(let n=0;n<planIds.length;n+=100){try{const d=await square('/catalog/batch-retrieve',{object_ids:planIds.slice(n,n+100),include_related_objects:true});for(const o of [...(d.objects||[]),...(d.related_objects||[])]){const v=o.subscription_plan_variation_data||o.subscription_plan_data;if(v)plans[o.id]={name:v.name||'',phases:(v.phases||[]).map(x=>({cadence:x.cadence,periods:x.periods??null,ordinal:x.ordinal??0,amount_cents:x.recurring_price_money?.amount??x.pricing?.price_money?.amount??null}))};}}catch{warnings.push('Square catalog plan frequency could not be read. Invoice schedules remain visible.');}}
    return {
      fetched_at:new Date().toISOString(),complete:p.complete&&i.complete&&s.complete,warnings,customers,plans,
      payments:p.rows.map(x=>({id:x.id,created_at:x.created_at,status:x.status,amount_cents:x.amount_money?.amount??0,refunded_cents:x.refunded_money?.amount??0,currency:x.amount_money?.currency,source_type:x.source_type||null,card_type:x.card_details?.card?.card_type||null,customer_id:x.customer_id||null,email:(x.buyer_email_address||'').toLowerCase(),name:[x.billing_address?.first_name,x.billing_address?.last_name].filter(Boolean).join(' '),note:x.note||'',receipt_url:x.receipt_url||null,order_id:x.order_id||null})),
      invoices:i.rows.map(x=>({id:x.id,number:x.invoice_number,status:x.status,customer_id:x.primary_recipient?.customer_id||null,email:(x.primary_recipient?.email_address||'').toLowerCase(),name:[x.primary_recipient?.given_name,x.primary_recipient?.family_name].filter(Boolean).join(' '),title:x.title||'',description:x.description||'',subscription_id:x.subscription_id||null,order_id:x.order_id||null,url:x.public_url||null,timezone:x.timezone||'America/Chicago',requests:(x.payment_requests||[]).map(r=>({id:r.uid,type:r.request_type,due:r.due_date||null,amount_cents:r.computed_amount_money?.amount??r.fixed_amount_requested_money?.amount??null,paid_cents:r.total_completed_amount_money?.amount??0,autopay:r.automatic_payment_source&&r.automatic_payment_source!=='NONE'}))})),
      subscriptions:s.rows.map(x=>({id:x.id,status:x.status,customer_id:x.customer_id,start_date:x.start_date,charged_through_date:x.charged_through_date,canceled_date:x.canceled_date,plan_variation_id:x.plan_variation_id||x.plan_id,price_override_cents:x.price_override_money?.amount??null,phases:(x.phases||[]).map(q=>({ordinal:q.ordinal,order_template_id:q.order_template_id}))}))
    };
}
export default async function handler(req,res){
  if(req.method!=='GET')return json(res,405,{error:'GET only'});
  if(!await owner(req))return json(res,403,{error:'Owner access required'});
  if(!process.env.SQUARE_ACCESS_TOKEN)return json(res,503,{error:'Square connection unavailable'});
  try{return json(res,200,await loadSquareHistory());}catch{return json(res,502,{error:'Square payment history or invoices could not be loaded. Refresh to retry.'});}
}
