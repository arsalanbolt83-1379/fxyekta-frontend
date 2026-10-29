export function spotDirection(side){return side==='LONG'?{text:'خرید',className:'positive'}:side==='SHORT'?{text:'فروش',className:'negative'}:{text:'—',className:''};}
export function spotOutcome(status,reason,historical=false){
 if(status==='open')return {text:historical?'باز در پایان دوره':'فعال',className:'spot-open'};
 if(['TP1','TP2','target'].includes(reason))return {text:'TP · هدف محقق شد',className:'positive'};
 if(['STOP','stop'].includes(reason))return {text:'SL · حد ضرر',className:'negative'};
 return {text:'بسته‌شده',className:''};
}
export function spotLogo(symbol,icons){const path=icons[symbol]??icons['1000'+symbol];return typeof path==='string'&&/^assets\/coins\/[A-Za-z0-9-]+\.(svg|png|jpg|webp)$/.test(path)?'/'+path:null;}
