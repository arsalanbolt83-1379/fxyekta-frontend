const $=id=>document.getElementById(id),status=$('status');let state,fields=[],baseline,draft,history=[],pending,busy=false,uncertainSave=false;
const errors={access_setup_required:'اتصال Cloudflare Access هنوز کامل نشده است.',access_denied:'ورود شما تأیید نشد. دوباره با ایمیل مدیر وارد شوید.',revision_conflict:'تنظیمات در جای دیگری تغییر کرده است. ابتدا بازخوانی کنید؛ تغییرات ذخیره نشد.',invalid_origin:'مبدأ درخواست تأیید نشد.',panel_unavailable:'ارتباط با پنل برقرار نشد. دوباره بازخوانی کنید.'};
async function api(path,method='GET',body){
 for(let attempt=0;;attempt++){
  try{
   const response=await fetch('/api/panel/'+path,{method,credentials:'same-origin',cache:'no-store',headers:method==='PUT'?{'Content-Type':'application/json','X-Panel-Request':'1'}:{Accept:'application/json'},body:body?JSON.stringify(body):undefined,redirect:'manual',signal:AbortSignal.timeout(12000)});
   if(response.type==='opaqueredirect'||response.status===401||response.status===403)throw Object.assign(new Error('نشست ورود تأیید نشد یا منقضی شده است. این صفحه را در یک تب جدید باز کنید و دوباره وارد شوید؛ متن ویرایش‌شده را در این تب نگه دارید.'),{auth:true});
   if(!response.headers.get('Content-Type')?.includes('application/json'))throw Object.assign(new Error('پاسخ معتبر از پنل دریافت نشد. اتصال یا نشست ورود را بررسی کنید.'),{uncertain:true});
   const data=await response.json();if(!response.ok)throw Object.assign(new Error(errors[data.error]||'درخواست پذیرفته نشد: '+(data.error||response.status)),{uncertain:response.status>=500});return data;
  }catch(error){
   if(error instanceof TypeError||error.name==='TimeoutError'||error.name==='AbortError')error=Object.assign(new Error('ارتباط با سرور قطع شد یا پاسخ دیر رسید. متن تغییرات شما در همین صفحه حفظ شده است.'),{uncertain:true});
   if(method==='GET'&&error.uncertain&&attempt===0)continue;
   throw error;
  }
 }
}
function sameValues(a,b){return fields.every(f=>a[f.key]===b[f.key]);}
async function savePending(){
 const revision=state.revision,values=structuredClone(pending);
 if(uncertainSave){const current=(await api('settings')).document;if(current.revision>revision){if(sameValues(current.values,values)){uncertainSave=false;return current;}throw new Error(errors.revision_conflict);}uncertainSave=false;}
 try{return (await api('settings','PUT',{revision,values})).document;}
 catch(error){
  if(!error.uncertain)throw error;
  uncertainSave=true;
  message('پاسخ ذخیره نرسید؛ در حال بررسی وضعیت ثبت تغییرات…',true);
  try{const current=(await api('settings')).document;if(current.revision>revision&&sameValues(current.values,values)){uncertainSave=false;return current;}if(current.revision>revision)throw Object.assign(new Error(errors.revision_conflict),{conflict:true});}catch(checkError){if(checkError.conflict)throw checkError;}
  throw new Error('نتیجهٔ ذخیره هنوز تأیید نشد. تغییرات شما حفظ شده است؛ پس از بهترشدن اتصال، «تأیید و ذخیره» را بزنید تا وضعیت دوباره بررسی شود.');
 }
}
function message(text,error=false){status.textContent=text;status.classList.toggle('error',error);}
function node(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
function display(value,field){if(field?.type==='image')return value?'لوگوی انتخاب‌شده':'بدون لوگو';if(field?.type==='boolean')return value?'فعال':'غیرفعال';if(field?.type==='time')return `${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')} تهران`;if(field?.key.endsWith('Cents'))return (value/100).toLocaleString('fa-IR')+' تتر';return String(value);}
function render(){const form=$('settings');form.replaceChildren();$('tabs').replaceChildren();const groups=[...new Set(fields.map(f=>f.group))];for(const [index,group] of groups.entries()){
 const tab=node('button',group);tab.type='button';tab.setAttribute('aria-selected',String(index===0));$('tabs').append(tab);const box=node('fieldset');box.hidden=index!==0;box.append(node('legend',group));tab.onclick=()=>{for(const b of form.querySelectorAll('fieldset'))b.hidden=b!==box;for(const b of $('tabs').children)b.setAttribute('aria-selected',String(b===tab));};
 for(const field of fields.filter(f=>f.group===group)){const wrap=node('div',undefined,'field'),label=node('label',field.label),input=document.createElement(field.type==='textarea'?'textarea':'input');input.id='field-'+field.key;label.htmlFor=input.id;input.name=field.key;if(field.type!=='textarea')input.type=field.type==='boolean'?'checkbox':field.type==='time'?'time':field.type==='image'?'text':field.type;if(field.type==='boolean')input.checked=draft[field.key];else if(field.type==='time'){const v=draft[field.key];input.value=`${String(Math.floor(v/60)).padStart(2,'0')}:${String(v%60).padStart(2,'0')}`;input.step=field.key==='tetherMinute'?300:60;}else input.value=field.key.endsWith('Cents')?draft[field.key]/100:draft[field.key];if(field.min!==undefined&&field.type==='number'){const currency=field.key.endsWith('Cents');input.min=currency?field.min/100:field.min;input.max=currency?field.max/100:field.max;input.step=currency?0.01:1;}if(!['boolean','image'].includes(field.type))input.required=true;if(field.type==='textarea')input.maxLength=field.key==='tetherMessage'?750:2000;if(field.key==='paymentWallet'||field.key==='supportUsername')input.setAttribute('data-ltr','');wrap.append(label,input);if(field.type==='image')logoEditor(wrap,input);if(field.help)wrap.append(node('small',field.help));box.append(wrap);}
 form.append(box);
 }const actions=node('div',undefined,'actions'),review=node('button','بررسی تغییرات');review.type='submit';actions.append(review);form.append(actions);form.hidden=false;}
function read(){const values={...draft};for(const field of fields){const el=$('field-'+field.key);values[field.key]=field.type==='boolean'?el.checked:field.type==='time'?el.value.split(':').reduce((h,m)=>Number(h)*60+Number(m)):field.type==='number'?(field.key.endsWith('Cents')?Math.round(Number(el.value)*100):Number(el.value)):el.value;}return values;}
function review(values){pending=values;const changes=fields.filter(f=>values[f.key]!==baseline[f.key]);if(!changes.length){message('تغییری برای ذخیره وجود ندارد.');return;}$('diff').replaceChildren();for(const f of changes){const row=node('div',undefined,'change');row.append(node('strong',f.label),node('pre','قبلی: '+display(baseline[f.key],f),'old'),node('pre','جدید: '+display(values[f.key],f),'new'));$('diff').append(row);}$('review').hidden=false;$('settings').hidden=true;$('review').scrollIntoView({block:'start',behavior:'smooth'});}
$('settings').onsubmit=e=>{e.preventDefault();if(busy)return;draft=read();review(draft);};$('cancel').onclick=()=>{$('review').hidden=true;$('settings').hidden=false;};
$('confirm').onclick=async()=>{if(busy)return;busy=true;$('confirm').disabled=true;try{state=await savePending();baseline=structuredClone(state.values);draft=structuredClone(state.values);$('review').hidden=true;render();$('revision').textContent='نسخه '+state.revision;try{await loadHistory();message('تغییرات ذخیره شد. سایت تا ۳۰ ثانیه و ربات در اجرای بعدی به‌روز می‌شود.');}catch{message('تغییرات ذخیره شد؛ دریافت سابقه به دلیل مشکل اتصال کامل نشد.');}}catch(e){message(e.message,true);}finally{busy=false;$('confirm').disabled=false;}};
async function loadHistory(){const data=await api('history');history=data.history;$('history').replaceChildren();if(!history.length)$('history').append(node('p','هنوز تغییری ثبت نشده است.'));for(const item of history){const row=node('div',undefined,'history-row'),s=node('span',`نسخه ${item.after.revision} · ${new Date(item.after.updatedAt).toLocaleString('fa-IR',{timeZone:'Asia/Tehran'})} · ${item.after.updatedBy}`),restore=node('button','بازگردانی نسخه قبلی','secondary');restore.type='button';restore.onclick=()=>{review({...baseline,...structuredClone(item.before.values)});};row.append(s,restore);$('history').append(row);}}
async function load(){try{const data=await api('settings');state=data.document;fields=data.fields;baseline=structuredClone(state.values);draft=structuredClone(state.values);$('identity').textContent=data.email;$('revision').textContent='نسخه '+state.revision;render();await loadHistory();message('ورود تأیید شد. پس از ویرایش، تغییرات را بررسی و تأیید کنید.');}catch(e){message(e.message,true);}}
function hasChanges(){return state&&(!sameValues($('review').hidden?read():pending,baseline));}
$('reload').onclick=()=>{if(busy)return;if(hasChanges()&&!window.confirm('تغییرات ذخیره‌نشده کنار گذاشته شوند؟'))return;$('review').hidden=true;load();};window.addEventListener('beforeunload',e=>{if(hasChanges()){e.preventDefault();e.returnValue='';}});load();

function logoEditor(wrap,input){
 const preview=node('img',undefined,'logo-preview'),upload=node('input'),clear=node('button','حذف لوگو','secondary');upload.type='file';upload.accept='image/png,image/jpeg,image/webp';clear.type='button';
 const show=()=>{const v=input.value;preview.hidden=!v;if(v&&(/^(https:\/\/|\/assets\/|data:image\/(png|jpeg|webp);base64,)/.test(v)))preview.src=v;else preview.removeAttribute('src');};
 input.addEventListener('input',show);clear.onclick=()=>{input.value='';upload.value='';show();};
 upload.onchange=async()=>{try{const file=upload.files[0];if(!file)return;if(file.size>5*1024*1024||!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('فایل PNG، JPG یا WebP با حجم کمتر از ۵ مگابایت انتخاب کنید.');const bitmap=await createImageBitmap(file),scale=Math.min(1,240/bitmap.width,100/bitmap.height),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();const value=canvas.toDataURL('image/webp',.8);if(value.length>32768)throw new Error('حجم لوگو زیاد است؛ تصویر ساده‌تری انتخاب کنید.');input.value=value;show();}catch(e){message(e.message,true);}};
 wrap.append(preview,upload,clear);show();
}
