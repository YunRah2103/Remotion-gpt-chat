import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {EP005DrivingFilm} from '../../../../production/yunex/supercar_flames_ep005/cinema/DrivingFilm';
import {CINEMA_FRAMES,CINEMA_FPS} from '../../../../production/yunex/supercar_flames_ep005/cinema/timeline';
import input from './recipe.json';
import {compileRecipe} from '../../modelling-kit/recipe';
import type {EpisodeRecipe} from '../../modelling-kit/recipe';
const compiled=compileRecipe(input as EpisodeRecipe);
if(compiled.durationInFrames!==CINEMA_FRAMES)throw Error('EP005 A3 source/recipe frame divergence');
const Root=()=> <Composition id="StudioEpisode" component={EP005DrivingFilm}
 width={1080} height={1920} fps={CINEMA_FPS} durationInFrames={CINEMA_FRAMES}/>;
registerRoot(Root);
