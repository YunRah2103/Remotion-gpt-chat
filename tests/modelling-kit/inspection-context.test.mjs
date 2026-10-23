import {test} from 'node:test';import assert from 'node:assert/strict';
import {compileRecipe} from '../../src/yunex/modelling-kit/recipe.ts';
const base={id:'inspection',title:'Inspection',vehicle:{variant:'city-ev'},world:{kind:'city'},shots:[{id:'motor',duration:1,camera:'reveal',action:'braking',part:'ev-drive',context:'inspection',energyFlow:'regenerate',caption:'Motor becomes a generator.'}]};
test('shot inspection context and energy direction reject misspelled controls',()=>{assert.equal(compileRecipe(base).shots[0].context,'inspection');for(const patch of [{context:'inspeciton'},{energyFlow:'backwards'}])assert.throws(()=>compileRecipe({...base,shots:[{...base.shots[0],...patch}]}),/context|energy/i);});
