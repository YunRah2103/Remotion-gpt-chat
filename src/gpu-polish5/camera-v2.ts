import * as THREE from 'three';

/** POLISH05 B — purely frame-derived camera; never modifies GPU geometry. */
export type Focus = 'all'|'front'|'fan'|'cooler'|'thermal'|'silicon'|'expand';
export type CameraKey = {
  frame:number; focus:Focus; yaw:number; pitch:number; roll:number;
  fov:number; widthFill:number; heightFill:number; biasY:number;
};
export const CAMERA_KEYS:readonly CameraKey[] = [
  {frame:0,   focus:'all',     yaw:18,pitch:14,roll:-29,fov:33,widthFill:.88,heightFill:.77,biasY:.04},
  {frame:34,  focus:'all',     yaw:26,pitch:18,roll:-32,fov:31,widthFill:.92,heightFill:.78,biasY:.05},
  {frame:49,  focus:'all',     yaw:28,pitch:17,roll:-32,fov:31,widthFill:.91,heightFill:.78,biasY:.04},
  {frame:73,  focus:'front',   yaw:27,pitch:15,roll:-18,fov:34,widthFill:.95,heightFill:.80,biasY:.08},
  {frame:89,  focus:'fan',     yaw:10,pitch:9, roll:-10,fov:30,widthFill:.91,heightFill:.74,biasY:.08},
  {frame:109, focus:'fan',     yaw:19,pitch:11,roll:-10,fov:29,widthFill:.95,heightFill:.78,biasY:.04},
  {frame:141, focus:'front',   yaw:37,pitch:14,roll:-25,fov:34,widthFill:.94,heightFill:.82,biasY:.06},
  {frame:159, focus:'front',   yaw:45,pitch:18,roll:-28,fov:34,widthFill:.92,heightFill:.78,biasY:.05},
  {frame:181, focus:'cooler',  yaw:59,pitch:30,roll:-19,fov:31,widthFill:.91,heightFill:.78,biasY:.09},
  {frame:209, focus:'cooler',  yaw:67,pitch:41,roll:-12,fov:30,widthFill:.95,heightFill:.81,biasY:.10},
  {frame:239, focus:'thermal', yaw:75,pitch:51,roll:-9,fov:29,widthFill:.94,heightFill:.78,biasY:.10},
  {frame:265, focus:'thermal', yaw:80,pitch:59,roll:-8,fov:29,widthFill:.91,heightFill:.78,biasY:.08},
  {frame:286, focus:'silicon', yaw:83,pitch:61,roll:-7,fov:29,widthFill:.89,heightFill:.74,biasY:.06},
  {frame:307, focus:'silicon', yaw:84,pitch:55,roll:-10,fov:28,widthFill:.96,heightFill:.74,biasY:.06},
  {frame:329, focus:'expand',  yaw:65,pitch:30,roll:-24,fov:33,widthFill:.87,heightFill:.77,biasY:.19},
  {frame:364, focus:'all',     yaw:48,pitch:21,roll:-45,fov:32,widthFill:.92,heightFill:.80,biasY:.13},
  {frame:405, focus:'all',     yaw:42,pitch:19,roll:-57,fov:32,widthFill:.92,heightFill:.80,biasY:-.10},
  {frame:449, focus:'all',     yaw:38,pitch:17,roll:-61,fov:32,widthFill:.92,heightFill:.80,biasY:-.20},
] as const;

export const SHOT_MAP = [
  {from:0,to:49,label:'01 / ASSEMBLED HERO',focus:'all'},
  {from:50,to:89,label:'02 / DETAIL HERO',focus:'front / fan'},
  {from:90,to:159,label:'03 / FAN SEPARATION',focus:'fan / front'},
  {from:160,to:209,label:'04 / COOLER REVEAL',focus:'cooler'},
  {from:210,to:279,label:'05 / THERMAL ARCHITECTURE',focus:'thermal'},
  {from:280,to:329,label:'06 / SILICON & EXPANSION',focus:'silicon / expand'},
  {from:330,to:404,label:'07 / EXPLODED MASTER',focus:'all'},
  {from:405,to:449,label:'08 / FINAL PAYOFF',focus:'all'},
] as const;

