/** Recommended V5 entry point. Legacy createCinematicVehicle defaults stay unchanged. */
import {createCinematicVehicle} from './rig.ts';
import type {CinematicOptions} from './rig.ts';
import {VEHICLES,vehicleSpec} from '../world-kit/catalog.ts';
import type {VehicleVariant} from '../world-kit/catalog.ts';
import {fleetArchitecture} from './fleet-profiles.ts';
import type {FleetArchitecture} from './fleet-profiles.ts';
import type {EpisodeRecipe} from './recipe.ts';
const defaults:Record<FleetArchitecture,VehicleVariant>={'mid-engine':'supercar',gt:'grand-tourer',muscle:'muscle-coupe',classic:'retro-coupe',sedan:'saloon',fastback:'fastback',hatch:'hot-hatch',rally:'rally-hatch',estate:'estate',suv:'long-suv',pickup:'crew-pickup',van:'minivan',formula:'formula-modern',motorcycle:'sport-bike',commercial:'tractor-truck'};
export type FleetOptions=Omit<CinematicOptions,'variant'|'bodyDetail'> & {variant?:VehicleVariant;family?:FleetArchitecture;trim?:'road'|'track';reference?:'v4-approved'};
export function createFleetVehicle(options:FleetOptions={}){
 if(options.family!==undefined&&!(options.family in defaults))throw Error('Unknown fleet family');
 if(options.trim!==undefined&&!['road','track'].includes(options.trim))throw Error('Unknown fleet trim');
 if(options.reference!==undefined&&options.reference!=='v4-approved')throw Error('Unknown approved reference');
 const variant=options.variant??defaults[options.family??'gt'];
 if(options.family&&fleetArchitecture(vehicleSpec(variant))!==options.family)throw Error('Vehicle variant does not belong to selected fleet family');
 if(options.reference&&variant!=='supercar')throw Error('Approved V4 reference requires supercar');
 return createCinematicVehicle({...options,variant,bodyDetail:options.reference?'studio':'fleet',tyreType:options.trim==='track'?'slick':options.tyreType});
}
export function fleetCatalogue(){return VEHICLES.map(s=>({...s,architecture:fleetArchitecture(s),source:'original source-owned fleet rebuild 2026-10-24'}));}
export function createFleetRecipe({id,variant='grand-tourer',color,world='track'}:{id:string;variant?:VehicleVariant;color?:string;world?:EpisodeRecipe['world']['kind']}):EpisodeRecipe{
 return {id,title:'V5 vehicle proof',presentation:'cinematic',vehicle:{variant,color,bodyDetail:'fleet'},world:{kind:world,timeOfDay:'day'},shots:[
  {id:'front',duration:1.5,camera:'tracking',action:'cruise',caption:''},
  {id:'side',duration:1.5,camera:'tracking',action:'cruise',caption:''},
  {id:'rear',duration:1.5,camera:'chase',action:'cruise',caption:''},
  {id:'drive',duration:1.5,camera:'tracking',action:'acceleration',caption:''},
 ]};
}
