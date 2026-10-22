import React from 'react';
import {Composition,registerRoot} from 'remotion';
import recipeJson from './recipe.json';
import type {EpisodeRecipe} from '../../modelling-kit/recipe';
import {compileRecipe} from '../../modelling-kit/recipe';
import {AfterfireEpisode} from './AfterfireEpisode';
const recipe=recipeJson as EpisodeRecipe;
const Root=()=> <Composition id="StudioEpisode" component={AfterfireEpisode} width={1080} height={1920} fps={30} durationInFrames={compileRecipe(recipe).durationInFrames} defaultProps={{recipe}}/>;
registerRoot(Root);
