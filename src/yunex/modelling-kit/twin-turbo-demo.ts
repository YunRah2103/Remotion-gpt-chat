/** Original silent editorial demonstration. All numbers are illustrative, no manufacturer claims. */
import type {EpisodeRecipe} from './recipe.ts';
import {TWIN_TURBO_V8,V3_PROOFS} from './v3-proofs.ts';
const assembly=structuredClone(TWIN_TURBO_V8);
assembly.id='demo-parallel-twin-turbo-v8';
for(const c of assembly.connections)c.flow={speed:.32,count:7};
export const TWIN_TURBO_DEMO:EpisodeRecipe={
 id:'twin-turbo-complete',title:'Twin turbos / SILENT',
 vehicle:{...structuredClone(V3_PROOFS.sports.vehicle),color:'#14675f',powertrain:assembly},
 world:{kind:'highway',timeOfDay:'day',components:structuredClone(V3_PROOFS.environment.world.components)},
 shots:[
 {id:'hook',duration:2,camera:'tracking',action:'acceleration',caption:'Two turbos. How do they make more power?'},
 {id:'exhaust',duration:4,camera:'reveal',context:'inspection',action:'acceleration',assembly,orbit:{azimuth:.8,elevation:.28,sweep:.3},caption:'Exhaust gas spins a turbine in each turbo.',annotation:{anchor:'part',text:'Orange: exhaust gas'}},
 {id:'shaft',duration:4,camera:'reveal',context:'inspection',action:'cruise',part:'turbo-small',orbit:{azimuth:1.1,elevation:.2,sweep:-.5},caption:'A shared shaft drives the air compressor.'},
 {id:'charge',duration:4,camera:'reveal',context:'inspection',action:'cruise',assembly,orbit:{azimuth:-.7,elevation:.45,sweep:.35},caption:'The compressors push more air into the engine.',annotation:{anchor:'part',text:'Teal: compressed air'}},
 {id:'combustion',duration:4,camera:'reveal',context:'inspection',action:'acceleration',part:'v8',orbit:{azimuth:.6,elevation:.3,sweep:.35},caption:'More air allows more fuel to burn, making more power.'},
 {id:'installed',duration:3,camera:'tracking',action:'acceleration',cutaway:.95,highlight:'engine',caption:'Both turbos work together in this parallel layout.',annotation:{anchor:'engine',text:'Fitted twin-turbo V8'}},
 {id:'payoff',duration:4,camera:'chase',action:'acceleration',jointTracks:{'v3-rear-wing':[{time:0,value:.2},{time:1.5,value:.8},{time:4,value:.8}]},caption:'Exhaust energy becomes extra engine power.'}
 ]
};
