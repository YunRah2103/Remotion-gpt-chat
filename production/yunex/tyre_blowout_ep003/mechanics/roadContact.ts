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
  // Reuse the EXISTING lathe tyre's sidewall rings. The inner band next to the
  // .278m rim remains attached, while the middle carcass balloons at the loaded
  // lower shoulders. This reads at phone resolution without destroying tread.
  const smooth=(a:number,b:number,v:number)=>{const u=clamp((v-a)/(b-a),0,1);return u*u*(3-2*u);};
  const shoulder=kind==='tyre'
    ?smooth(.282,.316,r)*(1-smooth(.342,.359,r)):0;
  const groundArc=Math.pow(Math.max(0,-worldSin),3);
  // Controlled 40mm lower-shoulder displacement avoids an oversized bulge.
  // Still readable at phone resolution while keeping the original carcass.
  const bulge=.040*c*shoulder*groundArc;
  // Fine creases belong to rubber material (angle/z), not the ground-fixed
  // squashed patch, so they visibly flow past the stationary contact region.
  const angle=Math.atan2(y,x);
  const wrinkle=.004*c*shoulder*Math.sin(13*angle+z*19)
    *(.15+.85*groundArc);
  return [x*ratio,y*ratio,z+Math.sign(z)*(bulge+wrinkle)];
}
export const toRoadHeight=(v:RubberVertex,phase:number,hubHeightM:number)=>
  hubHeightM + v[0]*Math.sin(phase)+v[1]*Math.cos(phase);
export const referenceRimRoadClearanceM=(f:TyreFrame)=>
  f.effectiveRadiusM-(EP003_SCENE.wheelRadiusM*.71+.022);
