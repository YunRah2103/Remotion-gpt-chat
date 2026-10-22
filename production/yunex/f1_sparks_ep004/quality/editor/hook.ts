/** Contact-authentic first frame: deterministic search of ORIGINAL EP004 A2 physics. */
import {getQualitySkidDescriptors} from './staging/vehicle/QualityF1Vehicle.tsx';
import {sampleDynamics,sampleContactDrivenSparks} from '../../physics/index.ts';
const SKIDS=getQualitySkidDescriptors();
export const HOOK_DISTANCE_M=63.65;
export const PREVIEW_SPEED_MPS=62;
type HookProof=Readonly<{sourceSec:number;active:boolean;visibleParticles:number;score:number}>;
let cachedHook:HookProof|null=null;
export function locateOriginalContactHook():HookProof {
 if(cachedHook)return cachedHook;
 let best:HookProof|null=null;
 for(let i=0;i<=150;i++){
  const t=i/150;
  const motion=sampleDynamics(t,{startDistanceM:HOOK_DISTANCE_M,
   speedMps:PREVIEW_SPEED_MPS,aeroLoad01:1});
  const data=sampleContactDrivenSparks(t,motion,SKIDS);
  const active=data.contacts.some(c=>c.active&&c.signedGapM<=0);
  const count=data.particles.filter(p=>p.ageSec>=0&&p.ageSec<p.lifetimeSec&&p.luminance01>.13).length;
  const score=count+(active?3:0);
  if(active&&count>=6&&(!best||score>best.score))best={sourceSec:t,active,visibleParticles:count,score};
 }
 if(!best)throw Error('EP004 first-second spark hook has no physically verified metal-contact shower — STOP rather than invent particles');
 cachedHook=best;
 return best;
}
