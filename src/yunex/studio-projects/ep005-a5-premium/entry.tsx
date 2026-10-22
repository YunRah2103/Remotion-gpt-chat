import React from 'react';
import {AbsoluteFill,Composition,registerRoot} from 'remotion';
import {PORTRAIT} from './picture-contract';
const MissingApprovedSource:React.FC=()=> <AbsoluteFill style={{background:'#08121b',color:'#fff',
  alignItems:'center',justifyContent:'center',fontFamily:'Arial,sans-serif',padding:90,textAlign:'center'}}>
  <h2>EP005 PREMIUM EDITOR / SOURCE GATE</h2>
  <p>This project requires SHA-pinned real A1–A4 footage. Stage the review sources with
  the dedicated workflow. This black gate is not an EP005 film.</p>
</AbsoluteFill>;
registerRoot(()=> <Composition id="StudioEpisode" component={MissingApprovedSource}
  width={PORTRAIT.width} height={PORTRAIT.height} fps={PORTRAIT.fps}
  durationInFrames={PORTRAIT.frames}/>);