const rad=(d:number)=>d*Math.PI/180;
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
export const ease=(f:number,a:number,b:number)=>{
  if(b<=a)return f>=b?1:0;
  const x=clamp((f-a)/(b-a));return x*x*(3-2*x);
};
const rangeBox=(scene:THREE.Object3D,names:string[])=>{
  const output=new THREE.Box3();
  for(const name of names){
    const object=scene.getObjectByName(name);
    if(object)output.union(new THREE.Box3().setFromObject(object,true));
  }
  return output;
};
/**
 * Focus is an optical selection only. Every mechanical node stays visible and
 * unchanged; editorial macro crops are deliberate, not disappearing geometry.
 */
export const subjectBox=(scene:THREE.Object3D,focus:Focus):THREE.Box3=>{
  if(focus==='all'||focus==='expand')return new THREE.Box3().setFromObject(scene,true);
  const names:Record<Exclude<Focus,'all'|'expand'>,string[]>={
    front:['FRONT_SHROUD','FAN_LEFT','FAN_CENTER','FAN_RIGHT'],
    fan:['FAN_CENTER'],
    cooler:['HEATSINK_FINS','HEATPIPE_BUNDLE','COLD_PLATE'],
    thermal:['HEATPIPE_BUNDLE','COLD_PLATE','GPU_DIE','VRAM_CHIPS'],
    silicon:['GPU_DIE','VRAM_CHIPS','VRM_COMPONENTS'],
  };
  const box=rangeBox(scene,names[focus]);
  if(box.isEmpty())throw Error('POLISH05 camera focus anchors missing: '+focus);
  return box;
};
const FOCUS_NAMES:Record<Exclude<Focus,'all'|'expand'>,string[]>={
  front:['FRONT_SHROUD','FAN_LEFT','FAN_CENTER','FAN_RIGHT'],
  fan:['FAN_CENTER'],
  cooler:['HEATSINK_FINS','HEATPIPE_BUNDLE','COLD_PLATE'],
  thermal:['HEATPIPE_BUNDLE','COLD_PLATE','GPU_DIE','VRAM_CHIPS'],
  silicon:['GPU_DIE','VRAM_CHIPS','VRM_COMPONENTS'],
};
const corners=(b:THREE.Box3)=>{
  const {min:m,max:M}=b;
  return [
    [m.x,m.y,m.z],[m.x,m.y,M.z],[m.x,M.y,m.z],[m.x,M.y,M.z],
    [M.x,m.y,m.z],[M.x,m.y,M.z],[M.x,M.y,m.z],[M.x,M.y,M.z],
  ].map(v=>new THREE.Vector3(v[0],v[1],v[2]));
};
export const keyAt=(frame:number)=>{
  let i=0;while(i+1<CAMERA_KEYS.length && frame>CAMERA_KEYS[i+1].frame)i++;
  const a=CAMERA_KEYS[i],b=CAMERA_KEYS[Math.min(i+1,CAMERA_KEYS.length-1)];
  const t=ease(frame,a.frame,b.frame);
  const fields=['yaw','pitch','roll','fov','widthFill','heightFill','biasY'] as const;
  const interpolated={} as Record<typeof fields[number],number>;
  for(const field of fields)interpolated[field]=mix(a[field],b[field],t);
  return {a,b,t,...interpolated};
};
function optics(box:THREE.Box3,orientation:THREE.Quaternion,target:THREE.Vector3,
                fov:number,aspect:number,fillX:number,fillY:number){
  const inverse=orientation.clone().invert();
  const tanY=Math.tan(rad(fov)/2),tanX=tanY*aspect;
  let distance=1;
  for(const corner of corners(box)){
    const local=corner.sub(target).applyQuaternion(inverse);
    // Exact perspective inequalities for off-axis and rolled bounding boxes.
    distance=Math.max(distance,
      local.z+Math.abs(local.x)/(tanX*fillX),
      local.z+Math.abs(local.y)/(tanY*fillY));
  }
  return distance;
}
/**
 * Mesh-tight perspective fitting: a whole-scene world AABB is far too
 * conservative for a yawed/rolled horizontal GPU in 9:16 portrait. The eight
 * corners of each mesh's LOCAL geometry box are transformed into the same
 * camera coordinates; the resulting distances still guarantee projected
 * containment of every mesh AABB, including C's moved anchor descendants.
 * This fixes the mini-card final shot without arbitrary zoom or clipped layers.
 */
