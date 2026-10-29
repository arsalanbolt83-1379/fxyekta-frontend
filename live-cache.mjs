const key=month=>'fxyekta:public-results:v1:'+(month||'latest');
export function validFeed(data){
 const month=m=>typeof m==='string'&&/^20\d{2}-(0[1-9]|1[0-2])$/.test(m);
 return !!data&&data.schemaVersion===1&&Array.isArray(data.trades)&&data.trades.length<=20000&&Array.isArray(data.months)&&data.months.length<=240&&data.months.every(month)&&(data.selectedMonth===null||month(data.selectedMonth))&&['count','gross','wins','checkedAt'].every(k=>Number.isFinite(data[k]))&&data.count>=0&&data.wins>=0&&data.wins<=data.count&&data.checkedAt>=0&&typeof data.backfillComplete==='boolean'&&data.trades.every(t=>/^\w{1,20}$/.test(t.symbol)&&['LONG','SHORT'].includes(t.side)&&['openedAt','closedAt','entry','stop','target','exit','weight','gross'].every(k=>Number.isFinite(t[k]))&&t.closedAt>t.openedAt&&[1,.5].includes(t.weight));
}
export function saveFeed(storage,month,data){
 if(!validFeed(data))return;
 try{storage.setItem(key(month),JSON.stringify({savedAt:Date.now(),data}));}catch{/* Storage may be disabled or full. */}
}
export function readFeed(storage,month,now=Date.now()){
 try{
  const saved=JSON.parse(storage.getItem(key(month))||'null');
  if(!saved||!Number.isFinite(saved.savedAt)||now-saved.savedAt>30*86400000||saved.savedAt>now+60000||!validFeed(saved.data)||(month&&saved.data.selectedMonth!==month))return null;
  return saved.data;
 }catch{return null;}
}
