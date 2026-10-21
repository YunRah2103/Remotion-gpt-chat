import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {KitDemo} from './Demos';
const Root:React.FC=()=> <>{(['A','B','C'] as const).flatMap(demo=>[false,true].map(portrait=><Composition key={`${demo}-${portrait}`} id={`Kit${demo}${portrait?'Portrait':''}`} component={KitDemo} width={portrait?1080:1920} height={portrait?1920:1080} fps={30} durationInFrames={(demo==='A'?9:6)*30} defaultProps={{demo}}/>))}<Composition id="KitBefore" component={KitDemo} width={1920} height={1080} fps={30} durationInFrames={60} defaultProps={{demo:'A',baseline:true}}/></>;
registerRoot(Root);
