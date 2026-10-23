/**
 * Frame-exact Agent 6 -> Agent 7/8 approved V4-A ports.
 * Dumps both physical factory mounts without altering the user-approved vehicle.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {createApprovedV4,poseApprovedV4,sampleV4Ports,v4Camera,
  V4_EXHAUST_MANIFEST,V4_DRIVING_FRAMES} from '../../src/yunex/ep005/agent6/v4-approved.ts';

const dest=process.argv[2]||'out/ep005-agent6/ports';
fs.mkdirSync(dest,{recursive:true});
const sourceCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const tracked=JSON.parse(fs.readFileSync('src/yunex/ep005/agent6/v4-exhaust-ports.json','utf8'));
assert.deepEqual(tracked,V4_EXHAUST_MANIFEST,'Git JSON manifest and source V4 rig must match EXACTLY');
assert.equal(tracked.version,2);
assert.equal(tracked.vehicle,'v4-a-supercar');
assert.equal(tracked.source,'9052a539e10a7cb97487c1435455bb9962ad58e1');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const write=(name,obj)=>{const content=JSON.stringify(obj,null,2)+'\n';
  fs.writeFileSync(path.join(dest,name),content);return hash(content);};
const manifestHash=write('v4-exhaust-ports.json',V4_EXHAUST_MANIFEST);
const sourceCar=createApprovedV4(),frames=[],agent7Frames=[];
const shots=['rear-proof','side-tracking','front-pursuit','rear-chase'];
for(let frame=0;frame<V4_DRIVING_FRAMES;frame++){
 const pose=poseApprovedV4(sourceCar,frame),ports=sampleV4Ports(sourceCar,frame);
 assert.equal(ports.length,2);
 assert(ports[0].worldOrigin[2]>ports[1].worldOrigin[2], 'Left/right tips swapped');
 for(const port of ports){
  assert(port.worldOutward[0]<-.99, 'V4 nozzle must flow backwards along -X');
  assert(Math.abs(Math.hypot(...port.worldOutward)-1)<1e-5, 'Nozzle outward axis not unit length');
  assert(port.outerDiameterM>=.105&&port.outerDiameterM<=.120,'Oversized outlet');
  assert.equal(port.innerRadiusM,.052);
 }
 const sep=Math.hypot(...ports[0].worldOrigin.map((v,i)=>v-ports[1].worldOrigin[i]));
 assert(sep>.35&&sep<1.75,'Outlets improperly spaced');
 const route={frame, fps:pose.fps,timeSec:frame/pose.fps,vehiclePosition:[pose.x,pose.y,pose.z],
   vehicleVelocity:[pose.speed,0,0],vehicleYawRad:pose.yaw,
   cameras:Object.fromEntries(shots.map(shot=>[shot,v4Camera(shot,frame)]))};
 frames.push({...route,ports});
 const v7ports=ports.map(p=>({
   frame, name:p.id==='left'?'exhaust-left':'exhaust-right',
   worldOrigin:p.worldOrigin, worldOutward:p.worldOutward,
   innerRadiusM:p.innerRadiusM, visibleOuterDiameterM:p.outerDiameterM
 }));
 agent7Frames.push({...route,ports:v7ports});
}
assert(frames.at(-1).vehiclePosition[0]-frames[0].vehiclePosition[0]>100,
 'Vehicle world translation not true high-speed driving');
const timelineHash=write('v4-ports-120frames.json',{
  vehicle:'v4-a-supercar',frameCount:V4_DRIVING_FRAMES,fps:30,
  sourceDesignCommit:V4_EXHAUST_MANIFEST.source,sourceShotCommit:sourceCommit,frames
});
const lock={
  version:2,vehicle:'v4-a-supercar',coordinateConvention:'world-three-y-up-metres',
  referenceKitCommit:V4_EXHAUST_MANIFEST.source,
  referenceApprovalUrl:V4_EXHAUST_MANIFEST.referenceApprovalUrl,
  agent6ShotCommit:sourceCommit,v4PortManifestSha256:manifestHash
};
const consumerHash=write('agent7-world-ports-120frames.json',{
  lock, sourceShotCommit:sourceCommit,sourceManifestSha256:manifestHash,
  sourceTimelineSha256:timelineHash, frames:agent7Frames
});
write('agent7-v4-port-lock.json',lock);
write('SHA256S.json',{sourceShotCommit:sourceCommit,sourceDesignCommit:lock.referenceKitCommit,
  manifestSha256:manifestHash,frameTransformTimelineSha256:timelineHash,
  agent7PortFrameDataSha256:consumerHash,
  note:'Shot commit is independent of immutable owner-approved appearance commit; native MP4 hashes are emitted by v4-verify.py'});
console.log(JSON.stringify({sourceShotCommit:sourceCommit,approvedDesignCommit:lock.referenceKitCommit,
   manifestSha256:manifestHash,timelineSha256:timelineHash,agent7WorldPortsSha256:consumerHash,
   frames:frames.length,worldDisplacementM:frames.at(-1).vehiclePosition[0]-frames[0].vehiclePosition[0],
   firstAxis:frames[0].ports[0].worldOutward,lastAxis:frames.at(-1).ports[0].worldOutward},null,2));
