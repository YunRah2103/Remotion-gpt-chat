import test from 'node:test';
import assert from 'node:assert/strict';
import {EP004} from '../../shared/contract.ts';
import {
 getSkidDescriptors, SKID_BOTTOM_Y_M, SKID_LAYOUT,
 SKID_THICKNESS_M, SKID_WIDTH_M, PLANK_HALF_LENGTH_M,
} from '../../mechanics/skids.ts';

test('forward mandatory separate metal skid and baseline clearance',()=>{
 const skids=getSkidDescriptors();
 assert.equal(skids.length,3);
 assert.equal(skids[0].id,'forward');
 assert.equal(SKID_LAYOUT[0].mandatory,true);
 assert.equal(SKID_LAYOUT[0].material,'Ti6Al4V');
 for (const s of skids){
  assert.equal(s.metal,true);
  assert.equal(s.localBottomPoint[1],SKID_BOTTOM_Y_M);
  assert.equal(s.localBottomPoint[1],EP004.initialSkidBottomClearanceM);
  assert.equal(s.localBottomPoint[2],0);
 }
});
test('skids are physically placeable in narrow composite plank',()=>{
 const sorted=[...SKID_LAYOUT].sort((a,b)=>a.xM-b.xM);
 for(let i=0;i<sorted.length;i++){
  const s=sorted[i];
  assert.ok(s.xM-s.lengthM/2 > -PLANK_HALF_LENGTH_M);
  assert.ok(s.xM+s.lengthM/2 < PLANK_HALF_LENGTH_M);
  assert.ok(SKID_WIDTH_M < .45);
  assert.ok(SKID_THICKNESS_M > 0 && SKID_THICKNESS_M < .05);
  if(i>0)assert.ok(sorted[i-1].xM+sorted[i-1].lengthM/2 < s.xM-s.lengthM/2);
 }
});
test('fixture speed is a declared illustration, not telemetry',()=>{
 assert.equal(EP004.previewSpeedMps,62);
 assert.equal(EP004.vehicleVariant,'formula-modern');
 assert.equal(EP004.wheelRadiusM,.36);
});
