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
export const EP006_SUSPENSION_LIMITS_M = {droop:-0.155,bump:0.092,tyreSquishMax:0.022} as const;
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
const vxAt=(t:number)=>25.6+0.10*t;
export const ep006TravelXM=(tSeconds:number)=>25.6*tSeconds+0.05*tSeconds*tSeconds;
/**
 * Exact independent-branch mirror of Agent 4's published environment/surface.ts
 * `heightAt` implementation. On integration use their heightAt as the single
 * shared import; mathematical parity here keeps this branch independently
 * buildable and gives the native fixture the same sampled collision heights.
 * Avoid changing either copy without notifying Agents 2 + 4.
 */
const lift=(x:number,crest:number)=>
  3.65*smooth(crest-38,crest+2,x)-3.75*smooth(crest+4,crest+32,x);
const roadEdge=(x:number)=>4.25+.16*Math.sin(x*.057)+.09*Math.sin(x*.159);
const roadBase=(x:number)=>.26*Math.sin(x*.025)+.16*Math.sin(x*.066)+lift(x,0)+lift(x,610);
function roadBed(x:number,z:number){
  const crown=.055*(1-Math.min(1,Math.abs(z)/5)**2);
  const rut=-.034*Math.exp(-(((Math.abs(z)-1.18)/.29)**2));
  const aggregate=.016*Math.sin(x*1.91+z*3.37)*Math.sin(x*3.26-z*2.41)
    +.012*Math.sin(x*.68+z*1.34);
  return roadBase(x)+crown+rut+aggregate;
}
export function ep006SurfaceHeightM(x:number,z=0):number {
  if(!Number.isFinite(x)||!Number.isFinite(z))throw Error('EP006 ground query must be finite metres');
  const d=Math.abs(z),edge=roadEdge(x);
  const blend=smooth(edge,edge+15,d);
  const rolling=.43*Math.sin(x*.038+z*.024)+.38*Math.sin(z*.056-x*.015)
    +.20*Math.cos(z*.113+x*.046);
  const hillside=(1.85+rolling)*blend + Math.pow(Math.max(0,d-edge-16)/22,1.05)
    *(.48+.18*Math.sin(x*.017+z*.03));
  const bank=.13*smooth(edge,edge+3,d)*Math.sin(x*.12+z*.17);
  return roadBed(x,z)+hillside+bank;
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
 if(!Number.isFinite(age)||age<0)return {compression:0,rate:0};
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
 const wave=oscillation(landAge,.14);
 const suspension=clamp(wave.compression,EP006_SUSPENSION_LIMITS_M.droop,EP006_SUSPENSION_LIMITS_M.bump);
 const compression=landAge<1.25?suspension:.010+.004*Math.sin(x*.34);
 const suspensionRate=landAge<1.25?wave.rate:.004*.34*vx*Math.cos(x*.34);
 const tyreSquish=landAge<1.25?.020*(1-Math.exp(-24*landAge))*Math.exp(-4.7*landAge):.007;
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
  const tyreRate=landAge<1.25?.020*(24*Math.exp(-24*landAge)*Math.exp(-4.7*landAge)-4.7*(1-Math.exp(-24*landAge))*Math.exp(-4.7*landAge)):0;
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
 // Resolve chassis pitch/bank to the actual four wheel-height samples.
 // A level car climbing a jump crest would otherwise demand >250mm front travel.
 const meanFront=(grounds[0][1]+grounds[1][1])/2;
 const meanRear=(grounds[2][1]+grounds[3][1])/2;
 const meanLeft=(grounds[0][1]+grounds[2][1])/2;
 const meanRight=(grounds[1][1]+grounds[3][1])/2;
 const roll=airborne?.002*Math.sin(t*.8):Math.atan2(meanRight-meanLeft,EP006_TRACK_M);
 if(!airborne)pitch+=Math.atan2(meanFront-meanRear,EP006_WHEELBASE_M);
 const targets=EP006_CORNERS.map((c,i)=>{
  const axle=c.startsWith('front')?EP006_WHEELBASE_M/2:-EP006_WHEELBASE_M/2;
  const side=c.endsWith('left')?EP006_TRACK_M/2:-EP006_TRACK_M/2;
  // World-space Y of the rotated hub relative to the chassis root.
  return compression+grounds[i][1]-meanGround-axle*Math.sin(pitch)+side*Math.sin(roll);
 });
 // Adjust the centre-of-mass height so the peak-loaded corner hits its bump
 // stop without pushing tyre geometry through the actual road surface.
 const lower=Math.max(...targets)-EP006_SUSPENSION_LIMITS_M.bump;
 const upper=Math.min(...targets)-EP006_SUSPENSION_LIMITS_M.droop;
 const shift=!airborne?(lower<=upper?clamp(0,lower,upper):lower):0;
 if(!airborne)y=meanGround-compression-tyreSquish+shift;
 EP006_CORNERS.forEach((c,i)=>{
  const point=grounds[i],contact=!airborne&&targets[i]-shift>=EP006_SUSPENSION_LIMITS_M.droop-.0001;
  const travel=contact?clamp(targets[i]-shift,EP006_SUSPENSION_LIMITS_M.droop,EP006_SUSPENSION_LIMITS_M.bump):EP006_SUSPENSION_LIMITS_M.droop;
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
  frame,timeSeconds:t,phase,jumpId,positionM:[x,y,z],rotationRad:[roll,yaw,pitch],
  velocityMps:[vx,vy,vz],wheels,impact01,dust01,gravel01,event,
 };
 return out;
}
