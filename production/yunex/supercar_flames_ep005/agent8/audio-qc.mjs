#!/usr/bin/env node
/**
 * EP005 native final-audio diagnostic. Only checks a real approved-media render.
 * Does not synthesize voice, stems or speculative movie.
 *
 * Usage: node production/yunex/supercar_flames_ep005/agent8/audio-qc.mjs <real MP4>
 */
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const manifest=JSON.parse(fs.readFileSync(path.join(here,'edit-manifest.json'),'utf8'));
const file=path.resolve(process.argv[2] || '');
if(process.argv.length < 3 || !fs.existsSync(file)) throw new Error('Missing real master MP4 — will not fabricate audio proof');
function run(bin,args) {
  const proc=spawnSync(bin,args,{encoding:'utf8',maxBuffer:20*1024*1024});
  if(proc.error || proc.status!==0) throw new Error(bin+' failed: '+(proc.stderr||proc.error||proc.status));
  return proc;
}
const probe=JSON.parse(run('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file]).stdout);
const aud=probe.streams.filter(s=>s.codec_type==='audio');
const duration=Number(probe.format?.duration);
const expected=manifest.voice.approved ? 1 : 0;
if(aud.length!==expected) throw new Error('AUDIO CONTENT CLAIM MISMATCH: wanted '+expected+', got '+aud.length);
if(Math.abs(duration-25)>0.125) throw new Error('Master duration is not 25 seconds: '+duration);
const out={
 schemaVersion:1,source:file,
 mode:manifest.voice.approved?'ORIGINAL_NARRATION_AUDIO_CANDIDATE':'SILENT_PICTURE_REVIEW',
 audioStreamCount:aud.length,durationSeconds:duration,
 codec:aud[0]?.codec_name || null,sampleRateHz:Number(aud[0]?.sample_rate)||null,
 channels:aud[0]?.channels||0,integratedLUFS:null,truePeakDBFS:null,
 manualAudioListen:'REQUIRED_BEFORE_FINAL',
 approvedNarrationSha256:manifest.voice.approved?manifest.voice.sha256:null
};
if(manifest.voice.approved){
 if(aud[0].codec_name!=='aac' || Number(aud[0].sample_rate)!==48000 || aud[0].channels!==2)
   throw new Error('Audio must be H264 compatible AAC stereo 48 kHz, NOT an unverified stream');
 const ff=run('ffmpeg',['-hide_banner','-nostats','-i',file,'-map','0:a:0','-af','ebur128=peak=true','-f','null','-']);
 const text=ff.stderr;
 const tail=text.slice(text.lastIndexOf('Summary:'));
 const lufs=tail.match(/\bI:\s*(-?\d+(?:\.\d+)?)\s+LUFS/);
 const peak=tail.match(/\bPeak:\s*(-?\d+(?:\.\d+)?)\s+dBFS/);
 if(!lufs||!peak) throw new Error('No reliable audio loudness/true-peak measurements');
 out.integratedLUFS=Number(lufs[1]);
 out.truePeakDBFS=Number(peak[1]);
 if(!Number.isFinite(out.integratedLUFS) || out.integratedLUFS < -20 || out.integratedLUFS > -13)
   throw new Error('Audio integrated loudness outside controlled narration-led target: '+out.integratedLUFS);
 if(!Number.isFinite(out.truePeakDBFS) || out.truePeakDBFS > -0.8)
   throw new Error('Excessive audio true peak/clipping risk: '+out.truePeakDBFS);
}
const report=path.join(path.dirname(file),'audio-qc-report.json');
fs.writeFileSync(report,JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify(out,null,2));
