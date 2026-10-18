import React from 'react';
import {AbsoluteFill,Composition,useCurrentFrame,useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {sampleRoute} from '../../world-kit/environments.ts';
import {vehicleSpec} from '../../world-kit/catalog.ts';
import {BrakingLookdev} from './BrakingLookdev.tsx';
import {calibrationHeat,worldFromCar} from './math.ts';
import type {Point3} from './math.ts';

type Mode='macro'|'context';
export const BrakingLookdevProof:React.FC<{mode:Mode}>=({mode})=>{
  const frame=useCurrentFrame(),{fps,width,height}=useVideoConfig();
  const t=frame/fps,car=vehicleSpec('grand-tourer');
  // Diagnostic driving at steady preview speed. NOT the episode's brake simulation.
  const distance=14+t*(mode==='macro'?5.8:10.5);
  const route=sampleRoute('track',distance),p=route.position,yaw=route.yaw;
  const a=mode==='macro'? .18*Math.sin(t*.7):.7*Math.sin(t*.45);
  const targetLocal:Point3=mode==='macro'
    ?[car.wheelbase/2,car.radius+.05,car.width/2-.09]
    :[.15,.75,0];
  const cameraLocal:Point3=mode==='macro'
    ?[car.wheelbase/2+.25+a,.78+.055*Math.sin(t*.8),2.75-.15*Math.sin(t*.5)]
    :[7.35+a,3.65,10.0-.4*Math.sin(t*.5)];
  const eye=worldFromCar(cameraLocal,p,yaw);
  const target=worldFromCar(targetLocal,p,yaw);
  const heat=mode==='macro'?calibrationHeat(t):0;
  return <AbsoluteFill style={{background:'#b9ced5'}}>
    <ThreeCanvas width={width} height={height} shadows
      camera={{position:[...eye],fov:mode==='macro'?42:38,near:.1,far:360}}>
      <BrakingLookdev previewDistanceM={distance} heatIllustration01={heat}
        cameraPose={{position:eye,target,fovDeg:mode==='macro'?42:38}}/>
    </ThreeCanvas>
    <div style={{position:'absolute',top:height*.052,left:width*.07,
      color:'#f3f6f5',font:'600 22px Arial',letterSpacing:3,
      textShadow:'0 2px 8px #23313b8c'}}>YUNEX <span style={{opacity:.65}}> / LOOKDEV QC</span></div>
    <div style={{position:'absolute',bottom:height*.062,left:width*.07,
      maxWidth:width*.84,color:'#f5f7f5',font:'500 25px Arial',
      textShadow:'0 2px 10px #16212cb3'}}>
      {mode==='macro'?'WHEEL / CALIPER FINISH':'GRAND TOURER / DAYLIGHT CIRCUIT'}
      <div style={{marginTop:8,opacity:.73,font:'400 16px Arial',letterSpacing:1}}>
        {mode==='macro'?'Heat is illustrative, not a temperature measurement':'Moving material study; constant preview speed'}
      </div>
    </div>
  </AbsoluteFill>;
};
export const BrakingLookdevCompositions:React.FC=()=> <>
  <Composition id="BrakingLookdevMacro" component={BrakingLookdevProof} width={1080} height={1920}
    fps={30} durationInFrames={120} defaultProps={{mode:'macro' as const}}/>
  <Composition id="BrakingLookdevContext" component={BrakingLookdevProof} width={1080} height={1920}
    fps={30} durationInFrames={120} defaultProps={{mode:'context' as const}}/>
</>;
