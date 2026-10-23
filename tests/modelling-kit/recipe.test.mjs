import {test} from 'node:test';import assert from 'node:assert/strict';
import * as recipe from '../../src/yunex/modelling-kit/recipe.ts';
const sample=()=>({id:'braking-demo',title:'How brakes work',vehicle:{variant:'hot-hatch',driver:true},world:{kind:'highway'},shots:[{id:'drive',duration:3,camera:'tracking',action:'cruise',caption:'The wheels keep turning.'},{id:'brake',duration:3,camera:'wheel',action:'braking',caption:'The pads slow the disc.'}]});
test('recipe compiler produces contiguous native frames and exact cut boundaries',()=>{
 assert.equal(typeof recipe.compileRecipe,'function');const r=recipe.compileRecipe(sample());
 assert.equal(r.durationInFrames,180);assert.deepEqual(r.shots.map(s=>[s.startFrame,s.endFrame]),[[0,90],[90,180]]);
 assert.equal(recipe.sampleRecipe(r,89).shot.id,'drive');assert.equal(recipe.sampleRecipe(r,90).shot.id,'brake');assert.equal(recipe.sampleRecipe(r,180).localFrame,89);
});
test('storyboard sampling is deterministic across reverse seeks and preserves cumulative distance',()=>{
 const input=sample(),before=JSON.stringify(input),c=recipe.compileRecipe(input),a=recipe.sampleRecipe(c,130);recipe.sampleRecipe(c,1);assert.deepEqual(recipe.sampleRecipe(c,130),a);assert.equal(JSON.stringify(input),before);
 assert.ok(recipe.sampleRecipe(c,90).state.distance>=recipe.sampleRecipe(c,89).state.distance);assert.equal(recipe.sampleRecipe(c,-1).localFrame,0);
});
test('invalid assets, timing, controls and unsupported drivers are rejected before rendering',()=>{
 for(const mutate of [r=>r.vehicle.variant='missing',r=>r.world.kind='missing',r=>r.shots[0].duration=0,r=>r.shots[1].id='drive',r=>r.shots[0].cutaway=2,r=>r.vehicle={variant:'sport-bike',driver:true},r=>r.shots[0].camera='bad',r=>r.shots[0].action='bad',r=>r.shots[0].duration=.001,r=>r.shots[0].part='bad']){const r=sample();mutate(r);assert.throws(()=>recipe.compileRecipe(r));}
});
test('supplied caption/audio metadata is validated without inventing narration',()=>{
 const r=sample();r.captions=[{start:0,end:1,text:'First'},{start:.5,end:2,text:'Overlaps'}];assert.throws(()=>recipe.compileRecipe(r));
 delete r.captions;r.audio={narration:'../private.mp3'};assert.throws(()=>recipe.compileRecipe(r));r.audio={narration:'audio/original-cedar.mp3'};assert.equal(recipe.compileRecipe(r).audio.narration,'audio/original-cedar.mp3');
});
test('cutaway envelopes and tracked annotations stay finite and recipe output is JSON portable',()=>{
 const r=sample();r.shots[0].cutaway=.9;r.shots[0].annotation={anchor:'engine',text:'Engine'};const c=recipe.compileRecipe(JSON.parse(JSON.stringify(r)));
 for(const f of [0,30,89,90,179]){const s=recipe.sampleRecipe(c,f);assert.ok(Number.isFinite(s.state.frame));assert.ok((s.state.cutaway??0)>=0&&(s.state.cutaway??0)<=1);}
 assert.throws(()=>recipe.sampleRecipe(c,NaN));
});
test('parked cabin cameras retain a gentle absolute-time dolly between gear movements',async()=>{const {drivingCamera}=await import('../../src/yunex/modelling-kit/driving.ts');const {vehicleSpec}=await import('../../src/yunex/world-kit/catalog.ts');const s=vehicleSpec('supercar'),pose={position:[0,0,0],yaw:0};const a=drivingCamera('interior',pose,s,1080/1920,13),b=drivingCamera('interior',pose,s,1080/1920,13+1/30);assert.notDeepEqual(a.position,b.position);assert.deepEqual(a,drivingCamera('interior',pose,s,1080/1920,13));assert.ok(Math.hypot(...a.position.map((n,i)=>n-b.position[i]))<.01);});

test('overhead explanation has a gentle deterministic orbit on featureless road',async()=>{const {drivingCamera}=await import('../../src/yunex/modelling-kit/driving.ts');const {vehicleSpec}=await import('../../src/yunex/world-kit/catalog.ts');const s=vehicleSpec('formula-modern'),pose={position:[0,0,0],yaw:0};const a=drivingCamera('overhead',pose,s,1080/1920,15),b=drivingCamera('overhead',pose,s,1080/1920,18);assert.ok(Math.hypot(...a.position.map((v,i)=>v-b.position[i]))>.05);assert.deepEqual(a,drivingCamera('overhead',pose,s,1080/1920,15));});

test('wheel camera and target stay on the selected side after route rotation',async()=>{const T=await import('three');const {drivingCamera}=await import('../../src/yunex/modelling-kit/driving.ts');const {vehicleSpec}=await import('../../src/yunex/world-kit/catalog.ts');for(const variant of ['hot-hatch','supercar','formula-modern'])for(const yaw of [0,.7,-2.1])for(const side of [-1,1]){const s=vehicleSpec(variant),pose={position:[17,2,-23],yaw},view=drivingCamera('wheel',pose,s,1080/1920,8,{side});for(const point of [view.position,view.target]){const local=new T.Vector3(...point).sub(new T.Vector3(...pose.position)).applyAxisAngle(new T.Vector3(0,1,0),-yaw);assert.ok(local.z*side>s.width*.4,variant+' selected side');}}});
