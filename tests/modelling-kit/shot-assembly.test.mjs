import {createProject} from '../../scripts/modelling-kit/studio.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,mkdirSync,symlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';import {resolve} from 'node:path';import {execFileSync} from 'node:child_process';
import {shotContract,verifyShot,assemble} from '../../scripts/modelling-kit/assemble.mjs';
test('real native shot assembly verifies hashes, source, frame counts and rejects stale recipe',()=>{
 const root=mkdtempSync(resolve(tmpdir(),'yunex-assemble-'));
 try{
  mkdirSync(resolve(root,'src/yunex'),{recursive:true});mkdirSync(resolve(root,'scripts'));
  for(const kit of ['modelling-kit','world-kit','parts-kit'])symlinkSync(resolve('src/yunex',kit),resolve(root,'src/yunex',kit));
  symlinkSync(resolve('scripts/modelling-kit'),resolve(root,'scripts/modelling-kit'));symlinkSync(resolve('package-lock.json'),resolve(root,'package-lock.json'));
  const folder=resolve(root,'src/yunex/studio-projects/test-film');mkdirSync(folder,{recursive:true});const out=resolve(root,'out/studio/test-film');mkdirSync(out,{recursive:true});
  const recipe={id:'test-film',title:'Silent',vehicle:{variant:'supercar'},world:{kind:'showroom'},shots:[{id:'a',duration:2/30,camera:'tracking',action:'cruise',caption:''},{id:'b',duration:2/30,camera:'chase',action:'cruise',caption:''}]};
  writeFileSync(resolve(folder,'entry.tsx'),'// actual agent entry');writeFileSync(resolve(folder,'recipe.json'),JSON.stringify(recipe));const dimensions={width:1080,height:1920};
  for(let i=0;i<2;i++){const file=resolve(out,`render-shot-${i}.mp4`);execFileSync('ffmpeg',['-v','error','-f','lavfi','-i',`color=c=${i?'blue':'red'}:s=1080x1920:r=30`,'-frames:v','2','-c:v','libx264','-pix_fmt','yuv420p',file]);writeFileSync(file+'.json',JSON.stringify(shotContract(root,recipe,i,file,dimensions)));}
  const collision={id:'test-film',title:'Silent',vehicle:{variant:'supercar'},world:{kind:'showroom'},shots:[{id:'a',duration:1,camera:'tracking',action:'cruise',caption:'Caption wofxsx'}]};
  const first=shotContract(root,collision,0,resolve(out,'render-shot-0.mp4'),dimensions);collision.shots[0].caption='Caption 8mem7c';const second=shotContract(root,collision,0,resolve(out,'render-shot-0.mp4'),dimensions);assert.equal(first.shotHash,second.shotHash);assert.notEqual(first.renderHash,second.renderHash);
  const report=assemble(root,'test-film');assert.equal(report.frames,4);assert.equal(report.fullDecode,'pass');
  writeFileSync(resolve(folder,'entry.tsx'),'// modified entry');assert.throws(()=>verifyShot(root,recipe,0,resolve(out,'render-shot-0.mp4'),dimensions),/Stale.*(entry|source)/);writeFileSync(resolve(folder,'entry.tsx'),'// actual agent entry');
  writeFileSync(resolve(folder,'custom-model.ts'),'export const size=2');assert.throws(()=>verifyShot(root,recipe,0,resolve(out,'render-shot-0.mp4'),dimensions),/Stale.*source/);rmSync(resolve(folder,'custom-model.ts'));
  recipe.shots[0].caption='Changed';assert.throws(()=>verifyShot(root,recipe,0,resolve(out,'render-shot-0.mp4'),dimensions),/Stale.*renderHash/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('render stability includes recipe edits without invalidating shared renderer cache identity',async()=>{
 const {renderInputFingerprint,sourceFingerprint}=await import('../../scripts/modelling-kit/assemble.mjs');assert.equal(typeof renderInputFingerprint,'function');
 const root=mkdtempSync(resolve(tmpdir(),'yunex-input-'));try{const folder=createProject(root,'input-proof');const original=renderInputFingerprint(root,folder),shared=sourceFingerprint(root,folder),file=resolve(folder,'recipe.json');const recipe=JSON.parse(readFileSync(file,'utf8'));recipe.title+=' changed';writeFileSync(file,JSON.stringify(recipe));assert.notEqual(renderInputFingerprint(root,folder),original);assert.equal(sourceFingerprint(root,folder),shared);}finally{rmSync(root,{recursive:true,force:true});}
});
