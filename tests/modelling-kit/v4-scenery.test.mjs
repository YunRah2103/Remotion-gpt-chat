import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {createCinematicEnvironment} from '../../src/yunex/modelling-kit/environments.ts';import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';import {scenicOffset} from '../../src/yunex/world-kit/world-catalog.ts';
for(const kind of ['mountain','rally'])test(`V4 ${kind} has deterministic natural shoulders clear of the driving corridor`,()=>{
 const a=createCinematicEnvironment({kind,quality:'hero',seed:22}),b=createCinematicEnvironment({kind,quality:'hero',seed:22});try{
 const g=a.getObjectByName('natural-scenery-v4');assert.ok(g);
 const shoulder=a.getObjectByName('natural-road-shoulder');assert.ok(shoulder);const p=shoulder.geometry.attributes.position;for(let i=0;i<p.count;i++)assert.ok(Math.abs(p.getZ(i)-scenicOffset(p.getX(i),kind))>=5.05-.001);
 assert.deepEqual(Array.from(shoulder.geometry.attributes.position.array),Array.from(b.getObjectByName('natural-road-shoulder').geometry.attributes.position.array));
 if(kind==='rally')assert.equal(a.getObjectByName('retaining-wall').visible,false,'gravel stage should not be stamped masonry');
 }finally{disposeObject(a);disposeObject(b);}
});
