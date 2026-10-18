import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {Agent4LookdevFilm} from './Film';
const Root:React.FC=()=> <>
 <Composition id="F1Agent4Before" component={Agent4LookdevFilm} width={540} height={960}
   fps={30} durationInFrames={180} defaultProps={{quality:'baseline' as const}}/>
 <Composition id="F1Agent4After" component={Agent4LookdevFilm} width={540} height={960}
   fps={30} durationInFrames={180} defaultProps={{quality:'premium' as const}}/>
</>;
registerRoot(Root);
