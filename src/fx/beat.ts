/**
 * Frame-locked beat FX. Every cut swaps actual video content first.
 * Effects only modify the first 1–6 frames; no implied duplicate footage.
 */
export type CutStyle = 'cut'|'whip-left'|'whip-right'|'punch'|'flash'|'rgb-edge'|'film-burn'|'shutter'|'zoom-through'|'light-leak';
export type BeatCut = {frame:number;style?:CutStyle;chapterStart?:boolean};
export type BeatFrame = {cutIndex:number;cutFrame:number;untilNext:number;slotFrames:number;age:number;progress:number;flash:number;zoom:number;shiftX:number;tilt:number;rgbOffset:number;burn:number;shutter:number;leak:number};

const clamp=(v:number,min=0,max=1)=>Math.max(min,Math.min(max,v));
const easeOut=(t:number)=>1-(1-clamp(t))**3;
/**
 * Minimum scale that covers all four output corners after an X translation and
 * Z rotation. Works at native or preview resolution; a fixed 540px divisor does not.
 */
export const requiredOverscan=(width:number,height:number,shiftX:number,tiltDegrees:number,zoom=1):number=>{
  if(![width,height,shiftX,tiltDegrees,zoom].every(Number.isFinite)||width<=0||height<=0||zoom<1)
    throw new Error('Invalid overscan geometry');
  const radians=tiltDegrees*Math.PI/180;
  const cosine=Math.abs(Math.cos(radians)),sine=Math.abs(Math.sin(radians));
  const x=Math.abs(shiftX);
  const scale=Math.max(1,zoom,(cosine*(width+2*x)+sine*height)/width,
    (sine*(width+2*x)+cosine*height)/height);
  return scale>1?scale+.006:1;
};
const supportedStyles:ReadonlySet<string>=new Set(['cut','whip-left','whip-right','punch','flash','rgb-edge','film-burn','shutter','zoom-through','light-leak']);
export const validateCuts=(cuts:ReadonlyArray<BeatCut>,duration:number):void=>{
  if(!Number.isInteger(duration)||duration<5)throw new Error('Duration must be integer frames');
  if(cuts.length<1||cuts[0].frame!==0)throw new Error('Cut 0 must begin at frame 0');
  for(let i=0;i<cuts.length;i++){
    const current=cuts[i].frame;
    if(!Number.isInteger(current)||current<0||current>=duration)throw new Error('Cut out of range');
    if(i>0&&current-cuts[i-1].frame<5)throw new Error('Too short for a clear moving clip');
    if(cuts[i].style!==undefined&&!supportedStyles.has(cuts[i].style))throw new Error('Unsupported FX cut style');
  }
};
export const evaluateBeatFx=(frame:number,cuts:ReadonlyArray<BeatCut>,duration:number,strength=0.55):BeatFrame=>{
  validateCuts(cuts,duration);
  if(!Number.isFinite(strength))throw new Error('Invalid FX strength');
  if(!Number.isInteger(frame)||frame<0||frame>=duration)throw new Error('Invalid frame');
  const amount=clamp(strength,0,.85);
  let index=0;
  while(index+1<cuts.length&&cuts[index+1].frame<=frame)index++;
  const cut=cuts[index];
  const end=cuts[index+1]?.frame??duration;
  const slotFrames=end-cut.frame,age=frame-cut.frame;
  // Film clips ~0.5s: do not spend more than 1/3 of one shot hiding the new car.
  const visibleWindow=Math.min(5,Math.max(2,Math.floor(slotFrames/3)));
  const p=easeOut(age/visibleWindow);
  const q=1-p;
  const style=cut.style??'cut';
  const accent=style==='flash'||style==='film-burn';
  return {
    cutIndex:index,cutFrame:cut.frame,untilNext:end-frame,slotFrames,age,progress:p,
    flash:accent?clamp((1-age/3)*amount*.62):0,
    zoom:style==='punch'?1+q*amount*.12:style==='zoom-through'?1+q*amount*.32:1,
    shiftX:style==='whip-left'?-q*amount*135:style==='whip-right'?q*amount*135:0,
    tilt:(style==='whip-left'?-1:style==='whip-right'?1:0)*q*amount*2.5,
    rgbOffset:style==='rgb-edge'?q*amount*5:0,
    burn:style==='film-burn'?Math.max(0,1-age/5)*amount*.65:0,
    shutter:style==='shutter'?Math.max(0,1-age/4)*amount*.42:0,
    leak:style==='light-leak'?Math.max(0,1-age/4)*amount*.45:0,
  };
};
export const buildChapterFx=(startFrames:ReadonlyArray<number>,style:CutStyle='whip-left'):BeatCut[]=>{
  if(!startFrames.length||startFrames[0]!==0)throw new Error('Start at frame 0');
  if(!supportedStyles.has(style))throw new Error('Unsupported chapter FX style');
  for(let i=1;i<startFrames.length;i++)if(!Number.isInteger(startFrames[i])||startFrames[i]-startFrames[i-1]<5)throw new Error('Chapter cuts must be ordered and at least 5 frames apart');
  return startFrames.map((frame,i)=>({frame,style:i===0?'cut':i%7===0?'film-burn':i%3===0?'punch':style,chapterStart:i!==0&&i%4===0}));
};
