import {test} from 'node:test';import assert from 'node:assert/strict';
import {createCinematicVehicle} from '../../src/yunex/modelling-kit/rig.ts';import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
test('hero glazing is a closed editable volume rather than a zero-thickness plane',()=>{
 for(const variant of ['supercar','hot-hatch','crossover','city-ev','box-truck']){
  const car=createCinematicVehicle({variant,optimize:false});const pane=car.getObjectByName(variant==='box-truck'?'windscreen':'windshield');assert.ok(pane.userData.glassThickness>=.004,variant);assert.equal(pane.userData.closedGlazing,true);assert.ok(pane.geometry.index);
  const p=pane.geometry.attributes.position,idx=pane.geometry.index,edges=new Map(),key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(v=>v.toFixed(6)).join(',');
  for(let i=0;i<idx.count;i+=3){const a=idx.getX(i),b=idx.getX(i+1),c=idx.getX(i+2);for(const [u,v] of [[a,b],[b,c],[c,a]]){const e=[key(u),key(v)].sort().join('|');edges.set(e,(edges.get(e)??0)+1);}}assert.ok([...edges.values()].every(n=>n===2),variant+' open/nonmanifold glazing edge');disposeObject(car);
 }
});
