import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createFragments,animateFragments} from '../../src/yunex/modelling-kit/damage.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
const origin=new T.Vector3(1.3,.28,.8);
const snapshot=g=>g.children.map(o=>[...o.position,...o.rotation.toArray().slice(0,3),...o.scale]);
test('ejected rubber rebounds after its first road impact',()=>{
 const g=createFragments();
 animateFragments(g,1,.4,origin);const first=g.children[0].position.y;
 animateFragments(g,1,.48,origin);assert.ok(g.children[0].position.y>first+.005,'rubber should rise during first rebound');
 disposeObject(g);
});
test('rubber fragments settle instead of sliding forever',()=>{
 const g=createFragments();animateFragments(g,1,8,origin);const settled=snapshot(g);
 animateFragments(g,1,12,origin);assert.deepEqual(snapshot(g),settled);
 disposeObject(g);
});
test('all tumbling rubber vertices stay above the road throughout ejection',()=>{
 const g=createFragments(),p=new T.Vector3();
 for(let t=0;t<1.5;t+=.025){animateFragments(g,1,t,origin);g.updateMatrixWorld(true);g.traverse(o=>{if(!o.isMesh||o.scale.x===0)return;const a=o.geometry.attributes.position;for(let i=0;i<a.count;i++){p.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);assert.ok(p.y>=.001-1e-6,`road penetration at ${t}: ${p.y}`);}});}
 disposeObject(g);
});
test('fragment motion is identical after out-of-order seeking and hides before ejection',()=>{
 const g=createFragments();animateFragments(g,1,.48,origin);const before=snapshot(g);
 animateFragments(g,1,8,origin);animateFragments(g,1,.48,origin);assert.deepEqual(snapshot(g),before);
 animateFragments(g,1,0,origin);assert.ok(g.children.every(o=>o.scale.x===0));
 animateFragments(g,0,.48,origin);assert.equal(g.visible,false);disposeObject(g);
});
