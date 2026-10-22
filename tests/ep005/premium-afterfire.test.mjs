import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createAfterfireMechanicalStage,animateAfterfireMechanicalStage} from '../../production/yunex/supercar_flames_ep005/flames/mechanical-stage.ts';
import {sampleAfterfire,stateFromCinemaDemand} from '../../production/yunex/supercar_flames_ep005/flames/afterfire.ts';
import {readExhaustMounts,createAfterfireRig,animateAfterfireRig} from '../../production/yunex/supercar_flames_ep005/flames/exhaust-rig.ts';
import {createEp005Hero} from '../../production/yunex/supercar_flames_ep005/flames/hero-reference/hero.ts';

test('real 3D mechanical stage has all five named units in a fit-sized portrait envelope',()=>{
 const stage=createAfterfireMechanicalStage();
 for(const unit of ['stage-v8-engine','stage-manifold','stage-catalyst','stage-muffler','stage-tailpipe']){
  assert.ok(stage.getObjectByName(unit),'Missing modelled flow unit '+unit);
 }
 assert.ok(stage.getObjectByName('stage-catalyst-cell-0-0'));
 assert.ok(stage.getObjectByName('stage-muffler-baffle-1'));
 assert.ok(stage.getObjectByName('stage-tailpipe-rolled-lip'));
 const box=new T.Box3().setFromObject(stage),size=box.getSize(new T.Vector3());
 assert.ok(size.x>4.2&&size.x<5.8,'portrait fit width:'+size.x);
 assert.ok(size.y>.7&&size.y<2,'stage must be visible and vertically contained:'+size.y);
 assert.ok([...stage.children].filter(x=>x.name.startsWith('stage-illustrative-gas-marker-')).length===14);
});

test('illustrative modelled flow beads obey absolute frame and reverse seeks',()=>{
 const stage=createAfterfireMechanicalStage(),bead=stage.getObjectByName('stage-illustrative-gas-marker-0');
 assert.ok(bead);
 animateAfterfireMechanicalStage(stage,0,30);
 const initial=bead.position.clone();
 animateAfterfireMechanicalStage(stage,75,30);
 assert.ok(bead.position.distanceTo(initial)>.05,'flow not animated');
 animateAfterfireMechanicalStage(stage,0,30);
 assert.ok(bead.position.distanceTo(initial)<1e-8,'reverse seek must be deterministic');
 assert.throws(()=>animateAfterfireMechanicalStage(stage,0,0));
});

test('nozzle-anchored flame layers produce irregular tapering non-spherical three dimensional plumes',()=>{
 const car=createEp005Hero(),rig=createAfterfireRig(car),ports=readExhaustMounts(car);
 const frame=sampleAfterfire(0,30,stateFromCinemaDemand(1,.05),ports);
 assert.ok(frame.ports.every(p=>p.length>.3),'first second must show flame');
 animateAfterfireRig(rig,frame);
 for(const {root,socket,envelopes,cores} of rig.elements){
  assert.equal(root.parent,socket);
  assert.equal(envelopes.length,4);assert.equal(cores.length,2);
  const geometry=envelopes[0].geometry;
  const positions=geometry.getAttribute('position');
  const alpha=geometry.getAttribute('aAlpha');
  const maxX=Math.max(...Array.from({length:positions.count},(_,j)=>positions.getX(j)));
  const minX=Math.min(...Array.from({length:positions.count},(_,j)=>positions.getX(j)));
  assert.ok(maxX-minX>.24,'flame must extend away from nozzle');
  assert.ok(new Set(Array.from({length:positions.count},(_,j)=>positions.getY(j).toFixed(4))).size>15,'flame should not be perfectly rotationally symmetric');
  assert.ok(Math.max(...Array.from({length:alpha.count},(_,j)=>alpha.getX(j)))>.1);
  assert.equal(geometry.type,'BufferGeometry');
 }
});
