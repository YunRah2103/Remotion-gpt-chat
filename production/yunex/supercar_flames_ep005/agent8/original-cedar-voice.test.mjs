import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const here=path.dirname(fileURLToPath(import.meta.url));
const load=f=>JSON.parse(fs.readFileSync(path.join(here,f),'utf8'));
const source=load('user-cedar-voice-contract.json');
const cut=load('narrated-picture-manifest.json');

test('owner Cedar recording is exactly SHA-locked at 25.56 seconds without audio truncation',()=>{
  assert.equal(source.sha256,'90dd2e299b1cdd9b7f2d3bc508b064c43dda7bfc36caa345b2f502ec13c200d8');
  assert.equal(source.ffprobe.containerDurationSeconds,25.56);
  assert.equal(source.ffprobe.sampleRateHz,24000);
  assert.equal(source.ffprobe.channels,1);
  assert.equal(cut.voice.userProvidedOriginal,true);
  assert.equal(cut.voice.approved,true);
  assert.equal(cut.voice.sha256,source.sha256);
  assert.equal(cut.voice.verifiedDurationSeconds,source.ffprobe.containerDurationSeconds);
  assert.equal(cut.settings.totalFrames,767);
  assert.equal(Math.ceil(cut.voice.verifiedDurationSeconds*cut.settings.fps),767);
  assert.ok(cut.settings.totalFrames/cut.settings.fps>=25.56);
  assert.equal(cut.voice.originalMp3AvailableToRenderer,false);
});

test('all thirteen user-transcript phrases have ordered measured cadence and safe caption limits',()=>{
  assert.equal(source.cues.length,13);
  assert.equal(cut.captions.length,13);
  let last=0;
  for(const [i,c] of cut.captions.entries()){
    assert.equal(c.verified,true,'only measured phrase boundaries, no fabricated word timestamps');
    assert.ok(c.start>=last);
    assert.ok(c.end>c.start && c.end<=767);
    assert.ok(c.text.length<=88);
    assert.equal(c.text.replace(/\n/g,' ').replace(/\s+/g,' ').toLowerCase(),source.cues[i].text.toLowerCase());
    last=c.end;
  }
  assert.equal(last,763);
  assert.equal(cut.captions.at(-1).text,'it looks absolutely insane.');
});

test('native 767-frame narrated film is source-gated until every approved shot exists',()=>{
  const run=spawnSync(process.execPath,[path.join(here,'master-editor.mjs'),'--check',path.join(here,'narrated-picture-manifest.json')],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  const gate=JSON.parse(run.stdout);
  assert.equal(gate.frameCount,767);
  assert.equal(gate.ready,false);
  assert.equal(gate.mode,'FINAL_WITH_APPROVED_AUDIO');
  assert.ok(gate.blockers.some(x=>x.includes('rear-proof')));
  assert.ok(gate.blockers.some(x=>x.includes('payoff')));
  assert.ok(cut.beats.every(x=>x.media.approved===false));
  assert.equal(cut.pictureReview.missingFrameCount,137);
});

test('source-locked recorder explicitly preserves original duration rather than forcing a 25s crop',()=>{
  const editor=fs.readFileSync(path.join(here,'master-editor.mjs'),'utf8');
  assert.ok(editor.includes("apad,atrim=duration='+filmDuration+'[originalVoice]"));
  assert.ok(!editor.includes('apad,atrim=duration=25[originalVoice]'));
});
