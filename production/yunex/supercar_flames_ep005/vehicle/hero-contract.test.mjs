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
  assert.equal(c.shape.radius,.034,'no oversize upstream feed');
  assert.deepEqual(c.shape.points.at(-1).slice(1),port.position.slice(1),'feed tube and lip concentric');
  assert.ok(c.shape.points.at(-1)[0]>port.position[0]+.12,'feed pipe must end recessed >120mm behind hollow lip');
  assert.ok(c.shape.points.at(-1)[0]<port.position[0]+.20,'feed pipe cannot terminate outside tapered transition');
  const mount=c.mounts.find(m=>m.name===port.id);
  assert.ok(mount);
  assert.equal(port.node,'mount:'+mount.name);
  assert.deepEqual(mount.position,port.position);
  assert.deepEqual(mount.direction,port.direction);
  assert.deepEqual(port.direction,[-1,0,0]);
  assert.ok(port.position[0]<-contract.bodyLength/2,'outlet behind fascia');
  assert.equal(contract.version,2);
  assert.equal(port.innerRadius,.044);
  assert.equal(port.outerRadius,.058);
  assert.ok(port.innerRadius>0&&port.outerRadius>port.innerRadius);
  assert.ok(Math.abs(port.position[2])<contract.bodyWidth/2);
 }
 assert.equal(contract.ports[0].position[2],-contract.ports[1].position[2]);
});
test('six distinct fully animated review shots / accurate portrait frame count',()=>{
 const ids=recipe.shots.map(s=>s.id);
 assert.equal(new Set(ids).size,ids.length);
 assert.deepEqual(ids,['rear-hook','moving-orbit','front-reveal','driver-cabin','engine-reveal','road-payoff']);
 assert.ok(recipe.shots.every(s=>s.duration>0));
 assert.equal(recipe.shots.reduce((n,s)=>n+Math.round(s.duration*30),0),300);
 assert.deepEqual(recipe.shots.map(s=>s.camera),['chase','reveal','tracking','interior','tracking','chase']);
 assert.ok(recipe.shots.some(s=>s.id==='engine-reveal'&&s.cutaway>.7&&!s.highlight), 'do not neon-highlight engine');
 assert.ok(recipe.shots.some(s=>s.camera==='interior'&&s.cutaway<.25), 'in-cabin camera, no X-ray mannequin');
 assert.ok(recipe.shots.some(s=>s.jointTracks?.['ep005-active-rear-wing']));
 assert.equal(recipe.audio,undefined,'silent preview: do not invent narration');
});

test('premium V3 hero factory includes rig-safe material, moving wheel and real hollow nozzle build',()=>{
 const src=readFileSync(new URL('./hero.ts',import.meta.url),'utf8');
 const detail=readFileSync(new URL('./premium-details.ts',import.meta.url),'utf8');
 assert.match(src,/createCinematicVehicle\(/);
 assert.match(src,/applyEdits\(hero,options.model\)/);
 assert.match(src,/applyEp005PremiumDetails\(hero\)/);
 assert.match(src,/userData\.radius=spec\.innerRadius/);
 assert.match(src,/ep005-\$\{side\}-tapered-nozzle-transition/);
 assert.match(src,/CylinderGeometry\(\.044,\.034,\.125,48,3,true\)/);
 assert.match(detail,/getObjectByName\('wheel-roll'\)/);
 assert.match(detail,/getObjectByName\('driver-rig'\)/);
 assert.match(detail,/function enhanceEngine/);
 assert.match(detail,/bodyHalfWidth\(/);
});

test('full-width portrait hero framing and readable mechanical closeups',()=>{
 const scene=readFileSync(new URL('./HeroEpisode.tsx',import.meta.url),'utf8');
 assert.match(scene,/s\.length\*2\.82/);
 assert.match(scene,/shot\.id==='driver-cabin'\)camera=framed/);
 assert.match(scene,/shot\.id==='engine-reveal'\)camera=framed/);
 assert.equal(recipe.shots.find(s=>s.id==='engine-reveal').highlight,undefined);
});

test('owner correction: real sculpted body geometry and reduced nozzle hardware',()=>{
 const shape=readFileSync(new URL('./body-proportions.ts',import.meta.url),'utf8');
 const hero=readFileSync(new URL('./hero.ts',import.meta.url),'utf8');
 assert.match(hero,/resculptEp005Supercar\(hero\)/);
 assert.match(shape,/body\.userData\.restVertices=/);
 assert.match(shape,/ep005-curved-windscreen/);
 assert.match(shape,/ep005-formed-roof-canopy/);
 assert.match(shape,/ep005-sculpted-rear-haunch-/);
 assert.match(hero,/CylinderGeometry\(\.058,\.058,\.120,48,2,true\)/);
 assert.match(hero,/TorusGeometry\(\.055,\.0025,9,48\)/);
 assert.doesNotMatch(hero,/CylinderGeometry\(\.105,\.105,\.22/);
 assert.equal(contract.nozzleConstruction.surroundOuterRadius,.065);
});
