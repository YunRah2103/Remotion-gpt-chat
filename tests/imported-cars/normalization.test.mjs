import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {normalizeImportedScene} from '../../src/yunex/imported-cars/normalize.ts';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,a+' != '+b);

test('a transformed authored GLB is centered, on the ground and full length',()=>{
 const source=new T.Group();
 source.position.set(13,-4,8);
 source.scale.set(2,3,4);
 source.rotation.y=.2;
 const mesh=new T.Mesh(new T.BoxGeometry(4,1,2));
 mesh.position.set(2,3,-1);source.add(mesh);
 source.updateMatrixWorld(true);
 const before=new T.Box3().setFromObject(source,true);
 const expected=before.getSize(new T.Vector3());
 const {cloned}=normalizeImportedScene(source,'fixture',4.7);
 const after=new T.Box3().setFromObject(cloned,true);
 const size=after.getSize(new T.Vector3());
 near(Math.max(size.x,size.z),4.7);
 near(size.y/size.x,expected.y/expected.x);
 near(size.z/size.x,expected.z/expected.x);
 near(after.min.y,0);
 near(after.getCenter(new T.Vector3()).x,0);
 near(after.getCenter(new T.Vector3()).z,0);
 assert.deepEqual(source.position.toArray(),[13,-4,8]);
 assert.deepEqual(source.scale.toArray(),[2,3,4]);
});
test('matrix-authored roots keep their untouched world transform',()=>{
 const source=new T.Group();source.matrixAutoUpdate=false;
 source.matrix.compose(new T.Vector3(7,2,-3),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),.6),new T.Vector3(2,2,2));
 source.add(new T.Mesh(new T.BoxGeometry(4,1,2)));
 const matrix=source.matrix.toArray();
 const {cloned}=normalizeImportedScene(source,'matrix-root',5);
 const bounds=new T.Box3().setFromObject(cloned,true);
 near(Math.max(bounds.getSize(new T.Vector3()).x,bounds.getSize(new T.Vector3()).z),5);
 near(bounds.min.y,0);
 assert.deepEqual(source.matrix.toArray(),matrix);
});
test('empty meshes or invalid target lengths fail rather than making pancake cars',()=>{
 assert.throws(()=>normalizeImportedScene(new T.Group(),'empty',4.7),/no usable geometry/);
 for(const length of [NaN,Infinity,0,-1,30])
  assert.throws(()=>normalizeImportedScene(new T.Group(),'invalid',length),/Invalid target length/);
});
