import assert from 'node:assert/strict';
import {sampleDynamics,DYNAMICS_DEFAULTS} from '../dynamics/model.ts';
import {refugeRailZ} from '../look/refuge-profile.ts';
import {crashIncidentFromDynamics,sampleCrashOutcome,impactRailZ,
 projectedRightHalfWidthM} from './model.ts';
const source=sampleDynamics(4,{...DYNAMICS_DEFAULTS,initialSpeedMps:70*.44704});
const incident=crashIncidentFromDynamics(source);
assert.ok(Math.abs(source.worldSpeedMps-70*.44704)<10);
assert.ok(source.wheels['front-right'].rollingRadiusM<.34);
const params={incident,worldCutX:-86,reaction:'panic-brake-and-overcorrect'};
const first=sampleCrashOutcome(0,params);
assert.deepEqual(first.physicalPositionM,source.positionM);
assert.equal(first.headingRad,source.yawRad);
assert.equal(first.pitchRad,source.pitchRad);
assert.equal(first.rollRad,source.rollRad);
assert.equal(first.frontRightWheelSpinRad,source.wheels['front-right'].spinRad);
let contact=null,lowestClear=Infinity;
for(let i=0;i<=135;i++){
 const s=sampleCrashOutcome(i/30,params);
 lowestClear=Math.min(lowestClear,s.contact.clearanceM);
 assert.ok(s.contact.clearanceM>=.015,'rail penetration at '+i);
 assert.ok(Math.abs(refugeRailZ(s.scenePositionM[0])-impactRailZ(s.scenePositionM[0]))<1e-7,
   'A4 refuge physical rail mismatch at '+i);
 if(s.contact.occurred&&!contact)contact=s;
}
assert.ok(contact,'actual A2 4s / 70mph + wrong reaction must contact within 4.5s');
assert.ok(contact.contact.impactSpeedMps>3);
assert.ok(contact.contact.firstContactX>-110&&contact.contact.firstContactX<110);
const later=sampleCrashOutcome(4.4,params);
assert.ok(later.bumperCrushM>.22);
assert.ok(later.fenderCrushM>.14);
assert.ok(later.lampCrushM>.10);
assert.ok(later.speedMps<first.speedMps);
const good=sampleCrashOutcome(3, {...params,reaction:'no-panic-control'});
assert.equal(good.driverBrake01,0);
console.log(JSON.stringify({result:'PASS authoritative A2 4s 70mph incident plus A1 wheel and A4 signed rail',
  initialSpeedMps:source.worldSpeedMps,initialZ:source.positionM[2],
  initialYaw:source.yawRad,firstContactTime:contact.contact.firstContactSec,
  firstContactSceneX:contact.contact.firstContactX,
  impactSpeedMps:contact.contact.impactSpeedMps,
  afterDamageM:[later.bumperCrushM,later.fenderCrushM,later.lampCrushM],
  minRailClearanceM:lowestClear},null,2));
