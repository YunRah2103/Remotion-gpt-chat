/**
 * Native deterministic mechanical QA using the exact pose/height functions of the film.
 * Reports geometric (not force-dynamics) contact, travel rate and independent corner response.
 * Run with Node 22+: node --experimental-strip-types production/tests/rugged_kinematics.mjs
 */
import {mkdirSync,writeFileSync} from 'node:fs';
import {poseAt,heightAt,FRAMES,FPS,RADIUS,SPEED,corners} from '../../src/suspension/kinematics.ts';

let maxHeightError=0,maxTravelDelta=0,minTravel=Infinity,maxTravel=-Infinity;
let maxRoll=0,maxPitch=0,maxFrameBodyDelta=0,maxRelativeWheelDifference=0;
let failed=[];
let lines=['frame,time_s,corner,ground_m,hub_m,travel_m,contact_error_m,wheel_omega_rad_s'];
let previous=null;
for(let frame=0;frame<FRAMES;frame++){
 const pose=poseAt(frame);
 if(previous){
  maxFrameBodyDelta=Math.max(maxFrameBodyDelta,Math.abs(pose.chassisY-previous.chassisY));
 }
 maxRoll=Math.max(maxRoll,Math.abs(pose.roll));maxPitch=Math.max(maxPitch,Math.abs(pose.pitch));
 let set=[];
 for(const c of corners){
  const w=pose.wheels[c];set.push(w.localY);
  // Actual centre after composing the two Euler rotations applied in the JSX.
  const r=pose.roll,p=pose.pitch;
  const rx=Math.cos(r)*w.x-Math.sin(r)*w.localY;
  const ry=Math.sin(r)*w.x+Math.cos(r)*w.localY;
  const wz=pose.z+Math.sin(p)*ry+Math.cos(p)*w.z;
  const wy=pose.chassisY+Math.cos(p)*ry-Math.sin(p)*w.z;
  const e=wy-RADIUS-heightAt(rx,wz);
  maxHeightError=Math.max(maxHeightError,Math.abs(e));
  minTravel=Math.min(minTravel,w.travel);maxTravel=Math.max(maxTravel,w.travel);
  if(previous)maxTravelDelta=Math.max(maxTravelDelta,Math.abs(w.travel-previous.wheels[c].travel));
  lines.push([frame,(frame/FPS).toFixed(5),c,w.ground.toFixed(5),wy.toFixed(5),w.travel.toFixed(5),e.toFixed(5),(SPEED/RADIUS).toFixed(5)].join(','));
 }
 maxRelativeWheelDifference=Math.max(maxRelativeWheelDifference,Math.max(...set)-Math.min(...set));
 previous=pose;
}
if(maxHeightError>.17)failed.push('Geometric heightfield contact exceeded 17cm');
if(maxTravelDelta>.13)failed.push('Frame-to-frame suspension travel exceeded 13cm');
if(maxFrameBodyDelta>.075)failed.push('Sprung body jumps exceeded 7.5cm/frame');
if(minTravel<-.95||maxTravel>.92)failed.push('Suspension operating range exceeded planned envelope');
if(maxRelativeWheelDifference<.24)failed.push('No meaningful independent articulation observed');
if(Math.abs(poseAt(FRAMES-1).wheels.FR.spin-SPEED*(FRAMES-1)/FPS/RADIUS)>1e-9)failed.push('Rotation-to-travel equation failed');
const report={
 status:failed.length?'FAIL':'PASS',frames:FRAMES,fps:FPS,coordinateSystem:'metres; +Y up; -Z forwards',
 model:'deterministic geometric suspension; not a validated vehicle dynamics simulation',
 toleranceMetres:.17,
 maxGeometricContactErrorMetres:+maxHeightError.toFixed(5),
 maxTravelChangeMetresPerFrame:+maxTravelDelta.toFixed(5),
 maxBodyHeightChangeMetresPerFrame:+maxFrameBodyDelta.toFixed(5),
 maxIndependentCornerSpreadMetres:+maxRelativeWheelDifference.toFixed(5),
 travelRangeMetres:[+minTravel.toFixed(5),+maxTravel.toFixed(5)],
 maxBodyRollRadians:+maxRoll.toFixed(5),maxBodyPitchRadians:+maxPitch.toFixed(5),
 wheelSpeedRadiansPerSecond:+(SPEED/RADIUS).toFixed(5),issues:failed
};
mkdirSync('out/rugged', {recursive:true});
writeFileSync('out/rugged/mechanical-report.json',JSON.stringify(report,null,2)+'\n');
writeFileSync('out/rugged/telemetry.csv',lines.join('\n')+'\n');
console.log(JSON.stringify(report,null,2));
if(failed.length)process.exitCode=1;
