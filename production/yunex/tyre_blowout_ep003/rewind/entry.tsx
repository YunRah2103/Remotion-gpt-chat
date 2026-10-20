/** Independent Agent 9 preview root: does not edit Agent 6 master registration. */
import React from 'react';
import {registerRoot,Composition} from 'remotion';
import {EP003Agent9ImpactRewind,EP003Agent9BranchCompare} from './EP003Agent9Preview.tsx';
const Root:React.FC=()=> <>
 <Composition id="EP003Agent9ImpactRewind" component={EP003Agent9ImpactRewind}
   fps={30} width={1080} height={1920} durationInFrames={135}/>
 <Composition id="EP003Agent9BranchCompare" component={EP003Agent9BranchCompare}
   fps={30} width={1080} height={1920} durationInFrames={225}/>
</>;
registerRoot(Root);
