/** Source-owned, silent showcase projects. Agents may freely change shots and private variants. */
import type {EpisodeRecipe} from './recipe.ts';
import {TWIN_TURBO_DEMO} from './twin-turbo-demo.ts';
import {TWIN_TURBO_V8} from './v3-proofs.ts';
export const SHOWCASES:Record<'A'|'B'|'C'|'D'|'E'|'F',EpisodeRecipe>={
 A:{id:'showcase-a-supercar',title:'Premium supercar / studio development',vehicle:{variant:'supercar',driver:true,color:'#185d63'},world:{kind:'track',timeOfDay:'dusk'},shots:[
 {id:'launch',duration:3,camera:'tracking',action:'acceleration',caption:'Sculpted bodywork. Class-specific weight transfer.'},
 {id:'cabin',duration:3,camera:'interior',action:'cornering',cutaway:.94,caption:'Fitted controls and an articulated occupant.'},
 {id:'powertrain',duration:3,camera:'reveal',action:'cruise',context:'inspection',part:'v8',orbit:{azimuth:.7,elevation:.3,sweep:.5},caption:'Reusable animated engine geometry.'},
 {id:'payoff',duration:3,camera:'chase',action:'acceleration',caption:'Steering, wheel travel and connected suspension.'}]},
 B:{id:'showcase-b-rally',title:'Rally / contact and articulation',vehicle:{variant:'rally-hatch',driver:true},world:{kind:'rally',roughness:.8,timeOfDay:'day'},shots:[
 {id:'stage',duration:3,camera:'tracking',action:'cornering',caption:'The road and tyres share one terrain height field.'},
 {id:'travel',duration:3,camera:'wheel',action:'cornering',caption:'Each wheel follows the surface independently.'},
 {id:'cage',duration:3,camera:'interior',action:'cornering',cutaway:.94,caption:'Motorsport occupant, cage and fitted controls.'},
 {id:'exit',duration:3,camera:'chase',action:'acceleration',caption:'Formed protection and routed exhaust hardware.'}]},
 C:{id:'showcase-c-formula',title:'Formula / precise response',vehicle:{variant:'formula-modern',driver:true,color:'#168a7d'},world:{kind:'track',timeOfDay:'day'},shots:[
 {id:'attack',duration:3,camera:'tracking',action:'acceleration',caption:'Multi-element wings and a sculpted engine cover.'},
 {id:'steering',duration:3,camera:'wheel',action:'cornering',caption:'Ackermann steering with connected suspension.'},
 {id:'apex',duration:3,camera:'chase',action:'cornering',caption:'A low-compliance Formula response.'}]},
 D:{id:'showcase-d-engineering',title:'Mechanical assembly / illustrative',vehicle:{variant:'supercar'},world:{kind:'showroom'},shots:[
 {id:'assembly',duration:3,camera:'reveal',action:'cruise',context:'inspection',assembly:structuredClone(TWIN_TURBO_V8),orbit:{azimuth:.7,elevation:.3,sweep:.4},caption:'Reusable V8 and twin-turbo assembly.'},
 {id:'cutaway',duration:3,camera:'reveal',action:'cruise',context:'inspection',part:'v8',exploded:.25,orbit:{azimuth:1,elevation:.35,sweep:-.4},caption:'Connected animated internals. Illustrative kinematics.'}]},
 E:{id:'showcase-e-environment',title:'City / night and rain',vehicle:{variant:'grand-tourer',driver:true,color:'#35546e'},world:{kind:'city',timeOfDay:'night',wetness:.55},shots:[
 {id:'street',duration:3,camera:'tracking',action:'cruise',caption:'Wet streets, reflections and architectural detail.'},
 {id:'headlights',duration:3,camera:'wheel',action:'cruise',caption:'Vehicle lighting and restrained atmospheric rain.'},
 {id:'departure',duration:3,camera:'chase',action:'acceleration',caption:'A reusable world with a clear driving corridor.'}]},
 F:{...structuredClone(TWIN_TURBO_DEMO),id:'showcase-f-complete-film',title:'How twin turbos work / silent film'}
};
