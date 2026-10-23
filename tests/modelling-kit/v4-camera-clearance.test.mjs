import test from 'node:test';import assert from 'node:assert/strict';
import {auditCameraClearance} from '../../src/yunex/modelling-kit/camera-clearance.ts';
import {createV4Production} from '../../src/yunex/modelling-kit/v4-production.ts';
import {compileRecipe,sampleRecipe} from '../../src/yunex/modelling-kit/recipe.ts';
import {createCinematicVehicle,animateCinematicVehicle} from '../../src/yunex/modelling-kit/rig.ts';
import {createCinematicEnvironment} from '../../src/yunex/modelling-kit/environments.ts';
import {sampleRoute} from '../../src/yunex/world-kit/environments.ts';
import {sampleCameraMove,fitCameraMove} from '../../src/yunex/modelling-kit/camera-move.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
function scene(fov){const r=createV4Production({kind:'supercar'}).recipe,s=sampleRecipe(compileRecipe(r),74),model=createCinematicVehicle({...r.vehicle,optimize:false}),world=createCinematicEnvironment(r.world),pose=sampleRoute('track',s.state.distance-30);if(fov){s.shot.cameraMove.start.fov=fov;s.shot.cameraMove.end.fov=fov;}animateCinematicVehicle(model,s.state);model.position.fromArray(pose.position);model.rotation.y=pose.yaw;const camera=fitCameraMove(model,sampleCameraMove(s.shot.cameraMove,s.localFrame,s.shot.endFrame-s.shot.startFrame,model,40),9/16);return {model,world,camera};}
test('camera clearance catches the actual near-fence obstruction missed by a centre ray',()=>{const s=scene(40);try{const r=auditCameraClearance(s.model,s.world,s.camera,9/16);assert.equal(r.state,'fail');assert.ok(r.blockers.some(b=>b.name==='circuit-catch-fence-posts'));assert.ok(r.targetSamples>3);assert.match(r.guidance,/lens|camera/i);}finally{disposeObject(s.model);disposeObject(s.world);}});
test('shipped pure-side portrait lens keeps the camera inside the fence with readable full-car framing',()=>{const s=scene();try{const r=auditCameraClearance(s.model,s.world,s.camera,9/16);assert.equal(r.state,'pass',JSON.stringify(r));assert.equal(r.blockedSamples,0);}finally{disposeObject(s.model);disposeObject(s.world);}});
test('camera clearance rejects invalid view inputs with corrective guidance',()=>assert.throws(()=>auditCameraClearance(null,null,{position:[0,1,2],target:[0,0,0],fov:40},0),/positive.*aspect/i));
