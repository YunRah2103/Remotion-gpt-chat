/** EP006 Agent 1: original V4 rally car, silent six-beat suspension proof.
 * Deterministic fixture demonstrates articulation; NOT the Agent 2 jump trajectory.
 * npx remotion render src/yunex/studio-projects/ep006-a1-vehicle/entry.tsx Ep006Agent1VehicleProof out/ep006/agent-01/vehicle-proof.mp4 --gl=swangle --codec=h264 --pixel-format=yuv420p
 */
import React,{useMemo,useEffect} from 'react';
import {Composition,registerRoot,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {createEp006RallyVehicle,applyEp006RallyPose} from '../../ep006/vehicle/index.ts';
import {sampleEp006VehicleFixture} from '../../ep006/vehicle/fixture.ts';
import {CinematicLighting} from '../../modelling-kit/Lighting';
import {CameraAim} from '../../world-kit/components';
import {disposeObject} from '../../world-kit/geometry';

const Proof:React.FC=()=>{
  const frame=useCurrentFrame(),{width,height}=useVideoConfig();
  const car=useMemo(()=>createEp006RallyVehicle(),[]);
  useEffect(()=>()=>disposeObject(car),[car]);
  const pose=sampleEp006VehicleFixture(frame);
  applyEp006RallyPose(car,pose);
  const shot=Math.floor(frame/30),u=frame%30/29;
  // Each camera is deliberately different: launch/front, true side/droop,
  // profile/contact, low mechanic three-quarter, airborne underbody and rear exit.
  const positions=[
    [8.5,2.5,8.8],[.1,1.5,13.8],[1.8,1.15,13.1],
    [7.6,1.15,9.2],[3.4,.13,10.4],[-8.9,2.1,9.1],
  ];
  const p=positions[shot]??positions[5];
  const tracking=pose.positionM[0],subtle=(u-.5)*.35;
  const camera:[number,number,number]=[p[0]+tracking+subtle,p[1]+(shot===4?0:.08*Math.sin(u*Math.PI)),p[2]];
  const aim:[number,number,number]=[tracking,Math.max(.48,.74+pose.positionM[1]*.7),0];
  return <ThreeCanvas width={width} height={height} shadows camera={{fov:38,near:.025,far:250}}>
    <CinematicLighting focus={[tracking,0,0]} timeOfDay="dusk"/>
    <primitive object={car}/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.025,0]} receiveShadow>
      <planeGeometry args={[300,300]}/>
      <meshStandardMaterial color="#4c473c" roughness={.95}/>
    </mesh>
    {Array.from({length:16},(_,i)=> {
      const z=(i%2?1:-1)*2.8,x=i*1.85-6;
      return <mesh key={i} position={[x,.05,z]} castShadow receiveShadow>
        <icosahedronGeometry args={[.11+(i%3)*.05,0]}/>
        <meshStandardMaterial color={i%3===0?'#5d5a50':'#777364'} roughness={.9}/>
      </mesh>;
    })}
    <CameraAim position={camera} target={aim} fov={38}/>
  </ThreeCanvas>;
};
const Root=()=> <Composition id="Ep006Agent1VehicleProof" component={Proof} width={1080} height={1920} fps={30} durationInFrames={180}/>;
registerRoot(Root);
