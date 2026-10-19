import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {F1RacingLinePicture} from './Episode.tsx';
import {FILM_FPS,FILM_FRAMES} from './timeline.ts';

/** Native software-WebGL master and review preview share identical 780-frame edit. */
const Root:React.FC=()=> <>
 <Composition id="YUNEXF1EP002Master" component={F1RacingLinePicture}
   durationInFrames={FILM_FRAMES} fps={FILM_FPS} width={1080} height={1920}/>
 <Composition id="YUNEXF1EP002Preview" component={F1RacingLinePicture}
   durationInFrames={FILM_FRAMES} fps={FILM_FPS} width={540} height={960}/>
</>;
registerRoot(Root);
