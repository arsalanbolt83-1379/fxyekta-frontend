import {fetchWithTimeout} from './network.mjs';
import {validFeed,readFeed,saveFeed} from './live-cache.mjs';
import {currentModelTrade,liveMonths} from './live24-view.mjs';
const endpoint='/api/results';
const fa=new Intl.NumberFormat('fa-IR',{maximumFractionDigits:3}),price=new Intl.NumberFormat('en-US',{maximumSignificantDigits:7});
const date=new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',dateStyle:'medium',timeStyle:'short'});
const signed=n=>(n>=0?'+':'−')+fa.format(Math.abs(n));
let busy=false,loaded=false,icons={},shown=20,rows=[],coldRetries=0,loadedMonth=null,lastCheckedAt=0;
let reviews=new Map(),reviewBusy=false,reviewLoaded=false;
const status=document.querySelector('#live-status'),month=document.querySelector('#live-month');
const text=(tag,value,className)=>{const el=document.createElement(tag);el.textContent=value;if(className)el.className=className;return el;};
function render(){
 const body=document.querySelector('#live-rows');body.replaceChildren();
 for(const original of rows.slice(0,shown)){
  const t=currentModelTrade(original,reviews);
  const tr=document.createElement('tr');tr.className='trade-row';
  const cell=(label,cls)=>{const td=document.createElement('td');td.dataset.label=label;td.className=cls;tr.append(td);return td;};
  const market=cell('بازار / جهت','trade-market'),wrap=text('div','','trade-market-main');
  if(icons[t.symbol]){const mark=text('span','','token-mark'),img=document.createElement('img');img.src=icons[t.symbol];img.alt='';img.width=22;img.height=22;mark.append(img);wrap.append(mark);}
  const name=document.createElement('div'),symbol=text('strong',t.symbol+' / USDT');symbol.dir='ltr';name.append(symbol,text('small',`${t.side==='LONG'?'خرید':'فروش'} · ریسک ${t.weight===1?'کامل':'نصف'}`));wrap.append(name);market.append(wrap);
  const time=cell('زمان ورود / خروج','trade-time');time.append(text('div',date.format(t.openedAt)),text('small','خروج: '+date.format(t.closedAt)));
  const levels=cell('سطوح معامله','trade-levels');for(const [label,n] of [['ورود',t.entry],['استاپ',t.stop],['هدف',t.target]]){const pair=text('div','','price-pair');pair.append(text('span',label),text('bdi',price.format(n)));levels.append(pair);}
  const result=cell('نتیجهٔ استراتژی اختصاصی','trade-results');result.append(text('bdi',signed(t.gross)+' U',t.gross>=0?'positive':'negative'));
  const reason=cell('علت خروج','trade-roi');reason.append(text('span',({TP1:'رسیدن به هدف',STOP:'رسیدن به استاپ',TIME_EXIT:'خروج زمانی'})[t.reason]||'بسته‌شده'));
  const exit=cell('قیمت خروج مدل','trade-pnl');exit.append(text('bdi',price.format(t.exit)));
  if(t.rebased)result.append(text('small','نتیجهٔ پژوهشی'));
  body.append(tr);
 }
 document.querySelector('#live-more').hidden=shown>=rows.length;
 document.querySelector('#live-empty').hidden=rows.length>0;
 document.querySelector('#live-table').hidden=rows.length===0;
 const effective=rows.map(t=>currentModelTrade(t,reviews));
 document.querySelector('#live-count').textContent=fa.format(effective.length);
 document.querySelector('#live-gross').textContent=signed(effective.reduce((n,t)=>n+t.gross,0))+' U';
 document.querySelector('#live-winrate').textContent=effective.length?fa.format(effective.filter(t=>t.gross>0).length/effective.length*100)+'٪':'—';
 renderMonthly();
}
async function loadReview(){
 if(reviewBusy||reviewLoaded)return;reviewBusy=true;
 try{
  const response=await fetchWithTimeout('/live24-review.json',{credentials:'omit'},7000);if(!response.ok)throw Error();
  const data=await response.json();if(data.schemaVersion!==1||data.kind!=='counterfactual_fixed_entries_24h'||!Array.isArray(data.reviews)||data.reviews.length>20000)throw Error();
  reviews=new Map(data.reviews.map(r=>[r.id,r]));reviewLoaded=true;if(loaded)render();else renderMonthly();
 }catch{/* Unverified research never substitutes a recorded outcome. */}finally{reviewBusy=false;}
}
function applyFeed(data,cached=false){
 lastCheckedAt=data.checkedAt;
 const selected=data.selectedMonth;month.replaceChildren();
  for(const m of data.months){const option=document.createElement('option');option.value=m;option.textContent=new Intl.DateTimeFormat('fa-IR-u-ca-gregory',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(m+'-15T12:00:00Z'));month.append(option);}month.value=selected??'';month.disabled=!data.months.length;
  monthlyFeeds.set(data.selectedMonth,data);rows=data.trades;shown=20;render();loaded=true;

  const stale=Date.now()-data.checkedAt>15*60000;
  status.textContent=data.checkedAt?`آخرین بررسی: ${date.format(data.checkedAt)}${stale?' · داده نیاز به تازه‌سازی دارد':''}${!data.backfillComplete?' · در حال تکمیل آرشیو':''}`:'در حال تکمیل آرشیو اولیه…';
 if(cached)status.textContent='نسخهٔ ذخیره‌شده · آخرین بررسی: '+(data.checkedAt?date.format(data.checkedAt):'نامشخص')+' · اتصال برقرار نیست یا دریافت نسخهٔ تازه در جریان است؛ این گزارش تازه نیست.';
}
async function refresh(){
 void loadReview();
 if(busy)return;const requestedMonth=month.value;busy=true;document.querySelector('#live-refresh').disabled=true;document.querySelector('#live-panel').setAttribute('aria-busy','true');status.textContent='در حال دریافت آخرین نتایج…';
 try{const cached=readFeed(localStorage,requestedMonth);if(cached){applyFeed(cached,true);loadedMonth=cached.selectedMonth;}}catch{}
 try{
  month.disabled=true;
  const queryMonth=requestedMonth&&requestedMonth!==month.options[0]?.value?requestedMonth:'';
  let response;
  for(let attempt=0;attempt<2;attempt++){
   try{response=await fetchWithTimeout(endpoint+(queryMonth?'?month='+encodeURIComponent(queryMonth):''),{credentials:'omit'},7000);if(response.ok||response.status<500||attempt===1)break;}catch(error){if(attempt===1)throw error;}
   status.textContent=loaded?'در حال تلاش دوباره؛ آخرین گزارش دریافت‌شده همچنان نمایش داده می‌شود.':'اتصال کند است؛ در حال تلاش دوباره…';
  }
  if(!response)throw new Error('unavailable');
  if(!response.ok){const error=await response.json().catch(()=>({}));if(error.error==='initializing'&&coldRetries++<3){status.textContent='در حال آماده‌سازی آرشیو نتایج…';setTimeout(()=>{if(!document.hidden&&!document.querySelector('#live-panel').hidden)refresh();},5000);return;}throw new Error('unavailable');}const data=await response.json();coldRetries=0;
  if(!validFeed(data))throw new Error('schema');
  applyFeed(data,response.headers.get('X-Results-Stale')==='1');loadedMonth=data.selectedMonth;try{saveFeed(localStorage,requestedMonth,data);if(data.selectedMonth===data.months[0])saveFeed(localStorage,'',data);}catch{}

 }catch{const sameMonth=loaded&&(!requestedMonth||requestedMonth===loadedMonth);if(!sameMonth){rows=[];render();for(const id of ['live-count','live-gross','live-winrate'])document.getElementById(id).textContent='—';}status.textContent=sameMonth?'اتصال موقتاً برقرار نیست؛ نسخهٔ ذخیره‌شده نمایش داده می‌شود. آخرین بررسی: '+(lastCheckedAt?date.format(lastCheckedAt):'نامشخص'):'نتایج این ماه فعلاً در دسترس نیست. برای دریافت دوباره، به‌روزرسانی را بزنید.';}
 finally{month.disabled=!month.options.length;busy=false;document.querySelector('#live-refresh').disabled=false;document.querySelector('#live-panel').setAttribute('aria-busy','false');}
}
document.querySelectorAll('#symbol-grid a').forEach(link=>{const symbol=new URL(link.href).searchParams.get('symbol'),img=link.querySelector('img');if(symbol&&img)icons[symbol]=img.getAttribute('src');});
document.querySelector('#live-refresh').addEventListener('click',refresh);month.addEventListener('change',refresh);
document.querySelector('#live-more').addEventListener('click',()=>{shown+=20;render();});
document.addEventListener('research-panel-change',event=>{if(event.detail==='live')refresh();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!document.querySelector('#live-panel').hidden)refresh();});
setInterval(()=>{if(!document.hidden&&!document.querySelector('#live-panel').hidden)refresh();},120000);

