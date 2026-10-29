import {fetchWithTimeout} from './network.mjs';
import {tradeRow,sortedTrades} from './trade-view.mjs';
import {leveragedSummary} from './calculator.mjs';
import {icon} from './icons.mjs';
const fa=new Intl.NumberFormat('fa-IR',{maximumFractionDigits:2});
let research,basis='gross',shown=10,marketFilter='all';

const names={BTC:'Bitcoin',ETH:'Ethereum',SOL:'Solana',BNB:'BNB',XRP:'XRP',DOGE:'Dogecoin',ADA:'Cardano',LINK:'Chainlink',AVAX:'Avalanche',LTC:'Litecoin',BCH:'Bitcoin Cash',DOT:'Polkadot',TRX:'TRON',UNI:'Uniswap',AAVE:'Aave',ETC:'Ethereum Classic',NEAR:'NEAR',APT:'Aptos',ATOM:'Cosmos',FIL:'Filecoin',ZEC:'Zcash',SUI:'Sui',ENA:'Ethena',DASH:'Dash',TAO:'Bittensor',ICP:'Internet Computer',STRK:'Starknet',ZK:'ZKsync',WLD:'Worldcoin',WIF:'dogwifhat',ARB:'Arbitrum',FET:'Artificial Superintelligence',HBAR:'Hedera',TIA:'Celestia',CRV:'Curve',XLM:'Stellar',OP:'Optimism',INJ:'Injective',ONDO:'Ondo',SEI:'Sei',LDO:'Lido',RENDER:'Render',PENDLE:'Pendle',ALGO:'Algorand',JUP:'Jupiter',POL:'Polygon'};
const signed=(n,digits=2)=>(n>=0?'+':'−')+Math.abs(n).toFixed(digits);
function scenarioInputs(){return {balance:Number(document.querySelector('#initial-balance').value),marginPercent:Number(document.querySelector('#margin-level').value),leverage:Number(document.querySelector('#leverage-level').value),basis};}
function updateLeverage(){
 const inputs=scenarioInputs();
 if(!document.querySelector('#initial-balance').checkValidity()){
  document.querySelector('#leverage-total').textContent='—';document.querySelector('#leverage-dollars').textContent='سرمایهٔ معتبر وارد کنید.';renderTrades();return;
 }
 const result=leveragedSummary(research.trades,inputs);
 document.querySelector('#leverage-output').textContent=inputs.leverage+'×';
 document.querySelector('#table-leverage').textContent=inputs.leverage+'×';
 document.querySelector('#leverage-basis').textContent=basis==='gross'?'جمع حسابی قبل از هزینه‌ها':'جمع حسابی با هزینه‌های مدل';
 document.querySelector('#leverage-total').textContent=signed(result.percent)+'%';
 document.querySelector('#leverage-dollars').textContent=`برآورد حسابی: ${fa.format(result.pnl)} دلار روی ${fa.format(inputs.balance)} دلار سرمایهٔ اولیه`;
 document.querySelector('#leverage-warning').textContent=result.wideStops?`در ${fa.format(result.wideStops)} معامله از ${fa.format(result.count)} معامله، زیانِ استاپ در این اهرم از کل مارجین اولیه بیشتر یا برابر می‌شود. این شمارش، تعداد لیکوییدشدن‌های واقعی نیست. برای محاسبهٔ دقیق باید مسیر مارک‌پرایس و قواعد صرافی بررسی شود.`:'فاصلهٔ استاپ‌ها در آزمون ساده زیر مارجین اولیه است؛ این بررسی، تأیید ایمنی یا شبیه‌سازی لیکوییدشدن نیست.';
 
 
 document.querySelector('#leverage-status').textContent='سناریوی اهرم انتخابی · محاسبهٔ حسابی';
 renderTrades();
}
function initMotion(){
 const portal=document.querySelector('.market-portal');if(portal&&'IntersectionObserver' in window){new IntersectionObserver(entries=>{portal.classList.toggle('in-view',entries[0].isIntersecting&&!document.hidden);},{threshold:.15}).observe(portal);document.addEventListener('visibilitychange',()=>{if(document.hidden)portal.classList.remove('in-view');else{const r=portal.getBoundingClientRect();portal.classList.toggle('in-view',r.bottom>0&&r.top<innerHeight);}});}
 if(!matchMedia('(max-width:800px)').matches&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&'IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-revealed');observer.unobserve(entry.target);}}),{threshold:.08});
  document.querySelectorAll('.section-heading,.process article,.chart-invite,.faq-section,.final-cta').forEach((element,i)=>{element.classList.add('reveal-item');element.style.setProperty('--reveal-delay',(i%3)*75+'ms');observer.observe(element);});
 }
 if('IntersectionObserver' in window){const radar=document.querySelector('.radar-shell'),track=document.querySelector('#radar-track');const observer=new IntersectionObserver(entries=>{track.classList.toggle('offscreen',!entries[0].isIntersecting);});if(radar)observer.observe(radar);}
 const pause=document.querySelector('#radar-pause');pause.addEventListener('click',()=>{const stopped=pause.getAttribute('aria-pressed')!=='true';pause.setAttribute('aria-pressed',String(stopped));pause.setAttribute('aria-label',stopped?'ادامهٔ حرکت نوار ارزها':'توقف حرکت نوار ارزها');pause.firstElementChild.textContent=stopped?'▷':'Ⅱ';document.querySelector('#radar-track').classList.toggle('paused',stopped);});
}
function drawCurve(svg,field){
 const points=research.curve,box=svg.viewBox.baseVal,W=box.width,H=box.height,pad=10,min=Math.min(0,...points.map(p=>p[field]))-1.5,max=Math.max(...points.map(p=>p[field]))+2.5;
 const x=at=>pad+(at-points[0].at)/(points.at(-1).at-points[0].at)*(W-pad*2),y=n=>H-pad-(n-min)/(max-min)*(H-pad*2);
 const coords=points.map(p=>`${x(p.at).toFixed(2)},${y(p[field]).toFixed(2)}`),line='M'+coords.join(' L'),last=points.at(-1),id='fill-'+field+'-'+Math.random().toString(36).slice(2,8);
 const grid=Array.from({length:5},(_,i)=>{const yy=pad+i*(H-pad*2)/4;return `<line x1="0" y1="${yy}" x2="${W}" y2="${yy}" stroke="#8bf5b00c" stroke-dasharray="3 7"/>`;}).join('');
 const vertical=Array.from({length:7},(_,i)=>`<line x1="${i*W/6}" y1="0" x2="${i*W/6}" y2="${H}" stroke="#8bf5b007"/>`).join('');
 svg.innerHTML=`<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8bf5b0" stop-opacity=".21"/><stop offset="100%" stop-color="#8bf5b0" stop-opacity="0"/></linearGradient></defs>${grid}${vertical}<path d="${line} L${x(last.at)},${H} L${x(points[0].at)},${H} Z" fill="url(#${id})"/><path d="${line}" pathLength="1000" fill="none" stroke="#90efb1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${x(last.at)}" cy="${y(last[field])}" r="7" fill="#8bf5b018"/><circle cx="${x(last.at)}" cy="${y(last[field])}" r="3" fill="#c8ffda"/>`;
}
function updateScenario(){
 const risk=Number(document.querySelector('#risk-level').value),result=research.metrics[basis]*risk;
 document.querySelector('#scenario-return').textContent=signed(result)+'%';
 document.querySelector('#scenario-example').textContent=`سرمایهٔ فرضی ۱٬۰۰۰ دلار ← سود ${fa.format(result*10)} دلار`;
 document.querySelector('#curve-value').textContent=signed(research.metrics[basis])+' U';
}
function renderTrades(){
 const filter=document.querySelector('#trade-filter').value,sort=document.querySelector('#trade-sort').value;
 const trades=sortedTrades(research.trades,filter,sort),assumptions=document.querySelector('#initial-balance').checkValidity()?scenarioInputs():null;
 document.querySelector('#trade-rows').innerHTML=trades.slice(0,shown).map(t=>tradeRow(t,research.icons,assumptions)).join('');
 document.querySelector('#trade-count').textContent=`نمایش ${fa.format(Math.min(shown,trades.length))} از ${fa.format(trades.length)} معامله`;
 document.querySelector('#more-trades').hidden=shown>=trades.length;
}
function renderSymbols(){
 const query=document.querySelector('#symbol-search').value.trim().toUpperCase(),traded=new Set(research.trades.map(t=>t.symbol));
 const symbols=research.symbols.filter(s=>(marketFilter==='all'||traded.has(s))&&(`${s} ${names[s]||''}`).toUpperCase().includes(query));
 document.querySelector('#symbol-grid').innerHTML=symbols.length?symbols.map(s=>{

  return `<a class="symbol-tile" href="charts.html?symbol=${encodeURIComponent(s)}" aria-label="مشاهدهٔ چارت ${s}"><span class="token-mark"><img src="${research.icons[s]}" alt="" width="22" height="22" loading="lazy" decoding="async"></span><span><strong>${s}</strong><small>${(names[s]||s.replace(/^1000/,'')).toUpperCase()}</small></span><span class="tile-arrow">${icon('arrow-up-right')}</span></a>`;
 }).join(''):'<p class="symbol-empty">نمادی پیدا نشد. نام کوتاه ارز را امتحان کنید.</p>';
 document.querySelector('#market-count').textContent=`${fa.format(symbols.length)} بازار از ${fa.format(research.symbols.length)} بازار`;
}
function setPanel(name){
 document.querySelectorAll('[data-panel]').forEach(b=>{const active=b.dataset.panel===name;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});
 document.querySelectorAll('.research-panel[role=tabpanel]').forEach(p=>p.hidden=p.id!==name+'-panel');
 document.dispatchEvent(new CustomEvent('research-panel-change',{detail:name}));
}
document.querySelectorAll('[data-panel]').forEach(b=>{b.addEventListener('click',()=>setPanel(b.dataset.panel));b.addEventListener('keydown',e=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;e.preventDefault();const tabs=[...document.querySelectorAll('[data-panel]')],i=tabs.indexOf(b),next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowLeft'?1:-1)+tabs.length)%tabs.length;setPanel(tabs[next].dataset.panel);tabs[next].focus();});});
  const openSection=name=>{setPanel(name);document.getElementById(name+'-panel').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});};
  document.querySelectorAll('[data-research-panel]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();history.replaceState(null,'',link.getAttribute('href'));openSection(link.dataset.researchPanel);}));
  const linkedPanel={'#method-panel':'method','#live-panel':'live','#trades-panel':'trades'}[location.hash];if(linkedPanel)openSection(linkedPanel);

async function init(){
 try{
  const response=await fetchWithTimeout('research.json',{},10000);if(!response.ok)throw new Error('data');research=await response.json();
  // Initial curves are already rendered in HTML; redraw only when the user changes basis.
  const months=['ژانویه','فوریه','مارس','آوریل','مه','ژوئن','ژوئیه','اوت','سپتامبر'];
  document.querySelector('#monthly-results').innerHTML=research.monthly.map((m,i)=>`<div class="month-cell"><span>${months[i]}</span><strong class="${m.net>=0?'positive':'negative'}">${signed(m.net)}</strong></div>`).join('');
  updateScenario();updateLeverage();
  document.querySelectorAll('[data-basis]').forEach(b=>b.addEventListener('click',()=>{basis=b.dataset.basis;document.querySelectorAll('[data-basis]').forEach(el=>{el.classList.toggle('active',el===b);el.setAttribute('aria-pressed',String(el===b));});drawCurve(document.querySelector('.large-chart'),basis);updateScenario();updateLeverage();}));
  document.querySelector('#risk-level').addEventListener('change',updateScenario);
  ['leverage-level','initial-balance','margin-level'].forEach(id=>document.getElementById(id).addEventListener('input',updateLeverage));
  document.querySelector('#open-leveraged-trades').addEventListener('click',event=>{event.preventDefault();setPanel('trades');document.querySelector('#trades-panel').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});});
  ['trade-filter','trade-sort'].forEach(id=>document.getElementById(id).addEventListener('change',()=>{shown=10;renderTrades();}));
  document.querySelector('#more-trades').addEventListener('click',()=>{shown+=20;renderTrades();});
  document.querySelector('#symbol-search').addEventListener('input',renderSymbols);
  document.querySelectorAll('[data-markets]').forEach(b=>b.addEventListener('click',()=>{marketFilter=b.dataset.markets;document.querySelectorAll('[data-markets]').forEach(el=>{el.classList.toggle('active',el===b);el.setAttribute('aria-pressed',String(el===b));});renderSymbols();}));
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();document.querySelector('#symbol-search').focus();}});
 }catch{console.warn('Research enhancement unavailable; static report retained.');}
}
initMotion();
init();
