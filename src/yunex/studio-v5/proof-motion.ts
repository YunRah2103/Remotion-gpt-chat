/** Fit an eight-second shot to a custom route without clamping a moving wheel rig at its end. */
export function sampleProofMotion(length:number,frame:number,fps:number,requestedSpeed:number){
 if(![length,frame,fps,requestedSpeed].every(Number.isFinite)||fps<=0||requestedSpeed<=0)throw Error('Finite inputs, positive fps and speed required');
 if(length<12)throw Error('Driving proof needs at least 12 metres of road');
 const start=Math.max(3,Math.min(78,length-8*requestedSpeed-3)),speed=Math.min(requestedSpeed,(length-3-start)/8),t=Math.max(0,Math.min(8,frame/fps));
 return {distance:start+t*speed,speed};
}
