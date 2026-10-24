/** Agent-1-only deterministic interface fixture — NOT a jump physics solver. */
import type {Ep006MotionPose,Ep006Corner} from './index.ts';
import {EP006_CORNERS,EP006_RALLY_SUSPENSION as LIMITS} from './index.ts';
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
const smooth=(n:number)=>{const u=clamp(n,0,1);return u*u*(3-2*u);};
/** Six 1-second stages for visual acceptance, independent of Agent 2's future solver. */
export function sampleEp006VehicleFixture(frame:number):Ep006MotionPose {
  const f=clamp(Math.floor(frame),0,179),segment=Math.floor(f/30),u=f%30/29;
  const x=f*.032;
  let phase:Ep006MotionPose['phase']='driving',jumpId:Ep006MotionPose['jumpId']=null;
  let compression=0,bodyY=0,contact=true;
  if(segment===0){phase='takeoff';jumpId='J1';contact=false;compression=-.05-.105*smooth(u);bodyY=.12+.55*smooth(u);}
  if(segment===1){phase='airborne';jumpId='J1';contact=false;compression=-LIMITS.maximumDroopM;bodyY=.68-.22*smooth(u);}
  if(segment===2){phase='touchdown';jumpId='J1';contact=true;compression=LIMITS.maximumCompressionM*Math.sin(u*Math.PI*.88);bodyY=-compression-.018;}
  if(segment===3){phase='rebound';jumpId='J1';contact=true;compression=.018+.048*Math.exp(-u*3)*Math.cos(u*8);bodyY=-compression-.014;}
  if(segment===4){phase='airborne';jumpId='J2';contact=false;compression=-LIMITS.maximumDroopM;bodyY=.42+.12*Math.sin(u*Math.PI);}
  if(segment===5){phase='driving';jumpId='J2';contact=true;compression=.012+.012*Math.sin(u*7);bodyY=-compression-.01;}
  const wheels={} as Ep006MotionPose['wheels'];
  for(const corner of EP006_CORNERS){
    const c:Ep006Corner=corner;
    const offset=corner.startsWith('front')?1:0;
    const travel=contact?clamp(compression*(.93+offset*.07),-.155,.092):compression;
    wheels[c]={compressionM:travel,steerRad:corner.startsWith('front')?.055*Math.sin(f*.024):0,
      spinRad:-x/LIMITS.wheelRadiusM,contact,surfaceHeightM:0};
  }
  return {frame:f,timeSeconds:f/30,phase,jumpId,positionM:[x,bodyY,0],
    rotationRad:[contact?-.012*Math.sin(u*Math.PI):0,.015*Math.sin(f*.012),
      segment===0?-.065*(1-u):segment===2?.045*Math.sin(u*Math.PI):0],
    velocityMps:[.96,0,0],wheels,impact01:segment===2?1-u:0,dust01:0,gravel01:0,
    event:segment===2&&f===60?'fixture_touchdown':null};
}
