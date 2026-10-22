import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createCinematicVehicle,animateCinematicVehicle} from '../../src/yunex/modelling-kit/rig.ts';
import {createCinematicEnvironment} from '../../src/yunex/modelling-kit/environments.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';

test('road heroes have fitted sculpted intake surrounds and recessed grille geometry',()=>{
 for(const variant of ['hot-hatch','supercar','boxy-suv']){
  const g=createCinematicVehicle({variant,optimize:false});
  for(const name of ['sculpted-intake-surround','recessed-grille','rear-diffuser-channel'])assert.ok(g.getObjectByName(name),`${variant}: ${name}`);
  const shell=g.getObjectByName('body-shell'),intake=g.getObjectByName('sculpted-intake-surround');
  assert.equal(intake.parent,shell);
  animateCinematicVehicle(g,{frame:80,fps:30,cutaway:1});assert.ok(intake.material.opacity<.1);
  animateCinematicVehicle(g,{frame:0,fps:30});assert.equal(intake.material.opacity,1);
  assert.ok(new T.Box3().setFromObject(intake).min.y>.15);
  disposeObject(g);
 }
});
test('Formula hero gains continuous sidepod skins and connected rear wing supports',()=>{
 const g=createCinematicVehicle({variant:'formula-modern'});
 assert.ok(g.getObjectByName('sculpted-sidepod'));
 assert.ok(g.getObjectByName('swan-neck-support'));
 assert.ok(g.getObjectByName('sidepod-inlet-lip'));
 disposeObject(g);
});
test('cinematic world detail adds location-specific geometry with a lightweight escape hatch',()=>{
 for(const [kind,name] of [['highway','motorway-overpass'],['city','shopfront-mullions'],['track','circuit-tyre-stacks'],['mountain','retaining-wall'],['garage','workshop-drawers'],['showroom','showroom-light-baffles']]){
  const g=createCinematicEnvironment({kind,quality:'hero',seed:42});assert.ok(g.getObjectByName(name),kind);disposeObject(g);
  const light=createCinematicEnvironment({kind,quality:'lightweight'});assert.ok(!light.getObjectByName('premium-world-detail'));disposeObject(light);
 }
 assert.throws(()=>createCinematicEnvironment({kind:'city',quality:'invalid'}));
});
test('new world batching is deterministic and keeps motorway furniture clear of all lanes',()=>{
 const a=createCinematicEnvironment({kind:'highway',seed:9}),b=createCinematicEnvironment({kind:'highway',seed:9});
 const x=a.getObjectByName('motorway-acoustic-panels'),y=b.getObjectByName('motorway-acoustic-panels');assert.ok(x?.isInstancedMesh);
 assert.deepEqual(Array.from(x.instanceMatrix.array),Array.from(y.instanceMatrix.array));
 const m=new T.Matrix4();for(let i=0;i<x.count;i++){x.getMatrixAt(i,m);assert.ok(Math.abs(m.elements[14])>8);}
 disposeObject(a);disposeObject(b);
});

test('intact shell preserves authored surface normals and restores them after a dent',()=>{
 const g=createCinematicVehicle({variant:'hot-hatch'}),body=g.getObjectByName('arched-body');
 assert.ok(body.userData.restNormals,'authored normals must survive cutout tessellation');
 const normals=Array.from(body.geometry.attributes.normal.array);
 animateCinematicVehicle(g,{frame:90,fps:30,bodyDamage:1});
 animateCinematicVehicle(g,{frame:0,fps:30});assert.deepEqual(Array.from(body.geometry.attributes.normal.array),normals);
 disposeObject(g);
});

test('premium grille cells sit ahead of their backing rather than behind the legacy solid grille',()=>{
 const g=createCinematicVehicle({variant:'hot-hatch',optimize:false});
 assert.equal(g.getObjectByName('grille').visible,false);
 const cells=new T.Box3().setFromObject(g.getObjectByName('recessed-grille')),back=new T.Box3().setFromObject(g.getObjectByName('grille-backing'));
 assert.ok(cells.min.x>back.max.x);disposeObject(g);
});
