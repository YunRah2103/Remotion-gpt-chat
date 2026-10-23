#!/usr/bin/env node
/**
 * On-demand downloader for real GLB assets, pinned to the upstream Git commit.
 * No procedural models. No binary cars are committed to this repository.
 * Run: node external-assets/cars/library.mjs list [query]
 *      node external-assets/cars/library.mjs download mclaren-p1
 *      node external-assets/cars/library.mjs download all --concurrency=8
 *      node external-assets/cars/library.mjs verify all
 */
import {readFile, writeFile, mkdir, rename, stat, unlink} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const manifest=JSON.parse(readFileSync(new URL('./catalog.json',import.meta.url),'utf8'));
const args=process.argv.slice(2);
const command=args.shift()??'help';
const arg=args.find(x=>!x.startsWith('--'))??'all';
const opt=(name, fallback)=>args.find(x=>x.startsWith('--'+name+'='))?.slice(name.length+3)??fallback;
const targetDir=path.resolve(opt('dest',path.join(process.cwd(),'public','external-cars')));
const concurrency=Math.max(1,Math.min(16,Number(opt('concurrency','8'))||8));
const catalog=manifest.models;
const idMatch=(v)=>catalog.find(m=>m.id===v||m.file===v||m.file===v+'.glb');

function select(query){
 if(query==='all')return catalog;
 const exact=idMatch(query);
 if(exact)return [exact];
 const matches=catalog.filter(m=>[m.brand,m.model,m.id,m.category].some(v=>String(v).toLowerCase().includes(query.toLowerCase())));
 if(matches.length===0)throw Error('No car matched '+query);
 return matches;
}
function blobSha(buffer){
 return createHash('sha1').update('blob '+buffer.length+'\0').update(buffer).digest('hex');
}
function checkBytes(buffer,model){
 return buffer.length===model.bytes &&
  buffer.subarray(0,4).toString('ascii')==='glTF' &&
  blobSha(buffer)===model.githubBlobSha;
}
async function verifyOne(model){
 const file=path.join(targetDir,model.file);
 try {
  const meta=await stat(file);
  if(meta.size!==model.bytes)return 'INVALID';
  return checkBytes(await readFile(file),model)?'OK':'INVALID';
 }catch(e){if(e.code==='ENOENT')return 'MISSING';throw e;}
}
async function fetchOne(model){
 const dest=path.join(targetDir,model.file);
 if((await verifyOne(model))==='OK')return 'cached';
 const uri='https://raw.githubusercontent.com/'+manifest.source.repo+'/'+manifest.source.commit+'/assets/'+encodeURIComponent(model.file);
 let last;
 for(let n=0;n<4;n++){
  let tmp;
  try{
   const response=await fetch(uri,{headers:{'User-Agent':'YUNEX-model-library/1.0'},signal:AbortSignal.timeout(180000)});
   if(!response.ok)throw Error('HTTP '+response.status+' '+uri);
   const bytes=Buffer.from(await response.arrayBuffer());
   if(!checkBytes(bytes,model))throw Error('GLB header, length or pinned Git blob SHA mismatch: '+model.id);
   tmp=dest+'.part-'+process.pid+'-'+Math.random().toString(16).slice(2);
   await writeFile(tmp,bytes); await rename(tmp,dest);return 'downloaded';
  }catch(e){last=e;if(tmp)await unlink(tmp).catch(()=>{});if(n<3)await new Promise(resolve=>setTimeout(resolve,900*(n+1))); }
 }
 throw Error(model.id+': '+last.message);
}
async function pool(models,fn){
 let next=0,ok=0;const errors=[];
 await Promise.all(Array.from({length:Math.min(concurrency,models.length)},async()=>{
  for(;;){
   const idx=next++;if(idx>=models.length)break;
   const model=models[idx];
   try{const result=await fn(model);ok++;if(ok%25===0||ok===models.length)console.log('Completed '+ok+'/'+models.length+' ('+model.id+')');}
   catch(e){errors.push(String(e));console.error(String(e));}
  }
 }));
 return {ok,errors};
}

if(command==='list'||command==='search'){
 const matches=arg==='all'?catalog:select(arg);
 for(const m of matches) console.log([m.id,m.brand,m.model,(m.bytes/1048576).toFixed(2)+'MiB',m.credit.license].join(' | '));
 console.log(matches.length+' of '+catalog.length+' models · '+(manifest.totalBytes/1073741824).toFixed(2)+' GiB total');
}else if(command==='download'){
 const models=select(arg);await mkdir(targetDir,{recursive:true});
 const r=await pool(models,fetchOne);
 console.log(JSON.stringify({downloadedOrCached:r.ok,selected:models.length,errors:r.errors.length,targetDir},null,2));
 if(r.errors.length)process.exitCode=1;
}else if(command==='verify'){
 const models=select(arg);let ok=0,missing=0,invalid=0;
 for(const m of models){const result=await verifyOne(m);if(result==='OK')ok++;else if(result==='MISSING')missing++;else invalid++;}
 console.log(JSON.stringify({checked:models.length,ok,missing,invalid,targetDir},null,2));
 if(missing||invalid)process.exitCode=1;
}else if(command==='info'){
 const m=idMatch(arg);if(!m)throw Error('Unknown car '+arg);
 console.log(JSON.stringify({...m,downloadURL:'https://raw.githubusercontent.com/'+manifest.source.repo+'/'+manifest.source.commit+'/assets/'+m.file},null,2));
}else{
 console.log('YUNEX REAL-CAR LIBRARY: 532 GLB models.\nCommands: list [query], search <query>, info <id>, download <id|brand|all> [--concurrency=8] [--dest=path], verify <id|all> [--dest=path]');
}
