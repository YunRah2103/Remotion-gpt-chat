/** Agent 12: pure, deterministic mobile graphics layout. No independent narration, particles or physics. */
import * as THREE from 'three';
import type {CameraPose,SkidContact,StoryRequest,Vec3,VehicleMotionState} from '../../shared/contract.ts';
import {localToWorld} from '../../physics/dynamics.ts';
import {projectedActualParts} from '../../story/project-actual-parts.ts';
import {validateAeroPair} from '../../story/visual-cues.ts';
export const SCREEN={width:1080,height:1920,left:84,right:186,top:225,captionBottom:326,captionMaxWidth:754,scienceBottom:1360} as const;
export type NarratorWord=Readonly<{text:string;startSec:number;endSec:number}>;
export type SubtitleCue=Readonly<{startFrame:number;endFrameExclusive:number;wordIndices:readonly number[]}>;
export type TimingStatus='verified-original-ep004'|'provisional-test-fixture';
const clamp=(x:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,x));
export const ease=(v:number)=>{const x=clamp(v,0,1);return x*x*(3-2*x);};
export function validateNarratorWords(words:readonly NarratorWord[],status:TimingStatus,allowFixture=false):void{
 if(status!=='verified-original-ep004' && !(status==='provisional-test-fixture'&&allowFixture))
   throw new Error('Original EP004 word alignment is missing; final-VO graphics render blocked');
 if(!words.length)throw new Error('Actual word timeline required');
 let previous=0;
 words.forEach((w,i)=>{
  if(!w.text.trim()||!Number.isFinite(w.startSec)||!Number.isFinite(w.endSec)||
     w.startSec<previous-1e-5||w.endSec<=w.startSec)
   throw new Error('Invalid/unsorted narrator word at '+i);
  if(w.endSec>25.248+.09 && status==='verified-original-ep004')
   throw new Error('Word beyond original EP004 audio duration');
  previous=w.startSec;
 });
}
export function activeSubtitle(frame:number,fps:number,words:readonly NarratorWord[],cue:SubtitleCue|null,
 status:TimingStatus,allowFixture=false){
 validateNarratorWords(words,status,allowFixture);
 if(!cue||frame<cue.startFrame||frame>=cue.endFrameExclusive)return null;
 if(!(fps>0)||!Number.isFinite(frame)||cue.startFrame<0||cue.endFrameExclusive<=cue.startFrame)
  throw new Error('Invalid caption frame bounds');
 const indices=[...cue.wordIndices];
 if(!indices.length||indices.length>5||new Set(indices).size!==indices.length||
    indices.some(i=>!Number.isInteger(i)||i<0||i>=words.length)||
    indices.some((x,i)=>i>0&&x<=indices[i-1]))
   throw new Error('Caption groups must reference 1–5 ordered real narrator words');
 const highlighted=indices.find(i=>frame/fps>=words[i].startSec&&frame/fps<words[i].endSec);
 return {indices,highlighted,fade:ease((frame-cue.startFrame+1)/4)*ease((cue.endFrameExclusive-frame)/4)};
}
export function subtitleSize(words:readonly string[],width=SCREEN.width) {
 const visible=Math.min(SCREEN.captionMaxWidth,width-SCREEN.left-SCREEN.right);
 const longest=words.reduce((m,s)=>Math.max(m,Array.from(s).length),0);
 const total=words.join(' ').length;
 const font=Math.max(22,Math.min(59,Math.floor(Math.min(59,visible/(Math.max(10,longest)*.61),visible/(Math.max(20,total/2)*.52)))));
 return {font,width:visible,left:Math.max(SCREEN.left,(width-SCREEN.right-visible)/2),bottom:SCREEN.captionBottom};
}
/** True 3D projection: reject behind-camera/offscreen markers; never clamp a false pointer. */
export function projectWorld(point:Vec3,pose:CameraPose,width=SCREEN.width,height=SCREEN.height) {
 const camera=new THREE.PerspectiveCamera(pose.fovDeg,width/height,.025,350);
 camera.position.set(...pose.positionWorld);camera.up.set(0,1,0);
 camera.lookAt(...pose.targetWorld);camera.updateMatrixWorld(true);
 const v=new THREE.Vector3(...point).project(camera);
 const x=(v.x+1)*width/2,y=(1-v.y)*height/2;
 return {x,y,visible:v.z>-1&&v.z<1&&Number.isFinite(x)&&Number.isFinite(y)&&x>=72&&x<=width-190&&y>=200&&y<=1360};
}
export type SciencePin=Readonly<{id:string;title:string;hint:string;color:string;anchorX:number;anchorY:number;labelX:number;labelY:number}>;
export function materialPins(request:StoryRequest,pose:CameraPose):readonly SciencePin[]{
 if(request.shot!=='underfloor-reveal')return [];
 const pts=projectedActualParts(request.motion,pose,SCREEN.width,SCREEN.height);
 const pins:SciencePin[]=[];
 for(const pt of pts){
  if(!pt.onScreen||pt.x<72||pt.x>SCREEN.width-190||pt.y<SCREEN.top||pt.y>SCREEN.scienceBottom)continue;
  const desiredX=pt.x<SCREEN.width*.55?pt.x+55:pt.x-345;
  const x=clamp(desiredX,SCREEN.left,SCREEN.width-SCREEN.right-315);
  const ideal=clamp(pt.y-63,SCREEN.top,SCREEN.scienceBottom-70);
  const slots=[ideal,ideal-106,ideal+106,ideal-212,ideal+212,SCREEN.top,SCREEN.scienceBottom-70];
  const y=slots.map(s=>clamp(s,SCREEN.top,SCREEN.scienceBottom-70))
    .find(s=>pins.every(prior=>Math.abs(s-prior.labelY)>=98||Math.abs(x-prior.labelX)>=340));
  if(y===undefined)continue;
  pins.push({id:pt.id,title:pt.id==='metal'?'METAL SKID BLOCK':pt.id==='plank'?'COMPOSITE PLANK':'CARBON FLOOR',
   hint:pt.id==='metal'?'SPARK SOURCE':'DOES NOT MAKE SPARKS',color:pt.color,
   anchorX:pt.x,anchorY:pt.y,labelX:x,labelY:y});
 }
 return pins;
}
export function liveMetalContact(contacts:readonly SkidContact[]):SkidContact|null {
 return contacts.find(c=>['forward','middle','rear'].includes(c.skidId)&&
  c.active&&c.signedGapM<=0&&c.relativeSpeedMps>.5&&c.contactIntensity01>0)??null;
}
export function contactPin(request:StoryRequest,pose:CameraPose){
 if(request.shot!=='contact-macro')return null;
 const active=liveMetalContact(request.contacts);
 if(!active)return null;
 const pin=projectWorld(active.pointWorld,pose);
 return pin.visible?pin:null;
}
export function aeroPin(request:StoryRequest,pose:CameraPose,unloaded?:VehicleMotionState) {
 if(request.shot!=='aero-load'||!unloaded)return null;
 validateAeroPair(unloaded,request.motion);
 if(!(request.motion.heaveM<unloaded.heaveM-.004&&request.motion.downforceProxy01>unloaded.downforceProxy01))return null;
 const point=projectWorld(localToWorld([0,.73,0],request.motion),pose);
 return point.visible?point:null;
}
