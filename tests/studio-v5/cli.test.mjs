import {test} from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,rmSync,writeFileSync,readFileSync} from 'node:fs';import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';import {spawnSync} from 'node:child_process';
const cli=resolve('scripts/studio-v5/studio.mjs');
test('agent CLI creates a round-trip-valid configuration and diagnoses invalid shot settings',()=>{
 const dir=mkdtempSync(join(tmpdir(),'yunex-cli-')),run=(...args)=>spawnSync(process.execPath,['--experimental-strip-types',cli,...args],{cwd:dir,encoding:'utf8'});
 try{const made=run('create','rally','stage.json');assert.equal(made.status,0,made.stderr);const valid=run('validate','stage','stage.json');assert.equal(valid.status,0,valid.stderr);assert.match(valid.stdout,/Valid/);assert.notEqual(run('create','rally','stage.json').status,0);
 const props=JSON.parse(readFileSync(join(dir,'stage.json')));props.camera={distance:2};writeFileSync(join(dir,'stage.json'),JSON.stringify(props));const invalid=run('validate','stage','stage.json');assert.notEqual(invalid.status,0);assert.match(invalid.stderr,/distance.*8/);
 for(const extra of [{config:{preset:'rally',road:{width:1}}},{config:{preset:'city',road:{points:[[0,0,0],[1,0,0]]}}},{config:{preset:'city'},scanned:'false'}]){writeFileSync(join(dir,'stage.json'),JSON.stringify(extra));assert.notEqual(run('validate','stage','stage.json').status,0);}
 }finally{rmSync(dir,{recursive:true,force:true});}
});
