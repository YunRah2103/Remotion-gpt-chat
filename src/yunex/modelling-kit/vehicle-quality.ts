import type {VehicleVariant} from '../world-kit/catalog.ts';
import type {EpisodeRecipe} from './recipe.ts';
export const QUALITY_VEHICLES=['city-ev','supercar','crossover','formula-modern','rally-hatch','coupe','hot-hatch','box-truck'] as const;
/** Matching trajectories and cameras isolate the modelling change; use ordinary editable studio projects. */
export function vehicleQualityRecipe(variant:VehicleVariant,bodyDetail:'legacy'|'coachbuilt'='coachbuilt',cabin=false):EpisodeRecipe{
 if(!QUALITY_VEHICLES.includes(variant as typeof QUALITY_VEHICLES[number]))throw Error('Unknown quality demonstration');
 const rally=variant==='rally-hatch';
 return {id:`quality-${variant}-${bodyDetail}${cabin?'-cabin':''}`,title:`${variant} / ${bodyDetail}`,vehicle:{variant,bodyDetail,driver:true,color:rally?'#e7e9e4':variant==='formula-modern'?'#168b7e':'#267c83'},world:{kind:rally?'rally':'track',timeOfDay:'day'},shots:cabin?[
 {id:'interior',duration:3,camera:'interior',action:'cornering',cutaway:.92,caption:'Integrated roll cage, controls and articulated driver.'},
 {id:'onboard',duration:3,camera:'onboard',action:'cornering',caption:'Rally cockpit / original steering and driving rigs.'}
 ]:[
 {id:'front',duration:2,camera:'tracking',action:rally?'cornering':'cruise',caption:rally?'Rally hatch / widened arches and raised suspension.':'Matching camera / revised body geometry.'},
 {id:'rear',duration:2,camera:'chase',action:rally?'cornering':'cruise',caption:rally?'Rear wing, mud flaps and roll cage.':'Matching rear view / original animation rigs.'},
 {id:'wheel',duration:2,camera:'wheel',action:rally?'cornering':'cruise',caption:rally?'Gravel tread and white multi-spoke rally wheels.':'Wheel, brake and road-contact detail.'}
 ]};
}
