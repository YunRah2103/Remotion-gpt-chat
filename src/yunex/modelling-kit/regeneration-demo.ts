/** Independent brief-to-video proof. Illustrative electrical flow; no speech or timing is fabricated. */
import {compileBrief} from './production.ts';
export const REGENERATION_DEMO=compileBrief({
 id:'ev-regeneration-proof',subject:'Regenerative braking / SILENT PROOF',duration:12,
 vehicle:{variant:'city-ev',color:'#3c8b91',driver:true,model:{id:'ev-recovery-variant',version:1,edits:[{target:'traction-battery',scale:[1,.95,1]}]},components:[{id:'battery-undertray',parent:'mechanical-systems',position:[0,.13,0],shape:{kind:'box',size:[1.8,.025,1.15]},color:'#38434d'}]},
 environment:{kind:'mountain',timeOfDay:'day'},
 scenes:[
 {id:'decelerate',duration:3,camera:'tracking',action:'braking',caption:'Lift off. The electric car slows down.'},
 {id:'recover',duration:3,camera:'overhead',action:'braking',cutaway:.96,energyFlow:'regenerate',caption:'The wheels drive the motor as a generator.',annotation:{anchor:'underfloor',text:'Energy to battery'}},
 {id:'generator',duration:3,camera:'reveal',action:'braking',part:'ev-drive',context:'inspection',orbit:{azimuth:.8,elevation:.25,sweep:.65},caption:'Electrical energy returns to the battery.',annotation:{anchor:'part',text:'Motor / generator'}},
 {id:'continue',duration:3,camera:'chase',action:'cruise',caption:'Some energy is recovered. Friction brakes still help.'}
 ]
});
