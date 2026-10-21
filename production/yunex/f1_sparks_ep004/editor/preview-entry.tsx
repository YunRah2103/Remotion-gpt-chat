/** EP004 Agent 6 SILENT PICTURE REVIEW — not original narrated final movie. */
import React from 'react';
import {registerRoot,Composition} from 'remotion';
import {EP004VideoOnlyReview} from './PreviewScene.tsx';
import {PREVIEW_TOTAL_FRAMES} from './preview-plan.ts';
const Root:React.FC=()=> <Composition
  id="EP004Agent6VideoOnlyReview"
  component={EP004VideoOnlyReview}
  durationInFrames={PREVIEW_TOTAL_FRAMES}
  fps={30} width={1080} height={1920}
/>;
registerRoot(Root);
