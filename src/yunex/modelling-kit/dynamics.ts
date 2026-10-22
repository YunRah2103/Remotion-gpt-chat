/** Absolute-sample visual dynamics. Quasi-static weight transfer, not a calibrated tyre solver. */
import type {VehicleSpec} from '../world-kit/catalog.ts';
const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
export type DynamicsInput={speed:number;distance:number;curvature:number;acceleration?:number;roughness?:number};
export function dynamicsProfile(s:VehicleSpec){
 if(s.family==='formula')return {rollPerG:.009,pitchPerG:.012,travel:.018};
 if(s.bodyStyle==='rally')return {rollPerG:.055,pitchPerG:.060,travel:.10};
 if(s.family==='sports')return {rollPerG:.026,pitchPerG:.035,travel:.045};
 if(s.family==='truck'||s.family==='van')return {rollPerG:.065,pitchPerG:.055,travel:.08};
 if(s.family==='suv')return {rollPerG:.072,pitchPerG:.070,travel:.085};
 return {rollPerG:.045,pitchPerG:.050,travel:.06};
}
/** A shared route-height field for all wheel samples. Zero input means a perfectly smooth road. */
export function roadHeight(distance:number,lateral:number,roughness=0){
 if(![distance,lateral,roughness].every(Number.isFinite)||roughness<0||roughness>1)throw Error('Invalid road-height input');
 return roughness*(.013*Math.sin(distance*1.7+lateral*.8)+.006*Math.sin(distance*3.9-lateral*1.4));
}
export function sampleDynamics(s:VehicleSpec,input:DynamicsInput){
 const {speed,distance,curvature,acceleration=0,roughness=0}=input;
 if(![speed,distance,curvature,acceleration,roughness].every(Number.isFinite)||speed<0||roughness<0||roughness>1)throw Error('Invalid dynamics input');
 const profile=dynamicsProfile(s),track=s.width*.83,k=clamp(curvature,-.25,.25);
 const lateralG=clamp(speed*speed*k/9.81,-1.5,1.5),longitudinalG=clamp(acceleration/9.81,-1,1);
 const roadHeights=[1,-1].flatMap(axle=>[1,-1].map(side=>roadHeight(distance+axle*s.wheelbase/2,side*track/2,roughness)));
 const heave=roadHeights.reduce((a,b)=>a+b,0)/4;
 const terrainPitch=Math.atan2((roadHeights[0]+roadHeights[1]-roadHeights[2]-roadHeights[3])/2,s.wheelbase);
 const terrainRoll=-Math.atan2((roadHeights[0]+roadHeights[2]-roadHeights[1]-roadHeights[3])/2,track);
 // Bound body rotation by wheel-to-body clearance, rather than allowing excessive visual lean.
 const pitch=clamp(longitudinalG*profile.pitchPerG+terrainPitch,-profile.travel/s.wheelbase,profile.travel/s.wheelbase);
 const roll=clamp(lateralG*profile.rollPerG+terrainRoll,-profile.travel/track,profile.travel/track);
 const steer=(side:number)=>clamp(Math.atan2(s.wheelbase*k,1+side*track*k/2),-.6,.6);
 return {pitch,roll,heave,steeringLeft:steer(1),steeringRight:steer(-1),roadHeights,lateralG,longitudinalG};
}
