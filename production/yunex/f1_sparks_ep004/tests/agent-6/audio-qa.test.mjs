import assert from 'node:assert/strict';
import {test} from 'node:test';
import {compareVoiceEnvelopes, energyEnvelope} from '../../editor/audio-qa.mjs';

const voice=Array.from({length:240},(_,i)=> {
  const syllable=((i*37+Math.floor(i/7)*13)%31);
  return 0.025 + (syllable/31)*0.18 + (i%17===0?0.07:0);
});

test('accepts actual matched original speech at correct time',()=>{
  const matched=voice.map(x=>x*0.99);
  const proof=compareVoiceEnvelopes(voice,matched);
  assert.ok(proof.zeroLagSpeechEnvelopeCorrelation>0.98);
  assert.ok(proof.relativeVoiceRmsGain>.95 && proof.relativeVoiceRmsGain<1.02);
  assert.equal(proof.peakAlignmentOffsetSec,0);
});
test('rejects replacement audio with different voice envelope',()=>{
  const unrelated=voice.map((x,i)=>voice[(i*71)%voice.length]);
  assert.throws(()=>compareVoiceEnvelopes(voice,unrelated),/does not match the original/);
});
test('rejects shifted voice even if the audio track exists',()=>{
  const shifted=voice.map((_,i)=>voice[(i+12)%voice.length]);
  assert.throws(()=>compareVoiceEnvelopes(voice,shifted),/does not match|shifted/);
});
test('rejects dramatically quieter or louder narration',()=>{
  assert.throws(()=>compareVoiceEnvelopes(voice,voice.map(x=>x*0.27)),/level changed/);
  assert.throws(()=>compareVoiceEnvelopes(voice,voice.map(x=>x*2)),/level changed/);
});
test('rejects short or silent and truncated voice tracks',()=>{
  assert.throws(()=>compareVoiceEnvelopes(voice,[]),/length differ/);
  assert.throws(()=>compareVoiceEnvelopes(voice,Array(voice.length).fill(0)),/essentially silent/);
  assert.throws(()=>compareVoiceEnvelopes(voice.slice(0,8),voice.slice(0,8)),/missing sufficient/);
});
test('fixed-size decoded PCM sample windows produce stable speech envelope',()=>{
  const pcm=Float32Array.from({length:8000},(_,i)=> i%2===0?0.5:-0.5);
  const envelope=energyEnvelope(pcm,8000,0.08);
  assert.equal(envelope.length,12);
  assert.ok(envelope.every(x=>Math.abs(x-0.5)<0.0001));
});
