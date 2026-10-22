import {test} from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,mkdirSync,symlinkSync,rmSync} from 'node:fs';
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
  const report=assemble(root,'test-film');assert.equal(report.frames,4);assert.equal(report.fullDecode,'pass');
  writeFileSync(resolve(folder,'entry.tsx'),'// modified entry');assert.throws(()=>verifyShot(root,recipe,0,resolve(out,'render-shot-0.mp4'),dimensions),/Stale.*entry/);writeFileSync(resolve(folder,'entry.tsx'),'// actual agent entry');
  recipe.shots[0].caption='Changed';assert.throws(()=>verifyShot(root,recipe,0,resolve(out,'render-shot-0.mp4'),dimensions),/Stale.*shotHash/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
