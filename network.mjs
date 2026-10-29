// AbortSignal.timeout is unavailable on some mobile Safari versions.
export async function fetchWithTimeout(url,options={},timeout=7000,fetcher=fetch){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
 try{return await fetcher(url,{...options,signal:controller.signal});}
 finally{clearTimeout(timer);}
}
