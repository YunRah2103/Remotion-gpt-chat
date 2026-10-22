import React from "react";
import {Composition,registerRoot} from "remotion";
import recipeJson from "../../../../src/yunex/studio-projects/ep005-a4-cinematic/recipe.json";
import type {EpisodeRecipe} from "../../../../src/yunex/modelling-kit/recipe.ts";
import {compileRecipe} from "../../../../src/yunex/modelling-kit/recipe.ts";
import {EP005CinematicLookEpisode} from "./PreviewV2.tsx";
const recipe=recipeJson as EpisodeRecipe;
const duration=compileRecipe(recipe).durationInFrames;
const Root=()=> <>
 <Composition id="EP005A4V2" component={EP005CinematicLookEpisode}
  width={1080} height={1920} fps={30} durationInFrames={duration}
  defaultProps={{recipe,premium:true}}/>
 <Composition id="EP005A4Previous" component={EP005CinematicLookEpisode}
  width={1080} height={1920} fps={30} durationInFrames={duration}
  defaultProps={{recipe,premium:false}}/>
</>;
registerRoot(Root);
