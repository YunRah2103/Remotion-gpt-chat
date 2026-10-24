/**
 * YUNEX EP006 — authoritative, absolute-frame jump motion.
 * Metres, seconds, radians; +X forward, +Y up, +Z left.
 * Intentionally illustrative 4-corner compliant response, NOT a calibrated car model.
 * Agent 4 must mesh this SAME height function. No simulation history is stored.
 */
export const EP006_FPS = 30;
export const EP006_GRAVITY_MPS2 = 9.81;
export const EP006_WHEELBASE_M = 2.62;
export const EP006_TRACK_M = 1.64;
export const EP006_TYRE_RADIUS_M = 0.36;
export const EP006_SUSPENSION_LIMITS_M = {droop:-0.085,bump:0.16,tyreSquishMax:0.03} as const;
export type Ep006Corner = 'front-left'|'front-right'|'rear-left'|'rear-right';
export const EP006_CORNERS:readonly Ep006Corner[] = ['front-left','front-right','rear-left','rear-right'];
export type Ep006Phase = 'approach'|'takeoff'|'airborne'|'touchdown'|'rebound'|'driving';
export type Ep006JumpId = 'J1'|'J2';
export type Ep006Wheel = {
  compressionM:number; steerRad:number; spinRad:number; contact:boolean; surfaceHeightM:number;
  tyreSquishM:number; suspensionVelocityMps:number; normalLoad01:number;
  contactPointM:[number,number,number];
};
export type Ep006Motion = {
  frame:number; timeSeconds:number; phase:Ep006Phase; jumpId:Ep006JumpId|null;
  positionM:[number,number,number]; rotationRad:[number,number,number]; velocityMps:[number,number,number];
  wheels:Record<Ep006Corner,Ep006Wheel>;
  impact01:number; dust01:number; gravel01:number; event:string|null;
};
const clamp=(x:number,a:number,b:number)=>Math.min(b,Math.max(a,x));
const smooth=(a:number,b:number,x:number)=>{const u=clamp((x-a)/(b-a),0,1);return u*u*(3-2*u);};
const vxAt=(t:number)=>24+0.10*t;
export const ep006TravelXM=(tSeconds:number)=>24*tSeconds+0.05*tSeconds*tSeconds;
/** Low-road / crest height profile. This EXACT function must build Agent 4's collision mesh. */
export function ep006SurfaceHeightM(x:number,z=0):number {
  const crest=(centre:number,h:number)=>
    h*smooth(centre-29,centre-1.5,x)*(1-smooth(centre+1.5,centre+25,x));
  const second=ep006TravelXM(684/EP006_FPS);
  // Wheel-scale ripple <12mm. Never inject random frame-by-frame noise.
  return .12+crest(0,1.07)+crest(second,1.00)
    +.006*Math.sin(x*.17+z*.39)*Math.cos(x*.11-z*.56)
    +.004*Math.sin(z*.95+x*.06);
}
export const EP006_JUMPS = [
  {id:'J1' as const,launchFrame:0,landingFrame:72},
  {id:'J2' as const,launchFrame:684,landingFrame:750},
] as const;
const durationOf=(jump:typeof EP006_JUMPS[number])=>(jump.landingFrame-jump.launchFrame)/EP006_FPS;
const launchSpeedY=(jump:typeof EP006_JUMPS[number])=>{
 const fromX=ep006TravelXM(jump.launchFrame/EP006_FPS);
 const toX=ep006TravelXM(jump.landingFrame/EP006_FPS);
 const duration=durationOf(jump);
 return (ep006SurfaceHeightM(toX)-ep006SurfaceHeightM(fromX)+.5*EP006_GRAVITY_MPS2*duration*duration)/duration;
};
export const EP006_JUMP_EVENTS = EP006_JUMPS.map(j=>({
 id:j.id,launchFrame:j.launchFrame,landingFrame:j.landingFrame,
 launchXM:ep006TravelXM(j.launchFrame/EP006_FPS),
 landingXM:ep006TravelXM(j.landingFrame/EP006_FPS),
 launchVerticalMps:launchSpeedY(j),
 impactVerticalMps:launchSpeedY(j)-EP006_GRAVITY_MPS2*durationOf(j),
}));
/** Damped oscillation after impact. The tyre does not leave the ground as it rebounds. */
function oscillation(age:number,scale:number){
 if(age<0)return {compression:0,rate:0};
 const e=Math.exp(-3.65*age),s=Math.sin(12.5*age),c=Math.cos(12.5*age);
 return {compression:scale*e*s,rate:scale*e*(12.5*c-3.65*s)};
}
const contactZ=(t:number)=>.13*Math.sin(.26*t);
const wake=(age:number,falloff:number)=>age<0?0:Math.exp(-falloff*age);
const jumpAt=(frame:number)=>EP006_JUMPS.find(j=>frame>=j.launchFrame&&frame<j.landingFrame);
const latestLanding=(frame:number)=>[...EP006_JUMPS].reverse().find(j=>frame>=j.landingFrame);
export function sampleEp006Motion(frame:number):Ep006Motion {
 if(!Number.isInteger(frame)||frame<0)throw new Error('EP006 frame must be a nonnegative integer');
 const t=frame/EP006_FPS,x=ep006TravelXM(t),vx=vxAt(t),z=contactZ(t);
 const yaw=.004*Math.cos(.26*t),vz=.13*.26*Math.cos(.26*t);
 const airborne=jumpAt(frame);
 const landed=latestLanding(frame);
 const landAge=landed?(frame-landed.landingFrame)/EP006_FPS:Infinity;
 const activeLanding=landed&&landAge<1.25?landed:null;
 const wave=oscillation(landAge,.205);
 const suspension=clamp(wave.compression,EP006_SUSPENSION_LIMITS_M.droop,EP006_SUSPENSION_LIMITS_M.bump);
 const compression=landAge<1.25?suspension:.010+.004*Math.sin(x*.34);
 const suspensionRate=landAge<1.25?wave.rate:.004*.34*vx*Math.cos(x*.34);
 const tyreSquish=landAge<1.25?.026*(1-Math.exp(-24*landAge))*Math.exp(-4.7*landAge):.007;
 let y:number,vy:number,pitch:number;
 let phase:Ep006Phase='driving',jumpId:Ep006JumpId|null=null;
 if(airborne){
  const age=(frame-airborne.launchFrame)/EP006_FPS,vy0=launchSpeedY(airborne);
  y=ep006SurfaceHeightM(ep006TravelXM(airborne.launchFrame/EP006_FPS))+vy0*age-.5*EP006_GRAVITY_MPS2*age*age;
  vy=vy0-EP006_GRAVITY_MPS2*age;
  pitch=.075*(1-age/durationOf(airborne));
  phase=frame===airborne.launchFrame?'takeoff':'airborne';jumpId=airborne.id;
 }else{
  y=ep006SurfaceHeightM(x,z)-compression-tyreSquish;
  const delta=.04,slope=(ep006SurfaceHeightM(x+delta,z)-ep006SurfaceHeightM(x-delta,z))/(delta*2);
  const tyreRate=landAge<1.25?.026*(24*Math.exp(-24*landAge)*Math.exp(-4.7*landAge)-4.7*(1-Math.exp(-24*landAge))*Math.exp(-4.7*landAge)):0;
  vy=slope*vx-suspensionRate-tyreRate;
  pitch=landAge<.75?-.020*Math.exp(-4*landAge)*Math.sin(9*landAge):.004*Math.sin(x*.055);
  if(activeLanding){jumpId=activeLanding.id;phase=landAge===0?'touchdown':landAge<.8?'rebound':'driving';}
 }
 const impact01=activeLanding?wake(landAge,8):0;
 const dust01=activeLanding?clamp((1-Math.exp(-landAge*18))*Math.exp(-landAge*1.3)*1.45,0,1):0;
 const gravel01=activeLanding?clamp((1-Math.exp(-landAge*30))*Math.exp(-landAge*4.1)*1.55,0,1):0;
 const wheels={} as Record<Ep006Corner,Ep006Wheel>;
 const grounds=EP006_CORNERS.map(c=>{
  const a=c.startsWith('front')?EP006_WHEELBASE_M/2:-EP006_WHEELBASE_M/2;
  const b=c.endsWith('left')?EP006_TRACK_M/2:-EP006_TRACK_M/2;
  const cx=x+a*Math.cos(yaw)+b*Math.sin(yaw),cz=z+b*Math.cos(yaw)-a*Math.sin(yaw);
  return [cx,ep006SurfaceHeightM(cx,cz),cz] as [number,number,number];
 });
 const meanGround=grounds.reduce((n,p)=>n+p[1],0)/4;
 // Translate chassis relative to average tyre contact so independent wheel positions
 // remain on the SAME ground even across the roughness/camber of Agent 4's mesh.
 if(!airborne){y=meanGround-compression-tyreSquish;}
 EP006_CORNERS.forEach((c,i)=>{
  const point=grounds[i],groundDelta=point[1]-meanGround;
  const contact=!airborne;
  const travel=contact?clamp(compression+groundDelta,EP006_SUSPENSION_LIMITS_M.droop,EP006_SUSPENSION_LIMITS_M.bump):EP006_SUSPENSION_LIMITS_M.droop;
  wheels[c]={
   compressionM:travel,
   steerRad:c.startsWith('front')?.012*Math.sin(t*.46):0,
   spinRad:-x/EP006_TYRE_RADIUS_M,
   contact,
   surfaceHeightM:point[1],
   tyreSquishM:contact?tyreSquish:0,
   suspensionVelocityMps:contact?suspensionRate:0,
   normalLoad01:contact?clamp(.43+impact01*1.4+Math.max(0,travel)*4.0,0,1):0,
   contactPointM:point,
  };
 });
 const start=EP006_JUMPS.find(j=>j.launchFrame===frame);
 const hit=EP006_JUMPS.find(j=>j.landingFrame===frame);
 const event=start?`${start.id}_LAUNCH`:hit?`${hit.id}_TOUCHDOWN`:null;
 const out:Ep006Motion={
  frame,timeSeconds:t,phase,jumpId,positionM:[x,y,z],rotationRad:[.002*Math.sin(t*.8),yaw,pitch],
  velocityMps:[vx,vy,vz],wheels,impact01,dust01,gravel01,event,
 };
 return out;
}
