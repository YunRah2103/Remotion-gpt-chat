import {test} from 'node:test';
import assert from 'node:assert/strict';
import {vehicleSpec} from '../../src/yunex/world-kit/catalog.ts';
import {fleetProfile} from '../../src/yunex/modelling-kit/fleet-profiles.ts';
import {fleetDeck, fleetFlank, fleetRoof, fleetBelt, fleetSection} from '../../src/yunex/modelling-kit/fleet-road.ts';

test('new body has a formed shoulder, recessed door centre and tucked rocker',()=>{
 for(const id of ['saloon','grand-tourer','rally-hatch','long-suv','crew-pickup','panel-van']){
  const s=vehicleSpec(id),c=fleetProfile(s),top=fleetDeck(s,0,1).y;
  const shoulder=fleetFlank(s,0,top-(top-c.sill)*.16,1).z;
  const waist=fleetFlank(s,0,top-(top-c.sill)*.58,1).z;
  const sill=fleetFlank(s,0,c.sill,1).z;
  assert.ok(shoulder-waist>.045,id+' must have a visibly recessed door section');
  assert.ok(shoulder-sill>.07,id+' must roll into a narrower sill');
 }
});
test('sports bonnet forms a low central volume between raised full fenders',()=>{
 for(const id of ['supercar','grand-tourer','track-coupe']){
  const s=vehicleSpec(id),x=s.wheelbase/2;
  assert.ok(fleetDeck(s,x,.78).y-fleetDeck(s,x,0).y>.065,id+' needs distinct bonnet and fender volumes');
 }
});
test('class greenhouse profiles arch longitudinally and differ in side silhouette',()=>{
 const arcs=[];
 for(const id of ['supercar','grand-tourer','saloon','boxy-suv','panel-van']){
  const s=vehicleSpec(id),c=fleetProfile(s),middle=(c.frontRoof+c.rearRoof)/2;
  const centre=fleetRoof(s,middle,0).y,ends=(fleetRoof(s,c.frontRoof,0).y+fleetRoof(s,c.rearRoof,0).y)/2;
  arcs.push(centre-ends);
  assert.ok(centre-ends>.02,id+' roof needs a full longitudinal arc');
  assert.ok(fleetRoof(s,middle,1).y<centre-.025,id+' roof must roll across its width');
 }
 assert.ok(Math.max(...arcs)-Math.min(...arcs)>.06,'class roofs must not share one extruded profile');
 assert.ok(fleetProfile(vehicleSpec('supercar')).roof>=1.39);
});
test('both flanks mirror exactly and body evaluators remain finite across apertures',()=>{
 for(const id of ['supercar','saloon','rally-hatch','long-suv','crew-pickup','panel-van']){
  const s=vehicleSpec(id),c=fleetProfile(s);
  for(let i=0;i<=40;i++){
   const x=s.length*(i/40-.5),y=(fleetDeck(s,x,1).y+c.sill)/2;
   const a=fleetFlank(s,x,y,1),b=fleetFlank(s,x,y,-1);
   assert.equal(a.z,-b.z);assert.ok(a.toArray().every(Number.isFinite));
  }
 }
});

test('bonnet centre descends smoothly to the nose without an inflated wave',()=>{
 for(const id of ['supercar','grand-tourer','saloon','hot-hatch','long-suv','crew-pickup','panel-van']){
  const s=vehicleSpec(id),c=fleetProfile(s);let previous=Infinity;
  for(let i=0;i<=100;i++){
   const x=c.frontBase+(s.length/2-c.frontBase)*i/100,y=fleetDeck(s,x,0).y;
   assert.ok(y<=previous+1e-8,id+' bonnet must descend continuously');previous=y;
  }
 }
});
test('glass base and seal lie on the actual shoulder rather than the bonnet centre',()=>{
 for(const id of ['supercar','grand-tourer','saloon','rally-hatch','long-suv','panel-van']){
  const s=vehicleSpec(id),c=fleetProfile(s);
  for(const x of [c.frontBase,c.rearBase,0])for(const z of [-1,-.5,0,.5,1]){
   const p=fleetBelt(s,x,z),surface=fleetDeck(s,x,p.z/fleetSection(s,x).width);
   assert.ok(p.distanceTo(surface)<1e-10,id+' glass/deck join');
  }
 }
});
