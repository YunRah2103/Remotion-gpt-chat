import {test} from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {prepareConceptVehicle} from '../../src/yunex/studio-v5/concept.ts';
import {animateImportedVehicle} from '../../src/yunex/studio-v5/import.ts';
test('authored car adapter straightens source wheels while calipers stay on steering mounts',()=>{
 const source=new T.Group();for(const [name,x,z]of [['WheelFrontL',1,1.4],['WheelFrontR',-1,1.4],['WheelRearL',1,-1.4],['WheelRearR',-1,-1.4]]){const wheel=new T.Group();wheel.name=name;wheel.position.set(x,.384,z);wheel.rotation.y=name.includes('Front')?-.5:0;const pad=new T.Mesh(new T.BoxGeometry(),new T.MeshStandardMaterial());pad.name=name+'BrakePad';wheel.add(pad);source.add(wheel);}
 const before=source.getObjectByName('WheelFrontL').quaternion.clone(),rig=prepareConceptVehicle(source);assert.ok(source.getObjectByName('WheelFrontL').quaternion.equals(before));
 rig.updateMatrixWorld(true);const axis=new T.Vector3(1,0,0).applyQuaternion(rig.getObjectByName('WheelFrontL').getWorldQuaternion(new T.Quaternion()));assert.ok(Math.abs(axis.z)>.9999);
 const pad=rig.getObjectByName('WheelFrontLBrakePad'),q=pad.getWorldQuaternion(new T.Quaternion());animateImportedVehicle(rig,10,0);rig.updateMatrixWorld(true);assert.ok(pad.getWorldQuaternion(new T.Quaternion()).angleTo(q)<1e-6);assert.equal(pad.parent.name,'steer-frontLeft');
});
test('vendored model retains verified bytes, author licence and all four named wheels',async()=>{
 const {readFileSync}=await import('node:fs'),{createHash}=await import('node:crypto'),data=readFileSync('public/yunex-v5/concept-car/CarConcept.glb'),source=JSON.parse(readFileSync('public/yunex-v5/concept-car/source.json','utf8'));
 assert.equal(createHash('sha256').update(data).digest('hex'),source.sha256);assert.equal(data.readUInt32LE(0),0x46546c67);assert.equal(data.readUInt32LE(4),2);
 const j=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString());assert.match(j.asset.copyright,/CC BY 4.0/);assert.match(j.asset.copyright,/Eric Chadwick/);for(const name of ['WheelFrontL','WheelFrontR','WheelRearL','WheelRearR'])assert.equal(j.nodes.filter(n=>n.name===name).length,1);assert.ok(j.nodes.length>90);
});
