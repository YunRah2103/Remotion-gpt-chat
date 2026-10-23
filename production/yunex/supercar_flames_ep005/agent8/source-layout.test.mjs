import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {resolveArtifactDestination} from './source-layout.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../../../..');
const read=(f)=>JSON.parse(fs.readFileSync(path.join(here,f),'utf8'));
const rough=read('rough-picture-manifest.json');

test('candidate plan covers exactly 750 portrait frames without looping or freezing',()=>{
  assert.deepEqual([rough.settings.width,rough.settings.height,rough.settings.fps,rough.settings.totalFrames],[1080,1920,30,750]);
  assert.equal(rough.voice.approved,false);
  let cursor=0, verified=0;
  for(const beat of rough.beats){
    assert.equal(beat.start,cursor);
    assert.ok(beat.end>beat.start);
    const count=beat.end-beat.start; cursor=beat.end;
    assert.equal(beat.media.approved,false,beat.id+' was silently promoted');
    if(beat.media.sha256) {verified+=count; assert.match(beat.media.sha256,/^[a-f0-9]{64}$/);}
    else assert.equal(beat.id,'rear-proof');
  }
  assert.equal(cursor,750);
  assert.equal(verified,630);
  assert.equal(rough.pictureReview.missingFrameCount,120);
  assert.equal(rough.pictureReview.notAnApprovedFilm,true);
});

test('A6 nested native/*.mp4 artifacts unpack to exact paths under isolated folder',()=>{
  const front=rough.beats.find(b=>b.id==='drive').media;
  const result=resolveArtifactDestination(root,front);
  assert.ok(result.absolute.endsWith('/front/native/front-pursuit.mp4'));
  assert.ok(result.extraction.endsWith('/front'));
  assert.equal(result.absolute,path.resolve(result.extraction,'native/front-pursuit.mp4'));
  for(const beat of rough.beats.filter(b=>b.media.path)) {
    assert.ok(resolveArtifactDestination(root,beat.media).absolute.startsWith(path.resolve(root,'out/ep005-agent8-sources')+path.sep));
  }
});

test('no path traversal or extract-root ambiguity in source artifact downloader',()=>{
  const good=rough.beats[0].media;
  for(const [target,dir] of [
    ['out/ep005-agent8-sources/../secret.mp4','out/ep005-agent8-sources/hook'],
    ['/tmp/exfil.mp4','out/ep005-agent8-sources/hook'],
    ['out/ep005-agent8-sources/hook/file.mp4','out/ep005-agent8-sources/other'],
    ['out/ep005-agent8-sources/hook/file.mp4','../../tmp'],
    ['out/ep005-agent8-sources/hook\\secret.mp4','out/ep005-agent8-sources/hook'],
  ]) {
    assert.throws(()=>resolveArtifactDestination(root,{...good,path:target,artifactExtractDir:dir}));
  }
});

test('V4 flame tip version and producer SHAs are pinned, but not visual-approved',()=>{
  const integrated=rough.beats.filter(b=>b.role==='integrated');
  assert.equal(integrated.length,2);
  for(const b of integrated) {
    assert.equal(b.media.approvedHeroSourceCommit,'9052a539e10a7cb97487c1435455bb9962ad58e1');
    assert.equal(b.media.portManifestSha256,'5f756ab40a6b2219a50485c94cf7592d73469478e7ddf49fd3644ca84624672d');
    assert.equal(b.media.portManifestVersion,'v4-exhaust-ports@1');
    assert.equal(b.media.agent6Commit,'26980fe1f509484bb612cd47ffcbf7c53f26fddf');
    assert.equal(b.media.agent7Commit,'de7d847ea1dc626744a0cee9b521b24782ce81be');
    assert.equal(b.media.approvalRef,null);
  }
  assert.deepEqual(rough.beats.filter(b=>b.role==='science').map(b=>b.media.sourceInFrame),[0,75]);
});
