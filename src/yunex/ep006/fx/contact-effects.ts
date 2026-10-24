/**
 * EP006 contact-driven particulate FX; coordinates stay world-space.
 * Every mote is born at one of the four actual tyre-ground contact points.
 * The returned geometry is an optional stylised effect, not a real CFD model.
 */
import {EP006_FPS,EP006_JUMPS,EP006_CORNERS,ep006SurfaceHeightM,sampleEp006Motion} from '../dynamics/motion.ts';
export type Ep006Dust = {id:string;positionM:[number,number,number];radiusM:number;opacity:number;stretchX:number;rotationY:number};
export type Ep006Gravel = {id:string;positionM:[number,number,number];radiusM:number;rotationRad:[number,number,number]};
export type Ep006Effects = {dust:Ep006Dust[];gravel:Ep006Gravel[]};
const hash=(v:number)=>{const q=Math.sin(v*127.13+35.85)*43758.5453;return q-Math.floor(q);};
const clamp=(x:number,a:number,b:number)=>Math.min(b,Math.max(a,x));
/** Particle emission is tied to touchdown only. No impossible airborne tyre wakes. */
export function sampleEp006Effects(frame:number):Ep006Effects {
 const dust:Ep006Dust[]=[],gravel:Ep006Gravel[]=[];
 if(!Number.isInteger(frame)||frame<0)throw Error('Expected integer absolute frame');
 for(let ji=0;ji<EP006_JUMPS.length;ji++){
  const jump=EP006_JUMPS[ji];
  const eventAge=(frame-jump.landingFrame)/EP006_FPS;
  if(eventAge<0||eventAge>2.3)continue;
  for(let k=0;k<104;k++){
   const cornerIndex=k%4,seed=k+ji*317;
   const birthOffset=Math.floor(hash(seed+11)*10);
   const birth=jump.landingFrame+birthOffset,age=(frame-birth)/EP006_FPS;
   if(age<0)continue;
   const point=sampleEp006Motion(birth).wheels[EP006_CORNERS[cornerIndex]].contactPointM;
   const a=hash(seed+2)*Math.PI*2;
   const lateral=(hash(seed+4)-.5)*(1.4+age*.4);
   const backward=2.0+hash(seed+8)*5.5;
   const x=point[0]-backward*age-.10*age*age,z=point[2]+lateral+Math.sin(a)*age*.85;
   const ground=ep006SurfaceHeightM(x,z);
   const radius=(.18+hash(seed+6)*.25)*(1+age*1.85);
   const opacity=(.08+hash(seed+13)*.18)*Math.pow(Math.max(0,1-age/2.3),1.25);
   if(age<2.3&&opacity>.006)dust.push({
    id:`${jump.id}-dust-${k}`,
    positionM:[x,ground+.08+age*(.25+hash(seed+12)*.36),z],
    radiusM:radius,opacity,
    stretchX:1.6+hash(seed+14)*2,rotationY:a,
   });
  }
  for(let k=0;k<180;k++){
   const cornerIndex=k%4,seed=k+ji*1131;
   const birthOffset=Math.floor(hash(seed+71)*10),birth=jump.landingFrame+birthOffset;
   const age=(frame-birth)/EP006_FPS;
   if(age<0||age>.9)continue;
   const point=sampleEp006Motion(birth).wheels[EP006_CORNERS[cornerIndex]].contactPointM;
   const dir=hash(seed+1)*Math.PI*2,backward=4.5+hash(seed+2)*8;
   const vz=Math.sin(dir)*(1+hash(seed+3)*3.5);
   const up=1.8+hash(seed+4)*4.5;
   const x=point[0]-backward*age,z=point[2]+vz*age;
   const y=point[1]+.018+up*age-4.905*age*age;
   if(y<ep006SurfaceHeightM(x,z)+.01)continue;
   const radius=.012+hash(seed+8)*.026;
   gravel.push({id:`${jump.id}-gravel-${k}`,positionM:[x,y,z],
    radiusM:radius,rotationRad:[age*9,age*13,age*11]});
  }
 }
 return {dust,gravel};
}
/** Local tyre wake for driving shots; no tyre-ground drag is emitted mid-air. */
export function sampleEp006TyreWake(frame:number){
 const pose=sampleEp006Motion(frame);
 if(!EP006_CORNERS.some(c=>pose.wheels[c].contact))return [];
 return EP006_CORNERS.filter(c=>pose.wheels[c].contact).map((corner,i)=>{
  const p=pose.wheels[corner].contactPointM;
  return {corner,positionM:[p[0]-1,p[1]+.025,p[2]] as [number,number,number],
   intensity01:clamp(pose.gravel01*.7+.12*Math.min(1,pose.velocityMps[0]/25),0,1),
   seed:i+frame*23};
 });
}
