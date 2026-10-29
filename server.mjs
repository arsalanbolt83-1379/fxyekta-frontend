import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';

const root=path.dirname(fileURLToPath(import.meta.url));
const project=path.basename(root);
const defaultPorts={venusbrick:4173,yektainvest:4174,fxyekta:4175};
let port=Number(process.env.PORT||defaultPorts[project]||4173),retries=0;
if(!Number.isInteger(port)||port<1024||port>65515){console.error('PORT must be a number between 1024 and 65515.');process.exit(1);}
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.ico':'image/x-icon','.csv':'text/csv; charset=utf-8','.txt':'text/plain; charset=utf-8'};
const headers={'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'"};
const server=http.createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'}).end();return;}
 let rel;
 try{rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400).end('Invalid URL');return;}
 if(rel.split('/').some(p=>p.startsWith('.'))||rel.includes('\\')||rel.includes('\0')){res.writeHead(403).end();return;}
 let file=path.resolve(root,'.'+rel);
 if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403).end();return;}
 let status=200;
 try{
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory()){
   if(!rel.endsWith('/')){res.writeHead(302,{Location:rel+'/',...headers}).end();return;}
   file=path.join(file,'index.html');
  }
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){status=404;file=path.join(root,'404.html');}
  if(!fs.existsSync(file)){res.writeHead(404,headers).end('Page not found');return;}
  res.writeHead(status,{'Content-Type':types[path.extname(file)]||'application/octet-stream',...headers});
  if(req.method==='HEAD'){res.end();return;}
  const stream=fs.createReadStream(file);stream.on('error',()=>res.destroy());stream.pipe(res);
 }catch{res.writeHead(500,headers).end('Unable to read local file.');}
});
server.on('error',error=>{
 if(error.code==='EADDRINUSE'&&retries++<15){port++;console.log('Port busy, trying '+port+'...');server.listen(port,'127.0.0.1');}
 else{console.error('Could not start the preview: '+error.message);process.exitCode=1;}
});
server.on('listening',()=>{
 const url='http://127.0.0.1:'+port+'/';
 console.log('\n'+project+' is ready.\n\nOpen in your browser: '+url+'\n\nKeep this window open. Press Ctrl+C to stop.\n');
 if(process.argv.includes('--open')&&process.platform==='win32'){
  const browser=spawn('explorer.exe',[url],{detached:true,stdio:'ignore',windowsHide:true});
  browser.on('error',()=>console.log('Please open the URL above manually.'));browser.unref();
 }
});
server.listen(port,'127.0.0.1');
