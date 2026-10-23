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

export {sampleDynamics,dynamicsProfile,roadHeight} from './dynamics.ts';
export type {DynamicsInput} from './dynamics.ts';

export {doorRegions} from './body-panels.ts';
export {glazingVolume} from './glazing.ts';

export {STUDIO_BODY_IDS,studioBodyProfile,studioDeckPoint} from './studio-coachwork.ts';
export {installStudioExhaust} from './studio-exhaust.ts';
export type {StudioExhaustOptions,StudioExhaustOutlet,StudioExhaustResult} from './studio-exhaust.ts';
export {sampleCameraMove,fitCameraMove,validateCameraMove} from './camera-move.ts';
export type {CameraMove,CameraMovePose} from './camera-move.ts';
export {createV4Production,V4_DEMONSTRATIONS,v4ReviewPlan} from './v4-production.ts';
export type {V4Brief,V4Kind,V4Beat} from './v4-production.ts';
export {auditVehicleGeometry,qualityStates} from './visual-quality.ts';
export type {QualityState,QualityStages,GeometryDiagnostic} from './visual-quality.ts';

export {auditCameraClearance} from './camera-clearance.ts';
export type {ClearanceView} from './camera-clearance.ts';
