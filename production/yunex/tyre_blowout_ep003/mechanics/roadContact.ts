import {EP003_SCENE} from '../shared/contract.ts';
import type {TyreFrame} from '../shared/contract.ts';

export type RubberSurfaceKind='tyre'|'groove'|'bead';
export type RubberVertex=readonly [number,number,number];
const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
/**
 * Stateless deformation of one existing wheel-local mesh vertex.
 * phaseRad is wheel-roll Z. Ground contact is calculated after virtual rotation
 * so the flattened contact footprint stays beneath the hub as rubber rotates.
 */
export function sampleRubberVertex(
  rest:RubberVertex,frame:TyreFrame,kind:RubberSurfaceKind
):RubberVertex {
  const [x,y,z]=rest,r=Math.hypot(x,y);
  if(r<1e-8)return rest;
  const c=clamp(frame.sidewallCompression,0,1);
  const worldSin=Math.sin(Math.atan2(y,x)+frame.angularPhaseRad);
  const tread=kind==='groove'?1:kind==='bead'?.50:clamp((r-.265)/.09,0,1);
  let newR=r-.023*c*tread;
  // Ground y = loaded hub height + rotated vertex y.
  // Every radial patch that would pierce the road is clipped to y >= 0.
  // No "dent" is attached to a particular painted tyre segment.
  if(c>0&&worldSin<-.06) {
    newR=Math.min(newR,frame.effectiveRadiusM/(-worldSin));
  }
  // Optional restrained shoulder scuff: a few millimetres of irregular loss,
// attached to the physical rubber material, not to an exploding wheel.
  if(kind==='tyre'&&frame.treadSeparation>0){
    const shoulder=clamp((r-.312)/.035,0,1);
    const tooth=Math.pow(Math.sin(Math.atan2(y,x)*9),2);
    newR-=Math.min(.004, .004*frame.treadSeparation*shoulder*tooth);
  }
  const ratio=newR/r;
  const sidewall=kind==='tyre'?clamp((.345-r)/.074,0,1):0;
  const bulge=.021*c*sidewall*Math.pow(Math.max(0,-worldSin),5);
  // Small circumferential sidewall creases travel WITH the tyre material while
  // contact compression itself remains road-fixed. Axial-only displacement
  // prevents wrinkles from poking below the road or folding across the rim.
  const angle=Math.atan2(y,x);
  const wrinkle=.0030*c*sidewall*Math.sin(12*angle+z*18)
    *(.18+.82*Math.pow(Math.max(0,-worldSin),2));
  return [x*ratio,y*ratio,z+Math.sign(z)*(bulge+wrinkle)];
}
export const toRoadHeight=(v:RubberVertex,phase:number,hubHeightM:number)=>
  hubHeightM + v[0]*Math.sin(phase)+v[1]*Math.cos(phase);
export const referenceRimRoadClearanceM=(f:TyreFrame)=>
  f.effectiveRadiusM-(EP003_SCENE.wheelRadiusM*.71+.022);
