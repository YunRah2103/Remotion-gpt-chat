import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createCinematicVehicle} from '../../src/yunex/modelling-kit/rig.ts';
import {vehicleSpec} from '../../src/yunex/world-kit/catalog.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
const ids=['formula-modern','formula-classic','sport-bike','naked-bike','touring-bike','box-truck','tractor-truck'];
const size=o=>new T.Box3().setFromObject(o).getSize(new T.Vector3());
for(const variant of ids)test(`${variant} rebuild replaces main volumes and retains finite normals and axle anchors`,()=>{
 const car=createCinematicVehicle({variant,bodyDetail:'fleet',optimize:false}),s=vehicleSpec(variant);
 const shell=car.getObjectByName('body-shell');assert.equal(shell.userData.specialtyRebuild,2);
 const main=variant.startsWith('formula')?'fleet-monocoque':variant.endsWith('bike')?'fleet-tank':'cab';
 const body=car.getObjectByName(main);assert.ok(body?.visible);assert.ok(body.geometry.attributes.position.count>1000);
 car.traverse(o=>{if(o instanceof T.Mesh&&o.visible)for(const key of ['position','normal'])for(const n of o.geometry.attributes[key]?.array??[])assert.ok(Number.isFinite(n),`${variant} ${o.name} ${key}`);});
 for(const mount of car.children.filter(o=>o.name.startsWith('mount-'))){assert.equal(mount.position.y,s.radius);assert.ok([s.wheelbase/2,-s.wheelbase/2,-s.wheelbase/2+.98].some(x=>Math.abs(x-mount.position.x)<1e-8));}
 if(s.family==='formula'){
  assert.equal(car.getObjectByName('single-seater-body').visible,false);
  const ray=new T.Raycaster(new T.Vector3(-.35,2,0),new T.Vector3(0,-1,0));
  assert.equal(ray.intersectObject(body).find(h=>h.point.y>.55),undefined,'cockpit stays open');
  if(variant==='formula-modern')assert.ok(Math.max(...['min','max'].map(k=>Math.abs(new T.Box3().setFromObject(car.getObjectByName('fleet-undercut-sidepod'))[k].z)))>.80,'wide undercut sidepods change main plan silhouette');
  else assert.ok(size(body).z>.65,'classic has a broad cigar cockpit tub');
 }else if(s.family==='bike'){
  assert.equal(car.getObjectByName('fuel-tank').visible,false);
  if(variant==='sport-bike')assert.ok(size(car.getObjectByName('fleet-sculpted-fairing')).y>.65,'closed full fairing controls side silhouette');
  if(variant==='naked-bike'){assert.ok(size(body).z>.45,'broad shoulder tank differs from sport');assert.ok(car.getObjectByName('fleet-radiator-shroud'),'naked needs a real radiator shoulder volume');assert.ok(size(car.getObjectByName('fleet-radiator-shroud')).y>.30,'naked radiator shoulders rebuild the visible mid-body');}
  if(variant==='touring-bike')assert.ok(car.getObjectByName('fleet-touring-fairing')?.visible,'tourer gets a substantial upper fairing');
 }else{
  const p=body.geometry.attributes.position;let roofFront=-Infinity,waistFront=-Infinity;
  for(let i=0;i<p.count;i++){const x=p.getX(i)+body.position.x,y=p.getY(i)+body.position.y;if(y>2.25)roofFront=Math.max(roofFront,x);if(y>1.15&&y<1.50)waistFront=Math.max(waistFront,x);}
  assert.ok(waistFront-roofFront>.18,'new raked cab changes volume instead of adding trim');
  const screen=car.getObjectByName('windscreen');assert.ok(screen.visible);assert.ok(size(screen).x>.12,'screen follows actual cab rake');
  if(variant==='tractor-truck')assert.ok(size(car.getObjectByName('sleeper')).y>.90,'high roof sleeper is rebuilt');
 }
 disposeObject(car);
});
for(const variant of ['box-truck','tractor-truck'])test(`${variant} rebuilt cab keeps clear window apertures and static roof cutaway`,()=>{
 const car=createCinematicVehicle({variant,bodyDetail:'fleet',optimize:false});car.updateMatrixWorld(true);
 const cab=car.getObjectByName('cab'),screen=car.getObjectByName('windscreen'),centre=new T.Box3().setFromObject(screen).getCenter(new T.Vector3());
 for(const [origin,direction] of [[centre.clone().add(new T.Vector3(1,0,0)),new T.Vector3(-1,0,0)],[new T.Vector3(cab.position.x,1.94,3),new T.Vector3(0,0,-1)]]){
  assert.equal(new T.Raycaster(origin,direction).intersectObject(cab).length,0,'glazing aperture must not have painted backing');
 }
 disposeObject(car);
 const open=createCinematicVehicle({variant,bodyDetail:'fleet',cutaway:true,optimize:false});
 const openCab=open.getObjectByName('cab');openCab.geometry.computeBoundingBox();
 assert.ok(openCab.geometry.boundingBox.max.y<.74,'replacement cab must retain the requested roof opening');
 disposeObject(open);
});
for(const variant of ['sport-bike','touring-bike'])test(`${variant} windscreen exterior normals face forward and upward`,()=>{
 const car=createCinematicVehicle({variant,bodyDetail:'fleet',optimize:false});
 const screen=car.getObjectByName('windshield'),p=screen.geometry.attributes.position,n=screen.geometry.attributes.normal;
 // Inspect the middle of the exterior patch, away from closure-edge normals.
 const centre=16*25+12,outer=new T.Vector3().fromBufferAttribute(n,centre);
 assert.ok(outer.x>.2&&outer.y>.2,'raked screen exterior must face +X and +Y');
 const inner=new T.Vector3().fromBufferAttribute(p,centre+33*25),exterior=new T.Vector3().fromBufferAttribute(p,centre);
 assert.ok(exterior.sub(inner).dot(outer)>.0049,'glass thickness must extend inward from the outward-facing pane');
 disposeObject(car);
});
