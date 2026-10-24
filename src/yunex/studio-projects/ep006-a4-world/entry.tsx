import React,{useEffect,useMemo} from 'react';
import {Composition,registerRoot,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {createCinematicVehicle,animateCinematicVehicle} from '../../modelling-kit/rig';
import {CinematicLighting} from '../../modelling-kit/Lighting';
import {CameraAim} from '../../world-kit/components';
import {disposeObject} from '../../world-kit/geometry';
import {createEp006Stage,heightAt} from '../../ep006/environment/stage';

/**
 * EP006 Agent 4 standalone 6-second moving 1080x1920 proof, no narration.
 * A deterministic stand-in launch only; replace with Agent 2's final motion
 * before integration/sign-off. The surface API is the production interface.
 */
const FPS=30,FRAMES=180;
function previewPose(frame:number){
  const t=frame/FPS,launch=.70,velocity=33,elapsed=t-launch,x=velocity*t-velocity*launch;
  const ground=heightAt(x,0),departure=heightAt(0,0);
  if(t<launch)return {x,y:ground,air:false,contact:true,impact:0};
  const flight=departure+4.7*elapsed-4.905*elapsed*elapsed;
  if(flight>ground)return {x,y:flight,air:true,contact:false,impact:0};
  const bounce=Math.max(0,.095*Math.sin(13*Math.max(0,elapsed-1.48))*Math.exp(-3*Math.max(0,elapsed-1.48)));
  return {x,y:ground+bounce,air:false,contact:true,impact:Math.exp(-5*Math.max(0,elapsed-1.48))};
}
const RallyStageProof:React.FC=()=>{
  const f=useCurrentFrame(),{width,height}=useVideoConfig(),t=f/FPS;
  const stage=useMemo(()=>createEp006Stage({seed:290,sceneryDensity:.75}),[]);
  const car=useMemo(()=>createCinematicVehicle({
    variant:'rally-hatch',bodyDetail:'studio',quality:'hero',driver:true,color:'#d5a13c'
  }),[]);
  useEffect(()=>()=>{disposeObject(stage);disposeObject(car);},[stage,car]);
  const pose=previewPose(f);
  // Four independently sampled wheel contact points: the render has NO second road function.
  const wheelY=(axleX:number,sideZ:number)=>pose.air?-.08:heightAt(pose.x+axleX,sideZ)-heightAt(pose.x,0);
  animateCinematicVehicle(car,{frame:f,fps:FPS,distance:pose.x+25,speed:33,curvature:0,
    compression:Math.max(0,Math.min(.075,pose.impact*.075)),roughness:0,
    roadFrontLeft:wheelY(1.31,.82),roadFrontRight:wheelY(1.31,-.82),
    roadRearLeft:wheelY(-1.31,.82),roadRearRight:wheelY(-1.31,-.82)});
  car.position.set(pose.x,pose.y,0);
  car.rotation.set(0,0,pose.air?-.055:0);
  // Motion, pan and hero scale are real frame-by-frame Three.js updates.
  const cam=t<2.5?
    {position:[pose.x-10.8,pose.y+3.15,-8.2] as [number,number,number],
      target:[pose.x+.8,pose.y+.95,0] as [number,number,number],fov:46}:
    t<4.3?
    {position:[pose.x+8.5,pose.y+2.2,10.2] as [number,number,number],
      target:[pose.x,pose.y+.75,0] as [number,number,number],fov:42}:
    {position:[pose.x-13,pose.y+7.0,-12.5] as [number,number,number],
      target:[pose.x+2,pose.y+.85,0] as [number,number,number],fov:44};
  return <ThreeCanvas width={width} height={height} shadows camera={{fov:46,near:.1,far:1800}}>
    <color attach="background" args={['#a9c7d3']}/>
    <fog attach="fog" args={['#b3c5c5',130,390]}/>
    <CinematicLighting focus={[pose.x,pose.y,0]} timeOfDay="day"/>
    <primitive object={stage}/>
    <primitive object={car}/>
    <CameraAim {...cam}/>
  </ThreeCanvas>;
};
const Root=()=> <Composition id="Ep006A4World" component={RallyStageProof}
  width={1080} height={1920} fps={FPS} durationInFrames={FRAMES}/>;
registerRoot(Root);
