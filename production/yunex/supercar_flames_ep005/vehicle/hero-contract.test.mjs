import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(p)=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const recipe=read('../../../../src/yunex/studio-projects/ep005-a1-hero/recipe.json');
const contract=read('./exhaust-contract.json');
const components=recipe.vehicle.components;
test('authored V3 model and proper animated powertrain and cabin',()=>{
 assert.equal(recipe.id,'ep005-a1-hero');
 assert.equal(recipe.vehicle.variant,'supercar');
 assert.equal(recipe.vehicle.driver,true);
 assert.equal(recipe.vehicle.powertrain.nodes[0].part,'v8');
 assert.equal(recipe.vehicle.powertrain.nodes.filter(n=>n.part==='turbo-small').length,2);
 assert.ok(recipe.vehicle.powertrain.connections.length>=4);
 assert.ok(recipe.vehicle.model.edits.some(e=>e.target==='arched-body'));
 assert.ok(components.some(c=>c.id==='ep005-cabin-display'&&c.parent==='dashboard'));
 assert.ok(components.some(c=>c.id==='ep005-driver-console'&&c.parent==='interior'));
});
test('two named OUTWARD exhaust ports are attached to real continuous tailpipes',()=>{
 assert.deepEqual(contract.ports.map(p=>p.id),['exhaust-tip-left','exhaust-tip-right']);
 assert.ok(components.length>=20);
 const ids=components.map(c=>c.id);
 assert.equal(new Set(ids).size,ids.length);
 for(const port of contract.ports){
  const c=components.find(c=>c.id===port.component);
  assert.ok(c,'port must be on authored geometry');
  assert.equal(c.shape.kind,'pipe');
  assert.equal(c.parent,'body-shell');
  assert.ok(c.shape.points.length>=5);
  assert.ok(c.shape.points[0][0]>-1.5,'pipe must lead forward into engine bay');
  assert.deepEqual(c.shape.points.at(-1),port.position,'geometry ends exactly at anchor');
  const mount=c.mounts.find(m=>m.name===port.id);
  assert.ok(mount);
  assert.equal(port.node,'mount:'+mount.name);
  assert.deepEqual(mount.position,port.position);
  assert.deepEqual(mount.direction,port.direction);
  assert.deepEqual(port.direction,[-1,0,0]);
  assert.ok(port.position[0]<-contract.bodyLength/2,'outlet behind fascia');
  assert.ok(port.innerRadius>0&&port.outerRadius>port.innerRadius);
  assert.ok(Math.abs(port.position[2])<contract.bodyWidth/2);
 }
 assert.equal(contract.ports[0].position[2],-contract.ports[1].position[2]);
});
test('five distinct fully animated review shots / accurate portrait frame count',()=>{
 const ids=recipe.shots.map(s=>s.id);
 assert.equal(new Set(ids).size,ids.length);
 assert.deepEqual(ids,['rear-hook','moving-orbit','driver-cabin','engine-reveal','road-payoff']);
 assert.ok(recipe.shots.every(s=>s.duration>0));
 assert.equal(recipe.shots.reduce((n,s)=>n+Math.round(s.duration*30),0),300);
 assert.deepEqual(recipe.shots.map(s=>s.camera),['chase','reveal','interior','tracking','chase']);
 assert.ok(recipe.shots.some(s=>s.cutaway>.8&&s.highlight==='engine'));
 assert.ok(recipe.shots.some(s=>s.camera==='interior'&&s.cutaway>.5));
 assert.ok(recipe.shots.some(s=>s.jointTracks?.['ep005-active-rear-wing']));
 assert.equal(recipe.audio,undefined,'silent preview: do not invent narration');
});
