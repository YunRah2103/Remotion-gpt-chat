import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createApprovedV4,poseApprovedV4,sampleV4Ports,V4_EXHAUST_MANIFEST,V4_DRIVING_FRAMES} from '../../src/yunex/ep005/agent6/v4-approved.ts';
const dest=process.argv[2]||'out/ep005-agent6/v4-ports';
fs.mkdirSync(dest,{recursive:true});
const scene=createApprovedV4(),timeline=[];
for(let frame=0;frame<V4_DRIVING_FRAMES;frame++){
 const pose=poseApprovedV4(scene,frame);
 const ports=sampleV4Ports(scene,frame);
 if(ports.length!==2||ports[0].worldOrigin[2] <= ports[1].worldOrigin[2])throw Error('Left-right port orientation wrong');
 for(const port of ports){
  if(port.worldOutward[0]>-.99)throw Error('Port axis does not point backward');
  if(port.outerDiameterM<.105||port.outerDiameterM>.120)throw Error('Invalid outlet diameter');
 }
 timeline.push({frame,timeSec:frame/30,vehicleX:pose.x,ports});
}
if(timeline.at(-1).vehicleX-timeline[0].vehicleX<100)throw Error('Car not truly moving at track speed');
const manifest=V4_EXHAUST_MANIFEST;
fs.writeFileSync(path.join(dest,'v4-exhaust-ports.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(dest,'v4-ports-120frames.json'),JSON.stringify({source:manifest.source,frames:timeline},null,2)+'\n');
for(const file of ['v4-exhaust-ports.json','v4-ports-120frames.json']){
 const data=fs.readFileSync(path.join(dest,file));
 console.log(file,crypto.createHash('sha256').update(data).digest('hex'));
}
console.log('validated 120 changing live world transforms; first/last x',timeline[0].ports[0].worldOrigin[0],timeline.at(-1).ports[0].worldOrigin[0]);
