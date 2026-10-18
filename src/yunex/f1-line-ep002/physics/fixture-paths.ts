import {routeLength,sampleRoute} from '../../world-kit/environments.ts';
import type {RaceCarId,RacePath,RacePose,V3} from '../contract.ts';

/**
 * Temporary deterministic legal on-asphalt geometry, used ONLY until A1 supplies
 * its authoritative RacePath. The simulation accepts A1 paths with no adaptation.
 * Corner: the rightmost bend around the existing [65,0,18] circuit control point.
 * Real circuit centerline is used, not an invented standalone road.
 */
const LENGTH=routeLength('track');
const START_BEFORE_ANCHOR_M=55;
const END_AFTER_ANCHOR_M=75;
const EXIT_AFTER_ANCHOR_M=64;
const SOURCE_STEP=.22;
const clamp=(x:number,a:number,b:number)=>Math.min(b,Math.max(a,x));
const smooth=(x:number)=>{const t=clamp(x,0,1);return t*t*t*(t*(6*t-15)+10);};
const wrapAngle=(x:number)=>Math.atan2(Math.sin(x),Math.cos(x));
const knots=[0,.2,.4,.57,.75,1];
const values=[0,3,3,1.2,3,0];
function racingOffset(u:number){
  const x=clamp(u,0,1);
  let i=0;while(i<knots.length-2&&knots[i+1]<x)i++;
  const x0=knots[i],x1=knots[i+1],span=x1-x0,t=(x-x0)/span;
  const slope=(j:number)=>j===0||j===knots.length-1?0:
    (values[j+1]-values[j-1])/(knots[j+1]-knots[j-1]);
  const a=values[i],b=values[i+1],m0=slope(i)*span,m1=slope(i+1)*span;
  const y=(2*t*t*t-3*t*t+1)*a+(t*t*t-2*t*t+t)*m0+
    (-2*t*t*t+3*t*t)*b+(t*t*t-t*t)*m1;
  return clamp(y,-4,4);
}
function shortcutOffset(u:number){
  return -4*smooth(u/.24)*smooth((1-u)/.24);
}
const angleOf=(a:V3,b:V3)=>Math.atan2(-(b[2]-a[2]),b[0]-a[0]);
const anchor=(()=>{
  let d=0,best=Infinity;
  for(let i=0;i<=3000;i++){
    const s=LENGTH*i/3000,p=sampleRoute('track',s).position;
    const err=(p[0]-65)**2+(p[2]-18)**2;
    if(err<best){best=err;d=s;}
  }
  if(best>1)throw new Error('World-kit track anchor [65,0,18] is unavailable');
  return d;
})();
function lateralNormal(sourceM:number):[number,number]{
  const before=sampleRoute('track',sourceM-.12).position,after=sampleRoute('track',sourceM+.12).position;
  const dx=after[0]-before[0],dz=after[2]-before[2],length=Math.hypot(dx,dz);
  return [-dz/length,dx/length];
}
type Node={sourceM:number;distanceM:number;position:V3};
function create(id:RaceCarId):RacePath{
  const offset=id==='shortcut'?shortcutOffset:racingOffset;
  const from=anchor-START_BEFORE_ANCHOR_M,to=anchor+END_AFTER_ANCHOR_M;
  const count=Math.ceil((to-from)/SOURCE_STEP),nodes:Node[]=[];
  for(let i=0;i<=count;i++){
    const sourceM=from+(to-from)*i/count;
    const base=sampleRoute('track',sourceM).position;
    const normal=lateralNormal(sourceM);
    const u=clamp((sourceM-from)/(EXIT_AFTER_ANCHOR_M+START_BEFORE_ANCHOR_M),0,1);
    const lateral=offset(u);
    // Formula car is 1.98m wide. Max 4.0m centre displacement stays inside
    // the 12m asphalt: 4.0 + 0.99 < 6.0m half-width.
    const position:V3=[base[0]+normal[0]*lateral,base[1],base[2]+normal[1]*lateral];
    const prior=nodes.at(-1),distanceM=prior?
      prior.distanceM+Math.hypot(position[0]-prior.position[0],position[2]-prior.position[2]):0;
    nodes.push({sourceM,distanceM,position});
  }
  const lengthM=nodes.at(-1)!.distanceM;
  const positionAt=(s:number):V3=>{
    const d=clamp(s,0,lengthM);
    let lo=0,hi=nodes.length-1;
    while(lo+1<hi){const mid=(lo+hi)>>1;if(nodes[mid].distanceM<=d)lo=mid;else hi=mid;}
    const a=nodes[lo],b=nodes[hi],t=(d-a.distanceM)/Math.max(1e-10,b.distanceM-a.distanceM);
    return [a.position[0]+(b.position[0]-a.position[0])*t,0,
      a.position[2]+(b.position[2]-a.position[2])*t];
  };
  const sourceToDistance=(sourceM:number)=>{
    let lo=0,hi=nodes.length-1;
    while(lo+1<hi){const m=(lo+hi)>>1;if(nodes[m].sourceM<=sourceM)lo=m;else hi=m;}
    const a=nodes[lo],b=nodes[hi],t=clamp((sourceM-a.sourceM)/(b.sourceM-a.sourceM),0,1);
    return a.distanceM+(b.distanceM-a.distanceM)*t;
  };
  const sampleAtDistance=(s:number):RacePose=>{
    if(!Number.isFinite(s))throw new Error('Non-finite arc distance');
    const d=clamp(s,0,lengthM);
    const p=positionAt(d);
    const h=.65,before=positionAt(Math.max(0,d-h)),after=positionAt(Math.min(lengthM,d+h));
    const yaw=angleOf(before,after);
    // Signed osculating-circle curvature; wide triangle window suppresses
    // spline sample jitter without hiding real geometry.
    const kh=1.45,P=positionAt(Math.max(0,d-kh)),Q=positionAt(Math.min(lengthM,d+kh));
    const x1=p[0]-P[0],z1=p[2]-P[2],x2=Q[0]-p[0],z2=Q[2]-p[2];
    const l1=Math.hypot(x1,z1),l2=Math.hypot(x2,z2),l3=Math.hypot(Q[0]-P[0],Q[2]-P[2]);
    const curvatureInvM=l1*l2*l3<1e-8?0:2*(x1*z2-z1*x2)/(l1*l2*l3);
    return {position:p,yaw:wrapAngle(yaw),curvatureInvM};
  };
  return {
    id,lengthM,entryDistanceM:0,
    apexDistanceM:sourceToDistance(anchor),
    exitDistanceM:sourceToDistance(anchor+EXIT_AFTER_ANCHOR_M),
    sampleAtDistance,
  };
}
export const fixtureRacePaths:Record<RaceCarId,RacePath>={
  shortcut:create('shortcut'),racing:create('racing'),
};
export const FIXTURE_SCENARIO=Object.freeze({
  anchorM:anchor,centerlineStartM:anchor-START_BEFORE_ANCHOR_M,
  finishCenterlineM:anchor+END_AFTER_ANCHOR_M,
  description:'Fixture: 12m-wide existing circuit, tighter -4m inner line versus wide 3m entry, late apex 1.2m left of the centerline, 3m exit.',
  minCarEdgeMarginM:6-(4+.99),
});
