/** Price-path arithmetic only. This is not a leveraged account/liquidation replay. */
export function leveragedTrade(trade,{balance,marginPercent,leverage,basis='gross'}){
 if(!Number.isFinite(balance)||balance<1||!Number.isFinite(marginPercent)||marginPercent<=0||marginPercent>100||!Number.isInteger(leverage)||leverage<1||leverage>100||!['gross','net'].includes(basis)||!(trade.entry>0)||!(trade.weight>0))throw new Error('Invalid scenario');
 const stopFraction=Math.abs(trade.entry-trade.stop)/trade.entry;
 const margin=balance*marginPercent/100*trade.weight,notional=margin*leverage;
 const priceReturn=trade[basis]/trade.weight*stopFraction;
 const roi=priceReturn*leverage*100,pnl=notional*priceReturn;
 return {margin,notional,pnl,roi,accountPercent:pnl/balance*100,stopExceedsMargin:stopFraction*leverage>=1,stopFraction};
}
export function leveragedSummary(trades,assumptions){
 const results=trades.map(t=>leveragedTrade(t,assumptions));
 const pnl=results.reduce((sum,r)=>sum+r.pnl,0),wideStops=results.filter(r=>r.stopExceedsMargin).length;
 return {pnl,percent:pnl/assumptions.balance*100,wideStops,count:results.length,results};
}