queueMicrotask(()=>{if(!document.querySelector('#live-panel').hidden)refresh();});

// The overview shares the public cached feed; it never triggers a market scan.
const monthlyFeeds=new Map();let monthlyBusy=false,monthlyVisible=false;
const monthlyRoot=document.querySelector('#monthly-results')?.parentElement;
const monthlyGrid=text('div','','month-cells');monthlyGrid.id='monthly-live-results';
const monthlyStatus=text('p','نتایج زنده پس از دریافت داده به این نما اضافه می‌شوند.','archive-note');
if(monthlyRoot){monthlyRoot.append(text('h4','عملکرد زنده · استراتژی اختصاصی'),monthlyGrid,monthlyStatus);}
function renderMonthly(){
 if(!monthlyRoot)return;
 const data=[...monthlyFeeds.values()];monthlyGrid.replaceChildren();
 for(const m of liveMonths(data.flatMap(d=>d.trades),reviews)){
  const card=text('div','','month-cell');
  const label=new Intl.DateTimeFormat('fa-IR-u-ca-gregory',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(m.month+'-15T12:00:00Z'));
  card.append(text('span',label+' · زنده'),text('strong',signed(m.gross)+' U',m.gross>=0?'positive':'negative'),text('small',fa.format(m.count)+' معامله'+(m.rebased?' · '+fa.format(m.rebased)+' نتیجهٔ پژوهشی':'')));monthlyGrid.append(card);
 }
 if(data.length)monthlyStatus.textContent='نتایج زنده پیش از هزینه‌ها · آخرین به‌روزرسانی: '+date.format(Math.min(...data.map(d=>d.checkedAt)));
}
async function refreshMonthly(){
 if(monthlyBusy)return;monthlyBusy=true;void loadReview();
 try{
  try{const cached=readFeed(localStorage,'');if(cached){monthlyFeeds.set(cached.selectedMonth,cached);renderMonthly();monthlyStatus.append(' · نسخهٔ ذخیره‌شده؛ در حال تازه‌سازی');}}catch{}
  const response=await fetchWithTimeout(endpoint,{credentials:'omit'},7000);if(!response.ok)throw Error();
  const latest=await response.json();if(!validFeed(latest))throw Error();
  monthlyFeeds.set(latest.selectedMonth,latest);try{saveFeed(localStorage,'',latest);}catch{}
  for(const m of latest.months){
   if(m===latest.selectedMonth)continue;
   const res=await fetchWithTimeout(endpoint+'?month='+encodeURIComponent(m),{credentials:'omit'},7000);if(!res.ok)throw Error();
   const feed=await res.json();if(!validFeed(feed)||feed.selectedMonth!==m)throw Error();monthlyFeeds.set(m,feed);
  }
  renderMonthly();
 }catch{renderMonthly();monthlyStatus.append(' · اتصال برقرار نیست؛ داده‌ها ممکن است کامل یا تازه نباشند.');}
 finally{monthlyBusy=false;}
}
if(monthlyRoot&&'IntersectionObserver' in window){new IntersectionObserver(entries=>{monthlyVisible=entries.some(e=>e.isIntersecting);if(monthlyVisible)refreshMonthly();},{rootMargin:'150px'}).observe(monthlyRoot);}
else if(monthlyRoot)refreshMonthly();
setInterval(()=>{if(monthlyVisible&&!document.hidden)refreshMonthly();},120000);
