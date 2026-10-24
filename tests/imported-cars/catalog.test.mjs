import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const path=new URL('../../production/assets/imported-cars/catalog.json',import.meta.url);
const catalogue=JSON.parse(readFileSync(path,'utf8'));
const fleet=catalogue.vehicles;
test('real imported fleet has unique stable IDs, verified licence and pinned source hashes',()=>{
 assert.ok(fleet.length>=10);
 assert.equal(new Set(fleet.map(x=>x.id)).size,fleet.length);
 for(const item of fleet){
  assert.match(item.id,/^[a-z0-9-]+$/);
  assert.equal(item.fileName,item.id+'.glb');
  assert.ok(item.name&&item.creator&&item.originalUrl&&item.attribution);
  assert.ok(['CC-BY-4.0','CC0-1.0'].includes(item.license));
  assert.ok(['attribution-required','review-only'].includes(item.readiness));
  assert.match(item.source.commit,/^[a-f0-9]{40}$/);
  assert.match(item.source.gitBlobSha1,/^[a-f0-9]{40}$/);
  assert.match(item.source.path,/^[A-Za-z0-9_./-]+$/);
  assert.ok(item.source.path.endsWith('.glb'));
 }
});
test('sensitive third-party mirrors never default into cleared fleet',()=>{
 for(const id of ['mclaren-senna','porsche-manthey-gt3rs']){
  const item=fleet.find(x=>x.id===id);
  assert.ok(item);
  assert.equal(item.readiness,'review-only');
  assert.match(item.publisherNote,/rights|review|mirror|source/i);
 }
 const ready=fleet.filter(x=>x.readiness==='attribution-required');
 assert.ok(ready.length>=10);
});
