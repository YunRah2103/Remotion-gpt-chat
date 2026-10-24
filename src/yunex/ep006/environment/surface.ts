/**
 * YUNEX EP006 - canonical collision surface for Agent 2 and the visual mesh.
 * World: metres; +X forward, +Y up, +Z left. No time/PRNG state.
 * Agent 2 MUST sample this function for all four contact points.
 */
export const EP006_STAGE_LIMITS = {minX:-100,maxX:790,minZ:-110,maxZ:110,halfRoadWidthM:4.25} as const;
export const EP006_JUMP_LANDMARKS = {
  J1:{approachX:-36,crestX:0,departureX:3,landingZoneX:[42,63] as const},
  J2:{approachX:574,crestX:610,departureX:613,landingZoneX:[652,673] as const},
} as const;
const clamp01=(x:number)=>Math.max(0,Math.min(1,x));
const smooth=(a:number,b:number,x:number)=>{const t=clamp01((x-a)/(b-a));return t*t*(3-2*t);};
const lift=(x:number,crest:number)=>{
  // Long run-up to a convex takeoff lip followed by a downhill landing apron.
  // Geometry stays C1-continuous at all boundaries; no artificial cliff.
  return 3.65*smooth(crest-38,crest+2,x)-3.75*smooth(crest+4,crest+32,x);
};
const roadEdge=(x:number)=>EP006_STAGE_LIMITS.halfRoadWidthM+.16*Math.sin(x*.057)+.09*Math.sin(x*.159);
const roadBase=(x:number)=>.26*Math.sin(x*.025)+.16*Math.sin(x*.066)+lift(x,0)+lift(x,610);
function roadBed(x:number,z:number){
  const crown=.055*(1-Math.min(1,Math.abs(z)/5)**2);
  const rut=-.034*Math.exp(-(((Math.abs(z)-1.18)/.29)**2));
  const aggregate=.016*Math.sin(x*1.91+z*3.37)*Math.sin(x*3.26-z*2.41)
    +.012*Math.sin(x*.68+z*1.34);
  return roadBase(x)+crown+rut+aggregate;
}
/** The terrain/road/tyre surface has no separate collision meshes or magic offsets. */
export function heightAt(x:number,z:number):number{
  if(!Number.isFinite(x)||!Number.isFinite(z))throw Error('EP006 ground query must be finite metres');
  const d=Math.abs(z),edge=roadEdge(x);
  const blend=smooth(edge,edge+15,d);
  const rolling=.43*Math.sin(x*.038+z*.024)+.38*Math.sin(z*.056-x*.015)
    +.20*Math.cos(z*.113+x*.046);
  // Distant rolling forest banks preserve the unchanged driving corridor.
  const ridge=Math.pow(Math.max(0,d-edge-14)/19,1.13)
    *(1.30+.38*Math.sin(x*.028+z*.031));
  const hillside=(3.10+rolling*1.4+1.10*Math.sin(x*.044+z*.017))*blend+ridge;
  const bank=.13*smooth(edge,edge+3,d)*Math.sin(x*.12+z*.17);
  return roadBed(x,z)+hillside+bank;
}
export function sampleEp006Ground(x:number,z:number){
  const y=heightAt(x,z),epsilon=.035;
  const dx=(heightAt(x+epsilon,z)-heightAt(x-epsilon,z))/(2*epsilon);
  const dz=(heightAt(x,z+epsilon)-heightAt(x,z-epsilon))/(2*epsilon);
  const inv=1/Math.hypot(dx,1,dz);
  const road=Math.abs(z)<=roadEdge(x);
  return {
    heightM:y,
    normal:[-dx*inv,inv,-dz*inv] as [number,number,number],
    isRoad:road,
    surface:road?'gravel' as const:'verge' as const,
    distanceFromCentreM:Math.abs(z),
  };
}
export const ep006SurfaceNormal=(x:number,z:number)=>sampleEp006Ground(x,z).normal;
export const ep006RoadHalfWidth=roadEdge;
