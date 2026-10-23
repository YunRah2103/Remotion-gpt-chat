import {writeFileSync} from 'node:fs';
import {createProject} from './studio.mjs';
import {REGENERATION_DEMO} from '../../src/yunex/modelling-kit/regeneration-demo.ts';
const folder=createProject(process.cwd(),REGENERATION_DEMO.id,'braking');
writeFileSync(`${folder}/recipe.json`,JSON.stringify(REGENERATION_DEMO,null,2)+'\n');
console.log(folder);
