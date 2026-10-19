import React from 'react';
import {Composition,Folder,registerRoot} from 'remotion';
import {StoryPreview} from './StoryPreview.tsx';

/** Agent-owned isolated compositions; NEVER change src/Root.tsx in Phase 1. */
const StoryPreviewRoot:React.FC=()=> <Folder name="YUNEX-EP003-Agent-5">
  <Composition id="Ep003StoryHook" component={StoryPreview}
    width={1080} height={1920} fps={30} durationInFrames={135}
    defaultProps={{variant:'hook' as const}}/>
  <Composition id="Ep003StoryModule" component={StoryPreview}
    width={1080} height={1920} fps={30} durationInFrames={228}
    defaultProps={{variant:'module' as const}}/>
</Folder>;
registerRoot(StoryPreviewRoot);
