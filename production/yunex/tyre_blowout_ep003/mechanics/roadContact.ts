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
  const ratio=newR/r;
  const sidewall=kind==='tyre'?clamp((.345-r)/.074,0,1):0;
  const bulge=.021*c*sidewall*Math.pow(Math.max(0,-worldSin),5);
  return [x*ratio,y*ratio,z+Math.sign(z)*bulge];
}
export const toRoadHeight=(v:RubberVertex,phase:number,hubHeightM:number)=>
  hubHeightM + v[0]*Math.sin(phase)+v[1]*Math.cos(phase);
export const referenceRimRoadClearanceM=(f:TyreFrame)=>
  f.effectiveRadiusM-(EP003_SCENE.wheelRadiusM*.71+.022);
