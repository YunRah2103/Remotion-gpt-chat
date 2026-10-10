// Run: node production/videos/bmw-m5-evolution-001/edit/test-timeline.mjs
// No audio/media needed; verifies source timeline and the chapter sequence.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const base = 'production/videos/bmw-m5-evolution-001/';
const map = JSON.parse(fs.readFileSync(base + 'beat-map.json', 'utf8'));
const gens=['E28','E34','E39','E60','F10','F90','G90'];
const years=[1985,1988,1998,2005,2011,2017,2024];
assert.equal(map.output.frames,552);
assert.equal(map.output.fps,30);
assert.deepEqual(map.output.resolution,[1080,1920]);
assert.equal(map.cuts.length,42);
let frame = 0;
for(let i=0;i<42;i++){
  const c=map.cuts[i];
  assert.equal(c.slot,i+1);
  assert.equal(c.generation,gens[Math.floor(i/6)]);
  assert.equal(c.generationYear,years[Math.floor(i/6)]);
  assert.equal(c.startFrame,frame);
  assert.equal(c.durationFrames,c.endFrame-c.startFrame+1);
  frame=c.endFrame+1;
}
assert.equal(frame,552);
for(let f=0;f<552;f++){
  const active=map.cuts.filter(s=>s.startFrame<=f&&f<=s.endFrame);
  assert.equal(active.length,1,'exactly one active unique clip per output frame '+f);
}
const boundary = map.cuts.slice(1).map(x=>x.startFrame);
assert.equal(new Set(boundary).size,41);
console.log('PASS: 552 frames, 42 slot locks, no missing/overlapping frames, 7 chronological M5 generations.');
console.log('Beat start frames:', map.cuts.map(x=>x.startFrame).join(','));
console.log('NOTE: these checks do not verify actual source-video uniqueness or audio sync.');
