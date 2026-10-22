import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const editor=path.join(here,'master-editor.mjs');
const original=JSON.parse(fs.readFileSync(path.join(here,'edit-manifest.json'),'utf8'));
const cues=JSON.parse(fs.readFileSync(path.join(here,'audio-cue-sheet.json'),'utf8'));
const script=(m)=>{
  const folder=fs.mkdtempSync(path.join(os.tmpdir(),'ep005-a8-audio-'));
  const target=path.join(folder,'manifest.json');
  fs.writeFileSync(target,JSON.stringify(m,null,2));
  try {
    const proc=spawnSync(process.execPath,[editor,'--check',target],{cwd:process.cwd(),encoding:'utf8'});
    assert.equal(proc.status,0,proc.stderr);
    return JSON.parse(proc.stdout);
  } finally {
    fs.rmSync(folder,{recursive:true,force:true});
  }
};

test('EP005 has one proposed sound cue per exact source-locked editorial beat',()=>{
  assert.equal(cues.sourceStatus,'PRELIMINARY_EDITING_NOT_RECORDED_OR_APPROVED');
  assert.equal(cues.cues.length,original.beats.length);
  cues.cues.forEach((c,i)=>{
    assert.deepEqual([c.id,c.start,c.end],[original.beats[i].id,original.beats[i].start,original.beats[i].end]);
    assert.equal(c.proposedStem,null);
    assert.equal(c.approved,false);
  });
  assert.equal(cues.narration.approved,false);
  assert.equal(cues.mastering.sampleRateHz,48000);
});

test('reject unapproved narration instead of synthesizing or respeeding it',()=>{
  const m=structuredClone(original);
  m.voice={...m.voice,approved:true,sha256:'a'.repeat(64),sourceCommit:'b'.repeat(40),
    path:'out/ep005-agent8-sources/voice.wav',
    approvalRef:'https://github.com/YunRah2103/Remotion-gpt-chat/issues/267#issuecomment-6352764717',
    artifactRunId:39865635903,artifactName:'ep005-voice',verifiedDurationSeconds:25.248,
    captionsVerified:true};
  m.captions=[{text:'Spoken only if validated',start:0,end:30,verified:true}];
  const status=script(m);
  assert.equal(status.ready,false);
  assert.ok(status.blockers.some(x=>x.includes('voice provenance')));
});

test('reject unsourced spoken captions beyond approved recording duration',()=>{
  const m=structuredClone(original);
  m.voice={...m.voice,approved:true,sha256:'a'.repeat(64),sourceCommit:'b'.repeat(40),
    path:'out/ep005-agent8-sources/voice.wav',
    approvalRef:'https://github.com/YunRah2103/Remotion-gpt-chat/issues/267#issuecomment-6352764717',
    artifactRunId:39865635903,artifactName:'ep005-voice',verifiedDurationSeconds:23.4,
    captionsVerified:true};
  m.captions=[{text:'Narrator line',start:700,end:745,verified:true}];
  const status=script(m);
  assert.equal(status.ready,false);
  assert.ok(status.blockers.some(x=>x.includes('beyond original recording')));
});

test('candidate A rejected source never meets new integrated hero quality gate',()=>{
  const m=structuredClone(original);
  const hook=m.beats[0].media;
  Object.assign(hook,{approved:true,sourceCommit:'bc0185ece668d6ebb1f0f58adbc62edec0ce2cb4',
    sha256:'0797444a04513418593b72cd6aaf58c1e2cbfc64574ae8d33c316ec4f7fddc81',
    path:'out/ep005-agent8-sources/hook.mp4',approvalRef:'https://github.com/YunRah2103/Remotion-gpt-chat/issues/267#issuecomment-6352764717',
    artifactRunId:39865710573,artifactName:'ep005-a6-car',
    assetProvenance:'candidate A CC0 license',agent6Commit:'bc0185ece668d6ebb1f0f58adbc62edec0ce2cb4',
    agent7Commit:'f964c9d3b225116066c4ba5a5dada0f736466ef0',
    portManifestSha256:'a'.repeat(64),portManifestVersion:'candidate-A-v1',
    portManifestRef:'https://github.com/YunRah2103/Remotion-gpt-chat/pull/270',producerIssue:266});
  const status=script(m);
  assert.equal(status.ready,false);
  assert.ok(status.blockers.some(x=>x.includes('hook')));
});

test('unverified generic issue link cannot stand in for explicit source approval',()=>{
  const m=structuredClone(original);
  const b=m.beats[1].media;
  Object.assign(b,{approved:true,path:'out/ep005-agent8-sources/drive.mp4',
    sha256:'a'.repeat(64),sourceCommit:'b'.repeat(40),artifactRunId:12345,
    artifactName:'my-car',producerIssue:265,assetProvenance:'licensed upstream',
    approvalRef:'https://github.com/YunRah2103/Remotion-gpt-chat/issues/265'});
  const status=script(m);
  assert.equal(status.ready,false);
  assert.ok(status.blockers.some(x=>x.includes('drive')));
});
