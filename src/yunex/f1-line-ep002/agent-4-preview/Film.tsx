import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {CameraAim} from '../../world-kit/components';
import {routeLength,sampleRoute} from '../../world-kit/environments.ts';
import type {V3} from '../contract.ts';
import {RaceWorld,RaceCar,RaceLighting} from '../lookdev/RaceWorld';
import type {RaceWorldQuality} from '../lookdev/RaceWorld';
import {closestRouteDistance,offsetPose,previewCarPositions,lateralNormal} from '../lookdev/layout.ts';

const len=routeLength('track');
const anchor=closestRouteDistance(d=>sampleRoute('track',d),len);
type Camera={position:V3;target:V3;fov:number};
const plus=(a:V3,b:V3):V3=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const scale=(a:V3,n:number):V3=>[a[0]*n,a[1]*n,a[2]*n];
const follow=(p:V3,yaw:number,forwardM:number,sideM:number,heightM:number):V3=>{
 const direction:V3=[Math.cos(yaw),0,-Math.sin(yaw)],normal=lateralNormal(yaw);
 return plus(plus(p,scale(direction,forwardM)),plus(scale(normal,sideM),[0,heightM,0]));
};
function cameraFor(shot:number,a:{position:V3;yaw:number},b:{position:V3;yaw:number},frame:number):Camera{
 const sway=Math.sin(frame*.055)*.06;
 if(shot===0)return {
  position:follow(b.position,b.yaw,-20,12,11.4+sway),
  target:follow(b.position,b.yaw,5,0,.8),fov:46};
 if(shot===1)return {
  // Near-wheel kerb height; visible road contact and moving background.
  position:follow(b.position,b.yaw,1.7,-12.2,2.0+sway),
  target:follow(b.position,b.yaw,0,0,.49),fov:50};
 return {
  position:follow(a.position,a.yaw,-32,-7.0,9.0+sway),
  target:follow(a.position,a.yaw,-8,.1,.63),fov:46};
}
/** Matched moving camera/cars/route for baseline and premium, 3 angles in six seconds.
 * NOT authoritative race physics or a winner claim. Agent 1/2 replace staging in film.
 */
export const Agent4LookdevFilm:React.FC<{quality:RaceWorldQuality}>=({quality})=>{
 const f=useCurrentFrame(),{fps,width,height}=useVideoConfig(),t=f/fps;
 const positions=previewCarPositions(t,anchor);
 const baseA=sampleRoute('track',positions.shortcut.distanceM);
 const baseB=sampleRoute('track',positions.racing.distanceM);
 const poseA=offsetPose(baseA,positions.shortcut.offsetM);
 const poseB=offsetPose(baseB,positions.racing.offsetM);
 const shot=f<2*fps?0:f<4*fps?1:2,cam=cameraFor(shot,poseA,poseB,f);
 return <AbsoluteFill style={{background:'#647a86'}}>
  <ThreeCanvas width={width} height={height} shadows camera={{position:cam.position,fov:cam.fov,near:.12,far:450}}>
   <RaceLighting quality={quality} focus={[65,0,18]}/>
   <RaceWorld quality={quality}/>
   <CameraAim position={cam.position} target={cam.target} fov={cam.fov}/>
   <RaceCar id="shortcut" quality={quality} wheelTravelM={positions.shortcut.distanceM} pose={poseA}/>
   <RaceCar id="racing" quality={quality} wheelTravelM={positions.racing.distanceM} pose={poseB}/>
  </ThreeCanvas>
  <div style={{position:'absolute',top:Math.round(height*.052),left:Math.round(width*.065),
   color:'#eff5ed',fontFamily:'Arial,sans-serif',fontWeight:700,letterSpacing:2.0,
   fontSize:Math.max(11,width*.023),textShadow:'0 2px 12px #102029',opacity:.92}}>
   CIRCUIT / {quality==='premium'?'SUNSET LOOKDEV':'ORIGINAL WORLD KIT'}
  </div>
  <div style={{position:'absolute',bottom:Math.round(height*.055),left:Math.round(width*.065),
   color:'#f4f6ee',fontFamily:'Arial,sans-serif',fontSize:Math.max(10,width*.018),
   letterSpacing:1.4,textShadow:'0 1px 9px #0a1821'}}>
   {shot===0?'01  /  TWO-CAR TRACKING':shot===1?'02  /  TYRE + KERB':'03  /  EXIT REVEAL'}
  </div>
 </AbsoluteFill>;
};
