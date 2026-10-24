/**
 * Select real absolute samples without introducing a second vehicle simulator.
 * The only timewarp is the visibly mechanical J1 slow-motion underbody replay.
 * [0,125) J1; [125,190) J1 replay; [190,218) acceleration; [218,350) J2.
 */
export const EP006_INTEGRATED_PROOF_FRAMES=350;
export type Ep006ReviewFrame={source:number;camera:number;replay:boolean};
export function integratedFrameAt(local:number):Ep006ReviewFrame{
  if(!Number.isInteger(local)||local<0||local>=EP006_INTEGRATED_PROOF_FRAMES)
    throw Error('EP006 local proof frame outside [0,350)');
  if(local<125)return {source:local,camera:local,replay:false};
  if(local<190)return {source:72+Math.floor((local-125)/4),camera:192+local-125,replay:true};
  if(local<218)return {source:610+local-190,camera:610+local-190,replay:false};
  return {source:678+local-218,camera:678+local-218,replay:false};
}
