import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {installStudioExhaust} from '../../src/yunex/modelling-kit/studio-exhaust.ts';
import {vehicleSpec} from '../../src/yunex/world-kit/catalog.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';

test('studio exhaust has realistic 112 mm open outlets, finite walls and recessed trim',()=>{
 const shell=new T.Group(), result=installStudioExhaust(shell,vehicleSpec('supercar'));
 assert.equal(result.outerDiameter,.112);assert.equal(result.outlets.length,2);
 for(const outlet of result.outlets){
  assert.equal(outlet.wallThickness,.004);assert.ok(Math.abs(outlet.innerDiameter-.104)<1e-12);
  const lip=outlet.mount.getObjectByName('studio-exhaust-lip');
  assert.equal(lip.geometry.type,'RingGeometry');
  assert.ok(Math.abs(lip.geometry.parameters.innerRadius-.052)<1e-12);
  assert.equal(lip.geometry.parameters.outerRadius,.056);
  assert.ok(outlet.mount.getObjectByName('studio-exhaust-inner-wall'));
  assert.ok(outlet.mount.getObjectByName('studio-exhaust-recess-trim').position.z<0);
  const ray=new T.Raycaster(outlet.mount.localToWorld(new T.Vector3(0,0,.1)),new T.Vector3(-1,0,0).negate(),0,.25);
  assert.equal(ray.intersectObject(outlet.mount,true).length,0,'bore is genuinely open along its centre');
  const wallRay=new T.Raycaster(outlet.mount.localToWorld(new T.Vector3(.054,0,.1)),new T.Vector3(1,0,0),0,.25);
  assert.ok(wallRay.intersectObject(lip).length>0,'annular lip is physical geometry outside the bore');
  const outer=outlet.mount.getObjectByName('studio-exhaust-outer-wall');
  outer.geometry.computeBoundingBox();
  assert.ok(Math.abs(outer.geometry.boundingBox.getSize(new T.Vector3()).x-.112)<1e-7);
 }
 disposeObject(shell);
});
test('stable named outlet mounts face backward and follow all parent transforms',()=>{
 const shell=new T.Group();shell.position.set(3,2,1);shell.rotation.set(.1,.7,-.2);shell.scale.setScalar(1.2);
 const s=vehicleSpec('coupe'),r=installStudioExhaust(shell,s);shell.updateMatrixWorld(true);
 assert.deepEqual(r.outlets.map(o=>o.side),['left','right']);
 assert.equal(r.mounts.left.name,'exhaust-outlet-left');assert.equal(r.mounts.right.name,'exhaust-outlet-right');
 for(const o of r.outlets){
  const direction=new T.Vector3(0,0,1).transformDirection(o.mount.matrixWorld);
  const expected=new T.Vector3(-1,0,0).transformDirection(shell.matrixWorld);
  assert.ok(direction.distanceTo(expected)<1e-10);
  assert.ok(Math.abs(o.mount.position.x+s.length/2+.075)<1e-10);
  assert.equal(o.mount.position.y,.43);
 }
 assert.ok(r.mounts.left.position.z>0);assert.ok(r.mounts.right.position.z<0);disposeObject(shell);
});
test('rally hatch has one right outlet; diameter defaults suit sports cars',()=>{
 const shell=new T.Group(),r=installStudioExhaust(shell,vehicleSpec('rally-hatch'),{outerDiameter:.12});
 assert.equal(r.outlets.length,1);assert.equal(r.mounts.left,undefined);assert.ok(r.mounts.right);assert.equal(r.outerDiameter,.12);disposeObject(shell);
});
test('invalid dimensions fail before mutating the shell',()=>{
 for(const options of [{outerDiameter:.059},{outerDiameter:.181},{outerDiameter:NaN},{wallThickness:0},{wallThickness:.06},{depth:-1},{centerHeight:Infinity},{lateralOffset:-1},{rearProtrusion:-.1}]){
  const shell=new T.Group();assert.throws(()=>installStudioExhaust(shell,vehicleSpec('supercar'),options));assert.equal(shell.children.length,0);
 }
 const shell=new T.Group();assert.throws(()=>installStudioExhaust(shell,vehicleSpec('boxy-suv')));assert.equal(shell.children.length,0);
});

test('smaller and larger real-world outlets are configurable with stable default wall thickness',()=>{
 for(const outerDiameter of [.06,.08,.15,.18]){
  const shell=new T.Group(),result=installStudioExhaust(shell,vehicleSpec('coupe'),{outerDiameter});
  assert.equal(result.outerDiameter,outerDiameter);
  for(const o of result.outlets)assert.ok(Math.abs(o.innerDiameter-(outerDiameter-.008))<1e-12);
  disposeObject(shell);
 }
});
test('repeat installation rejects duplicate attachment mounts without changing the existing system',()=>{
 const shell=new T.Group(),result=installStudioExhaust(shell,vehicleSpec('supercar'));
 const children=[...shell.children];
 assert.throws(()=>installStudioExhaust(shell,vehicleSpec('supercar')),/already installed/);
 assert.deepEqual(shell.children,children);
 assert.equal(shell.getObjectByName('exhaust-outlet-left'),result.mounts.left);
 disposeObject(shell);
});
