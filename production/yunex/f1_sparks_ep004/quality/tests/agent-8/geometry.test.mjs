/**
 * Dynamic 3D regression for EP004 quality V2. Uses installed TypeScript to run
 * actual Three.js construction, not string assertions or fake descriptor maths.
 * Run: node --test production/yunex/f1_sparks_ep004/quality/tests/agent-8/*.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const Module=require('node:module');
const ts=require('typescript');
const makeLoader=ext=>{
  Module._extensions[ext]=(module,filename)=>{
    const transpiled=ts.transpileModule(fs.readFileSync(filename,'utf8'),{
      compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,
        jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,allowImportingTsExtensions:true},
      fileName:filename,
    }).outputText;
    module._compile(transpiled,filename);
  };
};
makeLoader('.ts');makeLoader('.tsx');

const {Vector3,Group,Mesh}=require('three');
const {createQualityF1Vehicle,applyQualityF1Motion,assertQualitySkidGeometry,
  getQualitySkidDescriptors}=require('../../vehicle/QualityF1Vehicle.tsx');
const {sampleDynamics,localToWorld}=require('../../../physics/dynamics.ts');
const {disposeObject}=require('../../../../../src/yunex/world-kit/geometry.ts');

const within=(a,b,eps=1e-5)=>Math.abs(a-b)<eps;
const skidPoint=(mesh,root)=>{
  mesh.geometry.computeBoundingBox();
  const b=mesh.geometry.boundingBox;
  return root.worldToLocal(mesh.localToWorld(new Vector3((b.min.x+b.max.x)/2,b.min.y,(b.min.z+b.max.z)/2))).toArray();
};
const withVehicle=fn=>{
 const model=createQualityF1Vehicle();
 try{return fn(model)}finally{disposeObject(model)}
};

test('premium V2 hero: 4 articulated wheels, aero and no duplicate A1 rig',()=>{
 withVehicle(root=>{
  assert.equal(root.userData.ep004QualityKitV2,true);
  assert.ok(root.getObjectByName('body-shell'),'real V2 body shell missing');
  for(const wheel of ['front-left','front-right','rear-left','rear-right']){
   assert.ok(root.getObjectByName('mount-'+wheel),'missing kit wheel '+wheel);
   assert.ok(root.getObjectByName('mount-'+wheel).getObjectByName('wheel-roll'));
  }
  assert.ok(root.getObjectByName('front-aerofoil'),'missing kit V2 front wing');
  assert.ok(root.getObjectByName('rear-aerofoil'),'missing kit V2 rear wing');
  assert.ok(root.getObjectByName('EP004-QUALITY-PHYSICS-FLOOR'));
  assert.ok(!root.getObjectByName('EP004-STRUCTURAL-FLOOR'),'old A1 car accidentally embedded');
 });
});

test('exact authoritative named metallic skids, no double plank or false emitter',()=>{
 withVehicle(root=>{
  const descriptors=getQualitySkidDescriptors();
  assert.deepEqual(descriptors.map(v=>[v.id,...v.localBottomPoint]),
    [['forward',1.18,.065,0],['middle',.10,.065,0],['rear',-1.03,.065,0]]);
  const real=[];
  root.traverse(o=>{if(o.userData.metalSkid)real.push(o)});
  assert.equal(real.length,3);
  for(const d of descriptors){
   const mesh=root.getObjectByName('EP004-skid-'+d.id);
   assert.ok(mesh instanceof Mesh);
   const p=skidPoint(mesh,root);
   assert.ok(p.every((v,i)=>within(v,d.localBottomPoint[i],1e-6)),d.id+' bottom bounds mismatch');
   assert.ok(mesh.material.metalness>.8);
  }
  assertQualitySkidGeometry(root);
  for(const name of ['underfloor','contact-sparks','metal-skid','composite-plank']){
   root.traverse(o=>{if(o.name===name)assert.equal(o.visible,false,name+' still visible')});
  }
 });
});

test('five+ A2 states: exact transformed metal-bottom contact under heave, yaw, roll, pitch',()=>{
 withVehicle(root=>{
  const secs=[0,.11,.39,.91,1.75,3.13,5.8];
  for(const t of secs){
   const motion=sampleDynamics(t,{speedMps:62,rideHeightOffsetM:(t>2?.008:0)});
   applyQualityF1Motion(root,motion,(t%2)*.35);
   assertQualitySkidGeometry(root,motion);
   for(const d of getQualitySkidDescriptors()){
     const p=root.getObjectByName('EP004-skid-'+d.id);
     p.geometry.computeBoundingBox();
     const b=p.geometry.boundingBox;
     const actual=p.localToWorld(new Vector3(0,b.min.y,0)).toArray();
     const expected=localToWorld(d.localBottomPoint,motion);
     assert.ok(actual.every((v,i)=>within(v,expected[i])),d.id+' world bottom mismatch at '+t);
   }
   const sparks=root.getObjectByName('contact-sparks');
   assert.ok(sparks&&!sparks.visible,'V2 emitter reactivated after frame '+t);
  }
 });
});

test('wheel phase follows A2 and reverse seeking produces identical transforms',()=>{
 withVehicle(root=>{
  const pose=t=>{
    const motion=sampleDynamics(t,{speedMps:58});
    applyQualityF1Motion(root,motion,0);
    const phase=root.getObjectByName('mount-front-left').getObjectByName('wheel-roll').rotation.z;
    assert.ok(within(phase,motion.wheelRotationRad,1e-6),'wheel phase drift');
    return {
      wheel:phase,
      mesh:getQualitySkidDescriptors().map(s=>{
        const m=root.getObjectByName('EP004-skid-'+s.id);
        const b=m.geometry.boundingBox||(m.geometry.computeBoundingBox(),m.geometry.boundingBox);
        return m.localToWorld(new Vector3(0,b.min.y,0)).toArray();
      }),
      position:root.position.toArray(),quaternion:root.quaternion.toArray()
    };
  };
  const reference=pose(2.57);pose(.42);pose(5.43);pose(1.1);
  assert.deepEqual(pose(2.57),reference);
 });
});
