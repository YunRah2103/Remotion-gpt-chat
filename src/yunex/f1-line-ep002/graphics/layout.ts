/** Match physical typographic proportions across QA and final film canvases. */
export function portraitOverlayScale(width:number,height:number):number{
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)
  throw new Error('Invalid overlay viewport dimensions');
 return Math.min(width/540,height/960);
}
