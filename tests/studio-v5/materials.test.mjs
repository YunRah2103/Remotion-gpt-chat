import {test} from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {applyLoadedMaterials} from '../../src/yunex/studio-v5/assets.ts';
test('explicit surface overrides location when applying scanned road maps',()=>{
 const make=()=>{const g=new T.Group(),m=new T.Mesh(new T.PlaneGeometry(8,50),new T.MeshStandardMaterial());m.name='v5-road';g.add(m);return {g,m};};
 const textures=Array.from({length:6},()=>new T.Texture());const gravel=make(),before=gravel.m.material.map;
 applyLoadedMaterials(gravel.g,textures,'mountain','gravel');assert.equal(gravel.m.material.map,before);
 const asphalt=make();applyLoadedMaterials(asphalt.g,textures,'rally','asphalt');assert.equal(asphalt.m.material.map,textures[2]);
});
test('controlled comparison keeps foliage textures identical while preserving fallback road',()=>{
 const textures=Array.from({length:6},()=>new T.Texture()),g=new T.Group();
 for(const name of ['v5-road','v5-instanced-foliage-branches']){const m=new T.Mesh(new T.PlaneGeometry(),new T.MeshStandardMaterial());m.name=name;g.add(m);}
 applyLoadedMaterials(g,textures,'mountain','asphalt',false);assert.equal(g.getObjectByName('v5-road').material.map,null);assert.equal(g.getObjectByName('v5-instanced-foliage-branches').material.map,textures[4]);
});
