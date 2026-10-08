import * as THREE from 'three';
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
export const smooth=(f:number,a:number,b:number)=>{const t=clamp((f-a)/(b-a));return t*t*(3-2*t);};
const rad=(d:number)=>d*Math.PI/180;
const corners=(b:THREE.Box3)=>{const {min,max}=b;return [[min.x,min.y,min.z],[min.x,min.y,max.z],[min.x,max.y,min.z],[min.x,max.y,max.z],[max.x,min.y,min.z],[max.x,min.y,max.z],[max.x,max.y,min.z],[max.x,max.y,max.z]].map(([x,y,z])=>new THREE.Vector3(x,y,z));};
export const cameraShot=(frame:number)=>{
 const hero=smooth(frame,0,89),reveal=smooth(frame,100,322),settle=smooth(frame,330,449);
 return {yaw:rad(15+9*hero+29*reveal+2*settle),pitch:rad(10+7*smooth(frame,115,300)+2*settle),coverage:.79+.08*hero-.015*reveal+.02*settle,verticalBias:-.29-.065*reveal};
};
/** Deterministic bounds-fit camera. Real GLB mesh bounding volume, never a 2D image. */
export function fitCamera(camera:THREE.Camera,gpu:THREE.Object3D,frame:number,width:number,height:number){
 const o=camera as THREE.OrthographicCamera,shot=cameraShot(frame);
 const box=new THREE.Box3().setFromObject(gpu,true);
 if(box.isEmpty())throw new Error('POLISH3: empty GPU scene');
 const look=box.getCenter(new THREE.Vector3()).add(new THREE.Vector3(0,shot.verticalBias,0));
 const cp=Math.cos(shot.pitch),r=12;
 o.position.copy(look).add(new THREE.Vector3(r*Math.sin(shot.yaw)*cp,r*Math.sin(shot.pitch),r*Math.cos(shot.yaw)*cp));
 o.up.set(0,1,0);o.lookAt(look);
 const inverse=o.quaternion.clone().invert();
 const points=corners(box).map(p=>p.sub(look).applyQuaternion(inverse));
 const x=points.map(p=>p.x),ys=points.map(p=>Math.abs(p.y));
 const requiredWidth=Math.max(...x)-Math.min(...x);
 const viewHeight=Math.max(4.7,requiredWidth/((width/height)*shot.coverage),Math.max(...ys)/.315);
 o.zoom=height/viewHeight;o.updateProjectionMatrix();o.updateMatrixWorld(true);
}
