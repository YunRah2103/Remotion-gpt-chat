import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {Agent12Preview} from './Preview.tsx';
const Technical:React.FC=()=> <Agent12Preview mode="technical"/>;
const UI:React.FC=()=> <Agent12Preview mode="ui"/>;
const Root:React.FC=()=> <>
 <Composition id="EP004A12Technical" component={Technical} width={1080} height={1920} fps={30} durationInFrames={180}/>
 <Composition id="EP004A12UI" component={UI} width={1080} height={1920} fps={30} durationInFrames={270}/>
</>;
registerRoot(Root);
