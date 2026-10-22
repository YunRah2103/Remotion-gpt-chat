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

test('render hard-stops with missing approval and no false finished MP4',()=>{
  const r=spawnSync(process.execPath,[editor,'--render'],{cwd:process.cwd(),encoding:'utf8'});
  assert.equal(r.status,2);
  assert.match(r.stderr,/BLOCKED/);
});