function opticalMeshFit(scene:THREE.Object3D,focus:Focus,
  orientation:THREE.Quaternion,target:THREE.Vector3,
  fov:number,aspect:number,fillX:number,fillY:number):number{
  const inverse=orientation.clone().invert();
  const tanY=Math.tan(rad(fov)/2),tanX=tanY*aspect;
  const roots=(focus==='all'||focus==='expand')?[scene]:
    FOCUS_NAMES[focus].map(name=>scene.getObjectByName(name)).filter(
      (value):value is THREE.Object3D=>Boolean(value));
  let distance=1,seen=0;
  for(const root of roots){
    root.traverse(node=>{
      const mesh=node as THREE.Mesh;
      if(!mesh.isMesh||!mesh.geometry)return;
      const geometry=mesh.geometry;
      if(!geometry.boundingBox)geometry.computeBoundingBox();
      if(!geometry.boundingBox)return;
      for(const p of corners(geometry.boundingBox)){
        const local=p.applyMatrix4(mesh.matrixWorld).sub(target).applyQuaternion(inverse);
        distance=Math.max(distance,
          local.z+Math.abs(local.x)/(tanX*fillX),
          local.z+Math.abs(local.y)/(tanY*fillY));
      }
      seen++;
    });
  }
  if(!seen)throw Error('POLISH05 B optical fit has no mesh: '+focus);
  return distance;
}
export type CinemaPose={eye:THREE.Vector3; target:THREE.Vector3; fov:number; 
  roll:number; focusFrom:Focus; focusTo:Focus; blend:number; minDistance:number};
export function evaluateCamera(frame:number,scene:THREE.Object3D,aspect:number):CinemaPose{
  const k=keyAt(frame);
  const cp=Math.cos(rad(k.pitch));
  const direction=new THREE.Vector3(Math.sin(rad(k.yaw))*cp,
    Math.sin(rad(k.pitch)),Math.cos(rad(k.yaw))*cp).normalize();
  const probe=new THREE.PerspectiveCamera(k.fov,aspect,.04,200);
  probe.position.copy(direction);probe.up.set(0,1,0);probe.lookAt(0,0,0);
  probe.rotateZ(rad(k.roll));probe.updateMatrixWorld(true);
  const quaternion=probe.quaternion.clone();
  const boxA=subjectBox(scene,k.a.focus),boxB=subjectBox(scene,k.b.focus);
  const centerA=boxA.getCenter(new THREE.Vector3());
  const centerB=boxB.getCenter(new THREE.Vector3());
  const center=centerA.clone().lerp(centerB,k.t);
  const cameraUp=new THREE.Vector3(0,1,0).applyQuaternion(quaternion);
  const cameraTarget=center.clone().addScaledVector(cameraUp,k.biasY);
  const first=opticalMeshFit(scene,k.a.focus,quaternion,centerA,k.fov,aspect,k.widthFill,k.heightFill);
  const second=opticalMeshFit(scene,k.b.focus,quaternion,centerB,k.fov,aspect,k.widthFill,k.heightFill);
  const lensDistance=mix(first,second,k.t);
  // Relative clip-safe guard; no abrupt global bounding-box refit in macro.
  const safeDistance=Math.max(1.15,lensDistance);
  return {eye:cameraTarget.clone().addScaledVector(direction,safeDistance),
    target:cameraTarget,fov:k.fov,roll:k.roll,focusFrom:k.a.focus,
    focusTo:k.b.focus,blend:k.t,minDistance:safeDistance};
}
export function applyCinemaCamera(camera:THREE.Camera,frame:number,
                                  gpu:THREE.Object3D,width:number,height:number){
  const c=camera as THREE.PerspectiveCamera;
  if(!c.isPerspectiveCamera)throw Error('POLISH05 B requires PerspectiveCamera');
  const pose=evaluateCamera(frame,gpu,width/height);
  c.fov=pose.fov;c.aspect=width/height;c.near=.04;c.far=200;
  c.position.copy(pose.eye);c.up.set(0,1,0);c.lookAt(pose.target);
  c.rotateZ(rad(pose.roll));c.updateProjectionMatrix();c.updateMatrixWorld(true);
  return pose;
}
