import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {VEHICLES} from '../../src/yunex/world-kit/catalog.ts';
import {fleetProfile} from '../../src/yunex/modelling-kit/fleet-profiles.ts';
import {fleetEndFrame,fleetEndSurface} from '../../src/yunex/modelling-kit/fleet-body.ts';
import {installRefinedFascia} from '../../src/yunex/modelling-kit/fleet-fascia.ts';
import {fleetPatch} from '../../src/yunex/modelling-kit/fleet-surfaces.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
const material=new T.MeshStandardMaterial();
const materials={paint:material,trim:material,metal:material,white:material,red:material};
test('every road fascia has finite curved end surfaces and fitted aperture seams',()=>{
 for(const s of VEHICLES){
  if(['formula','bike'].includes(s.family)||['box-truck','tractor-truck'].includes(s.id))continue;
  const parent=new T.Group(),front=fleetEndFrame(s,true);
  // Sparse real cap surface isolates the fascia architecture from cabin and wheel construction.
  const body=new T.Mesh(fleetPatch(24,18,(u,v)=>fleetEndSurface(s,true,front.sill+(front.deck-front.sill)*v,front.width*(u*2-1)),true),material);parent.add(body);
  installRefinedFascia(parent,body,s,materials);
  const surrounds=[];parent.traverse(o=>{
   if(!(o instanceof T.Mesh))return;
   for(const attribute of ['position','normal'])assert.ok(Array.from(o.geometry.attributes[attribute].array).every(Number.isFinite),s.id+' '+o.name);
   if(o.userData.aperture)surrounds.push(o);
   if(['lamp-cover','classic-headlamp-lens'].includes(o.name)){
    const p=o.geometry.attributes.position;let min=Infinity,max=-Infinity;
    for(let i=0;i<p.count;i++){min=Math.min(min,p.getX(i));max=Math.max(max,p.getX(i));}
    assert.ok(max-min>.012,s.id+' cover must follow the cap in depth');
   }
  });
  assert.equal(surrounds.length,fleetProfile(s).van?6:8);
  for(const ring of surrounds){
   const p=ring.geometry.attributes.position,front=ring.userData.front,sign=front?1:-1,f=fleetEndFrame(s,front);
   for(let i=0;i<81;i++){
    const y=p.getY(i),z=p.getZ(i),q=fleetEndSurface(s,front,y,z);
    assert.ok(Math.abs(p.getX(i)-q.x-sign*.002)<.000002,s.id+' aperture seam must sit on the authored cap');
    const radial=Math.abs((y-f.centreY)/((f.deck-f.sill)/2))**(2/.79)+Math.abs(z/f.width)**(2/.79);
    assert.ok(radial<1.001,s.id+' '+ring.name+' must stay inside the body silhouette');
   }
  }
  if(fleetProfile(s).kind==='classic'){
   for(const name of ['classic-headlamp-lens','classic-headlamp-reflector','classic-headlamp-bezel','classic-headlamp-bulb'])assert.ok(parent.getObjectByName(name),s.id+' '+name);
   const ring=surrounds.find(o=>o.name==='shaped-headlamp-surround');
   assert.equal(ring.userData.aperture.w,ring.userData.aperture.h,'heritage optics retain a round aperture');
  }
  parent.updateMatrixWorld(true);
  const intake=parent.getObjectByName('sculpted-intake-surround').userData.aperture;
  const ray=new T.Raycaster(new T.Vector3(s.length/2+.2,intake.y,intake.z),new T.Vector3(-1,0,0));
  assert.equal(ray.intersectObject(body).length,0,s.id+' intake must be a real body aperture');
  disposeObject(parent);
 }
});
