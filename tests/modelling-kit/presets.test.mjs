import {test} from 'node:test';import assert from 'node:assert/strict';
import {animationPreset} from '../../src/yunex/modelling-kit/presets.ts';
test('collision rewind returns to the exact pre-impact state and never leaves valid control ranges',()=>{for(let frame=0;frame<180;frame++){const s=animationPreset('collision-rewind',frame,30);for(const key of ['impact','bodyDamage','braking'])assert.ok(s[key]>=0&&s[key]<=1);}assert.equal(animationPreset('collision-rewind',0,30).impact,0);assert.equal(animationPreset('collision-rewind',179,30).impact,0);assert.deepEqual(animationPreset('tyre-failure',90,30),animationPreset('tyre-failure',90,30));});
test('presets reject nonfinite time and unknown modes',()=>{for(const args of [['tyre-failure',NaN,30],['emergency-braking',1,0],['bogus',1,30]])assert.throws(()=>animationPreset(...args));});
test('collision rewind samples the same complete animation clock in both directions',()=>{
 for(const fps of [24,30,60])for(const t of [.5,1,1.9,2.5]){
  const forward=animationPreset('collision-rewind',t*fps,fps),reverse=animationPreset('collision-rewind',(6-t)*fps,fps);
  for(const key of Object.keys(forward))assert.ok(Math.abs(forward[key]-reverse[key])<1e-10,`${key} did not rewind`);
 }
});
test('negative timeline seeks return the initial absolute state',()=>{
 for(const name of ['tyre-failure','collision-rewind','driver-reaction'])assert.deepEqual(animationPreset(name,-30,30),animationPreset(name,0,30));
});
