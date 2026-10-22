import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {EP005PolishPreview} from '../../../../production/yunex/supercar_flames_ep005/polish/PolishPreview.tsx';
const Root=()=> <>
 <Composition id="EP005Before" component={EP005PolishPreview} width={1080} height={1920} fps={30} durationInFrames={180} defaultProps={{polished:false}}/>
 <Composition id="EP005After" component={EP005PolishPreview} width={1080} height={1920} fps={30} durationInFrames={180} defaultProps={{polished:true}}/>
 </>;
registerRoot(Root);
