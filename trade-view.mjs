import {leveragedTrade} from './calculator.mjs';
const price=new Intl.NumberFormat('en-US',{maximumSignificantDigits:7});
const day=new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',year:'numeric',month:'short',day:'numeric'});
const clock=new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',hour:'2-digit',minute:'2-digit'});
const signed=(n,digits=2)=>(n>=0?'+':'−')+Math.abs(n).toFixed(digits);
export function sortedTrades(trades,filter='all',sort='newest'){
 const compare={newest:(a,b)=>b.openedAt-a.openedAt,oldest:(a,b)=>a.openedAt-b.openedAt,'best-net':(a,b)=>b.net-a.net,'worst-net':(a,b)=>a.net-b.net,market:(a,b)=>a.symbol.localeCompare(b.symbol)||b.openedAt-a.openedAt};
 return trades.filter(t=>filter==='all'||(filter==='profit'?t.net>0:t.net<=0)).sort(compare[sort]||compare.newest);
}
export function tradeRow(t,icons,assumptions){
 const leveraged=assumptions?leveragedTrade(t,assumptions):null,positive=n=>n>=0?'positive':'negative';
 const levels=[['ورود',t.entry],['استاپ',t.stop],['هدف',t.target]].map(([label,value])=>`<div class="price-pair"><span>${label}</span><bdi>${price.format(value)}</bdi></div>`).join('');
 return `<tr class="trade-row">
 <td class="trade-market" data-label="بازار"><div class="trade-market-main"><span class="token-mark"><img src="${icons[t.symbol]}" alt="" width="22" height="22" loading="lazy"></span><div><strong dir="ltr">${t.symbol}<small> / USDT</small></strong><div class="trade-badges"><span class="side-badge ${t.side==='LONG'?'buy':'sell'}">${t.side==='LONG'?'خرید':'فروش'}</span><span class="size-badge">ریسک ${t.weight===1?'کامل':'نصف'}</span></div></div></div></td>
 <td class="trade-time" data-label="زمان ورود"><time datetime="${new Date(t.openedAt).toISOString()}"><span>${day.format(t.openedAt)}</span><small>${clock.format(t.openedAt)} · تهران</small></time></td>
 <td class="trade-levels" data-label="سطوح معامله">${levels}</td>
 <td class="trade-results" data-label="نتیجه / U"><div class="result-pair"><span>قبل هزینه</span><bdi class="${positive(t.gross)}">${signed(t.gross,3)}</bdi></div><div class="result-pair"><span>با هزینه</span><bdi class="${positive(t.net)}">${signed(t.net,3)}</bdi></div></td>
 <td class="trade-roi" data-label="بازده حسابی مارجین"><bdi class="${leveraged?positive(leveraged.roi):''}">${leveraged?signed(leveraged.roi)+'%':'—'}</bdi>${leveraged?.stopExceedsMargin?'<span class="margin-flag" title="اگر قیمت به استاپ برسد، زیان از مارجین اولیه بیشتر یا برابر می‌شود؛ لیکوییدشدن قطعی شبیه‌سازی نشده است.">فرض اهرم</span>':''}</td>
 <td class="trade-pnl" data-label="سود/زیان حسابی، دلار"><bdi class="${leveraged?positive(leveraged.pnl):''}">${leveraged?signed(leveraged.pnl):'—'}</bdi><small>دلار</small></td>
 </tr>`;
}
