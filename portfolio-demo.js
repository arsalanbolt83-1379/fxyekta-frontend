// Portfolio isolation: public frontend, browser-local demo data only.
(() => {
  const nativeFetch = window.fetch.bind(window);
  const respond = data => Promise.resolve(new Response(JSON.stringify(data), {headers:{'Content-Type':'application/json'}}));
  const fields = [
    {key:'heroTitle',label:'عنوان اصلی سایت',type:'text',group:'محتوای سایت'},
    {key:'heroDescription',label:'توضیح معرفی',type:'textarea',group:'محتوای سایت'},
    {key:'supportUsername',label:'شناسه پشتیبانی نمایشی',type:'text',group:'محتوای سایت'},
    {key:'monthlyPriceCents',label:'هزینه عضویت (نمونه)',type:'number',min:0,max:100000,group:'عضویت'},
    {key:'discountPercent',label:'تخفیف',type:'number',min:0,max:100,group:'عضویت'},
    {key:'publicEnabled',label:'انتشار عمومی',type:'boolean',group:'انتشار'},
    {key:'vipEnabled',label:'انتشار ویژه',type:'boolean',group:'انتشار'},
    {key:'welcomeMessage',label:'پیام خوش‌آمدگویی',type:'textarea',group:'پیام‌ها'},
    {key:'reportMinute',label:'ساعت گزارش',type:'time',group:'زمان‌بندی'}
  ];
  const initial={revision:1,updatedAt:new Date().toISOString(),updatedBy:'Portfolio demo',values:{heroTitle:'از هیاهوی بازار، به تصمیم روشن.',heroDescription:'نسخهٔ نمایشی فرانت‌اند FxYekta برای بررسی نمونه‌کار.',supportUsername:'demo_support',monthlyPriceCents:3000,discountPercent:10,publicEnabled:true,vipEnabled:true,welcomeMessage:'به نسخهٔ نمایشی خوش آمدید.',reportMinute:1320}};
  const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}};
  window.fetch=(input,options={})=>{
    const url=new URL(typeof input==='string'?input:input.url,location.href);
    if(url.pathname.startsWith('/api/panel/')){
      const document=read('fx-demo-settings',initial);
      if(url.pathname.endsWith('/history')) return respond({history:read('fx-demo-history',[])});
      if(options.method==='PUT'){
        const body=JSON.parse(options.body);
        if(body.revision!==document.revision)return Promise.resolve(new Response(JSON.stringify({error:'revision_conflict'}),{status:409,headers:{'Content-Type':'application/json'}}));
        const next={revision:document.revision+1,values:body.values,updatedAt:new Date().toISOString(),updatedBy:'Portfolio demo'};
        localStorage.setItem('fx-demo-settings',JSON.stringify(next));
        localStorage.setItem('fx-demo-history',JSON.stringify([{before:document,after:next},...read('fx-demo-history',[])].slice(0,30)));
        return respond({document:next});
      }
      return respond({document,fields,email:'demo@example.test'});
    }
    if(url.origin!==location.origin||url.pathname.startsWith('/api/')||url.pathname.startsWith('/public/')) return respond({authenticated:false,items:[],trades:[],results:[],months:[],demo:true});
    return nativeFetch(input,options);
  };
  document.addEventListener('DOMContentLoaded',()=>{
    const bar=document.createElement('div');bar.style.cssText='position:relative;z-index:9999;background:#102820;color:#9cb7a5;text-align:center;padding:9px;font:11px Vazirmatn,Tahoma;line-height:1.8;border-bottom:1px solid #263d30';
    bar.innerHTML='نسخهٔ رزومه · داده‌های پنل نمایشی هستند · <a href="/account/">پنل کاربر</a> · <a href="/admin/">پنل مدیریت</a>';
    document.body.prepend(bar);
    const s=document.createElement('meta');s.name='robots';s.content='noindex,nofollow';document.head.append(s);
    if(location.pathname.startsWith('/admin')){
      const status=document.getElementById('status');
      new MutationObserver(()=>{if(status.textContent.includes('سایت تا'))status.textContent='تغییرات فقط در مرورگر شما ذخیره شد.';else if(status.textContent.includes('ورود تأیید'))status.textContent='پنل نمایشی آماده است؛ تغییرات فقط در همین مرورگر ذخیره می‌شوند.';}).observe(status,{childList:true});
    }
  });
})();