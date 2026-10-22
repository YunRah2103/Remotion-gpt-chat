import {test} from 'node:test';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
test('catalogue search narrows vehicles, mechanical parts and environments without changing complete inventory',()=>{
 const run=q=>JSON.parse(execFileSync(process.execPath,['--experimental-strip-types','scripts/modelling-kit/studio.mjs','catalog',...q],{encoding:'utf8'}));
 const all=run([]),ev=run(['electric']);assert.equal(all.vehicles.length,35);assert.equal(all.environments.length,20);assert.ok(ev.vehicles.length<35);assert.ok(ev.vehicles.some(v=>v.id==='city-ev'));assert.ok(ev.parts.some(p=>p.id==='ev-drive'));assert.equal(run(['no-such-part-xyz']).parts.length,0);
});
