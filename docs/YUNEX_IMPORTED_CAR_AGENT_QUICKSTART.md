# YUNEX real-car kit: one command for agents

Use this path when the required car must look like a *specific real vehicle*. The 35/36 original procedural vehicles remain useful for editable tyre, suspension and mechanical demonstrations; they are **not interchangeable with manufacturer-accurate meshes**.

## Discover, obtain and inspect

Install the repo dependencies once with `npm ci`, then:

```bash
npm run kit:cars:agent -- list
npm run kit:cars:agent -- list --filter=bugatti
npm run kit:cars:agent -- preview ferrari-f40
```

The last command downloads the commit-pinned Ferrari GLB, validates its source checksum, makes decoder assets available and **renders an actual six-second 1080x1920/30fps moving inspection**. It independently checks exactly 180 decoded frames and full FFmpeg decoding. The output is local under `out/imported-cars/ferrari-f40-inspection.mp4`, not committed to Git.

To build a shot in Remotion's `ThreeCanvas`:

```tsx
import {ImportedCar,importedAssetInfo} from './src/yunex/imported-cars';

<ImportedCar id="ferrari-f40" lengthMeters={4.7} yaw={0} />

const details=importedAssetInfo('ferrari-f40');
console.log(details.attribution);
```

This preserves the original authored GLB hierarchy, materials, texture maps and matrix-root transforms. It corrects the old bug where models with transformed roots could appear as tiny/squashed cars. It normalizes to requested horizontal length and ground height. **It does not invent independent tyre rotation, steering, suspension, an interior, a real engine, or the missing parts of a weak source model.** For driving footage, explicitly build and review a named-wheel rig or select the existing procedural physics assets.

## All 96 candidate car meshes

The complete catalogue of 96 additional supercar/road candidates is already on main at `production/asset-library/external-car-catalogue.json`. Entries are namespaced with `external:` to prevent accidental collisions with attributed assets. For **private inspection only**:

```bash
npm run kit:cars:agent -- preview external:bugatti-2019-bugatti-divo --private-review
```

Then an R3F scene may explicitly use:

```tsx
<ImportedCar id="external:bugatti-2019-bugatti-divo" privateReview={true} />
```

Without `--private-review` at acquisition or `privateReview={true}` at the render boundary, unverified models fail closed with a rights warning. Two individually catalogued mirror models (Senna, Manthey Porsche) receive the same protection. These sources are **not publication-cleared**; mirror file integrity cannot establish creator consent or legal rights. Do **not** publish or monetize private proof footage or redistribute their GLBs without independent original-creator provenance/licence review. Do not upload such proofs to public Actions artifacts, release assets, or public galleries.

For a different display size, pass `--length=5.1`; to replace an existing local rendered proof explicitly pass `--overwrite`. Inspect the six-second orbit for actual mesh detail, body proportions, glass, wheel quality, floor contact, material realism and clipping before selecting a model for production. **GLB size alone is not a realism rating.**

## Stable boundaries for collaborating agents

- Use the attributed Ferrari F40 or other separately attributed stock models as the default realistic import path, recording creator and licence credits.
- Prefer actual real imported geometry over trying to make the procedural fleet imitate a specific Porsche/Ferrari body through random box additions.
- Keep YUNEX episode branches, V4 approved hero car, narration and sound unchanged unless explicitly assigned.
- Preserve `privateReview` and rights metadata in agent handoffs. Tests confirm the catalogue ID count, that unverified models never become default-ready, and that transformed source geometry is normalized without destruction.
- `src/yunex/imported-cars/entry.tsx` is a deterministic stationary-car camera orbit intended for judging a model, **not** a finished road film or a claim of full photorealism.
- Validate with `npm run check` and `node --experimental-strip-types --test tests/imported-cars/*.test.mjs`. Native CI uses the Ferrari still as a short visual smoke; separate six-second rendered moving proof is required for full approval.

## Current V5 work

The authored procedural fleet rebuild is still [PR #282](https://github.com/YunRah2103/Remotion-gpt-chat/pull/282), and the opt-in V5 scene/environment work is [PR #277](https://github.com/YunRah2103/Remotion-gpt-chat/pull/277). This importer adds a complementary production route without claiming either unfinished visual review is complete. Keep those PRs under their existing review gates.
