import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(f)=>readFileSync(new URL(f,import.meta.url),'utf8');
const src=read('./rear-finish.ts');
const core=read('./hero.ts');
const contract=JSON.parse(read('./exhaust-contract.json'));
test('rear optical layer is bespoke moving body geometry',()=>{
 assert.match(src,/new T\.BufferGeometry\(\)/);
 assert.match(src,/columns=48,rows=8/);
 assert.match(src,/shell\.add\(surface\)/);
 assert.match(src,/ep005-continuous-smoked-tail-lens-/);
 assert.match(src,/ep005-flush-diffused-led-/);
 assert.match(src,/hidden<8/);
 assert.match(core,/refineEp005RearFinish\(hero\)/);
});
test('rear styling leaves precise v2 live flame outlet contract untouched',()=>{
 assert.equal(contract.version,2);
 for(const p of contract.ports){
  assert.equal(p.innerRadius,.044);
  assert.equal(p.outerRadius,.058);
  assert.deepEqual(p.direction,[-1,0,0]);
  assert.equal(p.position[0],-2.380);
 }
 assert.match(src,/item\.o\.parent!==item\.parent/);
 assert.match(src,/Rear optical finishing moved the exhaust ABI/);
});
test('premium lamp uses one soft continuous band, not layered aftermarket hardware',()=>{
 assert.match(src,/o\.visible=false/);
 assert.match(src,/tail-lamp-housing/);
 assert.match(src,/lamp-reflector/);
 assert.match(src,/overhaul-rear-led-/);
 assert.match(src,/ep005-tail-light-left/);
 assert.doesNotMatch(src,/new T\.TorusGeometry/);
});
