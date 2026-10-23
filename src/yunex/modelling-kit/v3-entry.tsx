import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {StudioEpisode} from './StudioEpisode';
import {V3_PROOFS,baselineProof} from './v3-proofs';
import {compileRecipe} from './recipe';
const Root=()=> <>{Object.keys(V3_PROOFS).flatMap(name=>[false,true].map(landscape=><Composition key={`${name}-${landscape}`} id={`V3-${name}${landscape?'-landscape':''}`} component={StudioEpisode} width={landscape?1920:1080} height={landscape?1080:1920} fps={30} durationInFrames={compileRecipe(V3_PROOFS[name]).durationInFrames} defaultProps={{recipe:V3_PROOFS[name]}}/>))}{Object.keys(V3_PROOFS).map(name=><Composition key={name} id={`Before-${name}`} component={StudioEpisode} width={1080} height={1920} fps={30} durationInFrames={180} defaultProps={{recipe:baselineProof(name)}}/>)}</>;
registerRoot(Root);
