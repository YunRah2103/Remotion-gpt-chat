import type {EpisodeRecipe} from './recipe.ts';
export const STUDIO_RECIPES:Record<string,EpisodeRecipe>={
 braking:{id:'braking',title:'Where speed becomes heat',vehicle:{variant:'hot-hatch',driver:true},world:{kind:'highway'},shots:[
 {id:'approach',duration:3,camera:'tracking',action:'cruise',caption:'Speed carries energy.'},
 {id:'pedal',duration:3,camera:'interior',action:'braking',caption:'The driver applies the brake.'},
 {id:'disc',duration:3,camera:'wheel',action:'braking',caption:'Friction slows the rotating disc.'},
 {id:'mechanism',duration:3,camera:'reveal',action:'braking',part:'brake-drilled',annotation:{anchor:'part',text:'Caliper and disc'},caption:'The caliper clamps the pads.'},
 {id:'systems',duration:3,camera:'tracking',action:'braking',cutaway:.94,caption:'Braking loads the front suspension.'},
 {id:'finish',duration:3,camera:'reveal',action:'acceleration',caption:'Controlled braking keeps the car balanced.'}]},
 powertrain:{id:'powertrain',title:'From combustion to motion',vehicle:{variant:'supercar',driver:true},world:{kind:'showroom'},shots:[
 {id:'exterior',duration:3,camera:'reveal',action:'cruise',caption:'A complete powertrain works as one.'},
 {id:'cutaway',duration:3,camera:'tracking',action:'cruise',cutaway:.94,highlight:'engine',annotation:{anchor:'engine',text:'Engine'},caption:'The engine produces torque.'},
 {id:'engine',duration:3,camera:'reveal',action:'acceleration',part:'v8',caption:'Pistons turn the crankshaft.'},
 {id:'gearbox',duration:3,camera:'reveal',action:'cruise',part:'gearbox-dct',caption:'Gears trade speed for torque.'},
 {id:'driver',duration:3,camera:'interior',action:'acceleration',caption:'The driver requests acceleration.'},
 {id:'assembly',duration:3,camera:'reveal',action:'cruise',cutaway:.9,exploded:.35,caption:'Connected systems deliver motion.'}]}
};

STUDIO_RECIPES['f1-downforce']={id:'f1-downforce',title:'The single-seater toolkit',vehicle:{variant:'formula-modern',driver:true},world:{kind:'track'},shots:[
{id:'chase',duration:3,camera:'chase',action:'acceleration',caption:'Speed builds aerodynamic load.'},
{id:'onboard',duration:3,camera:'onboard',action:'cornering',caption:'Steering follows the circuit.'},
{id:'floor',duration:3,camera:'tracking',action:'cruise',cutaway:.9,highlight:'underfloor',caption:'Inspect the floor and suspension.'},
{id:'front',duration:3,camera:'wheel',action:'cornering',caption:'The front wheels set the direction.'},
{id:'power',duration:3,camera:'reveal',action:'acceleration',part:'v6',caption:'A compact engine delivers torque.'},
{id:'finish',duration:3,camera:'overhead',action:'cruise',caption:'A complete platform for racing explanations.'}]};
STUDIO_RECIPES['rain-drive']={...structuredClone(STUDIO_RECIPES.braking),id:'rain-drive',title:'City after dark',vehicle:{variant:'supercar',driver:true},world:{kind:'city',timeOfDay:'night',wetness:.8},shots:[
{id:'city',duration:3,camera:'tracking',action:'cruise',caption:'A moving city, after dark.'},
{id:'chase',duration:3,camera:'chase',action:'acceleration',caption:'Wet surfaces catch the city lights.'},
{id:'wheel',duration:3,camera:'wheel',action:'cruise',caption:'Keep the tyres connected to the road.'},
{id:'cabin',duration:3,camera:'interior',action:'cornering',caption:'Driver movement follows each input.'},
{id:'onboard',duration:3,camera:'onboard',action:'cruise',caption:'Switch to the driver perspective.'},
{id:'reveal',duration:3,camera:'tracking',action:'braking',caption:'One recipe. A complete cinematic sequence.'}]};
