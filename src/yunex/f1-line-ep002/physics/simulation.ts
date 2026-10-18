import type {CarFrameState,RaceCarId,RaceFrameState,RacePath} from '../contract.ts';

/**
 * Illustrative single-track corner model, NOT calibrated telemetry from a real F1 car.
 * Every car receives the identical mass, grip, downforce, drag and power assumptions.
 * Arc-distance speed profiles + numerical time integral make frame seeking deterministic.
 */
export type DynamicsConfig={
  massKg:number; gravityMps2:number; tyreMu:number; downforceNPerMps2:number;
  dragNPerMps2:number; accelerationCapMps2:number; brakingCapMps2:number;
  enginePowerW:number; wheelbaseM:number; maximumSpeedMps:number;
  entrySpeedMps:number; stepM:number;
};
export const REPRESENTATIVE_F1_CONFIG:Readonly<DynamicsConfig>=Object.freeze({
  massKg:800, gravityMps2:9.81, tyreMu:1.5,
  downforceNPerMps2:2.4, dragNPerMps2:.55,
  accelerationCapMps2:6, brakingCapMps2:9, enginePowerW:340000,
  wheelbaseM:3.42, maximumSpeedMps:47, entrySpeedMps:23, stepM:.6,
});
export type SpeedNode={distanceM:number;timeSeconds:number;speedMps:number;curvatureInvM:number};
export type CarProfile={path:RacePath;nodes:SpeedNode[];elapsedSeconds:number};
export type CarComparison={
  pathLengthM:number;minimumCornerSpeedMps:number;
  apexTimeSeconds:number;apexSpeedMps:number;exitTimeSeconds:number;
  exitSpeedMps:number;finishTimeSeconds:number;finishSpeedMps:number;
};
export type RaceComparison={
  assumptions:DynamicsConfig;
  shortcut:CarComparison;racing:CarComparison;
  fasterAtCommonFinish:RaceCarId|'tie';
  racingFinishAdvantageSeconds:number;
  /** Both path endpoints should be the same physical checkpoint. */
  finishSeparationM:number;
};

const clamp=(x:number,a:number,b:number)=>Math.min(b,Math.max(a,x));
const ids:RaceCarId[]=['shortcut','racing'];
export const effectiveNormalLoadN=(speedMps:number,c:Readonly<DynamicsConfig>=REPRESENTATIVE_F1_CONFIG)=>
  c.massKg*c.gravityMps2+c.downforceNPerMps2*speedMps*speedMps;
export const tyreForceLimitN=(speedMps:number,c:Readonly<DynamicsConfig>=REPRESENTATIVE_F1_CONFIG)=>
  c.tyreMu*effectiveNormalLoadN(speedMps,c);
export const lateralAccelerationMps2=(speedMps:number,curvatureInvM:number)=>
  speedMps*speedMps*Math.abs(curvatureInvM);
export const lateralForceN=(speedMps:number,curvatureInvM:number,c:Readonly<DynamicsConfig>=REPRESENTATIVE_F1_CONFIG)=>
  c.massKg*lateralAccelerationMps2(speedMps,curvatureInvM);
export const remainingLongitudinalAccelerationMps2=(
  speedMps:number,curvatureInvM:number,c:Readonly<DynamicsConfig>=REPRESENTATIVE_F1_CONFIG,
)=>{
  const grip=tyreForceLimitN(speedMps,c);
  const lateral=lateralForceN(speedMps,curvatureInvM,c);
  return Math.sqrt(Math.max(0,grip*grip-lateral*lateral))/c.massKg;
};
export const localSpeedLimitMps=(curvatureInvM:number,c:Readonly<DynamicsConfig>=REPRESENTATIVE_F1_CONFIG)=>{
  const k=Math.abs(curvatureInvM);
  // v²*k <= mu*(g + downforceCoefficient/m*v²)
  const denominator=k-c.tyreMu*c.downforceNPerMps2/c.massKg;
  return denominator<=0 ? c.maximumSpeedMps:
    Math.min(c.maximumSpeedMps,Math.sqrt(c.tyreMu*c.gravityMps2/denominator));
};
const aeroDragAcceleration=(v:number,c:Readonly<DynamicsConfig>)=>c.dragNPerMps2*v*v/c.massKg;
const availableBraking=(v:number,k:number,c:Readonly<DynamicsConfig>)=>
  Math.min(c.brakingCapMps2,remainingLongitudinalAccelerationMps2(v,k,c))+aeroDragAcceleration(v,c);
