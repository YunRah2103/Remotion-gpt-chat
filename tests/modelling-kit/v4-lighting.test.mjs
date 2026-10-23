import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createReflectionStudio,lightingProfile} from '../../src/yunex/modelling-kit/lighting-profile.ts';

// Regressions: dusk used to be identical to day, and a generic dim room left
// polished coachwork without a long, readable highlight across the shoulder.
test('day, dusk and night retain distinct key, fill and reflection exposure',()=>{
 const day=lightingProfile('day'),dusk=lightingProfile('dusk'),night=lightingProfile('night');
 assert.ok(day.keyIntensity>dusk.keyIntensity&&dusk.keyIntensity>night.keyIntensity);
 assert.notEqual(day.keyColor,dusk.keyColor);
 assert.notEqual(dusk.background,night.background);
 for(const p of [day,dusk,night]){
  assert.ok(p.environmentIntensity>=.3&&p.environmentIntensity<=1);
  assert.ok(p.fillIntensity>0&&p.rimIntensity>0,'dark paint still needs fill and separation');
 }
});
test('reflection studio gives coachwork broad overhead and continuous side softboxes',()=>{
 const scene=createReflectionStudio('day');
 for(const name of ['overhead-softbox','shoulder-softbox','cool-rim-softbox','front-softbox']){
  const panel=scene.getObjectByName(name);assert.ok(panel?.isMesh,name);
  const size=new T.Vector3();new T.Box3().setFromObject(panel).getSize(size);
  assert.ok(Math.max(size.x,size.y,size.z)>=3,'panel must make a broad automotive reflection');
  assert.equal(panel.material.toneMapped,false);
  assert.ok(Math.max(panel.material.color.r,panel.material.color.g,panel.material.color.b)>1,'HDR source survives PMREM');
  const normal=new T.Vector3(0,0,1).applyQuaternion(panel.quaternion),toCar=new T.Vector3(0,1,0).sub(panel.position).normalize();
  assert.ok(normal.dot(toCar)>.99,'emitting face points at the car');
 }
});
test('reflection studio is deterministic and the warm dusk key preserves a neutral shoulder strip',()=>{
 const a=createReflectionStudio('dusk'),b=createReflectionStudio('dusk');
 const snapshot=s=>s.children.map(o=>({name:o.name,position:o.position.toArray(),rotation:o.rotation.toArray(),color:o.material?.color.toArray()}));
 assert.deepEqual(snapshot(a),snapshot(b));
 const shoulder=a.getObjectByName('shoulder-softbox').material.color;
 assert.ok(Math.abs(shoulder.r-shoulder.b)<.8,'a neutral strip keeps paint identity legible');
});
