import {test} from 'node:test';
import assert from 'node:assert/strict';
import {vehicleSpec} from '../../src/yunex/world-kit/catalog.ts';
import {fleetProfile} from '../../src/yunex/modelling-kit/fleet-profiles.ts';
import {fleetDeck, fleetFlank, fleetRoof, fleetBelt, fleetSection} from '../../src/yunex/modelling-kit/fleet-road.ts';

test('class greenhouse profiles arch longitudinally and differ in side silhouette',()=>{
 const arcs=[];
 for(const id of ['supercar','grand-tourer','saloon','boxy-suv','panel-van']){
  const s=vehicleSpec(id),c=fleetProfile(s),middle=(c.frontRoof+c.rearRoof)/2;
  const centre=fleetRoof(s,middle,0).y,ends=(fleetRoof(s,c.frontRoof,0).y+fleetRoof(s,c.rearRoof,0).y)/2;
  arcs.push(centre-ends);
  assert.ok(centre-ends>.02,id+' roof needs a full longitudinal arc');
  assert.ok(fleetRoof(s,middle,1).y<centre-.025,id+' roof must roll across its width');
 }
 assert.ok(new Set(arcs.map(x=>Math.round(x*1000))).size>1,'class roofs must not share one extruded profile');
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

test('glass base and seal lie on the actual shoulder rather than the bonnet centre',()=>{
 for(const id of ['supercar','grand-tourer','saloon','rally-hatch','long-suv','panel-van']){
  const s=vehicleSpec(id),c=fleetProfile(s);
  for(const x of [c.frontBase,c.rearBase,0])for(const z of [-1,-.5,0,.5,1]){
   const p=fleetBelt(s,x,z),surface=fleetDeck(s,x,p.z/fleetSection(s,x).width);
   assert.ok(p.distanceTo(surface)<1e-10,id+' glass/deck join');
  }
 }
});
