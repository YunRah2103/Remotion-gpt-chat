/** Verified contact-or-release selects from already approved A1/A2 modules.
 * Two natural contact peaks are selected from the existing asphalt waveform.
 * This is EDITORIAL time selection, not a second spark/contact solver.
 */
import {getSkidDescriptors} from '../../../mechanics/skids.ts';
import {sampleDynamics} from '../../../physics/dynamics.ts';
import {sampleSkidContacts} from '../../../physics/contacts.ts';
export type SourceTake=Readonly<{startDistanceM:number;sourceSec:number;kind:'contact'|'release';score:number}>;
const SKIDS=getSkidDescriptors();
const STARTS=[63.65,69,132.30,134,70.6] as const;

export function selectRealSparkTakes():readonly SourceTake[]{
 const contacts:SourceTake[]=[],releases:SourceTake[]=[];
 for(const distance of STARTS){
  let priorContact=false;
  for(let i=0;i<=175;i++){
   const t=i*.02;
   const m=sampleDynamics(t,{startDistanceM:distance,speedMps:62,aeroLoad01:1});
   const cs=sampleSkidContacts(t,m,SKIDS);
   const score=Math.max(0,...cs.map(c=>c.active?c.contactIntensity01:0));
   const active=score>0;
   if(active&&score>.08)contacts.push({startDistanceM:distance,sourceSec:t,kind:'contact',score});
   if(!active&&priorContact)releases.push({startDistanceM:distance,sourceSec:t,kind:'release',score:0});
   priorContact=active;
  }
 }
 const sorted=contacts.sort((a,b)=>b.score-a.score);
 const first=sorted[0];
 if(!first)throw new Error('No approved A2 metal contact at selected physical route starts');
 const second=sorted.find(c=>c.startDistanceM!==first.startDistanceM&&c.score>.1)
  ??sorted.find(c=>Math.abs(c.sourceSec-first.sourceSec)>.19)??first;
 const release=(forContact:SourceTake)=>{
  return releases.find(r=>r.startDistanceM===forContact.startDistanceM&&
    r.sourceSec>forContact.sourceSec&&r.sourceSec-forContact.sourceSec<.76)
   ??releases.find(r=>r.startDistanceM===forContact.startDistanceM)
   ??releases[0]??{startDistanceM:forContact.startDistanceM,sourceSec:forContact.sourceSec+.65,kind:'release' as const,score:0};
 };
 return [first,release(first),second,release(second),first];
}

export function sourceTakeAt(screenSec:number,mode:'technical'|'cinematic',takes:readonly SourceTake[]){
 const segments=mode==='technical'?[
  {end:1.00,take:0,rate:.07,shot:'contact-macro' as const},
  {end:2.00,take:1,rate:.11,shot:'underfloor-reveal' as const},
  {end:3.00,take:2,rate:.08,shot:'contact-macro' as const},
  {end:4.00,take:3,rate:.11,shot:'underfloor-reveal' as const},
  {end:5.00,take:0,rate:.12,shot:'contact-macro' as const},
 ]:[
  {end:1.25,take:0,rate:.12,shot:'spark-hook' as const},
  {end:3.05,take:0,rate:.26,shot:'rear-mystery' as const},
  {end:4.30,take:1,rate:.17,shot:'underfloor-reveal' as const},
  {end:5.65,take:2,rate:.14,shot:'contact-macro' as const},
  {end:8.00,take:2,rate:.42,shot:'racing-payoff' as const},
 ];
 const i=segments.findIndex(s=>screenSec<s.end);
 const index=Math.max(0,i===-1?segments.length-1:i),segment=segments[index];
 const sectionStart=index?segments[index-1].end:0;
 const localSec=Math.max(0,screenSec-sectionStart);
 const take=takes[segment.take];
 return {sourceSec:take.sourceSec+localSec*segment.rate,startDistanceM:take.startDistanceM,
  kind:take.kind,shot:segment.shot,localSec,shotDurationSec:segment.end-sectionStart,segment:index};
}
