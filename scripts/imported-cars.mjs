#!/usr/bin/env node
/** YUNEX licensed real vehicle GLB acquisition; requires npm ci and curl.
 * Commands: list | fetch <id|all> [--allow-review-only] | verify <id|all>.
 */
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,existsSync,renameSync,rmSync,copyFileSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'..');
const catalog=JSON.parse(readFileSync(join(root,'production/assets/imported-cars/catalog.json'),'utf8'));
const cache=join(root,catalog.assetRoot);
const command=process.argv[2]||'list',selector=process.argv[3]||'all';
const review=process.argv.includes('--allow-review-only'),refresh=process.argv.includes('--refresh');
const entries=catalog.vehicles;
const approved=new Set(['sceneview/sceneview.github.io','KhronosGroup/glTF-Sample-Assets','AuraK-7/wild-racing-models','Priyanshh1407/porsche-react']);
function assert(ok,msg){if(!ok)throw Error(msg)}
function choose(){
 const selected=selector==='all'?entries:entries.filter(r=>r.id===selector);
 assert(selected.length&&new Set(selected.map(r=>r.id)).size===selected.length,'Unknown model: '+selector);
 return selected.filter(r=>{
  if(r.readiness==='review-only'&&!review){
   if(selector!=='all')throw Error('REVIEW ONLY '+r.id+': add --allow-review-only for non-public experiments');
   return false;
  }
  return true;
 });
}
function sourceUrl(r){
 assert(/^[a-z0-9-]+$/.test(r.id)&&r.fileName===r.id+'.glb','Invalid model filename');
 assert(['CC-BY-4.0','CC0-1.0'].includes(r.license),'Invalid model licence');
 const s=r.source;
 assert(s.host==='github'&&approved.has(s.owner+'/'+s.repository),'Unreviewed source');
 assert(/^[0-9a-f]{40}$/.test(s.commit)&&/^[0-9a-f]{40}$/.test(s.gitBlobSha1),'Missing pinned SHA');
 assert(/^[A-Za-z0-9_./-]+$/.test(s.path)&&!s.path.split('/').includes('..'),'Unsafe source path');
 return 'https://raw.githubusercontent.com/'+s.owner+'/'+s.repository+'/'+s.commit+'/'+s.path.split('/').map(encodeURIComponent).join('/');
}
function verifyBytes(b,r){
 assert(b.length>100000,'GLB suspiciously small: '+r.id);
 if(r.source.sizeBytes)assert(b.length===r.source.sizeBytes,'Size mismatch: '+r.id);
 assert(b.toString('ascii',0,4)==='glTF','Not a GLB: '+r.id);
 assert(b.readUInt32LE(4)===2&&b.readUInt32LE(8)===b.length,'Invalid GLB v2 length: '+r.id);
 assert(b.readUInt32LE(16)===0x4e4f534a,'Missing GLB JSON chunk: '+r.id);
 const n=b.readUInt32LE(12);
 assert(n>100&&20+n<=b.length,'Invalid JSON chunk: '+r.id);
 const gltf=JSON.parse(b.toString('utf8',20,20+n));
 assert(gltf.asset?.version?.startsWith('2.')&&gltf.meshes?.length>0,'GLB missing glTF 2 geometry: '+r.id);
 const sha=createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
 assert(sha===r.source.gitBlobSha1,'SHA mismatch for '+r.id+': '+sha);
 return {id:r.id,bytes:b.length,gitBlobSha1:sha,sha256:createHash('sha256').update(b).digest('hex'),
  meshes:gltf.meshes.length,materials:gltf.materials?.length??0,textures:gltf.textures?.length??0,
  requiredExtensions:gltf.extensionsRequired??[],license:r.license,creator:r.creator,attribution:r.attribution,readiness:r.readiness};
}
const pathFor=r=>join(cache,r.fileName);
function getOne(r){
 const url=sourceUrl(r),dest=pathFor(r);mkdirSync(dirname(dest),{recursive:true});
 if(existsSync(dest)&&!refresh){const report=verifyBytes(readFileSync(dest),r);console.log('CACHED VERIFIED '+r.id);return report}
 const temp=dest+'.partial-'+process.pid;
 try{
  execFileSync('curl',['--fail','--location','--retry','3','--retry-all-errors','--connect-timeout','30','--max-time','300','--silent','--show-error',url,'-o',temp],{stdio:'inherit'});
  const report=verifyBytes(readFileSync(temp),r);renameSync(temp,dest);
  console.log('IMPORTED '+r.id+': '+report.meshes+' meshes, '+report.materials+' materials, '+report.textures+' textures');
  return report;
 }finally{if(existsSync(temp))rmSync(temp)}
}
function copyDecoder(){
 const dir=join(cache,'draco'),src=join(root,'node_modules/three/examples/jsm/libs/draco');
 mkdirSync(dir,{recursive:true});
 for(const file of ['draco_decoder.js','draco_wasm_wrapper.js','draco_decoder.wasm']){
  assert(existsSync(join(src,file)),'Missing decoder '+file+'; run npm ci');
  copyFileSync(join(src,file),join(dir,file));
 }
}
try{
 for(const e of entries)sourceUrl(e);
 assert(new Set(entries.map(x=>x.id)).size===entries.length,'Duplicate car IDs');
 if(command==='list')console.log(JSON.stringify(entries.map(r=>({id:r.id,name:r.name,kind:r.kind,creator:r.creator,license:r.license,readiness:r.readiness,downloaded:existsSync(pathFor(r)),bytes:r.source.sizeBytes})),null,2));
 else if(command==='fetch'||command==='verify'){
  const reports=[];
  for(const e of choose()){
   if(command==='fetch')reports.push(getOne(e));
   else{
    assert(existsSync(pathFor(e)),'Missing '+e.id+'; run fetch '+e.id);
    reports.push(verifyBytes(readFileSync(pathFor(e)),e));
   }
  }
  if(command==='fetch')copyDecoder();
  const out=join(root,'out/imported-cars');mkdirSync(out,{recursive:true});
  writeFileSync(join(out,'verified-manifest.json'),JSON.stringify({catalogVersion:catalog.version,records:reports},null,2)+'\n');
  console.log('PASS '+reports.length+' verified source GLBs');
 }else throw Error('Usage: list | fetch <id|all> | verify <id|all> [--allow-review-only]');
}catch(error){console.error(error.message);process.exitCode=1}
