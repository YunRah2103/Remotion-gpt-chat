import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {Agent3CinemaPreview} from './Preview.tsx';
const Root=()=><>
 <Composition id="F1CinemaA" component={Agent3CinemaPreview} defaultProps={{reel:'A' as const}} fps={30} width={540} height={960} durationInFrames={240}/>
 <Composition id="F1CinemaB" component={Agent3CinemaPreview} defaultProps={{reel:'B' as const}} fps={30} width={540} height={960} durationInFrames={240}/>
</>;
registerRoot(Root);
