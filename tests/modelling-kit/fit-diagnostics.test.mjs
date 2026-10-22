import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import * as author from '../../src/yunex/modelling-kit/authoring.ts';
test('fit diagnostics report containment in rotated parent space without silently scaling parts',()=>{
 const parent=new T.Group();parent.position.set(4,2,-5);parent.rotation.y=.8;
 const part=new T.Mesh(new T.BoxGeometry(2,1,1));parent.add(part);parent.updateMatrixWorld(true);
 const fits=author.fitDiagnostics(parent,part,{min:[-1.1,-.6,-.6],max:[1.1,.6,.6]});
 assert.equal(fits.fits,true);assert.ok(Math.abs(fits.clearance[0]-.1)<1e-6);
 part.position.x=.5;
 const fails=author.fitDiagnostics(parent,part,{min:[-1.1,-.6,-.6],max:[1.1,.6,.6]});
 assert.equal(fails.fits,false);assert.ok(fails.overflows.some(x=>x.axis==='x'&&x.side==='max'));
 assert.equal(part.scale.x,1);
});
test('fit assistance proposes a non-destructive uniform scale and parent-space translation',()=>{
 const parent=new T.Group(),part=new T.Mesh(new T.BoxGeometry(4,2,2));part.position.x=3;parent.add(part);
 const result=author.fitDiagnostics(parent,part,{min:[-1,-1,-1],max:[1,1,1]});assert.ok(result.suggestion);assert.equal(result.suggestion.uniformScale,.5);assert.deepEqual(result.suggestion.translation,[-1.5,0,0]);assert.equal(part.scale.x,1);assert.equal(part.position.x,3);
});
