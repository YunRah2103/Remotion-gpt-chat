import assert from 'node:assert/strict';
import {test} from 'node:test';
import {validateVideoMetadata, uniqueDecodedFrameHashes, VIDEO_HASH_STREAM_SELECTOR} from '../../editor/native-qa.mjs';
const metadata = () => ({
  streams: [
    {codec_type:'video',width:1080,height:1920,avg_frame_rate:'30/1',nb_read_frames:'810'},
    {codec_type:'audio',codec_name:'aac'},
  ],
  format:{duration:'27.0'},
});
test('accepts genuine decoded native portrait with actual narration stream',()=>{
  const result=validateVideoMetadata(metadata(),810);
  assert.deepEqual(result,{width:1080,height:1920,fps:'30/1',frames:810,hasAudio:true});
});
test('rejects wrong frame count, size or frame rate',()=>{
  assert.throws(()=>validateVideoMetadata(metadata(),811),/decoded 810 frames/);
  const wrongSize=metadata();wrongSize.streams[0].height=1080;
  assert.throws(()=>validateVideoMetadata(wrongSize,810),/wrong portrait size/);
  const wrongFps=metadata();wrongFps.streams[0].avg_frame_rate='24/1';
  assert.throws(()=>validateVideoMetadata(wrongFps,810),/wrong fps/);
});
test('original audio stream is compulsory in final picture renders',()=>{
  const silent=metadata();silent.streams.pop();
  assert.throws(()=>validateVideoMetadata(silent,810),/narration audio stream missing/);
  assert.equal(validateVideoMetadata(silent,810,{audioRequired:false}).hasAudio,false);
});
test('sampled pixel hashes identify temporal movement, not metadata alone',()=>{
  const samples='# FrameMD5\n0, 0, 0, 300, hashA\n0, 1, 1, 300, hashB\n0, 2, 2, 300, hashB\n';
  assert.equal(uniqueDecodedFrameHashes(samples),2);
  assert.equal(uniqueDecodedFrameHashes('# FrameMD5\n0, 0, 0, 300, hashA\n0, 1, 1, 300, hashA\n'),1);
});

test('moving-frame proof samples VIDEO only, never voice/audio packet hashes',()=>{
  assert.equal(VIDEO_HASH_STREAM_SELECTOR,'0:v:0');
});
