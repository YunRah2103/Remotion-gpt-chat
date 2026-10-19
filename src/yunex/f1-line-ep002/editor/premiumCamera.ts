import type {RaceCameraPose,RaceFrameState,RaceCarId,V3} from '../contract.ts';
import {add,localOffset,magnitude,mix,subtract} from '../cinema/math.ts';
import {getRaceCamera} from '../cinema/cameras.ts';
import type {EditSegment} from './timeline.ts';

/**
 * Film-specific second-camera direction. It NEVER modifies physics, the camera
 * kit used in other YUNEX episodes, or any Formula car position.
 *
 * Each shot is keyed by the editable picture frame. No frame history, spring
 * physics, RNG, or cumulative interpolations: out-of-order Remotion seeks
 * render the same image as sequential playback.
 */
export type FilmCameraEdit=EditSegment & {localFrame:number;sourceFrame:number};
const ease=(t:number)=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);};
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
const normalize=(a:V3):V3=>{
 const l=magnitude(a);
 if(l<1e-8)throw new Error('Degenerate cinematic view direction');
 return [a[0]/l,a[1]/l,a[2]/l];
};
const dot=(a:V3,b:V3)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a:V3,b:V3):V3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const plus=(a:V3,b:V3):V3=>add(a,b);

/** Ensure we never crop wing or tyre on focal Formula car(s), in 9:16. */
function portraitProtect(pose:RaceCameraPose,state:RaceFrameState,carIds:readonly RaceCarId[]):RaceCameraPose{
 const axis=subtract(pose.position,pose.target);
 const direction=normalize(subtract(pose.target,pose.position));
 const right=normalize(cross(direction,[0,1,0]));
 const up=normalize(cross(right,direction));
 const tanY=Math.tan(pose.fov*Math.PI/360);
 const tanX=tanY*9/16;
 const worldCorners:V3[]=[];
 for(const id of carIds){
  const c=state.cars[id],o=c.worldPose.position,yaw=c.worldPose.yaw;
  const cos=Math.cos(yaw),sin=Math.sin(yaw);
  for(const f of [-2.9,2.9])for(const side of [-1.18,1.18])for(const height of [.13,1.45]){
   worldCorners.push([o[0]+f*cos+side*sin,o[1]+height,o[2]-f*sin+side*cos]);
  }
 }
 const safe=(factor:number)=>{
  const from=plus(pose.target,[axis[0]*factor,axis[1]*factor,axis[2]*factor]);
  return worldCorners.every(c=>{
   const ray=subtract(c,from),z=dot(ray,direction);
   return z>1.2 && Math.abs(dot(ray,right))<.80*z*tanX &&
                    Math.abs(dot(ray,up))<.79*z*tanY;
  });
 };
 if(safe(1))return pose;
 let lo=1,hi=1;
 for(let j=0;j<30&&!safe(hi);j++){lo=hi;hi*=1.13;}
 if(!safe(hi))throw new Error('Unable to frame racing cars in 9:16');
 for(let j=0;j<25;j++){
  const m=(lo+hi)/2;
  if(safe(m))hi=m;else lo=m;
 }
 return {...pose,position:plus(pose.target,[axis[0]*hi,axis[1]*hi,axis[2]*hi])};
}

/**
 * Per-shot lens, tracking, and crane movement.
 * Motion remains slow and purposeful; hard cuts only at Agent 6's existing
 * edit boundaries, which preserves the audio cue sheet and frame timing.
 */
