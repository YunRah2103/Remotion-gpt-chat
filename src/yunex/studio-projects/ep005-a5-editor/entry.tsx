import React from 'react';
import {AbsoluteFill,Composition,registerRoot} from 'remotion';
import input from './recipe.json';
import {StudioEpisode} from '../../modelling-kit/StudioEpisode';
import {compileRecipe} from '../../modelling-kit/recipe';
import type {EpisodeRecipe} from '../../modelling-kit/recipe';
import {EditorOverlay} from './EditorOverlay';

const recipe = input as EpisodeRecipe;
const compiled = compileRecipe(recipe);
const EditorPicture: React.FC = () => <AbsoluteFill>
  <StudioEpisode recipe={recipe} />
  <EditorOverlay shots={compiled.shots} hasVerifiedWords={Boolean(recipe.words?.length && recipe.audio?.narration)} />
</AbsoluteFill>;
const Root: React.FC = () => <Composition
  id="StudioEpisode"
  component={EditorPicture}
  width={1080}
  height={1920}
  fps={30}
  durationInFrames={compiled.durationInFrames}
/>;
registerRoot(Root);
