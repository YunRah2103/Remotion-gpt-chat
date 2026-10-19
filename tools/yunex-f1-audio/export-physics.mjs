/**
 * YUNEX Agent 7: source-of-truth per-picture-frame physics for sonic automation.
 * Never infer RPM or force an overtake. The real-time 480–653 payoff is
 * sampled by Agent 6 at 1.0x and these are the identical physical states.
 *
 * Node 24: node --experimental-strip-types tools/yunex-f1-audio/export-physics.mjs
 */
import {mkdirSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {sampleRaceFrame,getRaceComparison} from '../../src/yunex/f1-line-ep002/physics/index.ts';
import {editAtFrame,FILM_FPS,FILM_FRAMES} from '../../src/yunex/f1-line-ep002/editor/timeline.ts';

const frames=Array.from({length:FILM_FRAMES},(_,frame)=>{
  const edit=editAtFrame(frame);
  const sample=sampleRaceFrame(edit.sourceSeconds*FILM_FPS,FILM_FPS);
  const car=(id)=>{
    const state=sample.cars[id];
    return {
      speedMps:state.speedMps,
      brake01:state.brake01,
      throttle01:state.throttle01,
      gripUtilization01:state.gripUtilization01,
      longitudinalAccelMps2:state.longitudinalAccelMps2,
      lateralAccelMps2:state.lateralAccelMps2,
    };
  };
  return {
    frame,filmSeconds:frame/FILM_FPS,sourceSeconds:edit.sourceSeconds,
    replay:edit.replay,shot:edit.shot,beat:edit.beat,
    cars:{shortcut:car('shortcut'),racing:car('racing')},
  };
});
for(const f of frames){
  for(const id of ['shortcut','racing']){
    for(const x of Object.values(f.cars[id])){
      if(typeof x!=='number'||!Number.isFinite(x)) throw new Error('Non-finite authoritative physics state at frame '+f.frame);
    }
  }
}
const dest=resolve(process.argv[2]??'out/f1-ep002-audio/physics-per-film-frame.json');
mkdirSync(dirname(dest),{recursive:true});
writeFileSync(dest,JSON.stringify({
  framesPerSecond:FILM_FPS,frameCount:FILM_FRAMES,
  comparison:getRaceComparison(),frames
},null,2));
console.log('Exported',FILM_FRAMES,'actual Agent 6 source-synchronised physical states to',dest);
