import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {F1RacingLinePicture} from './Episode.tsx';
import {FILM_FPS,FILM_FRAMES} from './timeline.ts';

/** Preserve the original 780-frame film; register the user-approved tighter 696-frame premium camera cut separately. */
const PremiumPicture:React.FC=()=> <F1RacingLinePicture premiumCamera/>;
const Root:React.FC=()=> <>
 <Composition id="YUNEXF1EP002Master" component={F1RacingLinePicture}
   durationInFrames={FILM_FRAMES} fps={FILM_FPS} width={1080} height={1920}/>
 <Composition id="YUNEXF1EP002Preview" component={F1RacingLinePicture}
   durationInFrames={FILM_FRAMES} fps={FILM_FPS} width={540} height={960}/>
 <Composition id="YUNEXF1EP002Premium23s2" component={PremiumPicture}
   durationInFrames={696} fps={FILM_FPS} width={1080} height={1920}/>
 <Composition id="YUNEXF1EP002Premium23s2Preview" component={PremiumPicture}
   durationInFrames={696} fps={FILM_FPS} width={540} height={960}/>
</>;
registerRoot(Root);
