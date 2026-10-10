#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
// Compiles the ACTUAL repository TypeScript source via installed esbuild.
const dir=mkdtempSync(path.join(tmpdir(),'porsche-turbo-'));
const require=createRequire(import.meta.url);
try {
  const target=path.join(dir,'timeline.cjs');
  execFileSync('npx',['--no-install','esbuild',
    'src/porsche-turbo-evolution/edit/timeline.ts',
    '--bundle','--platform=node','--format=cjs','--target=node22',
    '--outfile='+target],{stdio:'inherit'});
  const {BEATS,FPS,WIDTH,HEIGHT,FRAMES,assertBeatMap,validateShots,framingFor,
    adaptAgentAManifest}=require(target);
  assertBeatMap();
  assert.deepEqual([FPS,WIDTH,HEIGHT,FRAMES],[30,1080,1920,510]);
  assert.equal(BEATS.length,30);
  assert.deepEqual(BEATS.filter(x=>x.chapterStart).map(x=>[x.generation,x.startFrame]),[
    ['930',0],['964',67],['993',136],['996',205],['997',274],['991',343],['992',429]
  ]);
  let cursor=0;
  for(const beat of BEATS){
    assert.equal(beat.startFrame,cursor);
    assert.equal(beat.endFrame,beat.startFrame+beat.durationFrames-1);
    cursor+=beat.durationFrames;
  }
  assert.equal(cursor,510);
  const shots=BEATS.map(b=>({
    slot:b.slot,generation:b.generation,file:'porsche-private/slot-'+b.slot+'.mp4',
    shotKey:'unique-shot-'+b.slot,sourceId:'source-'+b.slot,
    visualFingerprint:'camera-setup-'+b.slot,
    sourceSha256:b.slot.toString(16).padStart(64,'0'),
    sourceUrl:'https://example.org/TEST-NOT-A-REAL-SOURCE/'+b.slot,
    originCreator:'TEST FIXTURE NOT EVIDENCE',sourceLicenseStatus:'UNKNOWN / TEST',
    sourceInSeconds:0,sourceOutSeconds:2,sourceWidth:1280,sourceHeight:720,
    nativeFps:30,angle:'rolling',identityVerified:true,actualMotionVerified:true,
    uniqueAngleVerified:true,turboIdentityEvidence:'fixture',motionEvidence:'fixture',
  }));
  assert.equal(validateShots(shots).length,30);
  const reject=(slot,changes,reason)=>{
    const altered=shots.map(s=>({...s}));
    Object.assign(altered[slot-1],changes);
    assert.throws(()=>validateShots(altered),reason);
  };
  reject(5,{generation:'930'},/wrong-generation/i);
  reject(5,{actualMotionVerified:false},/Unverified/i);
  reject(5,{shotKey:'unique-shot-4'},/Reused shot/i);
  reject(5,{visualFingerprint:'camera-setup-4'},/Reused shot/i);
  reject(5,{file:'https://bad.test/car.mp4'},/Unsafe/i);
  reject(5,{file:'../escape.mp4'},/Unsafe/i);
  reject(5,{sourceSha256:'x'},/provenance/i);
  reject(5,{sourceOutSeconds:.01},/too-short/i);
  reject(5,{sourceSha256:shots[3].sourceSha256},/Overlapping/i);
  reject(5,{framing:'fullBleed'},/Full-bleed/i);
  reject(5,{cropX:101},/crop point/i);
  assert.equal(framingFor(shots[0]),'movingPictureField');
  assert.equal(framingFor({...shots[0],sourceWidth:1080,sourceHeight:1920}),'fullBleed');
  assert.throws(()=>adaptAgentAManifest({schemaVersion:1,shots:[]},{}),/Need 30/i);
  console.log(JSON.stringify({status:'PASS',frames:510,slots:30,chapters:7,
    validations:'11 negative cases + positive source adapter clock',
    note:'Synthetic manifest fixture; does NOT verify physical Porsche sources'}));
} finally {rmSync(dir,{recursive:true,force:true});}
