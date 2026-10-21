/**
 * Agent 6 — real native-video audit.
 * Do not confuse test fixtures, layout proxies or generic CI smoke movies
 * with source-approved EP004 motion footage.
 */
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, statSync, writeFileSync} from 'node:fs';
import {resolve, dirname, join, basename} from 'node:path';
import {pathToFileURL} from 'node:url';

export const VIDEO_HASH_STREAM_SELECTOR = '0:v:0';

const run = (command, args) => {
  try {
    return execFileSync(command, args, {encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe']});
  } catch (error) {
    const message = error.code === 'ENOENT'
      ? `Required ${command} binary is absent; install FFmpeg including ffprobe in the native runner.`
      : `${command} failed: ${String(error.stderr || error.message).slice(-2400)}`;
    throw new Error(`EP004 native audit: ${message}`);
  }
};

export function validateVideoMetadata(metadata, expectedFrames, {audioRequired = true} = {}) {
  if (!Number.isInteger(expectedFrames) || expectedFrames <= 1) {
    throw new Error('EP004 native audit: expected frame count must exceed one');
  }
  const video = metadata?.streams?.find(s => s.codec_type === 'video');
  if (!video) throw new Error('EP004 native audit: video stream missing');
  if (video.width !== 1080 || video.height !== 1920) {
    throw new Error(`EP004 native audit: wrong portrait size ${video.width}x${video.height}`);
  }
  if (video.avg_frame_rate !== '30/1') {
    throw new Error(`EP004 native audit: wrong fps ${video.avg_frame_rate}`);
  }
  if (Number(video.nb_read_frames) !== expectedFrames) {
    throw new Error(`EP004 native audit: decoded ${video.nb_read_frames} frames; expected ${expectedFrames}`);
  }
  if (audioRequired && !metadata.streams.some(s => s.codec_type === 'audio')) {
    throw new Error('EP004 native audit: original narration audio stream missing');
  }
  return {width: video.width, height: video.height, fps: video.avg_frame_rate, frames: Number(video.nb_read_frames), hasAudio: metadata.streams.some(s => s.codec_type === 'audio')};
}

export function uniqueDecodedFrameHashes(frameMd5) {
  return new Set(frameMd5.split(/\r?\n/).filter(line => line && !line.startsWith('#'))
    .map(line => line.split(',').at(-1).trim())).size;
}

/** Sample three isolated frames in EVERY locked editorial beat. */
export function beatMotionFrameNumbers(cuts, totalFrames) {
  if (!Array.isArray(cuts) || cuts.length !== 6) throw new Error('EP004 native audit: six editorial cuts required for per-beat motion');
  const indices = [];
  let previous = 0;
  for (const [i, cut] of cuts.entries()) {
    const start = cut.startFrame, end = cut.endFrameExclusive;
    if (!Number.isInteger(start) || !Number.isInteger(end) || start !== previous || end > totalFrames || end-start < 18) {
      throw new Error('EP004 native audit: invalid or too-short contiguous scene at beat ' + i);
    }
    const length = end-start;
    indices.push(start+Math.floor(length*0.16), start+Math.floor(length*0.5), start+Math.floor(length*0.84));
    previous = end;
  }
  if (previous !== totalFrames) throw new Error('EP004 native audit: scene cuts do not cover complete movie');
  return indices;
}

export function assertEachBeatChanges(frameHashContent, cuts, totalFrames) {
  const expected = beatMotionFrameNumbers(cuts, totalFrames);
  const entries = frameHashContent.split(/\r?\n/).filter(line => line && !line.startsWith('#'));
  if (entries.length !== expected.length) throw new Error('EP004 native audit: missing per-beat decoded frames');
  const report = [];
  for (let i=0; i<cuts.length; i++) {
    const unique = new Set(entries.slice(i*3,i*3+3).map(line => line.split(',').at(-1).trim())).size;
    if (unique<2) throw new Error('EP004 native audit: static or duplicate footage in scene ' + cuts[i].shot);
    report.push({shot: cuts[i].shot, sampleFrames: expected.slice(i*3,i*3+3), distinctPixelHashes: unique});
  }
  return report;
}

export function verifyNativeMp4(filePath, expectedFrames, {audioRequired = true, outputDir = null, cuts = null} = {}) {
  const absolute = resolve(filePath);
  if (!existsSync(absolute) || statSync(absolute).size < 1000) {
    throw new Error('EP004 native audit: missing or invalid MP4: ' + absolute);
  }
  const dir = resolve(outputDir || join(dirname(absolute), basename(absolute, '.mp4') + '-evidence'));
  mkdirSync(dir, {recursive: true});
  const ffprobeArgs = ['-v','error','-count_frames','-show_entries','stream=codec_type,codec_name,width,height,avg_frame_rate,nb_read_frames:format=duration','-of','json',absolute];
  const metadata = JSON.parse(run('ffprobe', ffprobeArgs));
  const video = validateVideoMetadata(metadata, expectedFrames, {audioRequired});
  run('ffmpeg', ['-hide_banner','-v','error','-xerror','-nostdin','-i',absolute,'-f','null','-']);
  const hashes = uniqueDecodedFrameHashes(run('ffmpeg', ['-hide_banner','-v','error','-nostdin','-i',absolute,'-map',VIDEO_HASH_STREAM_SELECTOR,'-vf','fps=1','-f','framemd5','-']));
  if (hashes < 2) throw new Error('EP004 native audit: no real time-evolving frames found by sampled decoded pixel hashes');
  let sceneMotionProof = null;
  if (cuts !== null) {
    const sampleFrames=beatMotionFrameNumbers(cuts,expectedFrames);
    const select=sampleFrames.map(frame => 'eq(n\\,'+frame+')').join('+');
    const sampleMd5=run('ffmpeg',['-hide_banner','-v','error','-nostdin','-i',absolute,'-map',VIDEO_HASH_STREAM_SELECTOR,'-vf','select='+select,'-fps_mode','vfr','-f','framemd5','-']);
    sceneMotionProof=assertEachBeatChanges(sampleMd5,cuts,expectedFrames);
  }
  const screenshots = [];
  for (const frame of [0, Math.floor(expectedFrames / 2), expectedFrames - 1]) {
    const outfile = join(dir, 'frame-' + String(frame).padStart(5, '0') + '.png');
    run('ffmpeg', ['-hide_banner','-v','error','-nostdin','-y','-i',absolute,'-vf',`select=eq(n\\,${frame})`,'-frames:v','1',outfile]);
    if (!existsSync(outfile) || statSync(outfile).size === 0) {
      throw new Error('EP004 native audit: sample frame not extracted: ' + frame);
    }
    screenshots.push(outfile);
  }
  const report = {
    source: absolute,
    video,
    durationSec: Number(metadata.format?.duration ?? 0),
    decodedAllFrames: true,
    uniqueSampledFrames: hashes,
    perBeatMotionProof: sceneMotionProof,
    sampledFrames: [0, Math.floor(expectedFrames/2), expectedFrames-1],
    screenshots,
    visualSignoff: 'PENDING HUMAN INSPECTION — automated pixel changes do not prove convincing physics or cinematic quality',
    audioListeningSignoff: 'PENDING HUMAN LISTENING — an audio stream does not prove intelligible original narration',
  };
  writeFileSync(join(dir,'native-report.json'), JSON.stringify(report,null,2) + '\n');
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const file = process.argv[2], frames = Number(process.argv[3]);
  if (!file || !frames || ![undefined,'--video-only'].includes(process.argv[4])) throw new Error('Usage: node native-qa.mjs path-to-native.mp4 expected-frame-count [--video-only]');
  process.stdout.write(JSON.stringify(verifyNativeMp4(file, frames, {audioRequired:process.argv[4]!=='--video-only'}), null, 2) + '\n');
}
