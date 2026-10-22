import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createCinematicEnvironment} from '../../src/yunex/modelling-kit/environments.ts';
import {roadHeight} from '../../src/yunex/modelling-kit/dynamics.ts';
import {scenicOffset} from '../../src/yunex/world-kit/world-catalog.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
test('opt-in rally road uses the exact controller height field in real mesh geometry',()=>{
 const world=createCinematicEnvironment({kind:'rally',roughness:.8});
 const road=world.getObjectByName('road');assert.ok(road.geometry.attributes.position.count>10000);
 const p=road.geometry.attributes.position;for(let i=0;i<p.count;i+=97){assert.ok(Math.abs(p.getY(i)-roadHeight(p.getX(i),p.getZ(i)-scenicOffset(p.getX(i),'rally'),.8))<1e-5);}
 assert.throws(()=>createCinematicEnvironment({kind:'track',roughness:.8}));disposeObject(world);
});
test('rough rally recipes reject unsupported motorcycle and six-wheel contact layouts before rendering',async()=>{
 const {compileRecipe}=await import('../../src/yunex/modelling-kit/recipe.ts');
 for(const variant of ['sport-bike','naked-bike','touring-bike','tractor-truck'])assert.throws(()=>compileRecipe({id:'rough-test',title:'Contact test',vehicle:{variant},world:{kind:'rally',roughness:.8},shots:[{id:'drive',duration:1,camera:'tracking',action:'cruise',caption:''}]}),/four-wheel/i);
});
