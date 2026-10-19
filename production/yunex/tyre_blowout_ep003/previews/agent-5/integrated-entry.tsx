import React from 'react';
import {Composition,Folder,registerRoot} from 'remotion';
import {IntegratedStoryPreview} from './IntegratedPreview.tsx';

/**
 * Cross-agent preview entry. GitHub Actions overlays exact approved department
 * source files into the TEMPORARY checkout; this branch commits only Agent 5.
 */
const IntegratedPreviewRoot:React.FC=()=> <Folder name="YUNEX-EP003-Integrated-Agent-5">
  <Composition id="EP003StoryHookReal" component={IntegratedStoryPreview}
    width={1080} height={1920} fps={30} durationInFrames={135}
    defaultProps={{variant:'hook' as const}}/>
  <Composition id="EP003StoryModuleReal" component={IntegratedStoryPreview}
    width={1080} height={1920} fps={30} durationInFrames={228}
    defaultProps={{variant:'module' as const}}/>
</Folder>;
registerRoot(IntegratedPreviewRoot);
