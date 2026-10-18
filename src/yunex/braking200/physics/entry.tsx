import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {BrakingPhysicsMacro,BrakingPhysicsContext} from './preview';
const PhysicsCompositions:React.FC=()=> <>
 <Composition id="BrakingPhysicsMacro" component={BrakingPhysicsMacro} fps={30} width={1080} height={1920} durationInFrames={145}/>
 <Composition id="BrakingPhysicsContext" component={BrakingPhysicsContext} fps={30} width={1080} height={1920} durationInFrames={120}/>
</>;
registerRoot(PhysicsCompositions);
