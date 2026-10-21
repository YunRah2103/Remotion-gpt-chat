import type {CinematicState} from './rig.ts';
export type AnimationPreset='tyre-failure'|'emergency-braking'|'collision-rewind'|'floor-sparks'|'engine-cutaway'|'suspension'|'driver-reaction';
const ramp=(a:number,b:number,t:number)=>{const x=Math.max(0,Math.min(1,(t-a)/(b-a)));return x*x*(3-2*x);};
/** Six-second reusable clips. State is absolute and may be sampled in any order. */
export function animationPreset(name:AnimationPreset,frame:number,fps:number):CinematicState{
 if(!Number.isFinite(frame)||!Number.isFinite(fps)||fps<=0)throw new Error('Finite frame and positive fps required');
 const t=Math.max(0,frame/fps),base={frame:Math.max(0,frame),fps,distance:t*8};
 switch(name){
  case 'tyre-failure':return {...base,tyreDamage:ramp(1.6,2.5,t),failureFrame:1.6*fps};
  case 'emergency-braking':{const braking=ramp(1,2,t)*(1-ramp(4.5,5.5,t));return {...base,distance:t<1?t*12:12+12*(1-Math.exp(-(t-1))),braking,compression:braking*.04,heat:braking*.8};}
  case 'collision-rewind':{const play=t<3?t:Math.max(0,6-t),impact=ramp(1.8,2.3,play);return {...base,frame:play*fps,distance:Math.min(play,2)*8,impact,bodyDamage:impact,braking:ramp(.8,1.6,play)};}
  case 'floor-sparks':return {...base,compression:.08*ramp(.8,1.3,t)*(1-ramp(4.8,5.3,t)),cutaway:.9*ramp(2.5,3,t)*(1-ramp(4,4.5,t))};
  case 'engine-cutaway':return {...base,cutaway:.96*ramp(.5,1.5,t),highlight:'engine',exploded:.2*ramp(3,4,t)};
  case 'suspension':return {...base,compression:.035*(1+Math.sin(t*Math.PI*2)),steer:Math.sin(t)*.12};
  case 'driver-reaction':return {...base,braking:ramp(1,2,t)*(1-ramp(4,5,t)),impact:ramp(2.6,3.1,t)*(1-ramp(3.5,4.5,t))};
  default:throw new Error(`Unknown animation preset: ${name}`);
 }
}
