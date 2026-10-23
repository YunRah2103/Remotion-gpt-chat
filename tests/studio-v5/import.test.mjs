import {test} from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {adaptImportedVehicle,animateImportedVehicle} from '../../src/yunex/studio-v5/import.ts';
function fixture(){const root=new T.Group();for(const [name,x,z] of [['fl',1.4,.8],['fr',1.4,-.8],['rl',-1.4,.8],['rr',-1.4,-.8]]){const m=new T.Mesh(new T.CylinderGeometry(.35,.35,.2),new T.MeshStandardMaterial());m.name=name;m.position.set(x,.35,z);root.add(m);}return root;}
const spec={sourceUrl:'https://example.com/model',license:'CC0-1.0',author:'Fixture',radius:.35,wheels:{frontLeft:'fl',frontRight:'fr',rearLeft:'rl',rearRight:'rr'}};
test('import adapter preserves source mesh/material and creates animated wheel pivots',()=>{
 const source=fixture(),before=source.getObjectByName('fl').position.toArray(),rig=adaptImportedVehicle(source,spec);
 animateImportedVehicle(rig,10,.2);assert.deepEqual(source.getObjectByName('fl').position.toArray(),before);assert.equal(source.children.length,4);
 const roll=rig.getObjectByName('roll-frontLeft');assert.equal(roll.rotation.z,-10/.35);assert.equal(roll.parent.rotation.y,.2);
 animateImportedVehicle(rig,4,0);animateImportedVehicle(rig,10,.2);assert.equal(roll.rotation.z,-10/.35);
 assert.equal(rig.getObjectByName('fl').material,source.getObjectByName('fl').material);
});
test('missing/duplicate names, absent provenance and invalid dimensions reject',()=>{
 assert.throws(()=>adaptImportedVehicle(fixture(),{...spec,license:''}),/license/);
 assert.throws(()=>adaptImportedVehicle(fixture(),{...spec,radius:0}),/radius/);
 assert.throws(()=>adaptImportedVehicle(fixture(),{...spec,wheels:{...spec.wheels,frontLeft:'missing'}}),/unique/);
});
