import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {requirePrivateReview} from '../../src/yunex/imported-cars/permissions.ts';

const attributed=JSON.parse(readFileSync(new URL('../../production/assets/imported-cars/catalog.json',import.meta.url)));
const external=JSON.parse(readFileSync(new URL('../../production/asset-library/external-car-catalogue.json',import.meta.url)));

test('attributed GLBs and 96 review-only candidates are uniquely addressable',()=>{
 const ids=[
  ...attributed.vehicles.map(r=>r.id),
  ...external.assets.map(r=>'external:'+r.id)
 ];
 assert.equal(ids.length,attributed.vehicles.length+96);
 assert.equal(new Set(ids).size,ids.length);
 assert.equal(external.assets.length,96);
 for(const a of external.assets){
  assert.equal(a.commercialUseApproved,false);
  assert.equal(a.licenseStatus,'unverified');
  assert.match(a.gitBlobSha,/^[a-f0-9]{40}$/);
  assert.ok(a.sizeBytes>100_000);
 }
});

test('unverified external assets and mirrored supercars demand private review',()=>{
 for(const item of external.assets.slice(0,5)){
  const asset={id:'external:'+item.id,privateReviewOnly:true};
  assert.throws(()=>requirePrivateReview(asset),/PRIVATE REVIEW ONLY/);
  assert.equal(requirePrivateReview(asset,true),asset);
 }
 for(const id of ['mclaren-senna','porsche-manthey-gt3rs']){
  const found=attributed.vehicles.find(x=>x.id===id);
  assert.equal(found.readiness,'review-only');
  assert.throws(()=>requirePrivateReview({id,privateReviewOnly:true}),/PRIVATE REVIEW ONLY/);
 }
});

test('attributed ready assets retain ordinary non-private scene access',()=>{
 const f40=attributed.vehicles.find(x=>x.id==='ferrari-f40');
 assert.equal(f40.readiness,'attribution-required');
 assert.equal(requirePrivateReview({id:f40.id,privateReviewOnly:false}).id,'ferrari-f40');
});
