import {test} from 'node:test';import assert from 'node:assert/strict';
import {sampleProofMotion} from '../../src/yunex/studio-v5/proof-motion.ts';
test('short valid custom roads show continuous movement without reaching endpoint',()=>{const a=sampleProofMotion(20,0,30,13),b=sampleProofMotion(20,239,30,13);assert.ok(b.distance>a.distance+10);assert.ok(a.distance>=3&&b.distance<=17);assert.equal(a.speed,b.speed);assert.deepEqual(sampleProofMotion(20,0,30,13),a);});
test('long roads retain authored speed and reject unusable inputs',()=>{assert.equal(sampleProofMotion(400,90,30,13).distance,117);assert.throws(()=>sampleProofMotion(9,0,30,13),/12/);assert.throws(()=>sampleProofMotion(200,0,0,13),/finite|positive/);});
