/** 
 * PREVIEW-ONLY contract-shaped fixture, NOT Agent 2 physics.
 * Never import into the eventual EP006 master. Camera module itself stays source-agnostic.
 * This temporary pose feed tests airborne, touchdown and getaway framing until Agent 2 merges.
 */
import {sampleRoute} from '../../../world-kit/environments.ts';
import {rallySurfaceHeight} from '../../../modelling-kit/rough-road.ts';
import type {Ep006MotionPose,Ep006Phase,Ep006Wheel} from '../../ep006/cameras/shot-motion.ts';
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
const pulse=(f:number,at:number,decay:number)=>f<at?0:Math.exp(-(f-at)/decay);
export const EP006_PREVIEW_FIXTURE_ID='ep006-a3-fixture-v1 / NOT VERIFIED JUMP PHYSICS';
export function samplePreviewPose(frame:number):Ep006MotionPose{
 if(!Number.isInteger(frame)||frame<0||frame>=810)throw Error('Fixture requires frame 0..809');
 const distance=-88+frame*.55,route=sampleRoute('rally',distance);
 const x=route.position[0],z=route.position[2],surface=rallySurfaceHeight(x,z,.8);
 const first=frame<74,second=frame>=684&&frame<760;
 const flightFrame=first?frame:second?frame-684:0,flightLength=first?74:76;
 const duration=flightLength/30,time=flightFrame/30;
 const initialLift=.34,v0=(.5*9.81*duration*duration-initialLift)/duration;
 const lift=first||second?Math.max(0,initialLift+v0*time-4.905*time*time):0;
 const land=frame>=74&&frame<133?74:frame>=760&&frame<809?760:null;
 const dt=land===null?0:(frame-land)/30;
 const settle=land===null?0:.085*Math.exp(-dt*4.8)*Math.sin(dt*22);
 const contact=!(first||second),impact=land===null?0:pulse(frame,land,9);
 const compression=land===null?0:clamp(.09*Math.exp(-dt*5)*Math.max(0,Math.sin(dt*25+.6)),0,.10);
 const phase:Ep006Phase=first||second?'airborne':frame===74||frame===760?'touchdown':land!==null&&frame-land<27?'rebound':'driving';
 const wheels={} as Ep006MotionPose['wheels'];
 for(const corner of ['front-left','front-right','rear-left','rear-right'] as const){
  const dx=corner.startsWith('front')?1.31:-1.31,dz=corner.endsWith('left')?.97:-.97;
  const wheelX=x+Math.cos(route.yaw)*dx+Math.sin(route.yaw)*dz;
  const wheelZ=z-Math.sin(route.yaw)*dx+Math.cos(route.yaw)*dz;
  const h=rallySurfaceHeight(wheelX,wheelZ,.8);
  const wheel:Ep006Wheel={compressionM:compression,steerRad:contact?.03*Math.sin(frame*.014):0,spinRad:frame*.55/.36,contact,surfaceHeightM:h};
  wheels[corner]=wheel;
 }
 return {frame,timeSeconds:frame/30,phase,jumpId:first||frame<134?'J1':frame>=675?'J2':null,
  positionM:[x,surface+Math.max(0,settle)+lift,z],rotationRad:[0,route.yaw,first||second?clamp(.06-.10*(flightFrame/flightLength),-.1,.1):0],
  velocityMps:[.55*30,first||second?v0-9.81*time:0,0],wheels,
  impact01:impact,dust01:impact,gravel01:contact?.3+impact*.7:0,
  event:frame===74?'J1-touchdown-preview':frame===760?'J2-touchdown-preview':null};
}
