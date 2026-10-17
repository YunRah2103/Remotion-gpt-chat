# YUNEX Turbo EP001 — Agent 5 | Film Look Development

**Source ownership:** `src/yunex/turbo3d/lookdev/` and this directory only. One narrow isolated CI workflow supports actual render proof; no A1–A4 source or central `src/Root.tsx` has been modified.

## Art direction — "Energy in Motion"

A premium stylised low-poly racing film, **not** a grey engineering slideshow. The single grade identity spans the car, turbine and intercooler: teal enamel as the hero, low-key petrol-blue shadows, brushed graphite steel, creamy tungsten roadside/sunset highlights, and narrow cool softbox reflections. Amber is reserved for the heat/exhaust side; cyan/aqua for fresh intake/charge.

| Surface | Base | Metalness | Roughness | Clearcoat |
| --- | --- | ---: | ---: | ---: |
| Car teal enamel | `#0D817F` | 0.68 | 0.19 | 1.00 |
| Teal trim | `#256E73` | 0.76 | 0.285 | 0.65 |
| Smoked glazing | `#102733` | 0.23 | 0.075 | 1.00 |
| Deep graphite wheel | `#171D27` | 0.84 | 0.24 | 0.35 |
| Tyre compound | `#11171C` | 0.035 | 0.86 | 0 |
| Turbo graphite housing | `#4B606D` | 0.86 | 0.30 | 0 |
| Turbine hot housing | `#866150` | 0.78 | 0.36 | 0 |
| Satin machined shaft | `#C5D0D1` | 0.91 | 0.23 | 0 |
| Intercooler alloy | `#789BA3` | 0.83 | 0.35 | 0 |
| Asphalt | `#202D34` | 0.12 | 0.88 | 0 |

Filmic background `#08121D`; warm light `#FFB46C`. Exhaust accents `#FF8A36`/`#F15C3A`, clean-air visual identity `#53CFFF`, cooled charge identity `#8CEBE3`. These are **visual language**, not measured thermal/CFD maps.

### Lookdev technology

* **Gloss with reflections:** `YunexReflectionEnvironment` constructs a small procedural 4–6 softbox scene, bakes a **native Three.js PMREM once per mount** and restores/disposes it on unmount. No borrowed stock HDR, image fetch, GPU ray tracing or uncontrolled random source.
* **Lighting:** `YunexLights({sceneVariant:road|turbine|charge,intensity,augment,shadows})` uses one soft cool camera-left key that may cast 1024² shadows, one warm right/back rim and one cyan side accent, plus hemisphere fill. `augment=true` provides 38% energy to an A1 scene that already owns its light rig; **do not stack two full rigs**.
* **Road atmosphere:** `RoadAtmosphere({frame,visibility})` adds cheap pooled tungsten cones and thin blue ground haze with deterministic parallax — 8 roadside pools and 8 haze layers, no GPU post stack.
* **Purposeful macro FX:** `ExhaustHeat({frame,position,intensity})` adds five restrained amber thermal rings **only on hot side**. `RotorGlimmer` adds ten faint rotor-face highlight spokes following the A2 shaft phase `frame*0.165`. Neither alters flow conservation or suggests exhaust contacts the compressor.
* **Shared surface slots:** `YunexMaterials`, `YunexSurface`, `surfaceForSlot`, `applyYunexMaterials(root)`. The binder is **opt-in** and restores old materials on dispose. It does not modify meshes, pivots, transforms, cameras, port positions, or source models.

### Use with real Agent 1/2 models

Material mapping checked against A1 `VehicleWorld.tsx` and `DetailKit.tsx`, and A2 `TurboMechanism.tsx` / `ports.ts` on their **separate active branches**. A1 uses material names `BODY_TEAL_ENAMEL`, `DARK_TINTED_GLASS`, `RIM_GRAPHITE`, `TYRE_TREAD`, `DRILLED_BRAKE_DISC`, `RACE_ASPHALT`, `REAR_DIFFUSER`, `AERO_REAR_SPOILER`. A2 uses parent groups `TURBINE_CIRCUIT`, `COMPRESSOR_HOUSING`, `TURBINE_HOUSING`, `SHAFT`, `INTERCOOLER`. A2 publishes the named source/attachment ports; A5 never alters them.

