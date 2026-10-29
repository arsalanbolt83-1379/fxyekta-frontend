export function matchingReview(trade,reviews){
 if(trade.reason!=='TIME_EXIT'||trade.closedAt-trade.openedAt>=86400000)return {status:'unchanged',hypothetical:{closedAt:trade.closedAt,exit:trade.exit,gross:trade.gross,net:trade.net,reason:trade.reason}};
 const r=reviews.get(trade.id),h=r?.hypothetical;
 if(r?.status!=='verified'||r.actualClosedAt!==trade.closedAt||r.openedAt!==trade.openedAt||r.actualExit!==trade.exit||r.actualGross!==trade.gross||!h||![h.closedAt,h.exit,h.gross,h.net].every(Number.isFinite)||h.closedAt<=trade.closedAt||h.closedAt>trade.openedAt+86400000||h.exit<=0||!['TP1','STOP','TIME_EXIT'].includes(h.reason))return null;
 return r;
}
export function reviewSummary(trades,reviews){
 const matched=trades.map(t=>matchingReview(t,reviews)),complete=matched.filter(Boolean);
 return {count:trades.length,complete:complete.length,actualGross:trades.reduce((n,t)=>n+t.gross,0),hypotheticalGross:complete.length===trades.length?complete.reduce((n,r)=>n+r.hypothetical.gross,0):null};
}
export function currentModelTrade(trade,reviews){
 const review=matchingReview(trade,reviews);
 return {...trade,...(review?.status==='verified'?review.hypothetical:{}),rebased:review?.status==='verified',modelVerified:!!review,actual:trade};
}
export function liveMonths(trades,reviews,{recorded=false}={}){
 const groups=new Map(),seen=new Set();
 for(const original of trades){
  if(seen.has(original.id))continue;seen.add(original.id);
  const t=recorded?{...original,rebased:false,modelVerified:true}:currentModelTrade(original,reviews);
  const key=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit'}).formatToParts(t.closedAt);
  const month=key.find(p=>p.type==='year').value+'-'+key.find(p=>p.type==='month').value;
  const g=groups.get(month)||{month,count:0,gross:0,rebased:0,pending:0};
  g.count++;g.gross+=t.gross;g.rebased+=Number(t.rebased);g.pending+=Number(!t.modelVerified);groups.set(month,g);
 }
 return [...groups.values()].sort((a,b)=>a.month.localeCompare(b.month));
}
