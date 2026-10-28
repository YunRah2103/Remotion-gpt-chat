/**
 * Temporary preview-only input for Agent 5 before Agent 2 is cherry-picked.
 * This is NOT authoritative EP006 dynamics. Never use it in the final edit.
 * Identical property names allow drop-in replacement with sampleEp006Motion.
 */
import type {Ep006Motion,MechanicalCorner} from './reveal.ts';
import {MECHANICAL_CORNERS} from './reveal.ts';
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
export function sampleMechanicalPreviewFixture(frame:number):Ep006Motion{
  if(!Number.isInteger(frame)||frame<0)throw Error('Invalid fixture frame');
  const t=frame/30,age=(frame-72)/30,airborne=frame<72;
  const wave=age<0?0:.115*Math.exp(-3.35*age)*Math.sin(12.2*age);
  const impact=age<0?0:Math.exp(-9*age);
  const compression=airborne?-.075:Math.max(-.065,Math.min(.12,wave));
  const x=(frame-62)*.058;
  const wheels={} as Ep006Motion['wheels'];
  for(const corner of MECHANICAL_CORNERS){
    const front=corner.startsWith('front'),left=corner.endsWith('left');
    const stagger=(front?1:.82)*(left?1:.93);
    const c=(compression<0?compression:compression*stagger);
    wheels[corner as MechanicalCorner]={compressionM:c,steerRad:front?.018:0,
      spinRad:-x/.36,contact:!airborne,surfaceHeightM:.02};
  }
  const flightHeight=airborne?.14*clamp((72-frame)/10):0;
  return {
    frame,timeSeconds:t,phase:airborne?'airborne':frame===72?'touchdown':age<.9?'rebound':'driving',
    jumpId:'J1',positionM:[x,flightHeight-Math.max(0,compression),0],
    rotationRad:[0,0,-.015*Math.exp(-Math.max(0,age)*2)],
    velocityMps:[1.74,0,0],wheels,impact01:clamp(impact),
    dust01:age<0?0:clamp(Math.exp(-age*1.2)*1.1),
    gravel01:age<0?0:clamp(Math.exp(-age*4)),event:frame===72?'J1_TOUCHDOWN':null,
  };
}
