/**
 * A frame-zero hero spark is a flash-forward to a REAL Agent 1 metal-on-asphalt
 * contact calculated by the APPROVED Agent 2 physics and Agent 4 road.
 * This never spawns decorative particles and never invents a contact frame.
 */
import {sampleDynamics,sampleContactDrivenSparks} from '../physics/index.ts';
import {getSkidDescriptors} from '../mechanics/skids.ts';

export type GenuineSparkHook = Readonly<{
  sourceSec: number;
  activeMetalSkids: readonly string[];
  minSignedGapM: number;
  contactParticleCount: number;
  emittedParticleIds: readonly number[];
}>;

export function assertGenuineSparkHook(sourceSec: number, minimumVisibleParticles = 6): GenuineSparkHook {
  if(!Number.isFinite(sourceSec)||sourceSec<0) throw new Error('EP004 spark hook: invalid contact source time');
  const skids=getSkidDescriptors();
  if(skids.some(s=>!s.metal)) throw new Error('EP004 spark hook: nonmetal spark source is forbidden');
  const state=sampleDynamics(sourceSec);
  const {contacts,particles}=sampleContactDrivenSparks(sourceSec,state,skids);
  const touching=contacts.filter(c=>c.active && c.signedGapM<=0 && c.relativeSpeedMps>0.5 && c.contactIntensity01>0);
  const bornFromRealSkid=particles.filter(p=>skids.some(s=>s.id===p.emitterSkidId)&&p.luminance01>0.12);
  if(!touching.length||bornFromRealSkid.length<minimumVisibleParticles)
    throw new Error('EP004 spark hook: no sufficient active metal-contact sparks at actual source time '+sourceSec.toFixed(3));
  return {sourceSec,activeMetalSkids:touching.map(c=>c.skidId),
    minSignedGapM:Math.min(...touching.map(c=>c.signedGapM)),
    contactParticleCount:bornFromRealSkid.length,
    emittedParticleIds:bornFromRealSkid.slice(0,16).map(p=>p.id)};
}

export function findAuthenticSparkMoment(options: Readonly<{
  startSec?:number;
  endSec?:number;
  minimumVisibleParticles?:number;
}>={}): GenuineSparkHook {
  const start=options.startSec??0,end=options.endSec??12;
  const required=options.minimumVisibleParticles??6;
  if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start||end-start>30)
    throw new Error('EP004 spark hook: finite bounded contact search required');
  if(!Number.isInteger(required)||required<1||required>260)
    throw new Error('EP004 spark hook: invalid genuine visible-particle minimum');
  let best:GenuineSparkHook|null=null;
  // Each checked instant is derived from road, chassis and actual metal skids.
  for(let i=0;i<=Math.ceil((end-start)*30);i++){
    const t=start+i/30;
    if(t>end+1e-6)break;
    try {
      const candidate=assertGenuineSparkHook(t,required);
      if(best===null||candidate.contactParticleCount>best.contactParticleCount)best=candidate;
    }catch(error){
      if(!(error instanceof Error)||!error.message.includes('no sufficient active metal-contact sparks'))throw error;
    }
  }
  if(!best)throw new Error('EP004 spark hook: no physically real visible contact event in available approved footage; ask Agents 2/3/5 to fix source timing');
  return best;
}
