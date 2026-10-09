/**
 * Polish05 spatially coherent crossfade.  Both views contain the actual same
 * B-driven rotor and physical A pads, never an empty mask / synthetic proxy.
 * Source frames and 750-frame duration are unchanged.
 */
export const PAD_ENTRY_START=96, PAD_ENTRY_END=104;
export const PAD_EXIT_START=143, PAD_EXIT_END=151;
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const smooth=(x:number)=>{const t=clamp(x);return t*t*(3-2*t);};
export const padBlendAt=(frame:number):number=>{
  if(frame<PAD_ENTRY_START||frame>PAD_EXIT_END)return 0;
  if(frame<=PAD_ENTRY_END)return smooth((frame-PAD_ENTRY_START)/(PAD_ENTRY_END-PAD_ENTRY_START));
  if(frame<PAD_EXIT_START)return 1;
  return 1-smooth((frame-PAD_EXIT_START)/(PAD_EXIT_END-PAD_EXIT_START));
};
export const isPadBlendActive=(frame:number)=>padBlendAt(frame)>0;
