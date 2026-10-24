import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const bin=new URL('../../scripts/yunex-agent-car.mjs',import.meta.url).pathname;
function run(...args){
 return spawnSync(process.execPath,[bin,...args],{encoding:'utf8'});
}
test('agents can find all 108 real imported assets',()=>{
 const r=run('list');
 assert.equal(r.status,0,r.stderr);
 const lines=r.stdout.trim().split('\n');
 assert.equal(lines.length,108);
 assert.ok(lines.some(s=>s.startsWith('ferrari-f40\tATTRIBUTION REQUIRED')));
 assert.ok(lines.some(s=>s.startsWith('external:bugatti-2019-bugatti-divo\tPRIVATE REVIEW ONLY')));
});
test('agents cannot silently acquire or render rights-unverified cars',()=>{
 const id='external:bugatti-2019-bugatti-divo';
 for(const command of ['fetch','preview']){
  const r=run(command,id,'--dry-run');
  assert.equal(r.status,1);
  assert.match(r.stderr,/PRIVATE REVIEW ONLY/);
 }
 const permitted=run('preview',id,'--private-review','--dry-run');
 assert.equal(permitted.status,0,permitted.stderr);
 assert.match(permitted.stdout,/YunexImportedCarPreview/);
 assert.match(permitted.stdout,/privateReview/);
});
test('agent can construct a native Ferrari render without a private gate',()=>{
 const r=run('preview','ferrari-f40','--dry-run');
 assert.equal(r.status,0,r.stderr);
 assert.match(r.stdout,/1080|YunexImportedCarPreview/);
 assert.match(r.stdout,/--codec=h264/);
});
