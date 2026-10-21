/**
 * An edit of real race passes, not an edit of emission onset.
 * Slowed playback samples authentic absolute contact states and is labelled.
 */
export type PreviewMode='technical'|'portrait';
export type PreviewAngle='underfloor-front'|'underfloor-rear'|'chase'|'approach'|'payoff';
export type PreviewShot=Readonly<{id:string;firstFrame:number;frames:number;startDistanceM:number;playbackRate:number;angle:PreviewAngle;title:string}>;
export const PREVIEW_SHOTS:Readonly<Record<PreviewMode,readonly PreviewShot[]>>={
 technical:[
  {id:'front',firstFrame:0,frames:75,startDistanceM:64,playbackRate:.32,angle:'underfloor-front',title:'FRONT TITANIUM SKID'},
  {id:'rear',firstFrame:75,frames:75,startDistanceM:130,playbackRate:.34,angle:'underfloor-rear',title:'THE METAL TOUCHES DOWN'},
 ],
 portrait:[
  {id:'opening',firstFrame:0,frames:70,startDistanceM:66,playbackRate:.42,angle:'chase',title:'WATCH THE SPARKS'},
  {id:'second',firstFrame:70,frames:70,startDistanceM:131,playbackRate:.38,angle:'approach',title:'METAL MEETS ASPHALT'},
  {id:'finish',firstFrame:140,frames:70,startDistanceM:70,playbackRate:.66,angle:'payoff',title:'THE CAR LIFTS CLEAR'},
 ],
};
export function samplePreviewShot(mode:PreviewMode,frame:number,fps=30){
 if(!Number.isInteger(frame)||frame<0||!(fps>0)||!Number.isFinite(fps))throw new Error('Bad preview frame/fps');
 const shots=PREVIEW_SHOTS[mode];if(!shots)throw new Error('Bad preview mode');
 const shot=shots.find(s=>frame>=s.firstFrame&&frame<s.firstFrame+s.frames);
 if(!shot)throw new RangeError('Beyond preview');
 return {shot,sourceTimeSec:(frame-shot.firstFrame)/fps*shot.playbackRate,localFrame:frame-shot.firstFrame};
}
