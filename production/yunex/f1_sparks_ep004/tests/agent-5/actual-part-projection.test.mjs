import test from 'node:test';
import assert from 'node:assert/strict';
import {projectedActualParts} from '../../story/project-actual-parts.ts';

import {sampleDynamics,localToWorld} from '../../physics/dynamics.ts';
test('camera projects ALL three separate named true mechanical parts into portrait view',()=>{
 for(const t of [.3,1.6,3.7]){
  const m=sampleDynamics(t,{startDistanceM:72,speedMps:62,aeroLoad01:1});
  const camera={
   positionWorld:localToWorld([1.0,-.28,1.32],m),
   targetWorld:localToWorld([1.0,.115,0],m),
   fovDeg:59,rollRad:0,
  };
  const parts=projectedActualParts(m,camera);
  assert.deepEqual(parts.map(p=>p.id),['metal','plank','floor']);
  assert.ok(parts.every(p=>p.onScreen),JSON.stringify(parts));
  assert.ok(parts.every(p=>p.x>0&&p.x<1080&&p.y>0&&p.y<1920));
  assert.ok(Math.abs(parts[0].x-parts[1].x)>30,'true metal and plank separated in projection');
 }
});

