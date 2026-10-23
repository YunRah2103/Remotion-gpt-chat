import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
test('approved V4 source and original mechanical/world kits remain byte-identical',()=>{
 const manifest=JSON.parse(readFileSync('docs/yunex-v5-preserved-baseline.json','utf8'));
 assert.ok(manifest.files.length>100);
 for(const {path,sha256} of manifest.files)assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'),sha256,`${path}: baseline changed; requires explicit visual reapproval`);
});
