# YUNEX reusable vehicles and worlds

19 original generic vehicle bodies and three compatible 3D environments. Designed for clean, modest-detail automotive explainers and stylised cinematics. No manufacturer badges or licensed model downloads. These are illustrative models, not engineering CAD or photoreal assets.

## Vehicle catalogue

| Family | Variant IDs |
|---|---|
| Normal | `saloon`, `hatchback`, `estate`, `compact` |
| Sports | `coupe`, `roadster`, `supercar`, `grand-tourer` |
| SUV | `crossover`, `boxy-suv`, `fastback-suv` |
| Single-seater | `formula-modern`, `formula-classic` |
| Motorcycle | `sport-bike`, `naked-bike`, `touring-bike` |
| Truck | `pickup`, `box-truck`, `tractor-truck` |

The variants have different dimensions and body geometry. Roadsters have an open cockpit, pickups an open bed, bikes different fairings/luggage, and heavy trucks distinct cab/cargo/chassis configurations. Paint changes are additional to those body differences.

## Open the previews

```bash
npm ci
npm run worldkit:studio
```

The five compositions also appear under **YUNEX-World-Kit** in the regular Studio. Original films remain intact.

- `VehiclePreview` and `VehiclePreviewPortrait`: orbiting model inspection. Props: `variant`, `angle` (radians), optional `color`.
- `DrivingPreview` and `DrivingPreviewPortrait`: 8-second tracking shot. Props: `variant`, `environment` (`highway`, `city`, `track`), `timeOfDay` (`day`, `dusk`, `night`), `seed` (integer).
- `WorldKitReel`: 19-second catalogue showing all shapes across the three worlds.

CLI example:

```bash
npx remotion render src/yunex/world-kit/entry.tsx DrivingPreview out/my-shot.mp4 \
  --props='{"variant":"grand-tourer","environment":"track","timeOfDay":"dusk","seed":12}' \
  --gl=swangle --codec=h264 --pixel-format=yuv420p
```

Default compositions render at 1920x1080 or 1080x1920, 30fps. The included review reel is 960x540 to keep review fast; it does not limit source output resolution. It is silent because this is an asset kit, not a scored film.

## Use in another film

All factory and React exports are available from `src/yunex/world-kit/index.ts`.

```tsx
import {ThreeCanvas} from '@remotion/three';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {Vehicle,Environment,WorldLighting,CameraAim,sampleRoute} from './yunex/world-kit';

export const MyDrivingShot=()=>{
  const frame=useCurrentFrame();
  const {width,height,fps}=useVideoConfig();
  const distance=-48+(frame/fps)*8; // metres, 8 m/s
  const pose=sampleRoute('highway',distance);
  return <ThreeCanvas width={width} height={height} shadows camera={{fov:42,near:.1,far:350}}>
    <WorldLighting timeOfDay="dusk" focus={pose.position}/>
    <Environment kind="highway" timeOfDay="dusk" seed={12}/>
    <CameraAim position={[pose.position[0]+7,3.5,pose.position[2]+6]} target={[pose.position[0],.8,pose.position[2]]}/>
    <Vehicle variant="coupe" color="#5c719c" accent="#e2ad55" wheelColor="#778991"
      lights distance={distance} steer={0} pose={pose}/>
  </ThreeCanvas>;
};
```

Inside `<ThreeCanvas>`, scene content must be actual Three.js objects. Keep typography outside. If using Remotion `<Sequence>` inside a ThreeCanvas, use `layout="none"`. Avoid `useFrame`, elapsed clocks and `Math.random` for animation.

`Vehicle` controls: `variant`, `color`, `accent` (calipers or trim), `wheelColor`, `lights` (emissive lenses), `distance` (metres rolled), `steer` (radians, clamped to +/-0.65), optional `pose`. For a curved route, derive steering from the change in route heading as in `Showcase.tsx`.

`vehicleCamera(vehicleSpec('saloon'),'front-three-quarter',false)` returns an inspection camera position, target and FOV. Other presets: `rear-three-quarter`, `side`, `top`; last argument chooses portrait framing.

For pure Three.js use `createVehicle`, `createEnvironment`, `animateVehicle`, `placeVehicle`, `sampleRoute`, `routeLength` and `disposeObject`. Factories own their geometry/materials; dispose each factory-created group once when finished. React wrappers do this on unmount. No remote assets are requested.

## Scale and compatibility

- Units are metres, +X forward, +Y up, +Z left. Tyres sit on y=0; all roads share y=0. No per-environment rescaling.
- `sampleRoute` returns `{position:[x,y,z],yaw}`. `track` is a continuous closed loop. Highway and city use a 180m wrapping span: cut before the end if you need an uninterrupted long journey. The provided 8-second driving preview stays within one span.
- Roads accommodate the widest truck. Lane-following is kinematic; there is no collision simulation or real suspension. The highway median separates its two carriageways.
- City building shapes and windows are repeatable by seed; another seed gives another layout. Lighting supports day/dusk/night. Headlights glow but do not project physical beams.
- Environments use instancing for repeated scenery. The scene is deliberately modest in detail. Shadow focus follows the hero vehicle; distant objects fade with fog.
- Models have exterior details and basic roadster seats; there are no complete interiors, opening doors, drivers, racing liveries or brand-specific mechanical claims.

## GLB export and verification

Node **22.18+ or 24** is needed for scripts that execute TypeScript directly.

```bash
npm run worldkit:test
npm run check
npm run worldkit:export
npm run worldkit:review
```

Export produces 19 `.glb` files plus `catalog.json` under `out/world-kit/glb`. GLBs retain wheel/steering node metadata, so the same animation helpers work on a loaded scene. Environments remain procedural source components; no environment GLBs are included.

Review generates every model's front angle, five rear checks, two portrait checks, three environment stills and a moving 19-second MP4. Exported GLBs are round-trip loaded during validation. `out/` is ignored: build outputs are delivered separately, rather than bloating the repository.

Tests cover catalogue families, distinct body bounds, valid vertex positions, tyre ground contact, fairing normals, 57 combinations, deterministic/reversible wheel motion, repeatable city layouts, circuit wrapping and input rejection. `npm run check` checks the entire source tree. Native renders are still necessary to assess appearance.