const availableAcceleration=(v:number,k:number,c:Readonly<DynamicsConfig>)=>
  Math.max(0,Math.min(
    c.accelerationCapMps2,
    c.enginePowerW/(c.massKg*Math.max(v,1)),
    remainingLongitudinalAccelerationMps2(v,k,c)
  )-aeroDragAcceleration(v,c));

function validateConfig(c:Readonly<DynamicsConfig>){
  for(const [k,v] of Object.entries(c)){
    if(!Number.isFinite(v)||v<=0)throw new Error(`Invalid positive physics config ${k}: ${v}`);
  }
  if(c.stepM>.9)throw new Error('stepM must be <= 0.9 to resolve the chosen corner');
}
const finitePose=(path:RacePath,s:number)=>{
  const pose=path.sampleAtDistance(s);
  if(!Number.isFinite(pose.yaw)||!Number.isFinite(pose.curvatureInvM)||
     pose.position.some(x=>!Number.isFinite(x)))throw new Error(`Non-finite path pose: ${path.id} @ ${s}`);
  return pose;
};
export function buildCarProfile(path:RacePath,c:Readonly<DynamicsConfig>=REPRESENTATIVE_F1_CONFIG):CarProfile{
  validateConfig(c);
  if(!Number.isFinite(path.lengthM)||path.lengthM<3)throw new Error('RacePath requires finite length >= 3m');
  if(!(0<=path.entryDistanceM&&path.entryDistanceM<=path.apexDistanceM&&
       path.apexDistanceM<=path.exitDistanceM&&path.exitDistanceM<=path.lengthM))
    throw new Error('RacePath checkpoints must be monotonically ordered');
  const n=Math.ceil(path.lengthM/c.stepM),s=Array.from({length:n+1},(_,i)=>path.lengthM*i/n);
  const k=s.map(x=>finitePose(path,x).curvatureInvM);
  const caps=k.map(x=>localSpeedLimitMps(x,c));
  const v=[...caps];v[0]=Math.min(c.entrySpeedMps,v[0]);
  // Backward admissible braking + forward grip/power-constrained acceleration.
  // Bisection prevents braking beyond the combined tyre force circle.
  for(let pass=0;pass<5;pass++){
    for(let i=n-1;i>=0;i--){
      const ds=s[i+1]-s[i];
      let low=v[i+1],high=caps[i];
      if(high<=low){v[i]=Math.min(v[i],high);continue;}
      for(let iteration=0;iteration<19;iteration++){
        const mid=(low+high)/2;
        const kWorst=Math.abs(k[i])>=Math.abs(k[i+1])?k[i]:k[i+1];
        const b=availableBraking(mid,kWorst,c);
        if(mid*mid<=v[i+1]*v[i+1]+2*b*ds)low=mid;
        else high=mid;
      }
      v[i]=Math.min(v[i],low);
    }
    v[0]=Math.min(v[0],c.entrySpeedMps);
    for(let i=1;i<=n;i++){
      const ds=s[i]-s[i-1];
      const ka=Math.abs(k[i])>=Math.abs(k[i-1])?k[i]:k[i-1];
      const a=availableAcceleration(v[i-1],ka,c);
      v[i]=Math.min(v[i],Math.sqrt(v[i-1]*v[i-1]+2*a*ds));
    }
  }
  const time=new Array<number>(n+1).fill(0);
  for(let i=1;i<=n;i++){
    const avg=(v[i-1]+v[i])*.5;
    if(avg<=1e-8)throw new Error('Zero-speed segment cannot be time integrated');
    time[i]=time[i-1]+(s[i]-s[i-1])/avg;
  }
  const nodes=s.map((distanceM,i)=>({distanceM,timeSeconds:time[i],speedMps:v[i],curvatureInvM:k[i]}));
  return {path,nodes,elapsedSeconds:time[n]};
}
const upperNode=(nodes:SpeedNode[],t:number,key:'distanceM'|'timeSeconds')=>{
  let lo=0,hi=nodes.length-1;
  while(lo+1<hi){const m=(lo+hi)>>1;if(nodes[m][key]<=t)lo=m;else hi=m;}
  return lo;
};
const interpolateTimeAtDistance=(p:CarProfile,s:number)=>{
  const nodes=p.nodes,d=clamp(s,0,p.path.lengthM),i=upperNode(nodes,d,'distanceM');
  const a=nodes[i],b=nodes[i+1];
  if(!b)return a.timeSeconds;
  const ds=d-a.distanceM;
  const accel=(b.speedMps*b.speedMps-a.speedMps*a.speedMps)/(2*(b.distanceM-a.distanceM));
  if(Math.abs(accel)<1e-9)return a.timeSeconds+ds/Math.max(1e-8,a.speedMps);
  const speed=Math.sqrt(Math.max(0,a.speedMps*a.speedMps+2*accel*ds));
  return a.timeSeconds+2*ds/(a.speedMps+speed);
};
const speedAtDistance=(p:CarProfile,s:number)=>{
  const nodes=p.nodes,d=clamp(s,0,p.path.lengthM),i=upperNode(nodes,d,'distanceM');
  const a=nodes[i],b=nodes[i+1];if(!b)return a.speedMps;
  const f=(d-a.distanceM)/(b.distanceM-a.distanceM);
  return Math.sqrt(Math.max(0,(1-f)*a.speedMps*a.speedMps+f*b.speedMps*b.speedMps));
};
export function sampleCarAtTime(p:CarProfile,timeSeconds:number,c:Readonly<DynamicsConfig>=REPRESENTATIVE_F1_CONFIG):CarFrameState{
  if(!Number.isFinite(timeSeconds))throw new Error('timeSeconds must be finite');
  const time=clamp(timeSeconds,0,p.elapsedSeconds),nodes=p.nodes;
  const i=upperNode(nodes,time,'timeSeconds'),a=nodes[i],b=nodes[i+1]??a;
  const ds=b.distanceM-a.distanceM,dt=b.timeSeconds-a.timeSeconds;
  const accel=ds>0?(b.speedMps*b.speedMps-a.speedMps*a.speedMps)/(2*ds):0;
  const elapsed=clamp(time-a.timeSeconds,0,dt);
  const distance=clamp(a.distanceM+a.speedMps*elapsed+.5*accel*elapsed*elapsed,0,p.path.lengthM);
  const speed=Math.sqrt(Math.max(0,a.speedMps*a.speedMps+2*accel*(distance-a.distanceM)));
  const pose=finitePose(p.path,distance),lat=speed*speed*Math.abs(pose.curvatureInvM);
  const normalGrip=tyreForceLimitN(speed,c)/c.massKg;
  const utilization=clamp(Math.hypot(lat,accel)/Math.max(normalGrip,1e-8),0,1);
  const brake=accel<-.01?clamp((-accel-aeroDragAcceleration(speed,c))/c.brakingCapMps2,0,1):0;
  const throttle=accel>.01?clamp((accel+aeroDragAcceleration(speed,c))/c.accelerationCapMps2,0,1):0;
  return {
    id:p.path.id,timeSeconds:time,pathDistanceM:distance,travelDistanceM:distance,
    worldPose:pose,speedMps:speed,longitudinalAccelMps2:accel,
    lateralAccelMps2:lat,steerRad:Math.atan(c.wheelbaseM*pose.curvatureInvM),
    brake01:brake,throttle01:throttle,gripUtilization01:utilization,
  };
}
export function makeRaceSimulator(paths:Record<RaceCarId,RacePath>,c:Readonly<DynamicsConfig>=REPRESENTATIVE_F1_CONFIG){
  if(paths.shortcut.id!=='shortcut'||paths.racing.id!=='racing')throw new Error('RacePath IDs mismatch');
  const startA=finitePose(paths.shortcut,0).position,startB=finitePose(paths.racing,0).position;
  const startSeparationM=Math.hypot(startA[0]-startB[0],startA[1]-startB[1],startA[2]-startB[2]);
  const finishA=finitePose(paths.shortcut,paths.shortcut.lengthM).position;
  const finishB=finitePose(paths.racing,paths.racing.lengthM).position;
  const finishSeparationM=Math.hypot(finishA[0]-finishB[0],finishA[1]-finishB[1],finishA[2]-finishB[2]);
  if(startSeparationM>.5||finishSeparationM>.5)throw new Error(
    'RacePaths must share physical start and finish checkpoints (A1 path revision required): '+JSON.stringify({startSeparationM,finishSeparationM}));
  let effectiveConfig:DynamicsConfig={...c};
  let profiles={shortcut:buildCarProfile(paths.shortcut,effectiveConfig),
    racing:buildCarProfile(paths.racing,effectiveConfig)};
  // A harder early bend may force one car to brake before the entry gate.
  // Lower BOTH entrants to the same feasible starting velocity instead of
  // quietly giving either route an unequal entry-speed advantage.
  for(let pass=0;pass<4;pass++){
    const sharedSpeed=Math.min(profiles.shortcut.nodes[0].speedMps,profiles.racing.nodes[0].speedMps);
    if(Math.abs(profiles.shortcut.nodes[0].speedMps-profiles.racing.nodes[0].speedMps)<.00001)break;
    effectiveConfig={...effectiveConfig,entrySpeedMps:sharedSpeed};
    profiles={shortcut:buildCarProfile(paths.shortcut,effectiveConfig),
      racing:buildCarProfile(paths.racing,effectiveConfig)};
  }
  if(Math.abs(profiles.shortcut.nodes[0].speedMps-profiles.racing.nodes[0].speedMps)>.0001)
    throw new Error('Could not find identical physically feasible entry speeds');
  const sample=(frame:number,fps:number):RaceFrameState=>{
    if(!Number.isFinite(frame)||!Number.isFinite(fps)||fps<=0)throw new Error('Invalid frame/fps');
    const t=Math.max(0,frame/fps);
    return {frame,fps,timeSeconds:t,cars:{
      shortcut:sampleCarAtTime(profiles.shortcut,t,effectiveConfig),
      racing:sampleCarAtTime(profiles.racing,t,effectiveConfig),
    }};
  };
  const carMetrics=(p:CarProfile):CarComparison=>{
    const corner=p.nodes.filter(n=>n.distanceM>=p.path.entryDistanceM&&n.distanceM<=p.path.exitDistanceM);
    return {
      pathLengthM:p.path.lengthM,
      minimumCornerSpeedMps:Math.min(...corner.map(n=>n.speedMps)),
      apexTimeSeconds:interpolateTimeAtDistance(p,p.path.apexDistanceM),
      apexSpeedMps:speedAtDistance(p,p.path.apexDistanceM),
      exitTimeSeconds:interpolateTimeAtDistance(p,p.path.exitDistanceM),
      exitSpeedMps:speedAtDistance(p,p.path.exitDistanceM),
      finishTimeSeconds:p.elapsedSeconds,finishSpeedMps:p.nodes.at(-1)!.speedMps,
    };
  };
  // Physical finish-gate separation was validated before solving the profiles.
  const shortcut=carMetrics(profiles.shortcut),racing=carMetrics(profiles.racing);
  const racingFinishAdvantageSeconds=shortcut.finishTimeSeconds-racing.finishTimeSeconds;
  const comparison:RaceComparison={
    assumptions:{...effectiveConfig},shortcut,racing,finishSeparationM,racingFinishAdvantageSeconds,
    fasterAtCommonFinish:racingFinishAdvantageSeconds>1e-6?'racing':
      racingFinishAdvantageSeconds< -1e-6?'shortcut':'tie',
  };
  return {profiles,sample,comparison,config:effectiveConfig};
}
