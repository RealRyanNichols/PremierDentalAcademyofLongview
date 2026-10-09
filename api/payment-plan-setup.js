import {identity,read,write,locked,selection,reply,fail,start,publicRecord,previewRecord,currentSquare,refreshActive} from './_payment-plan-core.mjs';
export default async function handler(req,res){
 try{
  if(!['GET','POST'].includes(req.method))return reply(res,405,{error:'GET or POST only'});
  const {user,profile}=await identity(req);const preview=req.query?.preview==='1';if(preview&&!profile.is_owner)fail(403,'Owner preview only');const id=preview?'preview-'+user.id:user.id;
  if(req.method==='GET'){
   let record=await read(id);if(!record&&preview)record=previewRecord(user.id);if(!record)fail(404,'A setup invitation is not available for this account. Contact Amanda if you need a payment plan.');
   if(!preview&&!record.selection){const fresh=await currentSquare(record);if(fresh.conflicting||fresh.uncertain)fail(409,'You already have a Square payment schedule. Contact Amanda to reconcile it.');if(fresh.paid!==record.paid_cents){record.paid_cents=fresh.paid;record.balance_cents=Math.max(0,record.total_cents-fresh.paid);await write(record);}}
   if(!preview&&record.status==='preparing')start(record);if(!preview&&record.status==='active')record=await refreshActive(record);
   return reply(res,200,{record:publicRecord(record),preview});
  }
  return await locked(id,async()=>{
   let record=await read(id);if(!record&&preview)record=previewRecord(user.id);if(!record)fail(404,'A setup invitation is not available for this account');
   if(preview&&req.body?.action==='reset_preview'){record=previewRecord(user.id);await write(record);return reply(res,200,{record:publicRecord(record),preview});}
   if(record.selection){if(!preview&&record.status==='payment_links_pending'){record.status='preparing';record.issue=null;await write(record);start(record);}return reply(res,200,{record:publicRecord(record),preview,already_saved:true});}
   const picked=selection(req.body,record);if(picked.cadence!=='other'&&picked.confirmed_balance_cents!==record.balance_cents)fail(409,'The balance changed. Refresh the form and review it again.');
   record.selection=picked;record.schedule=picked.schedule||[];record.work_started_at=new Date().toISOString();
   const nonstandard=picked.cadence==='other'||picked.first_due>record.first_due_suggested||(picked.first_due&&new Date(picked.first_due+'T12:00:00Z').getUTCDay()!==5);
   record.status=preview?'preview_saved':nonstandard?'needs_review':'preparing';record.issue=nonstandard&&!preview?'Your information is saved. Amanda will confirm this different arrangement before payment links are created.':null;
   await write(record);if(!preview&&record.status==='preparing')start(record);return reply(res,202,{record:publicRecord(record),preview,saved:true});
  });
 }catch(e){if(!e.status)console.error('payment-plan-setup failed:',e.name,e.code||'',e.stack?.split('\n')[1]?.trim());return reply(res,e.status||503,{error:e.status?e.message:'Your information could not be saved. Keep the form open and retry.'});}
}
