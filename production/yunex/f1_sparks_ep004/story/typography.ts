/** Phone-first subtitles. Layout is dynamic, never crops real narrator words.
 * The editor supplies short (ideally 1–3 word) spoken phrases; this code
 * doesn't fabricate word timings or rewrite the script. */
export const CAPTION_BOTTOM_SAFE_RATIO=0.155;
export const CAPTION_SIDE_SAFE_RATIO=0.09;
export type CaptionSizing=Readonly<{
 bottomPx:number;
 leftPx:number;
 rightPx:number;
 fontPx:number;
 maxLinesHint:number;
}>;
export function captionSizing(width:number,height:number,text:string):CaptionSizing{
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<200||height<200)
   throw new Error('Caption layout requires valid dimensions');
 const portrait=height>=width;
 const length=Array.from(text.trim()).length;
 const normalFont=width*(portrait?.052:.036);
 // Long supplied text remains fully visible: shrink slightly and wrap upwards.
 // There is intentionally NO overflow:hidden or max-height text cropping.
 const scaling=Math.min(1,Math.sqrt(34/Math.max(34,length)));
 const fontPx=Math.round(Math.max(width*(portrait?.028:.023),normalFont*scaling));
 const visibleWidth=width*(1-2*CAPTION_SIDE_SAFE_RATIO);
 const approxGlyphWidth=fontPx*.57;
 const maxLinesHint=Math.max(1,Math.ceil(length*approxGlyphWidth/visibleWidth));
 return {
  bottomPx:Math.round(height*CAPTION_BOTTOM_SAFE_RATIO),
  leftPx:Math.round(width*CAPTION_SIDE_SAFE_RATIO),
  rightPx:Math.round(width*CAPTION_SIDE_SAFE_RATIO),
  fontPx,maxLinesHint
 };
}
