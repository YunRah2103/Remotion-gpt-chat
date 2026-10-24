import React,{useMemo,useEffect} from 'react';
import {AbsoluteFill,Composition,registerRoot,useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {CameraAim} from '../../world-kit/components.tsx';
import {disposeObject} from '../../world-kit/geometry.ts';
import {createCinematicVehicle} from '../../modelling-kit/rig.ts';
import {createCinematicEnvironment} from '../../modelling-kit/environments.ts';
import {CinematicLighting} from '../../modelling-kit/Lighting.tsx';
import {createEp006MechanicalReveal} from '../../ep006/mechanical/reveal.ts';
import {sampleEp006MechanicalTimeline} from '../../ep006/mechanical/timeline.ts';
import {sampleMechanicalPreviewFixture} from '../../ep006/mechanical/preview-fixture.ts';

/**
 * AGENT 5 MOTION PROOF ONLY. Agent 2's motion implementation is on a separate
 * branch and must replace the labelled fixture before editor integration.
 * Native 1080x1920 30fps silent. No narration or final subtitle timing.
 */
const MechanicalProof:React.FC=()=>{
  const frame=useCurrentFrame();
  const car=useMemo(()=>createCinematicVehicle({
    variant:'rally-hatch',bodyDetail:'studio',quality:'hero',driver:true,
    color:'#b9c5c4',accent:'#df7838',lights:true
  }),[]);
  const scene=useMemo(()=>createCinematicEnvironment({
    kind:'rally',timeOfDay:'dusk',quality:'standard',roughness:.8,
  }),[]);
  const reveal=useMemo(()=>createEp006MechanicalReveal(car),[car]);
  useEffect(()=>()=>{disposeObject(car);disposeObject(scene);},[car,scene]);
  const globalFrame=192+Math.min(362,Math.floor(frame*363/180));
  const sample=sampleEp006MechanicalTimeline(globalFrame,sampleMechanicalPreviewFixture);
  reveal.update({motion:sample.motion,focus:sample.focus,
    exposure01:sample.exposure01,applyV4FallbackPose:true});
  return <AbsoluteFill style={{background:'#22303a'}}>
    <ThreeCanvas width={1080} height={1920} shadows
      camera={{fov:sample.camera.fov,near:.035,far:280}}
      gl={{antialias:true}}>
      <CinematicLighting focus={sample.motion.positionM} timeOfDay="dusk"/>
      <primitive object={scene}/>
      <primitive object={car}/>
      <CameraAim position={sample.camera.position}
        target={sample.camera.target} fov={sample.camera.fov}/>
      <pointLight position={[sample.motion.positionM[0]+1,1.6,2.4]}
        intensity={26} color="#ffe3b1" distance={6} decay={2}/>
    </ThreeCanvas>
    <div style={{position:'absolute',top:90,left:72,padding:'10px 16px',
      color:'#eff5f4',background:'rgba(13,23,29,.65)',borderLeft:'3px solid #e6ad48',
      font:'600 25px Arial',letterSpacing:2}}>
      SLOW-MOTION REPLAY
    </div>
  </AbsoluteFill>;
};
const Root:React.FC=()=> <Composition id="EP006A5MechanicalProof"
  component={MechanicalProof} width={1080} height={1920}
  fps={30} durationInFrames={180}/>;
registerRoot(Root);
