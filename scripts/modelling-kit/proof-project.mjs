/** Repeat a canonical proof without overwriting a specialist's modified project. */
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {createProject} from './studio.mjs';
export function prepareProofProject(root,recipe){
 const canonical=JSON.parse(JSON.stringify(recipe)),folder=resolve(root,'src/yunex/studio-projects',recipe.id);
 if(existsSync(folder)){
  const file=resolve(folder,'recipe.json');
  if(!existsSync(file)||!isDeepStrictEqual(JSON.parse(readFileSync(file,'utf8')),canonical))throw Error('Existing proof project has different or modified inputs; use another project id. Nothing was overwritten.');
  if(!existsSync(resolve(folder,'entry.tsx')))throw Error('Existing proof project has no source entry');
  return folder;
 }
 const created=createProject(root,recipe.id,'braking');writeFileSync(resolve(created,'recipe.json'),JSON.stringify(canonical,null,2)+'\n');return created;
}
