import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {CameraAim,Vehicle} from '../world-kit/components';
import {CinematicVehicle} from './components';
import {CinematicLighting} from './Lighting';
import {CinematicStage} from './Stage';
import type {VehicleVariant} from '../world-kit/catalog.ts';
const smooth=(a:number,b:number,t:number)=>{const u=Math.max(0,Math.min(1,(t-a)/(b-a)));return u*u*(3-2*u);};
export const SystemsDemo:React.FC<{mechanical?:boolean;baseline?:boolean}>=({mechanical=false,baseline=false})=>{
 const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig(),t=frame/fps,portrait=height>width;
 const variant:VehicleVariant=mechanical?(t<2?'hot-hatch':t<4?'supercar':'formula-modern'):'hot-hatch';
 const brake=smooth(1,2,t)*(1-smooth(4,5,t)),impact=smooth(2.6,3.1,t)*(1-smooth(3.5,4.5,t));
 const position:[number,number,number]=mechanical?[portrait?7:4.7,portrait?3.7:2.8,portrait?8:4.9]:[1.7+Math.sin(t*.25)*.06,1.45,-2.8];
 const target:[number,number,number]=mechanical?[0,.50,0]:[.05,.80,-.35];
 const gearChange=smooth(.25,.55,t)*(1-smooth(.85,1.15,t));
 const title=mechanical?`${variant.toUpperCase()} / SHARED INTERNALS`:t<1.15?'GEAR CHANGE / CONSOLE REACH':t<2.6?'BRAKING / BELT RESTRAINT':t<4?'ILLUSTRATIVE IMPACT REACTION':'REWIND / RESTORED POSE';
 return <AbsoluteFill style={{background:'#15232d'}}>
 <ThreeCanvas width={width} height={height} shadows camera={{fov:portrait?44:38,near:.05,far:300}} gl={{antialias:true}}>
 <CinematicLighting/><CinematicStage distance={t*2} track={false} wetness={.2}/>
 <CameraAim position={position} target={target} fov={portrait?44:38}/>
 {baseline?<Vehicle variant={variant} cutaway glassOpacity={.10}/>:<CinematicVehicle options={{variant,driver:!mechanical,cutaway:true,color:'#276c89',glassOpacity:.08}} state={{frame,fps,distance:t*2,cutaway:mechanical?.92:.97,braking:brake,impact,gearChange,steer:Math.sin(t)*.04,compression:brake*.025}}/>}
 </ThreeCanvas>
 <div style={{position:'absolute',top:'6%',left:'6%',right:'6%',fontFamily:'Arial',color:'#d5f0f1',fontSize:width*(portrait?.032:.018),letterSpacing:2}}>YUNEX / KIT V2 DEVELOPMENT</div>
 <div style={{position:'absolute',bottom:'12%',left:'6%',right:'6%',fontFamily:'Arial',fontSize:width*(portrait?.032:.019),color:'#ffffff',fontWeight:700}}>{baseline?'RECOVERED BASELINE':title}</div>
 <div style={{position:'absolute',bottom:'7%',left:'6%',right:'6%',fontFamily:'Arial',fontSize:width*(portrait?.023:.012),color:'#acc5ce'}}>Illustrative kinematics · Not an injury simulation</div>
 </AbsoluteFill>;
};
