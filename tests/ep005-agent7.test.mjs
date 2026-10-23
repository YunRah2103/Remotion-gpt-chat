import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {sampleActualPorts,adaptAgent6WorldPorts,adaptApprovedV4WorldPorts} from '../src/yunex/ep005/agent7/ports.ts';
import {createAfterfireRig,animateAfterfire,pulseEnvelope} from '../src/yunex/ep005/agent7/afterfire.ts';
import {buildScienceEngine,animateScienceEngine} from '../src/yunex/ep005/agent7/science.ts';

function setup(){
  const car=new T.Group();car.position.set(5,0,7);car.rotation.y=.37;
  for(const [name,side] of [['tip-L',.53],['tip-R',-.53]]){
    const port=new T.Group();port.name=name;port.position.set(-2,.27,side);
    car.add(port);
  }
  const manifest={version:1,owner:'agent6',coordinateConvention:'three-y-up-metres',
    mounts:[{id:'left',nodeName:'tip-L',mouthOffset:[0,0,0],outward:[-1,0,0],innerRadiusM:.045,outerDiameterM:.11},
      {id:'right',nodeName:'tip-R',mouthOffset:[0,0,0],outward:[-1,0,0],innerRadiusM:.045,outerDiameterM:.11}]};
  return {car,manifest};
}
test('ports resolve from real named moving nodes, even with vehicle yaw and translation',()=>{
  const {car,manifest}=setup();
  const ports=sampleActualPorts(car,manifest,15,30);
  assert.equal(ports.length,2);assert.equal(ports[0].frame,15);
  assert.ok(Math.abs(ports[0].origin.x-5)>1);
  assert.ok(Math.abs(ports[0].outward.z)>.2);
  const before=ports[0].origin.clone();car.position.x+=3;
  assert.ok(sampleActualPorts(car,manifest,16,30)[0].origin.distanceTo(before)>2.9);
});
test('no fictional exhaust positions or comically enlarged tips',()=>{
  const {car,manifest}=setup();
  assert.throws(()=>sampleActualPorts(car,{...manifest,mounts:[]},0,30));
  assert.throws(()=>sampleActualPorts(car,{...manifest,mounts:[manifest.mounts[0],manifest.mounts[0]]},0,30));
  assert.throws(()=>sampleActualPorts(car,{...manifest,mounts:manifest.mounts.map(m=>({...m,nodeName:'unconfirmed'}))},0,30));
  assert.throws(()=>sampleActualPorts(car,{...manifest,mounts:manifest.mounts.map(m=>({...m,outerDiameterM:.44}))},0,30));
});
test('brief deterministic flames shut off at idle; use exact same moving world coordinates',()=>{
  const {car,manifest}=setup(),rig=createAfterfireRig(),p=[{at:0,duration:.4,strength:1}];
  const ports=sampleActualPorts(car,manifest,3,30);
  animateAfterfire(rig,ports,.1,p);
  assert.equal(rig.jets.left.root.visible,true);
  assert.ok(rig.jets.left.root.position.distanceTo(ports[0].origin)<1e-8);
  assert.ok(pulseEnvelope(.41,p[0])===0);
  animateAfterfire(rig,sampleActualPorts(car,manifest,30,30),1,p);
  assert.equal(rig.jets.left.root.visible,false);
  assert.equal(rig.jets.left.spill.intensity,0);
});
test('science cutaway contains connected geometry and deterministic mechanical motion',()=>{
  const assembly=buildScienceEngine();
  assert.equal(assembly.pistons.length,8);
  assert.ok(assembly.gas.length>=20);
  let headers=0;assembly.root.traverse(o=>{if(o.name==='individual tubular exhaust runner')headers++});
  assert.equal(headers,8);
  animateScienceEngine(assembly,.12,1);
  const a=assembly.pistons[0].head.position.y;
  animateScienceEngine(assembly,.32,2);
  assert.notEqual(assembly.pistons[0].head.position.y,a);
  assert.ok(assembly.gas.some(g=>g.mesh.visible));
});

test('NEW Agent 6 actual sampled world transforms have no duplicate transform and enforce port ABI',()=>{
  const raw=[
    {frame:10,name:'exhaust-left',worldOrigin:[-2,.61,-2.53],worldOutward:[0,0,-1],innerRadiusM:.041,visibleOuterDiameterM:.114},
    {frame:10,name:'exhaust-right',worldOrigin:[2,.61,-2.53],worldOutward:[0,0,-1],innerRadiusM:.041,visibleOuterDiameterM:.114},
  ];
  const ports=adaptAgent6WorldPorts(raw,10,30);
  assert.deepEqual(ports[0].origin.toArray(),[-2,.61,-2.53]);
  assert.deepEqual(ports[0].outward.toArray(),[0,0,-1]);
  assert.throws(()=>adaptAgent6WorldPorts(raw,9,30));
  assert.throws(()=>adaptAgent6WorldPorts([raw[0],raw[0]],10,30));
  assert.throws(()=>adaptAgent6WorldPorts(raw.map(p=>({...p,visibleOuterDiameterM:.2})),10,30));
});

test('V4-only production port gate blocks candidate-A provenance and physically detached jets',()=>{
  const approved={
    version:2, vehicle:'v4-a-supercar',coordinateConvention:'world-three-y-up-metres',
    referenceKitCommit:'9052a539e10a7cb97487c1435455bb9962ad58e1',
    referenceApprovalUrl:'https://github.com/YunRah2103/Remotion-gpt-chat/issues/247#issuecomment-6355059494',
    agent6ShotCommit:'a'.repeat(40),v4PortManifestSha256:'b'.repeat(64),
  };
  const ports=[
    {frame:0,name:'exhaust-left',worldOrigin:[-.56,.55,-2.5],
      worldOutward:[0,0,-1],innerRadiusM:.044,visibleOuterDiameterM:.114},
    {frame:0,name:'exhaust-right',worldOrigin:[.56,.55,-2.5],
      worldOutward:[0,0,-1],innerRadiusM:.044,visibleOuterDiameterM:.114},
  ];
  assert.equal(adaptApprovedV4WorldPorts(ports,0,approved).length,2);
  assert.throws(()=>adaptApprovedV4WorldPorts(ports,0,{
    ...approved,agent6ShotCommit:'bc0185ece668d6ebb1f0f58adbc62edec0ce2cb4'}));
  assert.throws(()=>adaptApprovedV4WorldPorts(ports,0,{
    ...approved,referenceKitCommit:'c'.repeat(40)}));
  assert.throws(()=>adaptApprovedV4WorldPorts(ports,1,approved));
  assert.throws(()=>adaptApprovedV4WorldPorts(ports.map(p=>({
    ...p,worldOrigin:[.001,.55,-2.5]})),0,approved));
  assert.throws(()=>adaptApprovedV4WorldPorts(ports.map((p,i)=>({
    ...p,worldOutward:i?[0,0,1]:[0,0,-1]})),0,approved));
});