In A6's integration-owned component after all source branches have been locked and merged:

```tsx
import React,{useEffect,useRef} from 'react';
import * as THREE from 'three';
import {
  YunexLights, RoadAtmosphere, ExhaustHeat, RotorGlimmer,
  applyYunexMaterials,
} from '../lookdev/YunexLookdev';
import {YunexReflectionEnvironment} from '../lookdev/YunexReflectionEnvironment';

const modelRef = useRef<THREE.Group>(null);
useEffect(() => modelRef.current ? applyYunexMaterials(modelRef.current) : undefined, []);
return <>
  <YunexReflectionEnvironment variant="road" intensity={0.9}/>
  <YunexLights sceneVariant="road" augment={true} shadows={false}/>
  <group ref={modelRef}>
    {/* Actual locked Agent 1 VehicleWorld (or A2 TurboMechanism). */}
  </group>
  <RoadAtmosphere frame={frame}/>
</>;
```

**Integration note:** the A1 scene already contains ambient, directional, spot and road practical lighting. Use the additive `augment` setting and compare clipping. A2 macros can usually use the full `turbine` rig if their preview lighting is not retained. Material override on A2 anonymous meshes uses strictly limited parent-group fallbacks; verify that individual fittings remain readable before inclusion.

### Real moving proof setup

The independent Remotion entrypoint `src/yunex/turbo3d/lookdev/preview.entry.tsx` registers `YunexA5LookdevProof` for 270 frames (9s) at 1080×1920 and 30fps. The proxy car, shaft/turbines and intercooler are **look-test stand-ins**; they are not claimed to replace the actual A1/A2 models.

Run from repository root with npm dependencies installed:

```bash
npm run check
npx remotion compositions src/yunex/turbo3d/lookdev/preview.entry.tsx --gl=swangle
mkdir -p out/a5
npx remotion render src/yunex/turbo3d/lookdev/preview.entry.tsx YunexA5LookdevProof out/a5/car.mp4 --frames=12-35 --scale=0.5 --gl=swangle --codec=h264 --pixel-format=yuv420p --concurrency=1
npx remotion render src/yunex/turbo3d/lookdev/preview.entry.tsx YunexA5LookdevProof out/a5/turbine.mp4 --frames=102-125 --scale=0.5 --gl=swangle --codec=h264 --pixel-format=yuv420p --concurrency=1
npx remotion render src/yunex/turbo3d/lookdev/preview.entry.tsx YunexA5LookdevProof out/a5/charge.mp4 --frames=192-215 --scale=0.5 --gl=swangle --codec=h264 --pixel-format=yuv420p --concurrency=1
ffprobe -v error -show_streams out/a5/car.mp4
ffmpeg -v error -xerror -i out/a5/car.mp4 -f null -
```

The dedicated GitHub workflow runs the same commands, captures three spaced actual frame images per clip, and requires image **hash variation**, 24 video frames per scene, H.264/yuv420p, full FFmpeg decode and manifests. Native renders are pending verification until the workflow has passed and visual inspection is performed; a failed or unrun CI job is not evidence of delivery.

### Render budget and disclosure

* Target preview proof: 540×960, 24 frames × 3 shots, 30fps, `--gl=swangle` CPU-backed native WebGL. These are engineering preview crops from a 1080×1920 project, not the mastered EP001 film.
* One 1024² shadow atlas, 4–6 PMREM reflection cards, three directional lights + hemisphere; `augment` defaults to 38% strength. No custom GPU shader, Gaussian blur, composer, external HDR texture or runtime network.
* Haze 16 low-poly objects, thermal shimmer 5 rings, rotor glints 10 spokes; tight culling is naturally limited by scene.
* End-to-end CPU runtime and measured video bytes must come from the actual CI report rather than an estimate. No assertion of cinematic approval until reviewed moving media exists.
* A5 has no scope over soundtrack, narration, master edit or historical YUNEX productions.
