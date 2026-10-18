import {test} from 'node:test';
import assert from 'node:assert/strict';
import {visibleArc,validateRacePath,compareApexCurvature,measureCommonSector,storyCopy}
  from '../../src/yunex/f1-line-ep002/graphics/model.ts';
import {STAGING_PREVIEW_PATHS,previewDistance}
  from '../../src/yunex/f1-line-ep002/agent-5-preview/previewMotion.ts';
import {RACE_COLORS} from '../../src/yunex/f1-line-ep002/contract.ts';

const makePath=(id,k,offset=0)=>({
  id,lengthM:80,entryDistanceM:10,apexDistanceM:40,exitDistanceM:70,
  sampleAtDistance:d=>({position:[d,0,offset],yaw:0,curvatureInvM:k})
});
const paths={shortcut:makePath('shortcut',.07),racing:makePath('racing',.04,1)};
test('world line remains car-progress anchored and clipped to track sector',()=>{
 const p=paths.shortcut;
 assert.deepEqual(visibleArc(p,16,34,5),{startM:10,endM:21});
 assert.equal(visibleArc(p,-40,34,5),null);
 assert.equal(visibleArc(p,200,34,5),null);
 assert.equal(visibleArc(p,Infinity),null);
});
test('geometry contract validates finite poses and strict ordered marks',()=>{
 validateRacePath(paths.shortcut);
 assert.throws(()=>validateRacePath({...paths.shortcut,apexDistanceM:6}),/marks/);
 assert.throws(()=>validateRacePath({...paths.shortcut,
   sampleAtDistance:()=>({position:[NaN,0,0],yaw:0,curvatureInvM:0})}),/pose/);
});
test('curve comparison is derived from true path curvature, with no predetermined winner',()=>{
 assert.equal(compareApexCurvature(paths),'racing-gentler');
 assert.equal(compareApexCurvature({shortcut:paths.racing,racing:paths.shortcut}),'shortcut-gentler');
 assert.equal(compareApexCurvature({shortcut:makePath('shortcut',0),
    racing:makePath('racing',0)}),'inconclusive');
});
const state=(f,fps,rateA,rateB)=>({
 frame:f,fps,timeSeconds:f/fps,
 cars:{
  shortcut:{id:'shortcut',pathDistanceM:f*rateA,speedMps:fps*rateA},
  racing:{id:'racing',pathDistanceM:f*rateB,speedMps:fps*rateB}
 }
});
test('timing comparison interpolates entry and exit crossings for each car',()=>{
 const r=measureCommonSector(paths,(f,fps)=>state(f,fps,.5,.6),30,0,150);
 assert.ok(r);
 assert.equal(r.winner,'racing');assert.ok(r.leadSeconds>0);
 assert.ok(Math.abs(r.shortcut.elapsedSeconds-4)<1e-7);
 assert.ok(Math.abs(r.racing.elapsedSeconds-60/18)<1e-7);
 assert.match(storyCopy('payoff',paths,r).headline,/B IS QUICKER/);
 const reversed=measureCommonSector(paths,(f,fps)=>state(f,fps,.6,.5),30,0,150);
 assert.equal(reversed.winner,'shortcut');
 assert.match(storyCopy('payoff',paths,reversed).headline,/A IS QUICKER/);
});
test('no winning claims without comparable gate crossings or with absent authoritative data',()=>{
 const bad={shortcut:makePath('shortcut',.06),racing:makePath('racing',.03,22)};
 assert.equal(measureCommonSector(bad,(f,fps)=>state(f,fps,.5,.5),30,0,150),null);
 assert.equal(measureCommonSector(paths,(f,fps)=>state(f,fps,.4,.2),30,0,150),null);
 assert.match(storyCopy('payoff',paths).note,/PENDING/);
});
test('actual circuit staging paths contain two different track-anchored legal lines',()=>{
 for(const id of ['shortcut','racing']){
  const p=STAGING_PREVIEW_PATHS[id];validateRacePath(p);
  const positions=[0,5,20,36,50,69,72].map(d=>p.sampleAtDistance(d).position);
  for(const pos of positions)assert.ok(pos.every(Number.isFinite));
  assert.ok(previewDistance(110,id)>=0);
 }
 const spacingAt=d=>{
  const a=STAGING_PREVIEW_PATHS.shortcut.sampleAtDistance(d).position;
  const b=STAGING_PREVIEW_PATHS.racing.sampleAtDistance(d).position;
  return Math.hypot(a[0]-b[0],a[2]-b[2]);
 };
 assert.ok(spacingAt(1)>3,'Different legal entry lines');
 assert.ok(spacingAt(69)>3,'Different legal exit lines');
 assert.ok(spacingAt(36)<1,'Cars may visit a shared apex at different times');
 assert.equal(RACE_COLORS.shortcut,'#25AFA8');
 assert.equal(RACE_COLORS.racing,'#F5A44B');
});
