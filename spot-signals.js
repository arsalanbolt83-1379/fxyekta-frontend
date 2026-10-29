import {fetchWithTimeout} from './network.mjs';
const section=document.querySelector('#spot-signals');
if(section){
 const status=section.querySelector('[data-spot-status]'),list=section.querySelector('[data-spot-list]'),button=section.querySelector('button'),fmt=new Intl.NumberFormat('en-US',{maximumSignificantDigits:7}),date=new Intl.DateTimeFormat('fa-IR',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Tehran'});let busy=false,visible=false;
 const el=(tag,value,cls)=>{const n=document.createElement(tag);n.textContent=value;if(cls)n.className=cls;return n;};
 async function load(){if(busy)return;busy=true;button.disabled=true;try{
  const r=await fetchWithTimeout('/api/spot-signals',{cache:'no-cache'},10000);if(!r.ok)throw Error('unavailable');const data=await r.json();if(!Array.isArray(data.signals))throw Error('invalid');
  const fragment=document.createDocumentFragment();for(const s of data.signals){if(!/^[A-Z0-9]{1,20}$/.test(s.symbol)||![s.entry,s.stop,s.target].every(n=>Number.isFinite(n)&&n>0))continue;
   const card=el('article','','spot-card'),head=el('div','','spot-card-head');head.append(el('strong',s.symbol+' / USDT'),el('span',s.status==='open'?'فعال':s.reason==='target'?'هدف محقق شد':'حد ضرر',s.status==='open'?'spot-open':s.reason==='target'?'positive':'negative'));card.append(head,el('small','اسپات • خرید • بدون اهرم'));
   const levels=el('dl','','spot-levels');for(const [label,value] of [['ورود',s.entry],['استاپ',s.stop],['هدف',s.target]]){const pair=el('div','');pair.append(el('dt',label),el('dd',fmt.format(value)));levels.append(pair);}card.append(levels,el('small','انتشار: '+date.format(s.openedAt)));
   if(s.status==='closed'&&Number.isFinite(s.priceChangePct)){card.append(el('p',(s.priceChangePct>=0?'+':'')+fmt.format(s.priceChangePct)+'٪ تغییر قیمت',s.priceChangePct>=0?'positive':'negative'),el('small','خروج: '+fmt.format(s.exit)+' تتر • '+date.format(s.closedAt)));}fragment.append(card);
  }list.replaceChildren(fragment);status.textContent=data.signals.length?'آخرین دریافت: '+date.format(Date.now())+'؛ تغییر قیمت پیش از هزینه‌هاست.':'هنوز سیگنال اسپات جدیدی منتشر نشده؛ اولین فرصت معتبر همین‌جا نمایش داده می‌شود.';
 }catch{status.textContent='دریافت وضعیت اسپات فعلاً ممکن نیست؛ دوباره به‌روزرسانی کنید.';}finally{busy=false;button.disabled=false;}}
 button.addEventListener('click',load);if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible&&!list.children.length)load();}).observe(section);else{visible=true;load();}setInterval(()=>{if(visible&&!document.hidden)load();},120000);
}
