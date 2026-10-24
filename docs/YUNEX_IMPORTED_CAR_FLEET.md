# YUNEX imported-car fleet — real authored GLBs

This is **separate from the 35 procedural world-kit vehicle presets**. It adds real original GLB meshes: high-detail exteriors, embedded author-supplied textures/materials, wheels and interiors **where the individual model actually contains them**. Do not mistake a stylised or low-resolution source for a 1:1 scan, and never replace a missing GLB with a procedural block car.

## First use (from latest main)

```bash
npm ci
npm run kit:cars:list
npm run kit:cars:fetch -- all
npm run kit:cars:verify -- all
npm run check
```

The first fetch downloads and verifies **10 ready-for-attributed-use** source models under ignored `public/yunex/imported-cars/`, along with local Three.js Draco decoders. Every download is from a commit-pinned GitHub URL and is checked by **actual bytes, GLB 2 header, JSON chunk, mesh existence and Git blob SHA-1**. Re-download by `npm run kit:cars:fetch -- ferrari-f40 --refresh`. Cache files are not committed to Git or silently replaced.

The catalog is `production/assets/imported-cars/catalog.json`. It contains **12 individually attributed models**; two are deliberately gated as **review-only**:

- `ferrari-f40` — Black Snow, CC BY 4.0
- `fiat-500-classic` — Francesco Coldesina, CC BY 4.0
- `citroen-h-van` — Daniel Zhabotinsky, CC BY 4.0 (stylised)
- `mini-cooper-s` — cenobyte, CC BY 4.0
- `peugeot-2008` — David_Holiday, CC BY 4.0
- `tesla-model-3` — David_Holiday, CC BY 4.0 (small lightweight mesh)
- `car-concept` — Darmstadt Graphics Group/Eric Chadwick, CC BY 4.0
- `toy-car` — Guido Odendahl / Eric Chadwick, CC0 1.0 (stylised)
- `vespa-et3` — Nadia Ribitis, CC BY 4.0 (scooter)
- `cesium-milk-truck` — Cesium, CC BY 4.0
- `mclaren-senna` — Black Snow, Sketchfab CC BY 4.0 listing, **third-party mirror identity requires review**
- `porsche-manthey-gt3rs` — HYPR:IMPS 3D, Sketchfab CC BY 4.0 listing, **third-party mirror identity requires review**

For **non-public testing only**, obtain the two review-only models by `npm run kit:cars:fetch -- mclaren-senna --allow-review-only` or the Porsche equivalent. These are not part of `fetch all` without `--allow-review-only`. Do not infer that the models are licensed merely because an unrelated GitHub mirror hosts them. The source mirror must be matched to the original creator download before publication.

**Use in your own ThreeCanvas:**

```tsx
import {ImportedCar,importedCarInfo} from './src/yunex/imported-cars';
// Inside <ThreeCanvas>, after npm run kit:cars:fetch -- ferrari-f40:
<ImportedCar id="ferrari-f40" lengthMeters={4.6} yaw={0} />
// Gives the untouched source scene, normalized to the target length,
// centred on the floor (y=0), with real geometry and texture maps.
const rights=importedCarInfo('ferrari-f40');
console.log(rights.attribution);
```

`ImportedCar` uses GLTFLoader + MeshoptDecoder + local Draco, clones the source hierarchy, provides ground contact via bounding boxes and preserves source materials. It **does not** create wheel animation, driving rigs, physical suspension, extra texture resolution, missing interiors or a good environment by itself. For animated driving, supply a proper authored wheel-pivot rig and visually audit tyre-ground contact and rotation. All scene/lighting/camera work is still the video director's job.

All models are downloadable on demand; `main` stores source code, manifests, checksums and tooling **rather than bloating Git with 80+ MB third-party binaries**. In GitHub Actions, execute `npm ci` then `npm run kit:cars:fetch -- <id>` before Remotion rendering. Models remain reachable to other agents without relying on a previous person's personal cache.

## Rights and quality policy

The source catalogue is built from the [SceneView attribution manifest](https://sceneview.github.io/credits.html), [Khronos glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets), plus individually documented Sketchfab creator listings. `CC-BY-4.0` requires credits for the creator, source URL and licence and identifying modifications; `CC0` does not require attribution, though credits are welcome. Automaker logos, trademarks and music or video rights are separate from the 3D asset licence.

**Do not commercial-publish any model before checking the actual redistribution terms and manufacturer/trademark context.** A source check verifies the exact binary, *not* the legal rights of third parties or premium photographic quality. Prefer the Ferrari F40 for a licensed imported supercar with a credible third-party attribution trail. Keep the two preview-only supercars as private tests pending source matching. Never use the uncredited bulk mirror as an automatic fleet expansion source.

**Verification:** `npm run kit:cars:verify -- all` produces `out/imported-cars/verified-manifest.json` with SHA-256, asset sizes, mesh/material/texture counts and creator credits. `npm run kit:cars:list` shows source names, classes and whether cached. CI checks the 10 attributed assets and uploads a verification report. A successful GLB integrity check is *not* proof the car looks photoreal.
