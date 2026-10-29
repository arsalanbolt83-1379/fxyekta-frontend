let activeSymbol=null,generation=0,disposeChart=()=>{};
const symbolMap={};
function mountChart(symbol){
 activeSymbol=symbol;const token=++generation,tvSymbol='TOOBIT:'+symbol+'USDT.P';
 document.querySelectorAll('[data-symbol]').forEach(b=>{b.classList.toggle('active',b.dataset.symbol===symbol);b.setAttribute('aria-pressed',String(b.dataset.symbol===symbol));});
 document.querySelector('#selected-market').textContent=(symbolMap[symbol]||symbol)+' / USDT — TOOBIT FUTURES';
 document.querySelector('#external-chart').href='https://www.tradingview.com/chart/?symbol='+encodeURIComponent(tvSymbol);
 history.replaceState(null,'','charts.html?symbol='+encodeURIComponent(symbol));
 const layer=document.querySelector('#widget-layer');layer.classList.add('loading');layer.replaceChildren();
 const container=document.createElement('div');container.className='tradingview-widget-container';
 const widget=document.createElement('div');widget.className='tradingview-widget-container__widget';container.append(widget);
 const credit=document.createElement('div');credit.className='tradingview-widget-copyright';const creditLink=document.createElement('a');creditLink.href=document.querySelector('#external-chart').href;creditLink.target='_blank';creditLink.rel='noopener';creditLink.textContent=(symbolMap[symbol]||symbol)+' chart by TradingView';credit.append(creditLink);container.append(credit);
 const script=document.createElement('script');script.src='https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';script.async=true;
 script.textContent=JSON.stringify({autosize:true,symbol:tvSymbol,interval:'60',timezone:'Asia/Tehran',theme:'dark',style:'1',locale:'en',backgroundColor:'#0a110d',gridColor:'rgba(139,245,176,0.04)',allow_symbol_change:false,calendar:false,hide_side_toolbar:matchMedia('(max-width:800px)').matches,hide_volume:matchMedia('(max-width:800px)').matches,save_image:!matchMedia('(max-width:800px)').matches,support_host:'https://www.tradingview.com'});
 let loadTimer;const observer=new MutationObserver(()=>{const iframe=container.querySelector('iframe');if(iframe){iframe.addEventListener('load',()=>{if(token===generation){clearTimeout(loadTimer);layer.classList.remove('loading');document.querySelector('#chart-fallback').hidden=true;}});observer.disconnect();}});observer.observe(container,{childList:true,subtree:true});
 script.onerror=()=>showFailure(token);container.append(script);layer.append(container);
 document.querySelector('#chart-fallback').hidden=false;document.querySelector('#chart-fallback h2').textContent='در حال اتصال به چارت…';
 loadTimer=setTimeout(()=>{if(layer.classList.contains('loading'))showFailure(token);},12000);
 disposeChart=()=>{clearTimeout(loadTimer);observer.disconnect();};
}
function showFailure(token){if(token!==generation)return;document.querySelector('#chart-fallback').hidden=false;document.querySelector('#chart-fallback h2').textContent='اتصال به چارت برقرار نشد';document.querySelector('#chart-fallback p').textContent='بارگیری TradingView کند یا قطع شده است؛ دوباره تلاش کنید یا چارت را مستقیم باز کنید.';}
function init(){
 try{
  const symbols=[...document.querySelectorAll('#chart-watchlist [data-symbol]')].map(b=>b.dataset.symbol);
  document.querySelectorAll('[data-symbol]').forEach(b=>b.addEventListener('click',()=>mountChart(b.dataset.symbol)));
  const search=document.querySelector('#chart-symbol-search');
  const buttons=[...document.querySelectorAll('#chart-watchlist [data-symbol]')];
  function filterSymbols(){
   const query=search.value.trim().toUpperCase().replace(/[^A-Z0-9]/g,'').replace(/USDT$/, '');
   let count=0;for(const button of buttons){const symbol=button.dataset.symbol;button.hidden=!(symbol.includes(query)||(symbolMap[symbol]||symbol).includes(query));if(!button.hidden)count++;}
   document.querySelector('#chart-search-status').textContent=count+' نماد';
   document.querySelector('#chart-search-empty').hidden=count!==0;
  }
  search.addEventListener('input',filterSymbols);
  search.addEventListener('keydown',event=>{if(event.key==='Enter'){const first=buttons.find(button=>!button.hidden);if(first)mountChart(first.dataset.symbol);}if(event.key==='Escape'){search.value='';filterSymbols();}});
  filterSymbols();

  const wanted=new URL(location.href).searchParams.get('symbol');mountChart(symbols.includes(wanted)?wanted:'BTC');
  document.querySelector('#retry-chart').addEventListener('click',()=>mountChart(activeSymbol||'BTC',true));
 }catch{document.querySelector('#chart-fallback h2').textContent='فهرست بازارها بارگیری نشد';}
}
init();
