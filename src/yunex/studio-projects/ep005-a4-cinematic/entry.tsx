import React from "react";
import {Composition,registerRoot} from "remotion";
import input from "./recipe.json";
import type {EpisodeRecipe} from "../../modelling-kit/recipe.ts";
import {compileRecipe} from "../../modelling-kit/recipe.ts";
import {EP005CinematicLookEpisode} from "../../../../production/yunex/supercar_flames_ep005/look/PreviewV2.tsx";
const recipe=input as EpisodeRecipe,compiled=compileRecipe(recipe);
const Root=()=> <Composition id="StudioEpisode" component={EP005CinematicLookEpisode}
 width={1080} height={1920} fps={30} durationInFrames={compiled.durationInFrames}
 defaultProps={{recipe,premium:true}}/>;
registerRoot(Root);
