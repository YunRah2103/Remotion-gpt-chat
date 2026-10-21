# Agent 5 → Agent 0 / editor: exact EP004 integration seam

Source review as of 20 Oct 2026:
- Agent 1 PR #225: `F1HeroVehicle`, `UnderfloorReveal` and `getSkidDescriptors` from `mechanics/index.ts`. The hero receives `motion` and `reveal01`; actual metal skids have local bottom point descriptors.
- Agent 2 PR #222: `sampleDynamics`, `sampleContactDrivenSparks` from `physics/index.ts`. The latter samples real skid contacts and historical particle births.
- Agent 3 PR #226: `ShotCamera` from `cinema/ShotCamera.tsx`, takes `shot`, `localSec`, `durationSec`, `motion`.
- Agent 4 PR #227: `NightCircuitWorld` from `look/index.ts`, takes `motion`, `particles` and does not invent spark emission.
- This Agent 5 PR #224: `StorySequence`, `getStoryVisualCue`, `AeroContrast`, safe subtitle `StoryOverlay`.

**Do not import cross-agent modules into Agent 5's isolated branch before Agent 0 integrates approved PRs.** The exact composition adapter below belongs to manager-owned `integration/**` or `entry.tsx`. It is an integration recipe, **not** a claim that footage has been integrated or rendered.

```tsx
// After manager imports all accepted departments in the isolated EP004 base:
import {sampleDynamics,sampleContactDrivenSparks} from '../physics/index';
import {getSkidDescriptors,F1HeroVehicle,UnderfloorReveal} from '../mechanics/index';
import {NightCircuitWorld} from '../look/index';
import {ShotCamera} from '../cinema/ShotCamera';
import {StorySequence} from '../story/StorySequence';
import {ThreeCanvas} from '@remotion/three';

const SKIDS=getSkidDescriptors(); // exact Agent 1 mesh coordinates
const requestAt=(tSec,shot,shotLocalSec,shotDurationSec)=>{
 const motion=sampleDynamics(tSec);
 const {contacts,particles}=sampleContactDrivenSparks(tSec,motion,SKIDS);
 return {shot,tSec,shotLocalSec,shotDurationSec,motion,contacts,particles};
};
const renderShot=(req,cue)=>(
 <ThreeCanvas width={1080} height={1920} camera={{position:[0,1,6],fov:45}} shadows>
  <NightCircuitWorld motion={req.motion} particles={req.particles}/>
  <ShotCamera shot={req.shot} localSec={req.shotLocalSec}
      durationSec={req.shotDurationSec} motion={req.motion}/>
  {req.shot==='underfloor-reveal'
   ? <UnderfloorReveal motion={req.motion} reveal01={cue.sectionReveal01}/>
   : <F1HeroVehicle motion={req.motion}/>}
  {/* Integration renderer for req.particles at their TRUE particle.positionWorld
      is required; Agent 2 supplies positions, Agent 4 contact-derived lighting. */}
 </ThreeCanvas>
);
const Film=()=>(
 <StorySequence requestAt={requestAt} renderShot={renderShot}
   captions={/* Agent 6 true word-timed captions */ []}/>
);
```

## Critical mechanical notes
1. Agent 2 currently returns `wheelCompression` in `sampleDynamics`, while the binding interface and Agent 1 require `wheelCompressionM`. **The return key must be corrected by Agent 2 before integration.** Raised on issue #217 and the master #215; not modified by Agent 5. The visual story depends on real heave/compression.
2. `AeroContrast` expects two Agent 2-provided physics states sampled at identical **tSec, speed, route distance, yaw, X/Z world position**. Differences in Y world position, pitch, heave, wheel compression and downforce proxy are expected. An example is `sampleDynamics(tSec,{aeroLoad01:0})` versus `sampleDynamics(tSec,{aeroLoad01:1})`. The car does not teleport or change race line. **Do not imply real numerical F1 downforce data.**
3. The metal-skid pointer in `StoryOverlay` requires an actual camera projection of the forward skid world coordinate, sent as `{x01,y01,object:'metal-skid'}`. Never infer a position from a generic floor graphic. Agent 0/3 should implement projection in their integration/camera layer and call `metalSkidScreenAnchor`.
4. Source particles born at genuine `signedGapM<=0` metal contact may continue moving after contact ceases; do not hide their normal finite lifetime. **No independently drawn static streaks**.
5. Captions live outside the crossfaded shot layers (avoids double labels) and are 15.5% of the screen height above the bottom edge; Agent 6 uses natural recorded VO word timestamps. No frozen end slate.
6. `StoryTiming` is freely retimeable; do not lock cut boundaries before voice recording. Keep full motion timestamps identical on both sides of transitions.

## Native visual proof required before manager approval
From manager-owned integration `entry.tsx`, render one 4–6-second native 1080×1920/30 moving hook/mystery/underfloor and one 9–12-second moving middle-to-payoff clip. Use `npx remotion render ... --gl=swangle --codec=h264 --pixel-format=yuv420p`; get `ffprobe -count_frames`, decode every frame via `ffmpeg -v error -xerror -i clip.mp4 -f null -`, and visually check frame 0/middle/end and phone legibility. Commit binary media as accessible GitHub Actions artifacts/Release, link exact run and URLs back to #220; manager controls status `WORKING→PREVIEW READY→REVIEWED→APPROVED→INTEGRATED`. The isolated fixture `story/preview-entry.tsx` can validate moving source composition in advance, but it has **zero invented metal contacts and sparks** and cannot serve as integrated physics proof.
