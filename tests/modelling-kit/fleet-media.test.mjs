import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {normalizeFleetMedia,verifyFleetMedia} from '../../scripts/modelling-kit/fleet-media.mjs';
test('proof delivery converts full-range samples instead of merely retagging them',()=>{
 const dir=mkdtempSync(join(tmpdir(),'v5-range-')),file=join(dir,'white.mp4');
 try{
  const fixture=spawnSync('ffmpeg',['-v','error','-f','lavfi','-i','color=white:s=16x16:r=30','-frames:v','3','-c:v','libx264','-pix_fmt','yuvj420p','-color_range','pc',file]);assert.equal(fixture.status,0,fixture.stderr?.toString());
  assert.throws(()=>verifyFleetMedia(file,{width:16,height:16,frames:3}),/Native proof contract/);
  normalizeFleetMedia(file);const s=verifyFleetMedia(file,{width:16,height:16,frames:3});assert.equal(s.pix_fmt,'yuv420p');assert.equal(s.color_range,'tv');
  const raw=spawnSync('ffmpeg',['-v','error','-i',file,'-frames:v','1','-pix_fmt','yuv420p','-f','rawvideo','-']);assert.equal(raw.status,0);
  const luma=[...raw.stdout.subarray(0,256)];assert.ok(luma.every(v=>v>=234&&v<=236),'limited white must be 235, not full-range 255');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
