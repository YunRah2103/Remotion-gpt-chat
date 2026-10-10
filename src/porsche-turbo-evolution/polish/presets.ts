/** Agent C: opt-in 2–3 frame micro-polish. New shot replaces old at EXACT beat frame. */
export type PorscheEra='930'|'964'|'993'|'996'|'997'|'991'|'992';
export type PolishStyle='cut'|'micro-punch'|'match-shift'|'soft-luma';
export type BeatSlot=Readonly<{slot:number;generation:string;startFrame:number;endFrame:number;durationFrames:number}>;
export type ChapterPreset=Readonly<{style:PolishStyle;frames:number;strength:number;direction?:-1|1}>;
export type PolishFrame=Readonly<{frame:number;slot:number;generation:PorscheEra;chapterStart:boolean;style:PolishStyle;active:boolean;age:number;translateXPx:number;scale:number;flashOpacity:number;videoOpacity:1}>;
export const DURATION_FRAMES=510;
export const FPS=30;
export const CHAPTER_STARTS:Readonly<Record<number,`${PorscheEra}->${PorscheEra}`>>=Object.freeze({
67:'930->964',136:'964->993',205:'993->996',274:'996->997',343:'997->991',429:'991->992'
});
/** Editorial defaults: hard cut wins when camera match or native detail does not justify FX. */
export const CHAPTER_PRESETS:Readonly<Record<number,ChapterPreset>>=Object.freeze({
67:{style:'micro-punch',frames:3,strength:.42},
136:{style:'cut',frames:0,strength:0},
205:{style:'match-shift',frames:3,strength:.38,direction:-1},
274:{style:'cut',frames:0,strength:0},
343:{style:'cut',frames:0,strength:0},
429:{style:'micro-punch',frames:2,strength:.32}
});
const EXPECTED:ReadonlyArray<PorscheEra>=[
...Array<PorscheEra>(4).fill('930'),...Array<PorscheEra>(4).fill('964'),
...Array<PorscheEra>(4).fill('993'),...Array<PorscheEra>(4).fill('996'),
...Array<PorscheEra>(4).fill('997'),...Array<PorscheEra>(5).fill('991'),
...Array<PorscheEra>(5).fill('992')];
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
/** Fail closed if D re-times cuts. Requires re-review before any look is applied. */
export const validatePolishBeats=(cuts:ReadonlyArray<BeatSlot>):void=>{
 if(cuts.length!==30)throw new Error('Agent C: exactly 30 beats required');
 let previousEnd=-1;const chapterFrames:number[]=[];
 cuts.forEach((beat,i)=>{
  if(beat.slot!==i+1||beat.generation!==EXPECTED[i])throw new Error(`Agent C: wrong era/slot ${i+1}`);
  if(!Number.isInteger(beat.startFrame)||!Number.isInteger(beat.endFrame)||
   beat.startFrame!==previousEnd+1||beat.durationFrames!==beat.endFrame-beat.startFrame+1||
   beat.durationFrames<12)throw new Error(`Agent C: gap, overlap or short beat ${i+1}`);
  if(i>0&&beat.generation!==cuts[i-1].generation)chapterFrames.push(beat.startFrame);
  previousEnd=beat.endFrame;
 });
 if(previousEnd!==DURATION_FRAMES-1)throw new Error('Agent C: incomplete 510-frame timeline');
 if(chapterFrames.join(',')!==Object.keys(CHAPTER_STARTS).join(','))throw new Error('Agent C: chapter boundary moved; re-approve presets');
};
export const evaluatePolish=(frame:number,cuts:ReadonlyArray<BeatSlot>,
 overrides:Readonly<Record<number,ChapterPreset>>=CHAPTER_PRESETS):PolishFrame=>{
 validatePolishBeats(cuts);
 if(!Number.isInteger(frame)||frame<0||frame>=DURATION_FRAMES)throw new Error('Agent C: frame outside master');
 const beat=cuts.find(b=>frame>=b.startFrame&&frame<=b.endFrame);
 if(!beat)throw new Error('Agent C: missing beat at frame '+frame);
 const previous=cuts[beat.slot-2];
 const chapterStart=!!previous&&previous.generation!==beat.generation;
 if(chapterStart&&!Object.prototype.hasOwnProperty.call(CHAPTER_STARTS,beat.startFrame))throw new Error('Unknown chapter');
 const preset=chapterStart?(overrides[beat.startFrame]??{style:'cut' as const,frames:0,strength:0}):
  {style:'cut' as const,frames:0,strength:0};
 if(!['cut','micro-punch','match-shift','soft-luma'].includes(preset.style)||
  !Number.isInteger(preset.frames)||preset.frames<0||preset.frames>3||
  !Number.isFinite(preset.strength)||preset.strength<0||preset.strength>.6||
  (preset.style==='cut'&&preset.frames!==0)||preset.frames>Math.floor(beat.durationFrames/3))
  throw new Error('Unsafe preset at '+beat.startFrame);
 const age=frame-beat.startFrame;
 const active=chapterStart&&preset.style!=='cut'&&age<preset.frames;
 const progress=active?Math.pow(1-age/preset.frames,2):0;
 const k=clamp(preset.strength,0,.6)*progress;
 const scale=active&&preset.style==='micro-punch'?1+.055*k:1;
 const translateXPx=active&&preset.style==='match-shift'?Math.round((preset.direction??1)*24*k):0;
 const flashOpacity=active&&preset.style==='soft-luma'?Math.min(.055,k*.1):0;
 return {frame,slot:beat.slot,generation:beat.generation as PorscheEra,chapterStart,
  style:active?preset.style:'cut',active,age,translateXPx,scale,flashOpacity,videoOpacity:1};
};
/** Advisory crop only: preserve SD detail with same-source ambient backdrop. */
export type CropAdvice=Readonly<{mode:'full-bleed'|'same-source-ambient-panel';objectPosition:string;safeLabelLeftPx:70;safeLabelTopPx:145;warning:string|null}>;
export const recommendCrop=(width:number,height:number,focusX=.5,focusY=.5):CropAdvice=>{
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<1||height<1||
 !Number.isFinite(focusX)||!Number.isFinite(focusY)||focusX<0||focusX>1||focusY<0||focusY>1)
  throw new Error('Invalid source geometry/focus');
 const lowDetail=height<1000;
 return {mode:width/height>1.3||lowDetail?'same-source-ambient-panel':'full-bleed',
 objectPosition:`${Math.round(focusX*100)}% ${Math.round(focusY*100)}%`,
 safeLabelLeftPx:70,safeLabelTopPx:145,
 warning:lowDetail?'Archival source: preserve native detail; no fake 4K or full-height SD stretch':null};
};