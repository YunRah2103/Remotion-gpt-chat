import test from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {sampleRaceFrame,getRaceComparison} from '../../src/yunex/f1-line-ep002/physics/index.ts';
import {editAtFrame} from '../../src/yunex/f1-line-ep002/editor/timeline.ts';
import {getPremiumEditorialCamera} from '../../src/yunex/f1-line-ep002/editor/premiumCamera.ts';
import {getRaceCamera} from '../../src/yunex/f1-line-ep002/cinema/cameras.ts';

const FRAMES=696;
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);

test('23.2s portrait film is exactly 696 chronological frames, existing physics unchanged',()=>{
 assert.equal(FRAMES/30,23.2);
 const comparison=getRaceComparison();
 assert.ok(Math.abs(comparison.racingFinishAdvantageSeconds-.13218395)<1e-5);
 for(const frame of [0,36,60,120,180,250,302,330,402,480,540,588,653,654,695]){
  const edit=editAtFrame(frame);
  assert.equal(edit.start<=frame&&edit.end>frame,true);
  if(frame>=480&&frame<=653)assert.equal(edit.replay,false);
 }
 assert.equal(editAtFrame(480).sourceSeconds,0);
 assert.ok(Math.abs(editAtFrame(653).sourceSeconds-5.7666666667)<1e-6);
});
test('cinematography is deterministic, seeks in any order, preserves readable 9:16 sight lines',()=>{
 const requested=[695,0,330,180,16,599,480,250,695,120,540,5];
 for(const frame of requested){
  const edit=editAtFrame(frame);
  const sim=sampleRaceFrame(edit.sourceSeconds*30,30);
  const c=getPremiumEditorialCamera(edit,sim,frame);
  assert.deepEqual(c,getPremiumEditorialCamera(edit,sim,frame));
  assert.ok(c.fov>=28&&c.fov<=70);
  assert.ok(c.position.every(Number.isFinite));
  assert.ok(c.target.every(Number.isFinite));
  assert.ok(distance(c.position,c.target)>1);
 }
 assert.throws(()=>getPremiumEditorialCamera(editAtFrame(0),sampleRaceFrame(0,30),696));
});
test('premium editorial cameras physically move relative to original locked picture rigs',()=>{
 const counts=new Map();
 for(const frame of [0,13,32,40,67,108,145,178,201,236,271,311,346,401,438,475,508,563,601,646,675,692]){
  const edit=editAtFrame(frame),state=sampleRaceFrame(edit.sourceSeconds*30,30);
  const base=getRaceCamera(edit.shot,state,edit.sourceFrame);
  const shot=getPremiumEditorialCamera(edit,state,frame);
  counts.set(edit.shot,(counts.get(edit.shot)||0)+1);
  assert.ok(distance(shot.position,base.position)>.04 || Math.abs(shot.fov-base.fov)>.08,
            edit.shot+' camera should not be old static framing');
 }
 assert.ok(counts.size>=9);
});
test('real 3D car footprints stay in view during key shots: no cropped wings or tyre',()=>{
 const checks=[0,12,32,36,56,60,77,103,120,148,175,180,208,240,
  250,274,300,330,354,391,402,427,468,480,511,535,540,565,586,
  588,607,634,653,654,673,695];
 let tested=0;
 for(const filmFrame of checks){
  const edit=editAtFrame(filmFrame);
  if(edit.shot==='onboard')continue; // immersive forward road POV, subject car intentionally behind lens
  const state=sampleRaceFrame(edit.sourceSeconds*30,30);
  const view=getPremiumEditorialCamera(edit,state,filmFrame);
  const cam=new PerspectiveCamera(view.fov,9/16,.1,500);
  cam.position.set(...view.position);
  cam.lookAt(new Vector3(...view.target));
  cam.updateProjectionMatrix();cam.updateMatrixWorld();
  const ids=edit.shot==='opening'||edit.shot==='duel'||edit.shot==='overhead'||
    edit.shot==='force'||edit.shot==='apex'||edit.shot==='final'
    ?['shortcut','racing']:[edit.shot==='shortcut'?'shortcut':'racing'];
  for(const id of ids){
   const c=state.cars[id],o=c.worldPose.position,th=c.worldPose.yaw;
   for(const f of [-2.9,2.9])for(const side of [-1.18,1.18])for(const h of [.13,1.45]){
    const p=new Vector3(o[0]+f*Math.cos(th)+side*Math.sin(th),
      o[1]+h,o[2]-f*Math.sin(th)+side*Math.cos(th)).project(cam);
    assert.ok(p.z>=-1&&p.z<=1,'off depth @ frame '+filmFrame+' '+id);
    assert.ok(Math.abs(p.x)<.9,'horizontal wing crop @ '+filmFrame+' '+id+': '+p.x);
    assert.ok(Math.abs(p.y)<.9,'vertical wing crop @ '+filmFrame+' '+id+': '+p.y);
    tested++;
   }
  }
 }
 assert.ok(tested>350);
});
