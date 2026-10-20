import test from 'node:test';
import assert from 'node:assert/strict';
import {captionSizing,CAPTION_BOTTOM_SAFE_RATIO,CAPTION_SIDE_SAFE_RATIO} from '../../story/typography.ts';
test('portrait captions clear phone bottom UI and preserve side safe margins',()=>{
 const x=captionSizing(1080,1920,'THE METAL SKID');
 assert.equal(x.bottomPx,Math.round(1920*.155));
 assert.equal(x.leftPx,Math.round(1080*.09));
 assert.equal(x.rightPx,x.leftPx);
 assert.equal(x.fontPx,56);
 assert.equal(CAPTION_BOTTOM_SAFE_RATIO,.155);
 assert.equal(CAPTION_SIDE_SAFE_RATIO,.09);
});
test('longer source captions shrink rather than being silently cut',()=>{
 const short=captionSizing(1080,1920,'CONTACT');
 const long=captionSizing(1080,1920,'REAL METAL SKIDS CAN SCRAPE THE SURFACE OF THE TRACK');
 assert.ok(long.fontPx<short.fontPx);
 assert.ok(long.fontPx>=30);
 assert.ok(long.maxLinesHint>=1);
});
test('subtitles scale for other portrait and wide resolutions',()=>{
 assert.equal(captionSizing(540,960,'SPEED').bottomPx,149);
 assert.ok(captionSizing(1920,1080,'SPARKS').fontPx>=40);
 assert.throws(()=>captionSizing(0,1920,''),/valid dimensions/);
});
