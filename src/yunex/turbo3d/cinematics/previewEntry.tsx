import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {CinematicsPreview} from './PreviewScenes';
/** Entrypoint exclusively for specialist preview renders. Main src/Root.tsx is NOT touched. */
const PreviewRoot:React.FC=()=> <React.Fragment>
 <Composition id="YunexA4HookOrbit" component={()=> <CinematicsPreview variant="hookA"/>} durationInFrames={90} fps={30} width={1080} height={1920}/>
 <Composition id="YunexA4HookRush" component={()=> <CinematicsPreview variant="hookB"/>} durationInFrames={90} fps={30} width={1080} height={1920}/>
 <Composition id="YunexA4Shaft" component={()=> <CinematicsPreview variant="shaft"/>} durationInFrames={150} fps={30} width={1080} height={1920}/>
 <Composition id="YunexA4Charge" component={()=> <CinematicsPreview variant="charge"/>} durationInFrames={150} fps={30} width={1080} height={1920}/>
 <Composition id="YunexA4Road" component={()=> <CinematicsPreview variant="road"/>} durationInFrames={120} fps={30} width={1080} height={1920}/>
 </React.Fragment>;
registerRoot(PreviewRoot);