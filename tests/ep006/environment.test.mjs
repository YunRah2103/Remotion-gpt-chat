import assert from 'node:assert/strict';
import test from 'node:test';
import {heightAt,sampleEp006Ground,EP006_JUMP_LANDMARKS,
  EP006_STAGE_LIMITS,ep006RoadHalfWidth} from '../../src/yunex/ep006/environment/surface.ts';
import {createEp006Stage} from '../../src/yunex/ep006/environment/stage.ts';

test('all EP006 jump and landing heights and normal components are finite',()=>{
  for(const x of [-100,-36,-1,0,3,12,42,52,63,250,574,610,613,652,662,673,790])
    for(const z of [-100,-15,-5,-4.25,-1.18,0,1.18,4.25,5,15,100]){
      const s=sampleEp006Ground(x,z);
      assert.ok(Number.isFinite(s.heightM));
      assert.ok(s.normal.every(Number.isFinite));
      assert.ok(Math.abs(Math.hypot(...s.normal)-1)<1e-8);
      assert.ok(s.normal[1]>.01,'terrain normal is never upside down');
    }
});
test('jump crests and landing aprons are clear and physically continuous',()=>{
  for(const j of Object.values(EP006_JUMP_LANDMARKS)){
    const [a,b]=j.landingZoneX;
    assert.ok(heightAt(j.crestX,0)>heightAt(a,0)+2,'jump crest must be visible');
    assert.ok(heightAt(j.crestX,0)>heightAt(b,0)+2,'landing must be distinctly below takeoff');
    let prior=heightAt(j.approachX,0);
    for(let x=j.approachX+.025;x<=b;x+=.025){
      const h=heightAt(x,0);
      assert.ok(Math.abs(h-prior)<.05,'no height discontinuity over 2.5cm');
      prior=h;
    }
  }
});
test('road edge/tyre track heights are stable under cross samples',()=>{
  for(let x=-90;x<760;x+=7.3){
    const half=ep006RoadHalfWidth(x);
    assert.ok(half>4 && half<4.6);
    assert.equal(sampleEp006Ground(x,0).isRoad,true);
    assert.equal(sampleEp006Ground(x,half+.1).isRoad,false);
    for(const z of [-1.18,1.18,-.83,.83]){
      const h=heightAt(x,z),next=heightAt(x+.1,z);
      assert.ok(Math.abs(h-next)<.1,'contact sampler must vary smoothly');
    }
  }
});
test('road surface mesh exactly samples the exported collision function',()=>{
  const world=createEp006Stage({sceneryDensity:0});
  const road=world.getObjectByName('ep006-gravel-contact-mesh');
  assert.ok(road);
  const pos=road.geometry.getAttribute('position');
  for(let i=0;i<pos.count;i+=41){
    const x=pos.getX(i),z=pos.getZ(i);
    assert.ok(Math.abs(pos.getY(i)-heightAt(x,z))<.00025,'rendered triangle vertex differs from collision surface');
  }
  assert.equal(EP006_STAGE_LIMITS.maxX>=EP006_JUMP_LANDMARKS.J2.landingZoneX[1],true);
});
