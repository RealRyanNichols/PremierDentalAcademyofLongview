export function schedule(balance,cadence,count,first){
 if(!Number.isSafeInteger(balance)||balance<=0||!['weekly','monthly'].includes(cadence)||!Number.isInteger(count)||count<1||count>12||!/^\d{4}-\d{2}-\d{2}$/.test(first))throw Error('Choose all schedule fields');
 const d=new Date(first+'T12:00:00Z');if(Number.isNaN(d.valueOf())||d.toISOString().slice(0,10)!==first)throw Error('Invalid date');const anchor=d.getUTCDate(),per=Math.floor(balance/count);
 return Array.from({length:count},(_,i)=>{let date;if(cadence==='monthly'){const target=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+i,1,12)),last=new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth()+1,0)).getUTCDate();target.setUTCDate(Math.min(anchor,last));date=target.toISOString().slice(0,10);}else{const target=new Date(d);target.setUTCDate(target.getUTCDate()+i*7);date=target.toISOString().slice(0,10);}return {due:date,amount_cents:i===count-1?balance-per*(count-1):per,paid_cents:0};});
}
