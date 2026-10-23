import {test} from 'node:test';import assert from 'node:assert/strict';
import {createAssembly,animateAssembly} from '../../src/yunex/modelling-kit/authoring.ts';
import {TWIN_TURBO_V8} from '../../src/yunex/modelling-kit/v3-proofs.ts';
test('authored flow markers follow real connection paths deterministically',()=>{
 const spec=structuredClone(TWIN_TURBO_V8);spec.connections[0].flow={speed:.4,count:5};const g=createAssembly(spec);
 const find=()=>{let beads=[];g.traverse(o=>{if(o.name.startsWith('flow-'))beads.push(o.position.toArray());});return beads;};
 animateAssembly(g,0,30);const a=find();assert.equal(a.length,5);
 animateAssembly(g,15,30);const b=find();assert.notDeepEqual(a,b);
 animateAssembly(g,0,30);assert.deepEqual(find(),a);
});
