import {registerRoot} from 'remotion';
import React from 'react';
import {Composition} from 'remotion';
import {LookPreview} from './LookPreview.tsx';
import {RefugeInspection} from './RefugeInspection.tsx';

const LOOK_FPS=30;
const PreviewRoot=()=> <>
  <Composition id="EP003RefugeInspection" component={RefugeInspection}
    width={1080} height={1920} fps={LOOK_FPS} durationInFrames={150}/>
  <Composition id="EP003LookBeforeBeauty" component={LookPreview}
    width={1920} height={1080} fps={LOOK_FPS} durationInFrames={150}
    defaultProps={{mode:'beauty' as const,baseline:true}}/>
  <Composition id="EP003LookAfterBeauty" component={LookPreview}
    width={1920} height={1080} fps={LOOK_FPS} durationInFrames={150}
    defaultProps={{mode:'beauty' as const,baseline:false}}/>
  <Composition id="EP003LookBeforePortrait" component={LookPreview}
    width={1080} height={1920} fps={LOOK_FPS} durationInFrames={210}
    defaultProps={{mode:'portrait' as const,baseline:true}}/>
  <Composition id="EP003LookAfterPortrait" component={LookPreview}
    width={1080} height={1920} fps={LOOK_FPS} durationInFrames={210}
    defaultProps={{mode:'portrait' as const,baseline:false}}/>
</>;
registerRoot(PreviewRoot);
