import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const stage=path.join(path.dirname(fileURLToPath(import.meta.url)),'stage-owner-voice.mjs');
test('user Cedar staging rejects absent path and never silently picks synthetic narration',()=>{
 const result=spawnSync(process.execPath,[stage],{encoding:'utf8'});
 assert.equal(result.status,2);
 assert.match(result.stderr,/Usage/);
});
test('user Cedar staging fails closed on nonmatching data, never writing the supplied bytes',()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ep005-cedar-invalid-'));
 try{
  const p=path.join(tmp,'fake.mp3');
  fs.writeFileSync(p,'This is not the actual user recording');
  const result=spawnSync(process.execPath,[stage,p],{encoding:'utf8',cwd:tmp});
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/SHA256\/length mismatch/);
  assert.equal(fs.existsSync(path.join(tmp,'out/ep005-agent8-sources/user-cedar/openai-fm-cedar-audio.mp3')),false);
 }finally{fs.rmSync(tmp,{force:true,recursive:true});}
});
