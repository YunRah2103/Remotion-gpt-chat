#!/usr/bin/env node
// Stage the owner's unchanged Cedar MP3 on a TRUSTED LOCAL render worker.
// Never commit or upload this binary to the public GitHub repository.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';

const EXPECTED='90dd2e299b1cdd9b7f2d3bc508b064c43dda7bfc36caa345b2f502ec13c200d8';
const TARGET=path.resolve(process.cwd(),'out/ep005-agent8-sources/user-cedar/openai-fm-cedar-audio.mp3');
const src=process.argv[2];
if(process.argv.length!==3 || !src) {
 console.error('Usage: node stage-owner-voice.mjs /secure/path/openai-fm-cedar-audio.mp3');
 process.exit(2);
}
const source=path.resolve(src);
if(!fs.existsSync(source)||!fs.statSync(source).isFile()) throw new Error('Supplied input is not a local file');
const bytes=fs.readFileSync(source);
const sha=crypto.createHash('sha256').update(bytes).digest('hex');
if(sha!==EXPECTED || bytes.length!==408960)
 throw new Error('User-supplied original Cedar SHA256/length mismatch; refusing to stage');
const result=spawnSync('ffprobe',['-v','error','-show_entries','format=duration:stream=codec_name,sample_rate,channels','-of','json',source],{encoding:'utf8'});
if(result.status!==0||result.error) throw new Error('Cannot independently probe owner MP3');
const info=JSON.parse(result.stdout);
if(Math.abs(Number(info.format?.duration)-25.56)>0.03 ||
 !info.streams?.some(s=>s.codec_name==='mp3'&&Number(s.sample_rate)===24000&&s.channels===1))
 throw new Error('Unexpected user Cedar codec, rate or duration');
fs.mkdirSync(path.dirname(TARGET),{recursive:true,mode:0o700});
const tmp=TARGET+'.staging-'+process.pid;
try {
 fs.writeFileSync(tmp,bytes,{flag:'wx',mode:0o600});
 fs.chmodSync(tmp,0o600);
 fs.renameSync(tmp,TARGET);
} finally {if(fs.existsSync(tmp))fs.unlinkSync(tmp);}
if(crypto.createHash('sha256').update(fs.readFileSync(TARGET)).digest('hex')!==EXPECTED)
 throw new Error('Staged original Cedar hash mismatch');
console.log('Verified original owner Cedar is staged LOCALLY with restricted permissions (SHA256 '+EXPECTED+').');
console.log('Never add out/ep005-agent8-sources to Git.');