export function getPremiumEditorialCamera(
 edit:FilmCameraEdit,state:RaceFrameState,filmFrame:number
):RaceCameraPose{
 if(!Number.isInteger(filmFrame)||filmFrame<0||filmFrame>=696)
  throw new Error('Premium picture must use valid 23.2 second edit frame');
 const initial=getRaceCamera(edit.shot,state,edit.sourceFrame);
 const duration=Math.max(1,edit.end-edit.start-1);
 const u=ease(edit.localFrame/duration);
 const radians=state.cars.racing.worldPose.yaw;
 let delta:V3=[0,0,0];
 let lens=0;
 // Camera offsets are in WORLD units relative to the racing direction.
 switch(edit.shot){
 case 'opening':
  // Dramatic low three-quarter oncoming push across the opening line.
  delta=[lerp(.8,-.8,u),-.43,lerp(-1.05,1.10,u)];
  lens=lerp(-1.2,1.8,u);
  break;
 case 'shortcut':
  // A lower tracking dolly alongside the teal car, not a fixed dashboard.
  delta=[lerp(1.1,-.8,u),-.60,lerp(-1.35,.60,u)];
  lens=lerp(-1.5,.9,u);
  break;
 case 'apex':
  // Hold the tyre and real inside kerb long enough to understand the apex.
  delta=[lerp(.75,-.85,u),-.38,lerp(-.7,.7,u)];
  lens=lerp(-2.0,-.4,u);
  break;
 case 'wide-entry':
  // Amber approach changes parallax smoothly; no sudden lateral whip.
  delta=[lerp(-.65,.85,u),-.38,lerp(-.80,.45,u)];
  lens=lerp(-1.3,.7,u);
  break;
 case 'overhead':
  // Controlled crane reveal: both road ribbons stay anchored on the track.
  delta=[lerp(-2.2,2.2,u),lerp(1.8,-1.3,u),lerp(1.0,-1.0,u)];
  lens=lerp(1.3,-.9,u);
  break;
 case 'onboard':
  // The physics state's actual steering already supplies the head turn.
  delta=[0,.04,lerp(-.11,.11,u)];
  lens=-1.5;
  break;
 case 'force':
  // Relaxed graph-friendly camera during voice explanation.
  delta=[lerp(-.35,.45,u),lerp(.8,-.45,u),lerp(-.55,.55,u)];
  lens=.8;
  break;
 case 'duel':
  // A steady lowering tracking crane (separated cars only; no fake pass).
  delta=[lerp(.35,-.65,u),lerp(-1.5,-2.5,u),lerp(-.7,1.1,u)];
  lens=lerp(.2,-.8,u);
  break;
 case 'exit':
  // Low rear chase camera pushes into the exit without moving the race cars.
  delta=[lerp(-1.1,1.6,u),lerp(-.6,-.95,u),lerp(.8,-.7,u)];
  lens=lerp(-1.0,-3.0,u);
  break;
 case 'final':
  // Grandstand-style reveal: rising, widening, brief payoff title hold.
  delta=[lerp(.2,-2.5,u),lerp(-.8,2.4,u),lerp(.9,2.7,u)];
  lens=lerp(-1.2,1.9,u);
  break;
 }
 // The camera moves in vehicle-relative coordinates and naturally follows
 // each independently sampled A2 replay without discontinuous world jumps.
 const yaw=(edit.shot==='shortcut')?state.cars.shortcut.worldPose.yaw:radians;
 const translation=localOffset([0,0,0],yaw,...delta);
 const move=({position,target,fov}:RaceCameraPose):RaceCameraPose=>({
  position:plus(position,translation),target:plus(target,translation),
  fov:Math.max(28,Math.min(70,fov+lens)),
 });
 let candidate=move(initial);
 const both=edit.shot==='opening'||edit.shot==='duel'||
             edit.shot==='overhead'||edit.shot==='force'||
             edit.shot==='apex'||edit.shot==='final';
 const ids:readonly RaceCarId[]=both?['shortcut','racing']:
  [edit.shot==='shortcut'?'shortcut':'racing'];
 candidate=portraitProtect(candidate,state,ids);
 for(const n of [...candidate.position,...candidate.target,candidate.fov]){
  if(!Number.isFinite(n))throw new Error('Nonfinite film camera state');
 }
 return candidate;
}
