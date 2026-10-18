import {mkdirSync,writeFileSync} from 'node:fs';
import {raceSimulator,AUTHORITATIVE_RACE_PATHS} from '../../src/yunex/f1-line-ep002/physics/index.ts';
import {RACING_CORNER,CORNER_GEOMETRY} from '../../src/yunex/f1-line-ep002/track/racingPaths.ts';

const {comparison,config,profiles}=raceSimulator;
const p=AUTHORITATIVE_RACE_PATHS;
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const startSeparationM=distance(p.shortcut.sampleAtDistance(0).position,
 p.racing.sampleAtDistance(0).position);
const finishSeparationM=distance(p.shortcut.sampleAtDistance(p.shortcut.lengthM).position,
 p.racing.sampleAtDistance(p.racing.lengthM).position);
const vStart=Object.fromEntries(['shortcut','racing'].map(id=>[id,profiles[id].nodes[0].speedMps]));
const finite=(name,value)=>{if(!Number.isFinite(value))throw new Error('Non-finite '+name);};
for(const [key,v] of Object.entries({startSeparationM,finishSeparationM,...vStart}))finite(key,v);
if(startSeparationM>1e-6||finishSeparationM>1e-6)throw new Error('Not a common physical gate');
if(Math.abs(vStart.shortcut-vStart.racing)>1e-4)throw new Error('Unequal starting speed');
const report={
  source:'PR #166 makeRacingLinePath; copied unmodified into Agent 2 branch',
  model:'illustrative engineering physics — NOT exact real-world F1 telemetry',
  geometry:{...CORNER_GEOMETRY,...RACING_CORNER,
    sharedStartSeparationM:startSeparationM,sharedFinishSeparationM:finishSeparationM},
  assumptions:config,entrySpeedMps:vStart,
  signedComparison:comparison,
  samples:Object.fromEntries(['shortcut','racing'].map(id=>[id,
   [0,.25,.50,.75,1].map(f=>{
     const state=raceSimulator.sample(Math.round(profiles[id].elapsedSeconds*30*f),30).cars[id];
     return {timeSeconds:state.timeSeconds,travelDistanceM:state.travelDistanceM,
       speedMps:state.speedMps,brake01:state.brake01,throttle01:state.throttle01,
       lateralAccelerationMps2:state.lateralAccelMps2};
   })])),
  interpretation:'Race outcome is computed at a common actual checkpoint. Wider racing line may lose. Do not fake a pass. All dynamics are synthetic, openly assumed rather than measured.'
};
mkdirSync('out',{recursive:true});
writeFileSync('out/f1-agent2-physics-report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
