/**
 * Geometry-derived portrait shot gate. No image assumptions, no fixed 2D
 * boxes: project live source car panel + four wheel bounds every frame.
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createApprovedV4,poseApprovedV4,v4Camera,
  V4_DRIVING_FRAMES} from '../../src/yunex/ep005/agent6/v4-approved.ts';

const out=process.argv[2]||'out/ep005-agent6/camera-qc';
fs.mkdirSync(out,{recursive:true});
const car=createApprovedV4();
const shots=['side-tracking','front-pursuit','rear-proof','rear-chase'];
const results={source:'9052a539e10a7cb97487c1435455bb9962ad58e1',shots:{}};
for(const shot of shots){
 let largestX=0,largestY=0,edgeFrame=-1;
 const samples=[];
 for(let frame=0;frame<V4_DRIVING_FRAMES;frame++){
   poseApprovedV4(car,frame);
   const hull=new THREE.Box3().makeEmpty();
   for(const name of ['body-shell','mount-front-left','mount-front-right','mount-rear-left','mount-rear-right']){
     const object=car.getObjectByName(name);
     assert(object,'Expected approved V4 body/wheel '+name);
     hull.expandByObject(object,true);
   }
   assert(!hull.isEmpty(),'No actual approved V4 body');
   const c=v4Camera(shot,frame);
   const camera=new THREE.PerspectiveCamera(c.fov,1080/1920,.025,550);
   camera.position.set(...c.position);camera.lookAt(...c.target);
   camera.updateMatrixWorld(true);camera.updateProjectionMatrix();
   const xs=[hull.min.x,hull.max.x],ys=[hull.min.y,hull.max.y],zs=[hull.min.z,hull.max.z];
   const projected=[];
   for(const x of xs)for(const y of ys)for(const z of zs){
     const p=new THREE.Vector3(x,y,z).project(camera);
     assert([p.x,p.y,p.z].every(Number.isFinite),'Camera failed projection');
     projected.push([p.x,p.y,p.z]);
   }
   const xExtent=Math.max(...projected.map(a=>Math.abs(a[0])));
   const yExtent=Math.max(...projected.map(a=>Math.abs(a[1])));
   if(xExtent>largestX){largestX=xExtent;edgeFrame=frame;}
   largestY=Math.max(largestY,yExtent);
   if(frame%20===0||frame===119)samples.push({frame,xExtent,yExtent,centerWorld:hull.getCenter(new THREE.Vector3()).toArray()});
 }
 results.shots[shot]={largestAbsoluteNdcX:largestX,largestAbsoluteNdcY:largestY,closestFrameToCrop:edgeFrame,samples};
}
const dest=path.join(out,'camera-framing-report.json');
fs.writeFileSync(dest,JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify(results,null,2));
// Diagnostic JSON is preserved in always-uploaded artifacts even on quality failure.
assert(results.shots['side-tracking'].largestAbsoluteNdcX<.94,
  'Side V4 cropped at frame '+results.shots['side-tracking'].closestFrameToCrop);
assert(results.shots['front-pursuit'].largestAbsoluteNdcX<.96,
  'Front V4 cropped at frame '+results.shots['front-pursuit'].closestFrameToCrop);
