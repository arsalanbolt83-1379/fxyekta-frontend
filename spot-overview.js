import {fetchWithTimeout} from './network.mjs';
import history from './spot-history.mjs';
import {spotDirection,spotOutcome,spotLogo} from './spot-view.mjs';
const section=document.querySelector('#spot-signals');
if(section){
 const status=section.querySelector('[data-spot-status]'),list=section.querySelector('[data-spot-list]'),button=section.querySelector('[data-spot-refresh]'),more=section.querySelector('[data-spot-more]'),statsRoot=section.querySelector('[data-spot-stats]'),monthsRoot=section.querySelector('[data-spot-months]');
 const fmt=new Intl.NumberFormat('en-US',{maximumSignificantDigits:7}),fa=new Intl.NumberFormat('fa-IR',{maximumFractionDigits:2}),date=new Intl.DateTimeFormat('fa-IR',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Tehran'});
 let busy=false,visible=false,page=0,records=new Map(),filter='all',view='backtest',loadedAt=0;
 const tabs=[...section.querySelectorAll('[data-spot-view]')],livePanel=section.querySelector('#spot-live-panel'),historyPanel=section.querySelector('#spot-backtest-panel');
 function selectView(next,focus=false){view=next;tabs.forEach(t=>{const selected=t.dataset.spotView===view;t.setAttribute('aria-selected',String(selected));t.tabIndex=selected?0:-1;if(selected&&focus)t.focus();});historyPanel.hidden=view!=='backtest';livePanel.hidden=view!=='live';button.hidden=view!=='live';if(view==='live'&&Date.now()-loadedAt>=120000)load();}
 tabs.forEach((tab,index)=>{tab.addEventListener('click',()=>selectView(tab.dataset.spotView));tab.addEventListener('keydown',event=>{let target;if(event.key==='ArrowLeft')target=(index+1)%tabs.length;else if(event.key==='ArrowRight')target=(index-1+tabs.length)%tabs.length;else if(event.key==='Home')target=0;else if(event.key==='End')target=tabs.length-1;else return;event.preventDefault();selectView(tabs[target].dataset.spotView,true);});});
 const el=(tag,value,cls)=>{const n=document.createElement(tag);n.textContent=value;if(cls)n.className=cls;return n;};const signed=n=>(n>=0?'+':'−')+fa.format(Math.abs(n));
 const coinLabel=symbol=>{const label=el('span','','spot-coin-label'),src=spotLogo(symbol,history.icons);if(src){const img=document.createElement('img');img.src=src;img.alt='';img.width=24;img.height=24;img.loading='lazy';img.decoding='async';label.append(img);}label.append(el('strong',symbol));return label;};
 const historical=section.querySelector('[data-spot-history]');
 if(historical){
  historical.append(el('h4','بک‌تست مرجع اسپات · ژانویه تا سپتامبر ۲۰۲۶'));
  const stats=el('div','','spot-stats');
  for(const [label,value] of [['تعداد ورود',fa.format(history.stats.signals)],['باز در پایان دوره',fa.format(history.stats.open)],['بسته‌شده',fa.format(history.stats.closed)],['خالص تحقق‌یافته',signed(history.stats.realizedNetR)+' R']]){const card=el('div','','spot-stat');card.append(el('small',label),el('strong',value));stats.append(card);}historical.append(stats,el('p','دادهٔ بایننس اسپات، با هزینه‌های مدل؛ R واحد ریسک است. ورودهای مرجع ساعت ۱۰ تا ۲۲ بوده‌اند؛ اسکن زنده اکنون شبانه‌روزی است.','subtle-note'));
  const archive=el('details','','spot-history-archive');archive.append(el('summary','آرشیو '+fa.format(history.trades.length)+' معاملهٔ بک‌تست'));
  const wrap=el('div','','spot-history-scroll'),table=el('table','','spot-history-table'),head=el('thead',''),hr=el('tr','');for(const label of ['ارز','جهت','ورود','استاپ','هدف','نتیجه / خروج'])hr.append(el('th',label));head.append(hr);table.append(head);const body=el('tbody','');
  for(const t of [...history.trades].reverse()){const row=el('tr',''),market=el('td',''),side=spotDirection(t.side),outcome=spotOutcome(t.status,t.reason,true);market.append(coinLabel(t.symbol));row.append(market,el('td',side.text,'spot-direction '+side.className));for(const value of [t.entry,t.stop,t.target])row.append(el('td',fmt.format(value)));const result=el('td','');result.append(el('span',outcome.text,'spot-outcome '+outcome.className));if(t.status==='closed'&&Number.isFinite(t.exit))result.append(el('small','خروج: '+fmt.format(t.exit),'spot-exit-price'));row.append(result);body.append(row);}table.append(body);wrap.append(table);archive.append(wrap);historical.append(archive);
 }
 function render(){
  const fragment=document.createDocumentFragment();for(const s of records.values()){
   if(filter!=='all'&&s.status!==filter)continue;
   const card=el('article','','spot-card'),head=el('div','','spot-card-head'),outcome=spotOutcome(s.status,s.reason),side=spotDirection(s.side);head.append(coinLabel(s.symbol),el('span',outcome.text,'spot-outcome '+outcome.className));card.append(head,el('small','اسپات • '+side.text+' • بدون اهرم','spot-direction '+side.className));
   const levels=el('dl','','spot-levels');for(const [label,value] of [['ورود',s.entry],['استاپ',s.stop],['هدف',s.target]]){const pair=el('div','');pair.append(el('dt',label),el('dd',fmt.format(value)));levels.append(pair);}card.append(levels,el('small','انتشار: '+date.format(s.openedAt)),el('small','آخرین بررسی: '+date.format(s.checkedAt)));
   if(s.status==='closed'&&Number.isFinite(s.priceChangePct)){card.append(el('p',signed(s.priceChangePct)+'٪ تغییر قیمت',s.priceChangePct>=0?'positive':'negative'),el('small','خروج: '+fmt.format(s.exit)+' تتر • '+date.format(s.closedAt)));}fragment.append(card);
  }list.replaceChildren(fragment);
 }
 function summary(data){
  const s=data.stats??{},fragment=document.createDocumentFragment();for(const [label,value,cls] of [['سیگنال منتشرشده',fa.format(s.published??0),''],['معاملات فعال',fa.format(s.open??0),''],['معاملات بسته‌شده',fa.format(s.closed??0),''],['نتیجهٔ بسته‌ها · R',signed(s.grossR??0),(s.grossR??0)>=0?'positive':'negative']]){const card=el('div','','spot-stat');card.append(el('small',label),el('strong',value,cls));fragment.append(card);}statsRoot.replaceChildren(fragment);
  const months=document.createDocumentFragment();for(const m of data.months??[]){if(!/^20\d{2}-\d{2}$/.test(m.month)||!Number.isFinite(m.grossR))continue;const card=el('div','','month-cell'),label=new Intl.DateTimeFormat('fa-IR-u-ca-gregory',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(m.month+'-15T12:00:00Z'));card.append(el('span',label+' · اسپات'),el('strong',signed(m.grossR)+' R',m.grossR>=0?'positive':'negative'),el('small',fa.format(m.count)+' معاملهٔ بسته'));months.append(card);}monthsRoot.replaceChildren(months);
 }
 async function load(reset=true){if(busy)return;busy=true;button.disabled=true;more.disabled=true;try{
  const next=reset?0:page+1,r=await fetchWithTimeout('/api/spot-signals?page='+next,{credentials:'omit',cache:'no-cache'},10000);if(!r.ok)throw Error('unavailable');const data=await r.json();if(!Array.isArray(data.signals))throw Error('invalid');
  const incoming=data.signals.filter(s=>/^[A-Z0-9]{1,20}$/.test(s.symbol)&&[s.entry,s.stop,s.target,s.openedAt,s.checkedAt].every(n=>Number.isFinite(n)&&n>0)&&['open','closed'].includes(s.status));if(incoming.length!==data.signals.length)throw Error('invalid');
  if(reset)records=new Map();for(const s of incoming)records.set(s.id,s);page=next;loadedAt=Date.now();more.hidden=!data.hasMore;summary(data);render();status.textContent=records.size?'آخرین دریافت: '+date.format(Date.now())+'؛ نتایج پیش از هزینه‌ها و مستقل از فیوچرز هستند.':'هنوز سیگنال اسپات جدیدی منتشر نشده؛ اولین فرصت معتبر همین‌جا نمایش داده می‌شود.';
 }catch{status.textContent='دریافت وضعیت اسپات فعلاً ممکن نیست؛ داده‌های قبلی ممکن است تازه نباشند.';}finally{busy=false;button.disabled=false;more.disabled=false;}}
 button.addEventListener('click',()=>load());more.addEventListener('click',()=>load(false));
 section.querySelectorAll('[data-spot-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.spotFilter;section.querySelectorAll('[data-spot-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render();}));
 document.querySelectorAll('a[href="#spot-signals"]').forEach(a=>a.addEventListener('click',()=>document.querySelector('#overview-tab')?.click()));
 if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible&&view==='live'&&Date.now()-loadedAt>=120000)load();}).observe(livePanel);else visible=true;setInterval(()=>{if(visible&&view==='live'&&!document.hidden)load();},120000);
}
