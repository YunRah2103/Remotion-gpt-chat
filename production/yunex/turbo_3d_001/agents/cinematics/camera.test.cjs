/* Standalone Node camera tests. No other agents' code, no film-root modifications. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const ts=require('typescript');
const mod=path.resolve(__dirname,'../../../../src/yunex/turbo3d/cinematics/cameraMath.ts');
const js=ts.transpileModule(fs.readFileSync(mod,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const m={exports:{}};
Function('exports','module','require',js)(m.exports,m,require);
const cam=m.exports;
const shots=['hookOrbit','hookRush','exhaustTrack','shaftFollow','compressorReveal','chargeGlide','roadHero'];
for(const shot of shots){
 const d=cam.shotDuration[shot];
 for(let frame=0;frame<d;frame++){
  const p=cam.sampleShot(shot,frame);
  assert(cam.poseIsValid(p),'Bad pose '+shot+'/'+frame);
  assert(p.position.every(Number.isFinite));
 }
 const a=cam.sampleShot(shot,0),b=cam.sampleShot(shot,d-1),c=cam.sampleShot(shot,0);
 assert.deepEqual(a,c,'Not deterministic');
 assert.notDeepEqual(a.position,b.position,'Camera is static');
 const o=cam.sampleShot(shot,15,{TURBINE:[-6,0,0]});
 if(shot==='hookOrbit')assert.notDeepEqual(o.position,cam.sampleShot(shot,15).position,'Anchor override ignored');
}
for(let i=0;i<7;i++)assert(cam.smooth(i/6)>=0&&cam.smooth(i/6)<=1);
assert.throws(()=>cam.sampleShot('hookOrbit',0,{},1));
console.log('PASS: seven shot paths; every frame finite/nonstatic; anchor and frame determinism');