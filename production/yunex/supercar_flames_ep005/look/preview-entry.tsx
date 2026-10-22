import React from "react";
import {Composition,registerRoot} from "remotion";
import recipeJson from "../../../../src/yunex/studio-projects/ep005-a4-environment/recipe.json";
import type {EpisodeRecipe} from "../../../../src/yunex/modelling-kit/recipe.ts";
import {compileRecipe} from "../../../../src/yunex/modelling-kit/recipe.ts";
import {EP005NightBoulevardEpisode} from "./Preview.tsx";
const recipe=recipeJson as EpisodeRecipe;
const frames=compileRecipe(recipe).durationInFrames;
const Root=()=> <>
  <Composition id="EP005A4Premium" component={EP005NightBoulevardEpisode}
    width={1080} height={1920} fps={30} durationInFrames={frames} defaultProps={{recipe,premium:true}}/>
  <Composition id="EP005A4Baseline" component={EP005NightBoulevardEpisode}
    width={1080} height={1920} fps={30} durationInFrames={frames} defaultProps={{recipe,premium:false}}/>
</>;
registerRoot(Root);
