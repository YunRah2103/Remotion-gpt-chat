/** Exercise the normal agent project workflow, without a special-purpose renderer. */
import {writeFileSync} from 'node:fs';
import {createProject} from './studio.mjs';
import {TWIN_TURBO_DEMO} from '../../src/yunex/modelling-kit/twin-turbo-demo.ts';
const folder=createProject(process.cwd(),'twin-turbo-complete','powertrain');
writeFileSync(`${folder}/recipe.json`,JSON.stringify(TWIN_TURBO_DEMO,null,2)+'\n');
console.log(folder);
