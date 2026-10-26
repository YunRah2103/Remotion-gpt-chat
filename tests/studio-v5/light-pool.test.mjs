import {test} from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {limitStudioLights,restoreStudioLights} from '../../src/yunex/studio-v5/light-pool.ts';
test('light budget selects nearest lamps deterministically and restores original visibility',()=>{
 const g=new T.Group();for(let i=0;i<12;i++){const p=new T.PointLight();p.name='lamp-'+i;p.position.x=i*10;g.add(p);}g.children[5].visible=false;
 const selected=x=>{limitStudioLights(g,new T.Vector3(x,0,0),4);return g.children.filter(x=>x.visible).map(x=>x.name);};
 const first=selected(12);assert.deepEqual(first,['lamp-0','lamp-1','lamp-2','lamp-3']);selected(95);assert.deepEqual(selected(12),first);restoreStudioLights(g);assert.equal(g.children.filter(x=>x.visible).length,11);assert.equal(g.children[5].visible,false);
 assert.throws(()=>limitStudioLights(g,new T.Vector3(),0),/budget/);
});
test('reflection clone restores authored lamps independent of initial driving frame',async()=>{
 const {cloneStudioForReflections}=await import('../../src/yunex/studio-v5/light-pool.ts');
 const g=new T.Group();for(let i=0;i<8;i++){const p=new T.PointLight();p.name='lamp-'+i;p.position.x=i*10;g.add(p);}g.children[3].visible=false;
 const cloneAt=x=>{limitStudioLights(g,new T.Vector3(x,0,0),2);return cloneStudioForReflections(g).children.map(o=>o.visible);};
 assert.deepEqual(cloneAt(0),cloneAt(70));assert.deepEqual(cloneAt(0),[true,true,true,false,true,true,true,true]);assert.equal(g.children.filter(o=>o.visible).length,2);
});
