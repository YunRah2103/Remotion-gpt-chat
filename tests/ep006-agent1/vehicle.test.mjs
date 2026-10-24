import assert from 'node:assert/strict';
import test from 'node:test';
import {createEp006RallyVehicle,applyEp006RallyPose,ep006RallyHardpoints,EP006_CORNERS,EP006_RALLY_SUSPENSION} from '../../src/yunex/ep006/vehicle/index.ts';
import {sampleEp006VehicleFixture} from '../../src/yunex/ep006/vehicle/fixture.ts';

test('reuses the V4 rally shell, driver, rolling hubs and four independent new struts',()=>{
 const car=createEp006RallyVehicle();
 assert.ok(car.getObjectByName('body-shell'));
 assert.ok(car.getObjectByName('ep006-reinforced-underbody'));
 assert.equal(car.userData.ep006Vehicle,'V4 studio rally-hatch with original exterior');
 const p=ep006RallyHardpoints(car);
 assert.equal(p.length,4);
 for(const corner of EP006_CORNERS){
   assert.ok(car.getObjectByName('mount-'+corner));
   assert.ok(car.getObjectByName('ep006-'+corner+'-suspension'));
   assert.ok(car.getObjectByName('links-mount-'+corner));
   assert.equal(car.getObjectByName('links-mount-'+corner).visible,false);
   assert.equal(p.find(x=>x.corner===corner).compressionRangeM[0],-EP006_RALLY_SUSPENSION.maximumDroopM);
   assert.ok(car.getObjectByName('ep006-'+corner+'-suspension').getObjectByName('ep006-twelve-turn-coil'));
 }
});
test('contact compression, droop and rotated wheels are sampled from absolute frames',()=>{
 const car=createEp006RallyVehicle();
 const land=sampleEp006VehicleFixture(78),air=sampleEp006VehicleFixture(42);
 applyEp006RallyPose(car,land);
 const mount=car.getObjectByName('mount-front-left');
 const wheel=mount.getObjectByName('wheel-roll');
 const first=[mount.position.y,wheel.rotation.z,...car.position.toArray()];
 applyEp006RallyPose(car,air);
 assert.ok(mount.position.y<first[0]);
 applyEp006RallyPose(car,land);
 assert.deepEqual([mount.position.y,wheel.rotation.z,...car.position.toArray()],first);
 assert.ok(land.wheels['front-left'].contact);
 assert.equal(air.wheels['front-left'].contact,false);
});
test('pose rejects out-of-range springs and invalid geometry instead of clipping arches',()=>{
 const car=createEp006RallyVehicle(),pose=sampleEp006VehicleFixture(70);
 pose.wheels['front-left'].compressionM=.25;
 assert.throws(()=>applyEp006RallyPose(car,pose),/Travel outside/);
 pose.wheels['front-left'].compressionM=.02;
 pose.wheels['front-left'].spinRad=Number.NaN;
 assert.throws(()=>applyEp006RallyPose(car,pose),/Invalid pose/);
});
