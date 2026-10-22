import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {VEHICLES,vehicleSpec} from '../../src/yunex/world-kit/catalog.ts';
import {createCinematicVehicle} from '../../src/yunex/modelling-kit/rig.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
import {auditVehicleGeometry,qualityStates} from '../../src/yunex/modelling-kit/visual-quality.ts';
const fixture=()=>{
 const s=vehicleSpec('hot-hatch'),g=new T.Group();g.userData.variant=s.id;
 const add=(name,size,pos,parent=g)=>{const m=new T.Mesh(new T.BoxGeometry(...size),new T.MeshBasicMaterial());m.name=name;m.position.set(...pos);parent.add(m);return m;};
 add('arched-body',[s.length,.7,s.width],[0,.7,0]);
 add('roof',[1.5,.02,1.3],[0,s.height,0]);add('roof-liner',[1.45,.01,1.25],[0,s.height-.03,0]);
 for(const x of [-s.wheelbase/2,s.wheelbase/2])for(const z of [-s.width/2+.09,s.width/2-.09]){
 const mount=new T.Group();mount.name=`mount-${x>0?'front':'rear'}-${z>0?'left':'right'}`;mount.position.set(x,s.radius,z);g.add(mount);
 const tyre=new T.Mesh(new T.CylinderGeometry(s.radius,s.radius,.235,32),new T.MeshBasicMaterial());tyre.rotation.x=Math.PI/2;tyre.name='tyre';mount.add(tyre);
 add('rim-barrel',[.4,.4,.18],[0,0,0],mount);
 }return g;
};
test('geometry gates measure visible model in root coordinates and do not approve imagery',()=>{const g=fixture();const a=auditVehicleGeometry(g);assert.equal(a.state,'pass',JSON.stringify(a.diagnostics));g.position.set(12,5,-3);g.rotation.y=.7;g.scale.setScalar(2);assert.equal(auditVehicleGeometry(g).state,'pass');assert.equal(qualityStates({source:'pass',native:'pass',geometry:'pass'}).final,'pending');disposeObject(g);});
test('roof liner and hardware fit failures identify the actual object and measured limit',()=>{const g=fixture();g.getObjectByName('roof-liner').position.y+=.2;g.getObjectByName('rim-barrel').position.x+=1;const a=auditVehicleGeometry(g);for(const code of ['roof-liner-fit','wheel-hardware-fit']){const d=a.diagnostics.find(d=>d.code===code);assert.ok(d,JSON.stringify(a));assert.ok(d.object);assert.equal(typeof d.measured,'number');assert.ok(d.remedy);}disposeObject(g);});
test('missing roof, displaced or sunken wheels and enormous visible hardware are actionable failures',()=>{const g=fixture();g.remove(g.getObjectByName('roof'));g.getObjectByName('mount-front-left').position.y=-.1;g.getObjectByName('mount-rear-left').position.x-=1;const a=auditVehicleGeometry(g);for(const code of ['roof-required','wheel-contact','wheelbase-fit'])assert.ok(a.diagnostics.some(d=>d.code===code),code);disposeObject(g);});
test('hidden helpers are excluded, visible instances count and stale bounding boxes cannot conceal edits',()=>{const g=fixture(),helper=new T.Mesh(new T.BoxGeometry(100,100,100),new T.MeshBasicMaterial());helper.visible=false;g.add(helper);assert.equal(auditVehicleGeometry(g).state,'pass');const inst=new T.InstancedMesh(new T.BoxGeometry(.1,.1,.1),new T.MeshBasicMaterial(),1);inst.setMatrixAt(0,new T.Matrix4().makeTranslation(30,0,0));g.add(inst);assert.ok(auditVehicleGeometry(g).diagnostics.some(d=>d.code==='model-envelope'));g.remove(inst);const roof=g.getObjectByName('roof');roof.geometry.computeBoundingBox();roof.geometry.attributes.position.setY(0,20);assert.ok(auditVehicleGeometry(g).diagnostics.some(d=>d.code==='model-envelope'));disposeObject(g);});
test('all 36 canonical IDs remain auditable with family-specific wheel counts and roof policy',()=>{assert.equal(VEHICLES.length,36);for(const s of VEHICLES){const g=createCinematicVehicle({variant:s.id,quality:'standard'}),a=auditVehicleGeometry(g);assert.equal(a.variant,s.id);assert.equal(a.state,'pass',`${s.id}: ${JSON.stringify(a.diagnostics)}`);assert.equal(a.measurements.wheels.length,s.family==='bike'?2:s.axles*2);assert.equal(a.measurements.expectedWheels,s.family==='bike'?2:s.axles*2);if(s.family==='bike'||s.family==='formula'||s.roof==='open'||['box-truck','tractor-truck'].includes(s.id))assert.ok(!a.diagnostics.some(d=>d.code==='roof-required'),s.id);disposeObject(g);}});
test('stage states keep source/native/geometry/visual separate and fail closed',()=>{assert.deepEqual(qualityStates({source:'pass',native:'pass',geometry:'pass',visual:'pending'}),{source:'pass',native:'pass',geometry:'pass',visual:'pending',final:'pending'});assert.equal(qualityStates({source:'pass',native:'fail',geometry:'pass',visual:'pass'}).final,'fail');assert.equal(qualityStates({source:'pass',native:'pass',geometry:'pass',visual:'pass'}).final,'pass');assert.throws(()=>qualityStates({source:'beauty approved'}));});
test('studio fascia winding detects reversed solid end caps',()=>{const g=fixture();g.userData.bodyArchitecture='section-loft-v4';assert.ok(!auditVehicleGeometry(g).diagnostics.some(d=>d.code==='fascia-winding'));const body=g.getObjectByName('arched-body'),index=body.geometry.index;for(let i=0;i<index.count;i+=3){const b=index.getX(i+1);index.setX(i+1,index.getX(i+2));index.setX(i+2,b);}const failures=auditVehicleGeometry(g).diagnostics.filter(d=>d.code==='fascia-winding');assert.deepEqual(failures.map(d=>d.object),['arched-body/rear','arched-body/front']);disposeObject(g);});
test('media review requires SHA-bound explicit moving review covering all frames',async()=>{const {spawnSync}=await import('node:child_process');const result=spawnSync('python',['-B','-c',`import importlib.util
spec=importlib.util.spec_from_file_location('qc','scripts/modelling-kit/v4-media-qc.py')
qc=importlib.util.module_from_spec(spec);spec.loader.exec_module(qc)
r={'sha256':'abc','reviewer':'Reviewer','movingReview':True,'findings':[],'reviewedAt':'2026-10-22T12:00:00Z','reviewedRanges':[[0,29]],'decision':'pass'}
assert qc.review_state(None,'abc',30)[0]=='pending'
assert qc.review_state(r,'abc',30)[0]=='pass'
assert qc.review_state(r,'different',30)[0]=='pending'
r['movingReview']=False
assert qc.review_state(r,'abc',30)[0]=='pending'
r['movingReview']=True;r['reviewedRanges']=[[0,12],[14,29]]
assert qc.review_state(r,'abc',30)[0]=='pending'
r['reviewedRanges']=[[0,29]];r['decision']='fail'
assert qc.review_state(r,'abc',30)[0]=='fail'
`],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);});
