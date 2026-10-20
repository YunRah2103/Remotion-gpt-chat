import type {StoryRequest} from '../shared/contract.ts';
/** Preview callouts are semantic editorial placeholders, NOT fake voice timings.
 * Spark words are gated on LIVE Agent 2 born/persisting particles, so no
 * mismatched late 'SPARKS FLY' cards on an empty dry circuit. */
export function contactCaption(request:StoryRequest):string|undefined{
 const shining=request.particles.some(p=>p.luminance01>.08&&p.ageSec>=0&&p.ageSec<p.lifetimeSec);
 const touching=request.contacts.some(c=>c.active&&c.signedGapM<=0&&c.contactIntensity01>0);
 if(request.shot==='spark-hook'){
   return shining?'ACTUAL METAL SPARKS':'WHY DO F1 CARS SPARK?';
 }
 if(request.shot==='contact-macro'){
   if(touching&&shining)return 'METAL SCRAPES THE TRACK';
   if(shining)return 'CONTACT-BORN SPARKS';
   return 'NO CONTACT. NO SPARKS.';
 }
 if(request.shot==='racing-payoff'){
   if(shining)return 'SPARKS FROM THE SKID';
   return 'METAL. NOT THE ENGINE.';
 }
 return undefined;
}
