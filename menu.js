import {icon} from './icons.mjs';
const currentPath=location.pathname.replace(/\/+$/,'')||'/';
document.querySelectorAll('.nav-links a').forEach(a=>{const u=new URL(a.href,location.href),path=u.pathname.replace(/\/+$/,'')||'/';if(!u.hash&&((currentPath.startsWith('/blog')&&path==='/blog')||path===currentPath))a.remove();});
const trigger=document.querySelector('.menu-toggle');
if(trigger){
 const drawer=document.createElement('aside');drawer.id='mobile-menu';drawer.className='mobile-drawer';drawer.setAttribute('role','dialog');drawer.setAttribute('aria-modal','true');drawer.setAttribute('aria-label','منوی اصلی');drawer.inert=true;drawer.setAttribute('aria-hidden','true');
 drawer.innerHTML=`<div class="drawer-head"><strong dir="ltr">Fx<span>Yekta</span></strong><button type="button" class="drawer-close" aria-label="بستن منو">${icon('close')}</button></div><nav aria-label="منوی موبایل"></nav><div class="drawer-foot"><span>FROM DATA TO DECISION</span><a class="button" href="https://t.me/fxyektasignalbot" target="_blank" rel="noopener">ورود به کانال VIP ${icon('arrow-up-right')}</a></div>`;
 document.querySelectorAll('.nav-links a').forEach((a,i)=>{const link=a.cloneNode(true);link.style.setProperty('--i',i);drawer.querySelector('nav').append(link);});
 document.body.append(drawer);trigger.setAttribute('aria-controls',drawer.id);
 let open=false,background=[],previousOverflow='';
 function toggle(value){
  if(open===value)return;open=value;trigger.setAttribute('aria-expanded',String(open));drawer.inert=!open;drawer.setAttribute('aria-hidden',String(!open));drawer.classList.toggle('is-open',open);
  if(open){previousOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';background=[...document.body.children].filter(el=>el!==drawer&&el.tagName!=='SCRIPT').map(el=>[el,el.inert]);background.forEach(([el])=>el.inert=true);requestAnimationFrame(()=>{if(open)drawer.querySelector('button').focus();});}
  else{document.documentElement.style.overflow=previousOverflow;background.forEach(([el,was])=>el.inert=was);trigger.focus();}
 }
 trigger.addEventListener('click',()=>toggle(!open));drawer.querySelector('button').addEventListener('click',()=>toggle(false));drawer.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>toggle(false)));
 drawer.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();toggle(false);}if(e.key==='Tab'){const items=[...drawer.querySelectorAll('button,a[href]')],first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
 const desktop=matchMedia('(min-width:801px)'),onDesktop=e=>{if(e.matches)toggle(false);};if(desktop.addEventListener)desktop.addEventListener('change',onDesktop);else if(desktop.addListener)desktop.addListener(onDesktop);
}
