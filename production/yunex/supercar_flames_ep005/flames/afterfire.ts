/**
 * EP005 afterfire editorial model, NOT CFD, thermal calibration or ECU firmware.
 * Vehicle frame is +X forward / +Y up / +Z left. Ports are vehicle-local.
 * All animation is an absolute-frame pure function, safe for Remotion reverse seeks.
 */
export type Vec3=[number,number,number];
export type ExhaustPort={name:'exhaust-tip-left'|'exhaust-tip-right';position:Vec3;direction:Vec3;radius:number};
export type EngineState={
  throttle:number;unburntFuel:number;exhaustTemperatureC:number;
  overrun?:boolean;antiLag?:boolean;ignitionCut?:boolean;seed?:number;afterfireDemand?:number;
};
export type FlameBurst={name:ExhaustPort['name'];position:Vec3;direction:Vec3;radius:number;intensity:number;length:number;phase:number;mode:'overrun'|'anti-lag'|'ignition-cut'|'off'};
export type AfterfireSample={frame:number;fps:number;mode:FlameBurst['mode'];ports:FlameBurst[];illustrative:true};
const clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,v));
const hash=(n:number)=>{const x=Math.sin(n*127.1+78.233)*43758.5453123;return x-Math.floor(x);};
const smooth=(x:number)=>{const t=clamp(x);return t*t*(3-2*t);};
const finite=(a:number[])=>a.every(Number.isFinite);
export function validateExhaustMounts(ports:ExhaustPort[]):void{
 if(!Array.isArray(ports)||ports.length!==2)throw Error('Exactly two named exhaust ports required');
 if(new Set(ports.map(p=>p.name)).size!==2||!ports.some(p=>p.name==='exhaust-tip-left')||!ports.some(p=>p.name==='exhaust-tip-right'))throw Error('Required named left/right ports missing');
 for(const p of ports){
  if(!finite([...p.position,...p.direction,p.radius])||p.radius<=0||p.radius>.3||Math.hypot(...p.direction)<.99||Math.hypot(...p.direction)>1.01)throw Error('Invalid port pose, direction or radius');
 }
}
export function sampleAfterfire(frame:number,fps:number,engineState:EngineState,exhaustMounts:ExhaustPort[]):AfterfireSample{
 if(!Number.isFinite(frame)||!Number.isInteger(frame)||!Number.isFinite(fps)||fps<=0)throw Error('Finite integer frame and positive fps required');
 if(!finite([engineState.throttle,engineState.unburntFuel,engineState.exhaustTemperatureC,engineState.seed??0])||
 engineState.throttle<0||engineState.throttle>1||engineState.unburntFuel<0||engineState.unburntFuel>1||!Number.isFinite(engineState.afterfireDemand??1)||(engineState.afterfireDemand??1)<0||(engineState.afterfireDemand??1)>1)throw Error('Invalid engine state');
 validateExhaustMounts(exhaustMounts);
 // A temperature threshold is solely a visual-story gate: ignition depends on
 // gas composition, residence time and ignition source, not a universal temperature.
 const fuel=engineState.unburntFuel,hot=smooth((engineState.exhaustTemperatureC-350)/380);
 const eligible=fuel>.045&&hot>.025;
 const mode:AfterfireSample['mode']=!eligible?'off':engineState.antiLag?'anti-lag':engineState.ignitionCut?'ignition-cut':engineState.overrun&&engineState.throttle<.3?'overrun':'off';
 const period=mode==='anti-lag'?.41:mode==='ignition-cut'?.53:.67;
 const t=Math.max(0,frame/fps);
 const ports:FlameBurst[]=exhaustMounts.map((p,i)=>{
  const local=t+.115-(i*.032),beat=Math.floor(local/period),phase=(local/period)-beat;
  const attack=smooth(phase/.15),decay=1-smooth((phase-.20)/.49);
  const jitter=.78+.22*hash(beat*19+(engineState.seed??17)*31+i*37);
  const intensity=mode==='off'?0:clamp(attack*decay*jitter*fuel*hot*(engineState.afterfireDemand??1)*(mode==='anti-lag'?1:.93));
  return {name:p.name,position:[...p.position] as Vec3,direction:[...p.direction] as Vec3,radius:p.radius,intensity,
   length:intensity*(.77+.57*hash(beat*7+i*23+11))/.78,phase,mode};
 });
 return {frame,fps,mode,ports,illustrative:true};
}
/** Consume A3 sampleCinema.afterfireDemand, not arbitrary acceleration. */
export function stateFromCinemaDemand(demand:number,throttle:number,kind:'overrun'|'anti-lag'|'ignition-cut'='overrun'):EngineState{
 if(!Number.isFinite(demand)||demand<0||demand>1||!Number.isFinite(throttle)||throttle<0||throttle>1)throw Error('Invalid cinematic afterfire command');
 return {throttle,unburntFuel:demand>.001?.98:.01,exhaustTemperatureC:770,
 overrun:kind==='overrun',antiLag:kind==='anti-lag',ignitionCut:kind==='ignition-cut',
 afterfireDemand:demand,seed:5};
}
/** Storyboard engine control; never infer afterfire merely from acceleration. */
export function ep005PreviewEngineState(shot:'hook'|'tailpipe'|'mechanism'|'wide',localSeconds:number):EngineState{
 const active=shot==='hook'?localSeconds<.90:shot==='tailpipe'?(localSeconds<.65||(localSeconds>1.27&&localSeconds<1.70)):shot==='wide'?(localSeconds>.25&&localSeconds<.96):false;
 return {throttle:active?.08:.52,unburntFuel:active?.98:.01,exhaustTemperatureC:active?790:590,overrun:active,antiLag:false,ignitionCut:false,afterfireDemand:active?1:0,seed:5};
}
