# YUNEX Real GitHub Car Library

**Status:** 532 real, original GLB vehicle files catalogued and source-pinned on this **separate feature branch**. Source: [pedrosoandre/carros](https://github.com/pedrosoandre/carros). The pinned upstream commit is `2d18dfd9db96bbf0d9cffa949deaf7f571388cbf`.

## What is here

- `catalog.json`: 532 searchable entries with original brand/model, filename, category, byte size, source Sketchfab creator, source page, CC licence, paint metadata and Git blob SHA for integrity.
- `library.mjs`: Node 22 tool to search, download and independently verify each original compressed GLB. No replacement procedural meshes.
- `ExternalCar.tsx`: a React Three Fiber car loader for Remotion, with Meshopt decoding and automatic scale/centering.
- `UPSTREAM_LICENSE.md`: original upstream licensing and modification notes.
- `build_release.py`: packages downloaded originals into independently downloadable archive shards with credits.
- `.github/workflows/yunex-car-library-archive.yml`: builds the complete set as **GitHub Release assets**, not massive binary Git commits.

**Actual model files live in the release ZIPs or are downloaded on demand.** The source code Git tree contains the index and downloader, not 1.88 GB of committed binaries. This keeps your existing YUNEX source and historical PRs clean.

## Search and download

Run from the repository root with Node 22:

```sh
node external-assets/cars/library.mjs list porsche
node external-assets/cars/library.mjs search rally
node external-assets/cars/library.mjs info mclaren-p1
node external-assets/cars/library.mjs download mclaren-p1
node external-assets/cars/library.mjs download porsche
node external-assets/cars/library.mjs download all --concurrency=8
node external-assets/cars/library.mjs verify all
```

Downloads are written under `public/external-cars/<original-model>.glb`. These locally downloaded files are gitignored. All original binary hashes and file sizes must match the pinned upstream snapshot. Existing valid downloads are reused; corrupted and partial files are rejected and downloaded again.

## Use in Remotion

```tsx
import {ThreeCanvas} from '@remotion/three';
import {ExternalCar} from './external-assets/cars/ExternalCar';

// Inside a Remotion composition:
<ThreeCanvas width={1080} height={1920} camera={{fov:38,near:0.1,far:100}}>
  <ambientLight intensity={1.6}/>
  <directionalLight intensity={3} position={[6,9,4]}/>
  <ExternalCar file="mclaren-p1.glb" rotationY={0.45}/>
</ThreeCanvas>
```

First download that car. **The source is an imported asset**, not a finished YUNEX vehicle rig. Wheel turning, steering, suspension, exhaust mounts, interior rigging and accurate physical damage still require mapping and QA. Original axes vary by author; check the final shot and rotate the root as required. Frame-driven animation must be implemented in your own scene.

## Bulk release

A full source archive is built from `catalog.json`. ZIP shards have the actual GLB files under `cars/`, with a licence notice, subset metadata and individual model credits in each shard. The `release-index.json` file lists all shards and expected counts/sizes.

The release process uses pinned GitHub data and checks **each model against its original Git blob SHA1** and the GLB header. It never replaces your main branch.

## Licensing and usage

The original catalogue reports **528 CC BY and 4 CC BY-SA cars**. Every use must include appropriate creator attribution and source links; modified assets may require a change indication and ShareAlike conditions. The binary files were already modified/decimated/compressed upstream. **These licence records are inherited from the source repository; they have not been independently audited against every original uploader.** Review the specific source and licence before commercial publication, especially for branded vehicles and trademarks.

Do not pass the entire unfiltered 532-car collection into an agent's prompt or load every GLB in every render. Select a vehicle by `id`, download it, quality-check its topology/materials and author the shot.

## Isolation

Feature branch: `feat/yunex-external-car-library-20261023`

No existing episode, `main` branch, YUNEX modelling kit or video outputs were edited.
