#!/usr/bin/env node
/**
 * EP004 Agent 4 independent *native Remotion* moving-video proof.
 *
 * Run at repository root with npm ci and ffmpeg/ffprobe installed:
 * node production/yunex/f1_sparks_ep004/look/render-native.mjs
 *
 * Never accepts a synthetic image sequence in place of a Remotion render.
 * Validates both actual 1080x1920 H.264 videos and their frame differences.
 */
import {spawnSync} from 'node:child_process';
import {readFileSync, writeFileSync, mkdirSync, existsSync} from 'node:fs';
import {resolve, dirname, relative} from 'node:path';
import {createHash} from 'node:crypto';

const entry = 'production/yunex/f1_sparks_ep004/look/preview-entry.tsx';
const directory = resolve('production/yunex/f1_sparks_ep004/previews/agent-4');
const scenes = [
  {id: 'EP004Agent4Trackside', filename: 'ep004-agent4-trackside-1080x1920.mp4', frames: 150},
  {id: 'EP004Agent4RaceFollow', filename: 'ep004-agent4-race-follow-1080x1920.mp4', frames: 210},
];

function run(command, args, opts = {}) {
  const out = spawnSync(command, args, {
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
    stdio: opts.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    ...opts,
  });
  if (out.error || out.status !== 0) {
    throw new Error(command + ' exited ' + out.status + ': ' + (out.stderr || out.error || ''));
  }
  return (out.stdout || '').trim();
}

function probe(path) {
  return JSON.parse(run('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0', '-count_frames',
    '-show_entries', 'stream=width,height,codec_name,pix_fmt,avg_frame_rate,nb_read_frames,duration',
    '-of', 'json', path,
  ], {capture: true})).streams[0];
}

function movingFrames(path, frameCount) {
  const stdout = run('ffmpeg', [
    '-v', 'error', '-i', path, '-an',
    '-vf', 'scale=80:144:flags=area', '-f', 'framemd5', '-',
  ], {capture: true});
  const records = stdout.split('\n').filter(x => x.trim() && !x.startsWith('#'));
  const hashes = records.map(x => x.trim().split(',').at(-1).trim());
  const unique = new Set(hashes).size;
  if (records.length !== frameCount) throw new Error('Frame hash count mismatch: ' + records.length);
  if (unique < Math.floor(frameCount * 0.7)) {
    throw new Error('Preview lacks meaningful moving-frame changes: ' + unique + '/' + frameCount);
  }
  return {checkedFrames: records.length, uniqueFrameHashes: unique};
}

function grab(path, frame, fps, dest) {
  run('ffmpeg', [
    '-v', 'error', '-y', '-ss', (frame / fps).toFixed(6),
    '-i', path, '-frames:v', '1', dest,
  ]);
  if (!existsSync(dest)) throw new Error('Missing frame evidence ' + dest);
}

mkdirSync(directory, {recursive: true});
const summary = {sourceEntry: entry, generatedBy: 'Remotion renderer + ffprobe + complete FFmpeg decode', previews: []};
for (const scene of scenes) {
  const path = resolve(directory, scene.filename);
  run('npx', [
    'remotion', 'render', entry, scene.id, path,
    '--frames=0-' + (scene.frames - 1),
    '--gl=swangle', '--codec=h264',
    '--pixel-format=yuv420p', '--concurrency=1',
  ]);
  const stream = probe(path);
  if (stream.width !== 1080 || stream.height !== 1920) throw new Error('Not native portrait');
  if (stream.avg_frame_rate !== '30/1') throw new Error('Not 30fps');
  if (Number(stream.nb_read_frames) !== scene.frames) throw new Error('Wrong decoded video frame count');
  if (stream.codec_name !== 'h264' || stream.pix_fmt !== 'yuv420p') throw new Error('Unexpected codec/pixel format');
  // -xerror and complete output decode; error exits nonzero.
  run('ffmpeg', ['-v', 'error', '-xerror', '-i', path, '-f', 'null', '-']);
  const motion = movingFrames(path, scene.frames);
  const stills = [];
  for (const frame of [0, Math.floor((scene.frames - 1) / 2), scene.frames - 1]) {
    const dest = resolve(directory, scene.id + '-frame-' + frame + '.png');
    grab(path, frame, 30, dest);
    stills.push(relative(directory, dest));
  }
  summary.previews.push({
    id: scene.id,
    mp4: scene.filename,
    video: stream,
    durationSec: scene.frames / 30,
    fullDecode: 'passed',
    motion,
    frameEvidence: stills,
    sha256: createHash('sha256').update(readFileSync(path)).digest('hex'),
  });
}
const evidence = resolve(directory, 'native-proof.json');
writeFileSync(evidence, JSON.stringify(summary, null, 2) + '\n');
console.log('EP004 Agent 4 native motion verified:\n' + JSON.stringify(summary, null, 2));
