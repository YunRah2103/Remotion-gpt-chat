/**
 * Original, metres-based illustrative off-road suspension kinematics.
 * Each tyre centre is positioned from the same 3D heightfield used for the terrain.
 * Chassis roll/pitch are low-gain, temporally filtered reactions, not sine bounces.
 * A kinematic/contact approximation, not a tyre-force or multibody solver.
 */
export const FPS=30;
export const FRAMES=600;
export const SPEED=2.15; // metres per second, forward is -Z
export const RADIUS=.49;
export const HALF_TRACK=1.19;
export const HALF_WHEELBASE=1.72;
export const RIDE_HEIGHT=1.16;
export type Corner='FL'|'FR'|'RL'|'RR';
export const corners:Corner[]=['FL','FR','RL','RR'];
export const clamp=(v:number,min:number,max:number)=>Math.min(max,Math.max(min,v));
export const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
export const gauss=(u:number,s:number)=>Math.exp(-.5*(u/s)**2);
export function heightAt(x:number,z:number):number {
 const noise=.065*Math.sin(z*.68+x*.73)+.043*Math.sin(z*1.39-x*1.31)+.024*Math.sin(2.54*z+2.2*x);
 const banking=.028*x+.003*z;
 const boulders=
  .68*gauss(z+14.0,1.12)*gauss(x-1.19,.53)+
  .54*gauss(z+22.0,1.30)*gauss(x+1.19,.60)+
  .43*gauss(z+31.0,1.1)*gauss(x-1.19,.55)+
  .30*gauss(z+4.2,1.0)*gauss(x+1.19,.60);
 const ruts=
  -.48*gauss(z+14.4,2.1)*gauss(x+1.19,.53)-
  .39*gauss(z+21.7,2.0)*gauss(x-1.19,.57)-
  .22*gauss(z+30.3,2.4)*gauss(x+1.19,.62);
 return noise+banking+boulders+ruts;
}
export function zAt(frame:number){return 8-SPEED*frame/FPS;}
function wheelHeights(frame:number):Record<Corner,number>{
 const z=zAt(frame);
 return {FL:heightAt(-HALF_TRACK,z-HALF_WHEELBASE),
 FR:heightAt(HALF_TRACK,z-HALF_WHEELBASE),
 RL:heightAt(-HALF_TRACK,z+HALF_WHEELBASE),
 RR:heightAt(HALF_TRACK,z+HALF_WHEELBASE)};
}
export type VehiclePose={z:number;chassisY:number;pitch:number;roll:number;
 wheels:Record<Corner,{x:number;z:number;ground:number;centerY:number;localY:number;travel:number;spin:number}>};
export function poseAt(frame:number):VehiclePose {
 // Temporal five-tap terrain filtering: no integration state, deterministic random-access frames.
 const accumulator={FL:0,FR:0,RL:0,RR:0};
 for(const [offset,weight] of [[-6,1],[-3,2],[0,3],[3,2],[6,1]]){
  const values=wheelHeights(clamp(frame+offset,0,FRAMES-1));
  for(const c of corners)accumulator[c]+=values[c]*weight;
 }
 for(const c of corners)accumulator[c]/=9;
 const avg=(accumulator.FL+accumulator.FR+accumulator.RL+accumulator.RR)/4;
 const left=(accumulator.FL+accumulator.RL)/2;
 const right=(accumulator.FR+accumulator.RR)/2;
 const front=(accumulator.FL+accumulator.FR)/2;
 const rear=(accumulator.RL+accumulator.RR)/2;
 // Small fractions of terrain slope are allowed into the sprung body.
 const roll=clamp((right-left)/(2*HALF_TRACK)*.36,-.13,.13);
 const pitch=clamp((front-rear)/(2*HALF_WHEELBASE)*.50,-.12,.12);
 const chassisY=RIDE_HEIGHT+avg;
 const exact=wheelHeights(frame);
 const wheels={} as VehiclePose['wheels'];
 for(const c of corners){
  const x=c.endsWith('L')?-HALF_TRACK:HALF_TRACK;
  const z=c.startsWith('F')?-HALF_WHEELBASE:HALF_WHEELBASE;
  const ground=exact[c];
  const centerY=ground+RADIUS;
  // Inverse, first-order roll/pitch body transform gives wheel local vertical position.
  const localY=centerY-chassisY-x*roll+z*pitch;
  wheels[c]={x,z,ground,centerY,localY,travel:localY-(-.67),spin:SPEED*frame/FPS/RADIUS};
 }
 return {z:zAt(frame),chassisY,pitch,roll,wheels};
}
