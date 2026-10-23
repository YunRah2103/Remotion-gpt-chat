import {test} from 'node:test';import assert from 'node:assert/strict';
import {createImpactBarrier,animateImpactBarrier} from '../../src/yunex/modelling-kit/barrier.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
test('impact bends actual rail vertices and reverse seek exactly restores geometry',()=>{const g=createImpactBarrier(),rail=g.getObjectByName('impact-rail'),a=rail.geometry.attributes.position;const before=Array.from(a.array);animateImpactBarrier(g,1);assert.notDeepEqual(Array.from(a.array),before);animateImpactBarrier(g,0);assert.deepEqual(Array.from(a.array),before);assert.throws(()=>animateImpactBarrier(g,NaN));disposeObject(g);});
