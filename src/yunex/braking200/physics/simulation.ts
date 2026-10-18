/**
 * Authoritative seek-stable illustrative brake dynamics in SI units.
 * NOT a measured vehicle specification or stopping-distance claim.
 * Hub angle is accumulated positive; +X-forward kit wheel roll uses -angle about Z.
 */
import type {BrakingSimulationState, WheelBrakingState, WheelKey} from '../contracts.ts';

export type BrakingScenario = 'dry-track'|'low-grip-abs';
export const BRAKING_MODEL=Object.freeze({
  initialSpeedMps:200/3.6, illustrativeMassKg:1700,gravityMps2:9.81,
  wheelbaseM:2.92,wheelRadiusM:.36,cgHeightM:.52,staticFrontLoadFraction:.52,
  illustrativeWheelInertiaKgM2:2.6,dryGripCoefficient:.96,
  lowGripCoefficient:.30,optimalSlipRatio:.14,integrationHz:240,maxTimeSec:14,
});
const WHEELS:readonly WheelKey[]=['front-left','front-right','rear-left','rear-right'];
const DT=1/BRAKING_MODEL.integrationHz;
const maxStep=Math.round(BRAKING_MODEL.maxTimeSec*BRAKING_MODEL.integrationHz);
const clamp=(v:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,v));
const smooth=(t:number)=>{const x=clamp(t,0,1);return x*x*(3-2*x);};
function initialWheel(speed:number):WheelBrakingState{
  return {angularSpeedRadPerSec:speed/BRAKING_MODEL.wheelRadiusM,rotationRad:0,
    slipRatio:0,normalLoadN:0,roadLongitudinalForceN:0,brakePressure01:0,absIntervening:false};
}
function freshWheels(speed:number):Record<WheelKey,WheelBrakingState>{
  return {'front-left':initialWheel(speed),'front-right':initialWheel(speed),
    'rear-left':initialWheel(speed),'rear-right':initialWheel(speed)};
}
function roadGrip(t:number,scenario:BrakingScenario):number{
  // Separately labelled surface transient only; dry stop does not force ABS.
  return scenario==='low-grip-abs'&&t>=1.05&&t<2.90
    ?BRAKING_MODEL.lowGripCoefficient:BRAKING_MODEL.dryGripCoefficient;
}
function slipRoadFraction(slip:number):number{
  const p=BRAKING_MODEL.optimalSlipRatio;
  return slip<=p?clamp(slip/p,0,1):.78+.22*Math.exp(-(slip-p)/.29);
}
function start():BrakingSimulationState{
  const wheel=freshWheels(BRAKING_MODEL.initialSpeedMps);
  const mg=BRAKING_MODEL.illustrativeMassKg*BRAKING_MODEL.gravityMps2;
  for(const id of WHEELS)wheel[id].normalLoadN=mg*(id.startsWith('front')?.52:.48)/2;
  return {simTimeSec:0,speedMps:BRAKING_MODEL.initialSpeedMps,traveledM:0,
    decelerationMps2:0,pitchRad:0,wheel,brakeHeatJ:0};
}
function advance(prev:BrakingSimulationState,t:number,scenario:BrakingScenario):BrakingSimulationState{
  const m=BRAKING_MODEL,speed=prev.speedMps;
  if(speed<=0){
    const wheel=freshWheels(0);
    for(const id of WHEELS)wheel[id]={...prev.wheel[id],angularSpeedRadPerSec:0,
      slipRatio:0,roadLongitudinalForceN:0,absIntervening:false,brakePressure01:0};
    return {...prev,simTimeSec:t,speedMps:0,decelerationMps2:0,pitchRad:0,wheel};
  }
  const mg=m.illustrativeMassKg*m.gravityMps2;
  const transferN=m.illustrativeMassKg*prev.decelerationMps2*m.cgHeightM/m.wheelbaseM;
  const frontN=clamp((mg*m.staticFrontLoadFraction+transferN)/2,mg*.10,mg*.48);
  const rearN=(mg-2*frontN)/2;
  const mu=roadGrip(t,scenario),demand=smooth((t-.12)/.40);
  const wheel={} as Record<WheelKey,WheelBrakingState>;
  let tyreTotalN=0,brakePowerW=0;
  for(const id of WHEELS){
    const front=id.startsWith('front'),old=prev.wheel[id],normalLoadN=front?frontN:rearN;
    const desiredPressure=demand*(front?.85:.78);
    const torqueMaxNm=front?1940:920;
    const slipBefore=clamp((speed-m.wheelRadiusM*old.angularSpeedRadPerSec)/Math.max(speed,1),0,1);
    const approachingLock=scenario==='low-grip-abs'&&mu<.5&&speed>3&&slipBefore>.18&&demand>.1;
    // ABS release/restore never increases road grip and is NOT mandatory on dry.
    const pressure=scenario==='low-grip-abs'&&mu<.5
      ?clamp(old.brakePressure01+(approachingLock?-8.5:2.15)*DT,0,desiredPressure)
      :desiredPressure;
    const torqueNm=torqueMaxNm*pressure;
    const tyreForceN=Math.min(mu*normalLoadN*slipRoadFraction(slipBefore),mu*normalLoadN);
    tyreTotalN+=tyreForceN;
    const alpha=(tyreForceN*m.wheelRadiusM-torqueNm)/m.illustrativeWheelInertiaKgM2;
    let omega=Math.max(0,old.angularSpeedRadPerSec+alpha*DT);
    omega=Math.min(omega,speed/m.wheelRadiusM);
    const rotationRad=old.rotationRad+(old.angularSpeedRadPerSec+omega)*.5*DT;
    brakePowerW+=torqueNm*(old.angularSpeedRadPerSec+omega)*.5;
    wheel[id]={angularSpeedRadPerSec:omega,rotationRad,
      slipRatio:clamp((speed-m.wheelRadiusM*omega)/Math.max(speed,1),0,1),
      normalLoadN,roadLongitudinalForceN:tyreForceN,brakePressure01:pressure,
      absIntervening:approachingLock};
  }
  // Atmospheric and rolling losses explicitly excluded from disc-heat budget.
  const aeroN=.37*speed*speed,rollingN=.011*mg;
  const decelerationMps2=(tyreTotalN+aeroN+rollingN)/m.illustrativeMassKg;
  const speedMps=Math.max(0,speed-decelerationMps2*DT);
  const traveledM=prev.traveledM+(speed+speedMps)*.5*DT;
  const pitchRad=clamp(decelerationMps2/m.gravityMps2*.018,0,.023);
  if(speedMps===0)for(const id of WHEELS){wheel[id].angularSpeedRadPerSec=0;wheel[id].slipRatio=0;}
  return {simTimeSec:t,speedMps,traveledM,decelerationMps2,pitchRad,wheel,
    brakeHeatJ:prev.brakeHeatJ+Math.max(0,brakePowerW)*DT};
}
// Pure deterministic fixed-step integration per scenario, cached only as immutable history.
// Seeking arbitrary frames NEVER advances a render-order-dependent mutable clock.
const trajectories=new Map<BrakingScenario,readonly BrakingSimulationState[]>();
function trajectory(scenario:BrakingScenario):readonly BrakingSimulationState[]{
  const old=trajectories.get(scenario);if(old)return old;
  const frames:BrakingSimulationState[]=[start()];
  for(let i=1;i<=maxStep;i++)frames.push(advance(frames[i-1],i*DT,scenario));
  trajectories.set(scenario,frames);return frames;
}
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
export function sampleBrakingSimulation(simTimeSec:number,scenario:BrakingScenario='dry-track'):BrakingSimulationState{
  if(!Number.isFinite(simTimeSec)||simTimeSec<0)throw new RangeError('simTimeSec must be finite and nonnegative');
  if(scenario!=='dry-track'&&scenario!=='low-grip-abs')throw new RangeError('Unknown braking scenario');
  const time=Math.min(simTimeSec,BRAKING_MODEL.maxTimeSec);
  const pos=time*BRAKING_MODEL.integrationHz,frames=trajectory(scenario);
  const i=Math.min(Math.floor(pos),maxStep),j=Math.min(i+1,maxStep),a=frames[i],b=frames[j],f=pos-i;
  const wheel={} as Record<WheelKey,WheelBrakingState>;
  for(const id of WHEELS){
    const aw=a.wheel[id],bw=b.wheel[id];
    wheel[id]={angularSpeedRadPerSec:lerp(aw.angularSpeedRadPerSec,bw.angularSpeedRadPerSec,f),
      rotationRad:lerp(aw.rotationRad,bw.rotationRad,f),
      slipRatio:lerp(aw.slipRatio,bw.slipRatio,f),
      normalLoadN:lerp(aw.normalLoadN,bw.normalLoadN,f),
      roadLongitudinalForceN:lerp(aw.roadLongitudinalForceN,bw.roadLongitudinalForceN,f),
      brakePressure01:lerp(aw.brakePressure01,bw.brakePressure01,f),
      absIntervening:aw.absIntervening||bw.absIntervening};
  }
  return {simTimeSec:time,speedMps:lerp(a.speedMps,b.speedMps,f),
    traveledM:lerp(a.traveledM,b.traveledM,f),
    decelerationMps2:lerp(a.decelerationMps2,b.decelerationMps2,f),
    pitchRad:lerp(a.pitchRad,b.pitchRad,f),wheel,
    brakeHeatJ:lerp(a.brakeHeatJ,b.brakeHeatJ,f)};
}
