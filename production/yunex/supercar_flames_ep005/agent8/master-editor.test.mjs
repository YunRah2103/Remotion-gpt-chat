import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const DIR=path.dirname(fileURLToPath(import.meta.url));
const manifest=JSON.parse(fs.readFileSync(path.join(DIR,'edit-manifest.json'),'utf8'));
const editor=path.join(DIR,'master-editor.mjs');

test('EP005 1080x1920 native portrait / 30fps / 25-second source-locked picture plan',()=>{
  assert.deepEqual([manifest.settings.width,manifest.settings.height,manifest.settings.fps,manifest.settings.totalFrames],[1080,1920,30,750]);
  let cursor=0;
  for(const b of manifest.beats) {
    assert.equal(b.start,cursor,'timeline gap or overlap: '+b.id);
    assert.ok(b.end>b.start);
    cursor=b.end;
  }
  assert.equal(cursor,750);
  assert.equal(manifest.beats[0].id,'hook');
  assert.equal(manifest.beats[0].start,0);
  assert.equal(manifest.beats.at(-1).end,750);
});

test('first-second afterfire and last 75 frames are assigned to port-anchored integrated source',()=>{
  assert.equal(manifest.beats[0].role,'integrated');
  assert.equal(manifest.beats.at(-1).role,'integrated');
  assert.equal(manifest.beats.at(-1).start,675);
  assert.ok(manifest.beats.find(b=>b.role==='science'));
});

test('new Agent 6/7 approval gate cannot silently use rejected source or manufacture Cedar narration',()=>{
  const r=spawnSync(process.execPath,[editor,'--check'],{cwd:process.cwd(),encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
  const status=JSON.parse(r.stdout);
  assert.equal(status.ready,false);
  assert.equal(status.mode,'SILENT_PICTURE_REVIEW');
  assert.ok(status.blockers.some(x=>x.includes('hook')));
  assert.equal(manifest.voice.approved,false);
  assert.deepEqual(manifest.captions,[]);
  assert.ok(manifest.beats.every(b=>b.media.approved===false));
});

test('approved teal V4 exterior is pinned without falsely approving shots, ports or audio',()=>{
  const hero=manifest.approvedHero;
  assert.equal(hero.appearanceApproved,true);
  assert.equal(hero.referenceProject,'v4-a-supercar');
  assert.equal(hero.sourceCommit,'9052a539e10a7cb97487c1435455bb9962ad58e1');
  assert.deepEqual(hero.vehicle,{variant:'supercar',bodyDetail:'studio',color:'#18636b'});
  assert.equal(hero.sourceVideo.sha256,'1654a5efd3a3403871b0a52a3140a9e7aeb1222a2e4bd4242e6edaa8d879cd88');
  assert.equal(hero.approvalScope,'CAR_APPEARANCE_ONLY__NOT_FULL_FILM_OR_MOVING_SHOTS');
  for(const beat of manifest.beats) {
    assert.equal(beat.media.approved,false,'appearance approval must not unlock '+beat.id);
    if(['vehicle','integrated'].includes(beat.role)) {
      assert.equal(beat.media.approvedHeroSourceCommit,null);
    }
  }
  assert.equal(manifest.voice.approved,false);
});

test('render hard-stops with missing approval and no false finished MP4',()=>{
  const r=spawnSync(process.execPath,[editor,'--render'],{cwd:process.cwd(),encoding:'utf8'});
  assert.equal(r.status,2);
  assert.match(r.stderr,/BLOCKED/);
});
