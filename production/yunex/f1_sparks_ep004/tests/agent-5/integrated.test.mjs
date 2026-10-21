import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {getSkidDescriptors} from '../../mechanics/skids.ts';
import {sampleDynamics} from '../../physics/dynamics.ts';
import {sampleContactDrivenSparks} from '../../physics/sparks.ts';
import {sampleCircuitRoadPoint} from '../../look/road.ts';
import {sampleTrackSurface} from '../../shared/track.ts';

const skids=getSkidDescriptors();
const params={startDistanceM:72,speedMps:62,aeroLoad01:1};
test('integrated source uses EXACT approved Agent1 metal skid descriptor',()=>{
 assert.ok(skids.some(x=>x.id==='forward'&&x.metal&&Math.abs(x.localBottomPoint[1]-.065)<1e-8));
 assert.equal(new Set(skids.map(x=>x.id)).size,skids.length);
});
test('road location corresponds to the exact Agent2 road profile',()=>{
 for(const d of [72,73,138,139]){
  const surface=sampleTrackSurface(d);
  assert.ok(Math.abs(sampleCircuitRoadPoint(d).y-surface.heightM)<1e-9);
 }
});
test('first-second sparks genuinely arise from active forward/mid/rear metal-road contacts',()=>{
 let hasContact=false,hasSpark=false,hasGap=false;
 for(let k=0;k<30;k++){
  const t=k/300,m=sampleDynamics(t,params);
  const {contacts,particles}=sampleContactDrivenSparks(t,m,skids,params);
  for(const c of contacts){
   if(c.active){hasContact=true;assert.ok(c.signedGapM<=0);assert.ok(c.relativeSpeedMps>0);}
   else if(c.signedGapM>0)hasGap=true;
  }
  if(particles.length){hasSpark=true;assert.ok(particles.every(p=>skids.some(s=>s.id===p.emitterSkidId)));}
 }
 assert.ok(hasContact,'first 0.1s must contain real skid-road contact');
 assert.ok(hasSpark,'first 0.1s must contain contact-born particles');
 assert.ok(hasGap || hasContact,'contact signal sampled');
});
test('render order independence in integrated Agent2 physics',()=>{
 const t=.045, m=sampleDynamics(t,params);
 const a=sampleContactDrivenSparks(t,m,skids,params);
 sampleContactDrivenSparks(.0,sampleDynamics(0,params),skids,params);
 const b=sampleContactDrivenSparks(t,m,skids,params);
 assert.deepEqual(a,b);
});
test('strict isolated Agent5+accepted source TypeScript compile',()=>{
 const x=spawnSync('node_modules/.bin/tsc',['-p','production/yunex/f1_sparks_ep004/story/tsconfig.json'],{encoding:'utf8',timeout:120000});
 assert.equal(x.status,0,[x.stdout,x.stderr].join('\n'));
});
