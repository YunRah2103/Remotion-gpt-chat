export {createCinematicVehicle,animateCinematicVehicle,HERO_VEHICLES} from './rig.ts';
export type {CinematicOptions,CinematicState,WheelCorner} from './rig.ts';
export {CinematicVehicle} from './components';
export {createImpactBarrier,animateImpactBarrier} from './barrier.ts';

export {createCinematicEnvironment} from './environments.ts';
export {CinematicStage} from './Stage';
export {CinematicLighting} from './Lighting';

export {drivingCamera,drivingState} from './driving.ts';
export type {CameraPreset,DrivingAction} from './driving.ts';

export {StudioEpisode} from './StudioEpisode';
export {compileRecipe,sampleRecipe} from './recipe.ts';
export type {EpisodeRecipe,StudioShot} from './recipe.ts';
export {STUDIO_RECIPES} from './studio-recipes.ts';
export {createWeather,animateWeather} from './weather.ts';

export {applyEdits,editModel,attachAt,createAssembly,animateAssembly,validateModel,modelCatalogue,modelPath,selectModelObject,fitDiagnostics} from './authoring.ts';
export type {ModelEdit,ModelVariation,AssemblySpec} from './authoring.ts';
export {compileBrief,productionPlan} from './production.ts';

export {buildComponents,animateComponents,importGLB,exportGLB} from './authoring.ts';
export type {ComponentSpec} from './authoring.ts';

export {ComponentRegistry} from './registry.ts';
export type {RegisteredComponent} from './registry.ts';

export {animateEnergyFlow} from './systems.ts';
