import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createV4Production,V4_DEMONSTRATIONS,v4ReviewPlan} from '../../src/yunex/modelling-kit/v4-production.ts';
import {createProject,validateProject} from './studio.mjs';

/** Preflight the entire batch before touching any existing source project. */
export function createV4Projects(root,kinds=Object.keys(V4_DEMONSTRATIONS)){
 if(!Array.isArray(kinds)||!kinds.length||new Set(kinds).size!==kinds.length)throw Error('Choose distinct demonstration kinds');
 const productions=kinds.map(kind=>createV4Production({kind}));
 for(const {recipe} of productions)if(existsSync(resolve(root,'src/yunex/studio-projects',recipe.id)))throw Error(`Refusing to overwrite ${recipe.id}`);
 return productions.map(({recipe,storyboard})=>{const folder=createProject(root,recipe.id,'powertrain');writeFileSync(resolve(folder,'recipe.json'),JSON.stringify(recipe,null,2)+'\n');writeFileSync(resolve(folder,'storyboard.json'),JSON.stringify(storyboard,null,2)+'\n');return folder;});
}
export function main(args=process.argv.slice(2),root=process.cwd()){
 const [command,name]=args;
 if(command==='create')return console.log(createV4Projects(root,name&&name!=='all'?[name]:undefined).join('\n'));
 if(command==='plan'){
  if(name&&Object.hasOwn(V4_DEMONSTRATIONS,name))return console.log(JSON.stringify(v4ReviewPlan(createV4Production({kind:name}).recipe),null,2));
  const {folder}=validateProject(root,name);return console.log(JSON.stringify(v4ReviewPlan(JSON.parse(readFileSync(resolve(folder,'recipe.json'),'utf8'))),null,2));
 }
 throw Error('Use v4-proof.mjs create [all|supercar|rally|film] | plan <kind|project-slug>');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){try{main();}catch(error){console.error(error.message);process.exitCode=1;}}
