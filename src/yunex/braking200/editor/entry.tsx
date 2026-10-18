import React from 'react';
import {Composition,Folder,registerRoot} from 'remotion';
import {Braking200FirstCut,EP001_FPS,EP001_FRAMES} from './film.tsx';

const Braking200Root:React.FC=()=> <Folder name="YUNEX-BRAKING-200-EDITOR">
  <Composition id="YunexBraking200FirstCut" component={Braking200FirstCut}
    width={1080} height={1920} fps={EP001_FPS} durationInFrames={EP001_FRAMES}/>
</Folder>;
registerRoot(Braking200Root);
