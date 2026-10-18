import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createVehicle} from '../../src/yunex/world-kit/vehicles.ts';
import {interiorLayout} from '../../src/yunex/world-kit/interiors.ts';
import {vehicleSpec} from '../../src/yunex/world-kit/catalog.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';

test('road body sides have a shaped cross-section rather than flat slab sides',()=>{
 for(const variant of ['saloon','coupe','boxy-suv','minivan']){
  const g=createVehicle({variant}),body=g.getObjectByName('arched-body'),p=body.geometry.attributes.position;
  const samples=[];for(let i=0;i<p.count;i++)if(Math.abs(p.getX(i))<.12&&p.getZ(i)>.5&&p.getY(i)>.45&&p.getY(i)<.70)samples.push([p.getY(i),p.getZ(i)]);
  const zs=samples.map(v=>v[1]);assert.ok(Math.max(...zs)-Math.min(...zs)>.01,`${variant}: side lacks cross-section curvature`);disposeObject(g);
 }
});
test('cabin glazing is enclosed by modelled window apertures',()=>{
 const g=createVehicle({variant:'saloon'});const frame=g.getObjectByName('window-frame');assert.ok(frame,'painted aperture instead of exposed rod frame');
 assert.ok(g.getObjectByName('windshield-seal'));assert.ok(g.getObjectByName('side-glass').geometry.attributes.position.count>10,'rounded glazing corners');disposeObject(g);
});
test('formula nose is substantially narrower than the cockpit body',()=>{
 const g=createVehicle({variant:'formula-modern'}),p=g.getObjectByName('single-seater-body').geometry.attributes.position;let nose=0,centre=0;
 for(let i=0;i<p.count;i++){if(p.getX(i)>2)nose=Math.max(nose,Math.abs(p.getZ(i)));if(Math.abs(p.getX(i))<.6)centre=Math.max(centre,Math.abs(p.getZ(i)));}
 assert.ok(nose<centre*.7,`${nose}/${centre}`);disposeObject(g);
});

test('opaque cabin pillars face outwards on both sides',()=>{
 for(const variant of ['saloon','roadster']){
  const g=createVehicle({variant});g.updateMatrixWorld(true);let count=0;
  g.traverse(o=>{if(!['b-pillar','cabin-pillar'].includes(o.name))return;count++;const p=o.geometry.attributes.position,n=o.geometry.attributes.normal;let z=0,nz=0;for(let i=0;i<p.count;i++){z+=p.getZ(i);nz+=n.getZ(i);}assert.ok(o.material.side===T.DoubleSide||z*nz>0,`${variant} ${o.name} points inward`);});
  assert.equal(count,2);disposeObject(g);
 }
});


test('painted window-frame outer corners meet the roof without holes',()=>{
 for(const variant of ['saloon','coupe','boxy-suv','minivan']){
  const s=vehicleSpec(variant),l=interiorLayout(s),g=createVehicle({variant});g.updateMatrixWorld(true);let frame;
  g.traverse(o=>{if(o.name==='window-frame'&&new T.Box3().setFromObject(o).getCenter(new T.Vector3()).z>0)frame=o;});assert.ok(frame);
  for(const x of [l.rearRoof+.005,l.frontRoof-.005]){
   const ray=new T.Raycaster(new T.Vector3(x,l.roof-.012,s.width),new T.Vector3(0,0,-1),0,s.width);
   assert.ok(ray.intersectObject(frame).length>0,`${variant}: corner near ${x} has an open roof/frame junction`);
  }
  disposeObject(g);
 }
});
