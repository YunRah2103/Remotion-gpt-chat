/** EP003 Agent 8: seek-safe, illustrative alternate crash outcome; never modifies Agent 2. */
import type {VehicleDynamicsFrame,Vec3} from '../shared/contract.ts';

export type CrashIncidentState=Readonly<{
 sourceTimeSec:number;positionM:Vec3;headingRad:number;speedMps:number;
 pitchRad:number;rollRad:number;wheelSpinRad:number;
}>;
export type CrashBranchParams=Readonly<{
 incident?:CrashIncidentState;
 reaction?:'panic-brake-and-overcorrect'|'no-panic-control';
 worldCutX?:number;
}>;
export type CrashOutcomeFrame=Readonly<{
 branch:'HYPOTHETICAL_BAD_REACTION';relativeTimeSec:number;sourceTimeSec:number;
 physicalPositionM:Vec3;scenePositionM:Vec3;
 speedMps:number;distanceTravelledM:number;headingRad:number;pitchRad:number;
 rollRad:number;driverSteerRad:number;driverBrake01:number;driverThrottle01:number;
 frontRightPressureRatio:number;frontRightWheelSpinRad:number;
 bumperCrushM:number;fenderCrushM:number;lampCrushM:number;scrapeSeverity01:number;
 contact:Readonly<{occurred:boolean;firstContactSec:number|null;
 firstContactX:number|null;firstContactZ:number|null;impactSpeedMps:number|null;
 barrierZ:number;clearanceM:number;scraping:boolean;}>;
}>;
const HZ=240,DURATION=4.5,HALF_WIDTH=.97,HALF_LENGTH=2.47;
const clamp=(x:number,a:number,b:number)=>Math.min(b,Math.max(a,x));
const smooth=(v:number)=>{const u=clamp(v,0,1);return u*u*(3-2*u)};
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
/** Exact Agent 4 signed right-hand rail profile; our contact is upstream of taper. */
export function impactRailZ(x:number):number{
 if(!Number.isFinite(x))throw Error('Nonfinite rail coordinate');
 return -7.8-6.2*smooth((x-4)/36);
}
export function projectedRightHalfWidthM(yaw:number):number{
 return HALF_WIDTH*Math.abs(Math.cos(yaw))+HALF_LENGTH*Math.abs(Math.sin(yaw));
}
export function crashIncidentFromDynamics(s:VehicleDynamicsFrame):CrashIncidentState{
 return {sourceTimeSec:s.tSec,positionM:[...s.positionM] as Vec3,headingRad:s.yawRad,
 speedMps:s.worldSpeedMps,pitchRad:s.pitchRad,rollRad:s.rollRad,
 wheelSpinRad:s.wheels['front-right'].spinRad};
}
/** Fixture ONLY for unmerged preview. Editor supplies authoritative Agent 2 state. */
export const PREVIEW_INCIDENT:CrashIncidentState=Object.freeze({
 sourceTimeSec:.75,positionM:[0,0,-1.85] as const,
 headingRad:0,speedMps:27.78,pitchRad:0,rollRad:0,wheelSpinRad:0});
type Step={t:number;x:number;z:number;v:number;yaw:number;rate:number;distance:number;
 steer:number;brake:number;roll:number;pitch:number;spin:number;
 hitAt:number|null;hitX:number|null;hitZ:number|null;hitSpeed:number|null};
