import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {compileRecipe,sampleRecipe} from '../../src/yunex/modelling-kit/recipe.ts';
import {sampleCameraMove,fitCameraMove} from '../../src/yunex/modelling-kit/camera-move.ts';
const move={start:{position:[6,3,-5],target:[0,1,0],fov:40},end:{position:[-6,4,-8],target:[1,1,0],fov:50}};
const recipe=()=>({id:'camera-test',title:'Camera test',vehicle:{variant:'supercar'},world:{kind:'highway'},shots:[{id:'one',duration:2,camera:'tracking',action:'acceleration',caption:'',cameraMove:structuredClone(move),speedScale:2},{id:'two',duration:1,camera:'chase',action:'cruise',caption:'',speedScale:3}]});

test('local camera endpoints and interpolation use actual model transform and shot frame endpoints',()=>{
 const model=new T.Group();model.position.set(9,2,-3);model.rotation.set(.1,.7,.2);model.scale.setScalar(1.2);model.updateMatrixWorld(true);
 const start=sampleCameraMove(move,0,60,model,42),end=sampleCameraMove(move,59,60,model,42),mid=sampleCameraMove(move,29.5,60,model,42);
 assert.deepEqual(start.position,new T.Vector3(...move.start.position).applyMatrix4(model.matrixWorld).toArray());
 assert.deepEqual(end.target,new T.Vector3(...move.end.target).applyMatrix4(model.matrixWorld).toArray());
 assert.equal(mid.fov,45);
 assert.ok(new T.Vector3(...mid.position).distanceTo(new T.Vector3(...start.position).lerp(new T.Vector3(...end.position),.5))<1e-10);
 assert.deepEqual(sampleCameraMove(move,59,60,model,42),end);
 assert.deepEqual(sampleCameraMove(move,0,1,model,42),start);
 const smooth={...move,easing:'smooth'};
 assert.ok(sampleCameraMove(smooth,10,60,model,42).fov<sampleCameraMove(move,10,60,model,42).fov);
});

test('speed scale changes physical speed acceleration and analytically integrated continuous distance',()=>{
 const r=compileRecipe(recipe()),a=sampleRecipe(r,30),b=sampleRecipe(r,60);
 assert.equal(a.state.speed,13);assert.equal(a.state.acceleration,7);assert.equal(a.state.distance,9.5);
 assert.equal(b.state.distance,26);assert.equal(b.state.speed,36);
 const h=1/30;assert.ok(Math.abs((sampleRecipe(r,31).state.distance-a.state.distance)/h-(a.state.speed+7*h/2))<1e-10);
 const seek=sampleRecipe(r,17);sampleRecipe(r,76);assert.deepEqual(sampleRecipe(r,17),seek);
 const defaults=recipe();delete defaults.shots[0].speedScale;assert.equal(sampleRecipe(compileRecipe(defaults),30).state.speed,6.5);
});

test('invalid camera controls and speed scales are rejected before rendering',()=>{
 for(const speedScale of [0,.249,3.001,Infinity,'2']){const r=recipe();r.shots[0].speedScale=speedScale;assert.throws(()=>compileRecipe(r),/speed scale/i);}
 for(const change of [m=>m.start.position=[1,2],m=>m.end.target=[0,NaN,0],m=>m.start.fov=0,m=>m.end.fov=180,m=>m.easing='bounce',m=>m.start.target=[...m.start.position],m=>m.end=null]){const r=recipe();change(r.shots[0].cameraMove);assert.throws(()=>compileRecipe(r),/camera move/i);}
 const r=recipe();r.vehicle.bodyDetail='studio';r.presentation='cinematic';assert.equal(compileRecipe(r).presentation,'cinematic');r.presentation='flashy';assert.throws(()=>compileRecipe(r),/presentation/i);
});


test('overview camera moves fit the entire transformed vehicle in portrait and landscape',()=>{
 const model=new T.Group(),mesh=new T.Mesh(new T.BoxGeometry(4.8,1.4,2),new T.MeshBasicMaterial());mesh.position.y=.9;model.add(mesh);
 model.position.set(16,3,-11);model.rotation.set(.12,.8,.06);model.updateMatrixWorld(true);
 const close={start:{position:[1,1,-1],target:[0,.9,0],fov:42},end:{position:[-2,2,-1],target:[0,.9,0],fov:48}};
 const overhead={start:{position:[0,2,0],target:[0,.9,0]},end:{position:[0,4,0],target:[0,.9,0]}};
 for(const aspect of [9/16,16/9])for(const move of [close,overhead])for(const frame of [0,15,29]){
  const camera=fitCameraMove(model,sampleCameraMove(move,frame,30,model,42),aspect);
  const view=new T.PerspectiveCamera(camera.fov,aspect,.025,500);view.position.fromArray(camera.position);view.lookAt(new T.Vector3(...camera.target));view.updateMatrixWorld(true);
  for(const x of [-2.4,2.4])for(const y of [-.7,.7])for(const z of [-1,1]){const point=new T.Vector3(x,y,z).applyMatrix4(mesh.matrixWorld).project(view);assert.ok(Math.abs(point.x)<.87&&Math.abs(point.y)<.65&&point.z>-1&&point.z<1,JSON.stringify(point));}
 }
 const wide=sampleCameraMove({...move,start:{...move.start,position:[60,30,-50]}},0,60,model,42);
 assert.deepEqual(fitCameraMove(model,wide,9/16),wide);
});
