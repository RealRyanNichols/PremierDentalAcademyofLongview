/* Fictional fixtures for the authenticated owner preview. */
function PDAFinancialPreview(){
 const cohort={id:'sample-class',name:'Sample in-person class',start_date:'2026-09-29',delivery_mode:'in_person'};
 const names=['Avery Sample','Blair Sample','Casey Sample','Drew Sample','Emery Sample'];
 const profiles=names.map((name,i)=>({id:'sample-'+i,first_name:name.split(' ')[0],last_name:'Sample',email:'sample'+i+'@example.test'}));
 const enrollments=profiles.map((p,i)=>({id:'enrollment-'+i,student_id:p.id,cohort_id:cohort.id,status:'active',notes:i===4?'Chose to pay in full by check; receipt unconfirmed':''}));
 const payments=profiles.slice(0,4).map((p,i)=>({id:'payment-'+i,status:'COMPLETED',email:p.email,amount_cents:i===3?300000:50000,refunded_cents:0,source_type:'CARD',card_type:i===3?'CREDIT':'DEBIT',created_at:'2026-09-20T12:00:00Z',note:i===3?'PDA tuition — Paid in full':'PDA tuition — Down payment'}));
 const schedule=[{due:'2026-10-02',amount_cents:100000},{due:'2026-11-02',amount_cents:100000},{due:'2026-12-02',amount_cents:100000}];
 const records=profiles.slice(0,3).map((p,i)=>({student_id:p.id,total_cents:350000,paid_cents:50000,balance_cents:300000,status:i===2?'preparing':'email_prepared',email_sent:i===1,selection:i===2?{cadence:'monthly',count:3,first_due:'2026-10-02',submitted_at:'2026-09-29T18:00:00Z',phone:'555-555-0100',notes:'Fictional preview',schedule}:null,schedule:i===2?schedule:[],invoices:[],cohort}));
 const sq={complete:true,warnings:[],customers:{},plans:{},subscriptions:[],invoices:[],payments,fetched_at:new Date().toISOString()};
 return [profiles,enrollments,[cohort],[],[],{ok:true,json:async()=>sq},{ok:true,json:async()=>({records})}];
}
