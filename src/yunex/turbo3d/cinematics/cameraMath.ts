/** Agent 4 — deterministic, scene-unit camera shot planning. No clock, RNG, or external model ownership. */
export type Vec3 = readonly [number,number,number];
export type Shot = 'hookOrbit'|'hookRush'|'exhaustTrack'|'shaftFollow'|'compressorReveal'|'chargeGlide'|'roadHero';
export type CameraAnchor = 'TURBINE'|'SHAFT'|'COMPRESSOR'|'EXHAUST_IN'|'COMPRESSED_AIR_OUT'|'INTERCOOLER_OUT'|'ENGINE_INTAKE'|'CAR';
export type Anchors = Partial<Record<CameraAnchor,Vec3>>;
export type CameraPose = {position:Vec3; target:Vec3; fov:number; roll:number};
const defaultAnchors:Record<CameraAnchor,Vec3> = {
 TURBINE:[-0.82,0,0], SHAFT:[0,0,0], COMPRESSOR:[0.82,0,0],
 EXHAUST_IN:[-2.25,0,0], COMPRESSED_AIR_OUT:[2.1,0.32,0],
 INTERCOOLER_OUT:[3.7,-0.3,-1.2], ENGINE_INTAKE:[4.3,0.15,-2.1], CAR:[0,0.7,0]
};
export const clamp01=(n:number):number=>Math.max(0,Math.min(1,n));
export const smooth=(t:number):number=>{const x=clamp01(t);return x*x*(3-2*x);};
export const mix=(a:number,b:number,t:number):number=>a+(b-a)*t;
const add=(a:Vec3,b:Vec3):Vec3=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const lerp=(a:Vec3,b:Vec3,t:number):Vec3=>[mix(a[0],b[0],t),mix(a[1],b[1],t),mix(a[2],b[2],t)];
/** Cubic Bezier with independently art-directed handles avoids jerky straight-line translations. */
export const bezier=(p0:Vec3,p1:Vec3,p2:Vec3,p3:Vec3,t:number):Vec3=>{
 const u=1-clamp01(t),v=1-u;
 const k0=u*u*u,k1=3*u*u*v,k2=3*u*v*v,k3=v*v*v;
 return [p0[0]*k0+p1[0]*k1+p2[0]*k2+p3[0]*k3,
 p0[1]*k0+p1[1]*k1+p2[1]*k2+p3[1]*k3,
 p0[2]*k0+p1[2]*k1+p2[2]*k2+p3[2]*k3];
};
const vec=(anchor:CameraAnchor,offset:Vec3,anchors:Anchors):Vec3=>add(anchors[anchor]??defaultAnchors[anchor],offset);
export const shotDuration:Readonly<Record<Shot,number>>={
 hookOrbit:90,hookRush:90,exhaustTrack:120,shaftFollow:150,compressorReveal:120,chargeGlide:150,roadHero:120
};
export const sampleShot=(shot:Shot,frame:number,anchors:Anchors={},duration=shotDuration[shot]):CameraPose=>{
 if (!Number.isFinite(frame)||!Number.isFinite(duration)||duration<2) throw new Error('Invalid frame/duration');
 const t=smooth(frame/(duration-1));
 let p0:Vec3,p1:Vec3,p2:Vec3,p3:Vec3,a:Vec3,b:Vec3, f0:number,f1:number;
 switch(shot){
 case 'hookOrbit':
  p0=vec('TURBINE',[-4.25,0.75,1.2],anchors);p1=vec('TURBINE',[-3.9,0.60,1.65],anchors);
  p2=vec('TURBINE',[-3.05,0.50,3.0],anchors);p3=vec('TURBINE',[-2.9,0.43,3.15],anchors);
  a=vec('TURBINE',[0,0,0],anchors);b=vec('TURBINE',[0.07,0.04,0],anchors);f0=42;f1=44;break;
 case 'hookRush':
  p0=vec('TURBINE',[-4.2,1.15,1.8],anchors);p1=vec('TURBINE',[-3.7,1.05,2.2],anchors);
  p2=vec('TURBINE',[-3.15,0.85,2.55],anchors);p3=vec('TURBINE',[-3.0,0.7,2.7],anchors);
  a=vec('EXHAUST_IN',[0.05,0.0,0],anchors);b=vec('TURBINE',[0,0.02,0],anchors);f0=42;f1=43;break;
 case 'exhaustTrack':
  p0=vec('EXHAUST_IN',[-0.7,0.65,2.6],anchors);p1=vec('EXHAUST_IN',[0.45,0.7,2.2],anchors);
  p2=vec('TURBINE',[-1.15,0.5,2.5],anchors);p3=vec('TURBINE',[-0.05,0.25,2.25],anchors);
  a=vec('EXHAUST_IN',[0.2,0,0],anchors);b=vec('TURBINE',[0,0,0],anchors);f0=34;f1=33;break;
 case 'shaftFollow':
  p0=vec('TURBINE',[-2.4,0.65,4.3],anchors);p1=vec('SHAFT',[-1.5,0.85,4.5],anchors);
  p2=vec('SHAFT',[1.5,0.85,4.5],anchors);p3=vec('COMPRESSOR',[2.4,0.65,4.3],anchors);
  a=vec('TURBINE',[0,0,0],anchors);b=vec('COMPRESSOR',[0,0,0],anchors);f0=42;f1=42;break;
 case 'compressorReveal':
  p0=vec('COMPRESSOR',[0.36,0.25,2.15],anchors);p1=vec('COMPRESSOR',[0.6,0.35,2.5],anchors);
  p2=vec('COMPRESSED_AIR_OUT',[0.35,0.55,2.65],anchors);p3=vec('COMPRESSED_AIR_OUT',[0.65,0.65,2.7],anchors);
  a=vec('COMPRESSOR',[0,0,0],anchors);b=vec('COMPRESSED_AIR_OUT',[0,0,0],anchors);f0=34;f1=36;break;
 case 'chargeGlide':
  p0=vec('COMPRESSED_AIR_OUT',[3.0,1.4,3.7],anchors);p1=vec('INTERCOOLER_OUT',[2.5,2.0,4.2],anchors);
  p2=vec('INTERCOOLER_OUT',[3.3,1.9,3.8],anchors);p3=vec('INTERCOOLER_OUT',[3.5,1.8,3.1],anchors);
  a=vec('COMPRESSED_AIR_OUT',[1.5,0.5,-0.4],anchors);b=vec('INTERCOOLER_OUT',[0.43,0.6,0],anchors);f0=46;f1=43;break;
 case 'roadHero':
  p0=vec('CAR',[-2.45,0.26,6.65],anchors);p1=vec('CAR',[-1.9,0.22,6.25],anchors);
  p2=vec('CAR',[1.5,0.28,6.4],anchors);p3=vec('CAR',[2.45,0.38,7.1],anchors);
  a=vec('CAR',[0,0.03,0.35],anchors);b=vec('CAR',[0,0.1,0.15],anchors);f0=42;f1=42;break;
 }
 return {position:bezier(p0,p1,p2,p3,t),target:lerp(a,b,t),fov:mix(f0,f1,t),roll:0};
};
/** Camera continuity: no frame has zero-distance eye/target; finite values are guaranteed. */
export const poseIsValid=(p:CameraPose):boolean=>{
 const n=[...p.position,...p.target,p.fov,p.roll];if(!n.every(Number.isFinite))return false;
 const d=p.position.reduce((acc,v,i)=>acc+(v-p.target[i])**2,0);
 return d>0.04 && p.fov>=20 && p.fov<=65;
};
