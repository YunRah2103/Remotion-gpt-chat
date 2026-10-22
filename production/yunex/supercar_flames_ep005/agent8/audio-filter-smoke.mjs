#!/usr/bin/env node
/**
 * Synthetic audio-only FFmpeg filter smoke test (NO user VO and NO EP005 film).
 * Verifies future sidechain+LUFS filter path without making false film artifacts.
 */
import {spawnSync} from 'node:child_process';
const graph=[
  '[0:a]aresample=48000,asetpts=PTS-STARTPTS,apad,atrim=duration=1[originalVoice]',
  '[1:a]aresample=48000,volume=-15dB,atrim=duration=1[bed0]',
  '[originalVoice]asplit=2[voiceMain][voiceKey]',
  '[bed0]amix=inputs=1:duration=longest:dropout_transition=0:normalize=0[bedSum]',
  '[bedSum][voiceKey]sidechaincompress=threshold=0.02:ratio=6:attack=7:release=220[ducked]',
  '[voiceMain][ducked]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,loudnorm=I=-16:LRA=9:TP=-1.5:linear=false[aout]'
].join(';');
const args=['-hide_banner','-loglevel','error',
  '-f','lavfi','-i','sine=frequency=305:sample_rate=48000:duration=1',
  '-f','lavfi','-i','sine=frequency=115:sample_rate=48000:duration=1',
  '-filter_complex',graph,'-map','[aout]','-t','1','-f','null','-'];
const r=spawnSync('ffmpeg',args,{encoding:'utf8',maxBuffer:2*1024*1024});
if(r.status!==0 || r.error) throw new Error('Audio-only filter test failed (NO film output): '+(r.stderr||r.error||r.status));
console.log('AUDIO-ONLY FILTER DIAGNOSTIC PASS — no EP005 voice, music or film was generated.');
