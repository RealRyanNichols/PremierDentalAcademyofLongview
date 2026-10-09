import {identity,prepare,records,read,write,locked,emailDraft,sendMail,reply,fail,publicRecord,currentSquare} from './_payment-plan-core.mjs';
export default async function handler(req,res){
 try{
  await identity(req,true);
  if(req.method==='GET'){const list=await records();return reply(res,200,{records:list.map(r=>({...publicRecord(r),student_id:r.student_id,created_at:r.created_at,email_sent:!!r.email_sent,draft:emailDraft(r)}))});}
  if(req.method!=='POST')return reply(res,405,{error:'GET or POST only'});
  const body=req.body;if(!body||typeof body!=='object')fail(400,'Invalid request');
  if(body.action==='prepare'){const record=await prepare(req,body.student_id,body.cohort_start);return reply(res,200,{student_id:record.student_id,record:publicRecord(record),draft:emailDraft(record),email_sent:!!record.email_sent});}
  if(body.action==='send')return await locked(body.student_id,async()=>{const record=await read(body.student_id);if(!record)fail(404,'Prepare the email first');if(record.selection)fail(409,'The student has already submitted their plan');if(record.email_sent)return reply(res,200,{sent:true,already_sent:true});const current=await currentSquare(record);if(current.conflicting||current.uncertain||current.paid>=record.total_cents)fail(409,'The student already has a plan or has paid in full; this email is excluded');const mail=await sendMail({...emailDraft(record),id:'pda-plan-setup-v1-invite-'+record.id});record.email_sent=mail.id;record.email_sent_at=new Date().toISOString();await write(record);return reply(res,200,{sent:true});});
  fail(400,'Choose prepare or send');
 }catch(e){return reply(res,e.status||503,{error:e.status?e.message:'The saved plan could not be loaded. Please retry.'});}
}