const cache=new Map<string,readonly Step[]>();
function resolved(p:CrashBranchParams):Required<CrashBranchParams>{
 const out={incident:p.incident??PREVIEW_INCIDENT,
 reaction:p.reaction??'panic-brake-and-overcorrect',worldCutX:p.worldCutX??-86};
 const v=[out.incident.sourceTimeSec,...out.incident.positionM,out.incident.headingRad,
 out.incident.speedMps,out.incident.pitchRad,out.incident.rollRad,
 out.incident.wheelSpinRad,out.worldCutX];
 if(!v.every(Number.isFinite)||out.incident.sourceTimeSec<0||
 out.incident.speedMps<1||out.incident.speedMps>50||
 !['panic-brake-and-overcorrect','no-panic-control'].includes(out.reaction))
 throw Error('Invalid Agent 8 incident / reaction');
 return out;
}
function build(p:Required<CrashBranchParams>):readonly Step[]{
 const a:Step[]=[],dt=1/HZ,incident=p.incident;
 let x=p.worldCutX,z=incident.positionM[2],yaw=incident.headingRad,rate=0;
 let v=incident.speedMps,distance=0,spin=incident.wheelSpinRad;
 let roll=incident.rollRad,pitch=incident.pitchRad,steer=0,brake=0;
 let hitAt:number|null=null,hitX:number|null=null,hitZ:number|null=null,hitSpeed:number|null=null;
 for(let i=0;i<=Math.round(DURATION*HZ);i++){
  const t=i*dt,panic=p.reaction==='panic-brake-and-overcorrect';
  // Exact branch equality: frame zero is the identical injected Agent 2 state.
  if(i===0){
   a.push({t,x,z,v,yaw,rate,distance,steer,brake,roll,pitch,spin,
    hitAt,hitX,hitZ,hitSpeed});
   continue;
  }
  const ramp=smooth((t-.47)/.32),release=smooth((t-1.65)/.85);
  steer=panic?.083*ramp*(1-.80*release):0;
  brake=panic?.90*ramp:0;
  const target=clamp(v/2.92*Math.tan(steer)*.32+(panic?.006:.002),-.46,.46);
  if(hitAt!==null){
   const elapsed=t-hitAt,settle=smooth(elapsed/.9);
   yaw=lerp(yaw,Math.max(.015,incident.headingRad+.045),.030+.045*settle);
   rate*=.93;v=Math.max(0,v-dt*(8.1+2.5*settle));
   const dx=Math.max(0,v*Math.cos(yaw))*dt;
   x+=dx;distance+=dx;
   z=impactRailZ(x)+projectedRightHalfWidthM(yaw)+.028;
   pitch=lerp(pitch,.020,Math.min(1,dt*8));
   roll=lerp(roll,.023,Math.min(1,dt*5));
  }else{
   rate+=clamp((target-rate)*dt/.25,-dt*1.8,dt*1.8);
   yaw+=rate*dt;v=Math.max(.3,v+dt*(-.10-6.1*brake));
   const dx=v*Math.cos(yaw)*dt,dz=-v*Math.sin(yaw)*dt;
   x+=dx;z+=dz;distance+=Math.hypot(dx,dz);
   roll=lerp(roll,clamp(.045*rate+.012*ramp,-.05,.055),dt*8);
   pitch=lerp(pitch,clamp(.024*brake,-.035,.032),dt*7);
   const rail=impactRailZ(x);
   if(z-projectedRightHalfWidthM(yaw)<=rail){
    hitAt=t;
    // The front-right bumper/fender corner, not the centre of the car,
    // is the actual first contact with the right-hand steel barrier.
    hitX=x+HALF_LENGTH*Math.cos(yaw)-HALF_WIDTH*Math.sin(yaw);
    hitZ=rail;hitSpeed=v;
    z=rail+projectedRightHalfWidthM(yaw)+.028;
    v*=.65;rate*=.28;
   }
  }
  spin-=dt*v/(.36-.06*smooth(t/.32));
  a.push({t,x,z,v,yaw,rate,distance,steer,brake,roll,pitch,spin,
   hitAt,hitX,hitZ,hitSpeed});
 }
 return a;
}
function steps(p:Required<CrashBranchParams>):readonly Step[]{
 const key=JSON.stringify(p);let result=cache.get(key);
 if(!result){result=build(p);if(cache.size>=12)cache.clear();cache.set(key,result)}
 return result;
}
/** Seek any frame in any order: Agent 9 rewind and Agent 10 cameras use this exact result. */
export function sampleCrashOutcome(relativeTimeSec:number,params:CrashBranchParams={}):CrashOutcomeFrame{
 if(!Number.isFinite(relativeTimeSec)||relativeTimeSec<0||relativeTimeSec>DURATION)
 throw Error('Crash sample time outside 0..4.5 seconds');
 const p=resolved(params),a=steps(p),u=relativeTimeSec*HZ;
 const i=Math.min(a.length-2,Math.floor(u)),f=clamp(u-i,0,1);
 const lo=a[i],hi=a[i+1];
 const n=(field:keyof Pick<Step,'x'|'z'|'v'|'yaw'|'distance'|'steer'|'brake'|'roll'|'pitch'|'spin'>)=>
  lerp(lo[field],hi[field],f);
 const x=n('x'),yaw=n('yaw'),hit=lo.hitAt!==null||hi.hitAt!==null;
 const evt=hit?(lo.hitAt!==null?lo:hi):null;
 const elapsed=evt?.hitAt==null?0:Math.max(0,relativeTimeSec-evt.hitAt);
 const dent=smooth(elapsed/.24);
 const scrape=hit?smooth(elapsed/.08)*(1-smooth((elapsed-1.15)/.4)):0;
 const barrierZ=impactRailZ(x);
 const z=Math.max(n('z'),barrierZ+projectedRightHalfWidthM(yaw)+.017);
 return {branch:'HYPOTHETICAL_BAD_REACTION',
 relativeTimeSec,sourceTimeSec:p.incident.sourceTimeSec+relativeTimeSec,
 physicalPositionM:[p.incident.positionM[0]+x-p.worldCutX,0,z],
 scenePositionM:[x,0,z],speedMps:n('v'),distanceTravelledM:n('distance'),
 headingRad:yaw,pitchRad:n('pitch'),rollRad:n('roll'),
 driverSteerRad:n('steer'),driverBrake01:n('brake'),
 driverThrottle01:hit?0:.12*(1-smooth((relativeTimeSec-.47)/.32)),
 frontRightPressureRatio:1-.92*smooth(relativeTimeSec/.32),
 frontRightWheelSpinRad:n('spin'),
 bumperCrushM:.24*dent,fenderCrushM:.15*dent,lampCrushM:.11*dent,
 scrapeSeverity01:scrape,
 contact:{occurred:hit,firstContactSec:evt?.hitAt??null,
 firstContactX:evt?.hitX??null,firstContactZ:evt?.hitZ??null,
 impactSpeedMps:evt?.hitSpeed??null,barrierZ,
 clearanceM:z-projectedRightHalfWidthM(yaw)-barrierZ,
 scraping:hit&&elapsed<1.35}};
}
export const CRASH_DURATION_SEC=DURATION;
