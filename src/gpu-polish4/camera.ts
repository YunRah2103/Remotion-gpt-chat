import * as THREE from 'three';

/** POLISH04 B — purely frame-derived camera; never modifies GPU geometry. */
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
  {frame:181, focus:'cooler',  yaw:51,pitch:22,roll:-20,fov:31,widthFill:.91,heightFill:.78,biasY:.09},
  {frame:209, focus:'cooler',  yaw:57,pitch:23,roll:-15,fov:30,widthFill:.95,heightFill:.81,biasY:.10},
  {frame:239, focus:'thermal', yaw:65,pitch:25,roll:-17,fov:29,widthFill:.94,heightFill:.78,biasY:.10},
  {frame:265, focus:'thermal', yaw:59,pitch:26,roll:-15,fov:29,widthFill:.91,heightFill:.78,biasY:.08},
  {frame:286, focus:'silicon', yaw:67,pitch:29,roll:-11,fov:29,widthFill:.89,heightFill:.74,biasY:.06},
  {frame:307, focus:'silicon', yaw:76,pitch:28,roll:-12,fov:28,widthFill:.96,heightFill:.74,biasY:.06},
  {frame:329, focus:'expand',  yaw:62,pitch:21,roll:-28,fov:33,widthFill:.84,heightFill:.77,biasY:.05},
  {frame:364, focus:'all',     yaw:54,pitch:20,roll:-33,fov:32,widthFill:.91,heightFill:.78,biasY:.01},
  {frame:405, focus:'all',     yaw:59,pitch:19,roll:-34,fov:32,widthFill:.93,heightFill:.80,biasY:.01},
  {frame:449, focus:'all',     yaw:63,pitch:17,roll:-32,fov:32,widthFill:.92,heightFill:.78,biasY:0},
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
    cooler:['FRONT_SHROUD','HEATSINK','HEATPIPE_BUNDLE','COLD_PLATE'],
    thermal:['HEATPIPE_BUNDLE','COLD_PLATE','GPU_DIE','PCB'],
    silicon:['GPU_DIE','VRAM_CHIPS','VRM_COMPONENTS'],
  };
  const box=rangeBox(scene,names[focus]);
  if(box.isEmpty())throw Error('POLISH04 camera focus anchors missing: '+focus);
  return box;
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
  const first=optics(boxA,quaternion,centerA,k.fov,aspect,k.widthFill,k.heightFill);
  const second=optics(boxB,quaternion,centerB,k.fov,aspect,k.widthFill,k.heightFill);
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
  if(!c.isPerspectiveCamera)throw Error('POLISH04 B requires PerspectiveCamera');
  const pose=evaluateCamera(frame,gpu,width/height);
  c.fov=pose.fov;c.aspect=width/height;c.near=.04;c.far=200;
  c.position.copy(pose.eye);c.up.set(0,1,0);c.lookAt(pose.target);
  c.rotateZ(rad(pose.roll));c.updateProjectionMatrix();c.updateMatrixWorld(true);
  return pose;
}
