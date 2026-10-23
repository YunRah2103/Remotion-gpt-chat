import {test} from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {resolve} from 'node:path';
import * as proof from '../../scripts/modelling-kit/proof-project.mjs';
import {vehicleQualityRecipe} from '../../src/yunex/modelling-kit/vehicle-quality.ts';
test('native proof preparation reuses identical source but rejects edits without overwriting them',()=>{
 assert.equal(typeof proof.prepareProofProject,'function');const root=mkdtempSync(resolve(tmpdir(),'yunex-proof-'));try{const recipe=vehicleQualityRecipe('supercar'),folder=proof.prepareProofProject(root,recipe);writeFileSync(resolve(folder,'keep.txt'),'agent work');assert.equal(proof.prepareProofProject(root,recipe),folder);assert.equal(readFileSync(resolve(folder,'keep.txt'),'utf8'),'agent work');const file=resolve(folder,'recipe.json'),changed={...recipe,title:'My private edit'};writeFileSync(file,JSON.stringify(changed));assert.throws(()=>proof.prepareProofProject(root,recipe),/different|modified/);assert.deepEqual(JSON.parse(readFileSync(file,'utf8')),changed);}finally{rmSync(root,{recursive:true,force:true});}
});
