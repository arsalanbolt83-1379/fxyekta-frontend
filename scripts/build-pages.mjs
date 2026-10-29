import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'_site');
const repository=process.env.GITHUB_REPOSITORY?.split('/')[1]||'fxyekta-frontend';
const base=process.env.PAGES_BASE_PATH??('/'+repository+'/');
if(!/^\/(?:[a-zA-Z0-9_.-]+\/)*$/.test(base))throw new Error('Invalid Pages base path');
if(repository.endsWith('.github.io')&&!process.env.PAGES_BASE_PATH)throw new Error('Set PAGES_BASE_PATH=/ for a user site');
const prefix=value=>base==='/'||value.startsWith(base)?value:base+value.slice(1);
const allowed=new Set(['.html','.css','.js','.mjs','.json','.svg','.png','.jpg','.jpeg','.webp','.woff','.woff2','.ico','.txt','.csv']);
const excluded=new Set(['.git','.github','scripts','node_modules','screenshots','_site']);
const excludedFiles=new Set(['server.mjs','package.json','package-lock.json','README.md','VERIFICATION.md','ASSET-SOURCES.md']);
const csp="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'";
let files=0;
function copy(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){
 if(item.name.startsWith('.')||excluded.has(item.name))continue;
 const source=path.join(dir,item.name);
 if(item.isSymbolicLink())throw new Error('Symlinks are not supported');
 if(item.isDirectory()){copy(source);continue;}
 const ext=path.extname(item.name).toLowerCase();
 if(!allowed.has(ext)||excludedFiles.has(item.name))continue;
 const destination=path.join(output,path.relative(root,source));
 fs.mkdirSync(path.dirname(destination),{recursive:true});
 if(['.html','.css','.js','.mjs','.json'].includes(ext)){
  let content=fs.readFileSync(source,'utf8');
  if(ext==='.html'){
   content=content.replace(/\b(href|src|action|poster)=(['"])(\/(?!\/)[^'"]*)\2/g,(_,attr,q,url)=>attr+'='+q+prefix(url)+q);
   content=content.replace(/<head>/i,'<head>\n<meta http-equiv="Content-Security-Policy" content="'+csp+'">');
  }
  if(ext==='.js'||ext==='.mjs'){
   // Prefix root-relative string literals, including URLs embedded in HTML templates.
   content=content.replace(/(["'`])(\/(?!\/)[A-Za-z0-9?][^"'`\s<>]*)/g,(_,q,url)=>q+prefix(url));
  }
  if(ext==='.css'||ext==='.html')content=content.replace(/url\(\s*(['"]?)(\/(?!\/)[^)'"\s]+)\1\s*\)/g,(_,q,url)=>'url('+q+prefix(url)+q+')');
  fs.writeFileSync(destination,content);
 }else fs.copyFileSync(source,destination);
 files++;
}}
fs.mkdirSync(output,{recursive:true});
copy(root);
fs.writeFileSync(path.join(output,'.nojekyll'),'');
console.log('Built '+files+' static files for '+base+' in _site/');
