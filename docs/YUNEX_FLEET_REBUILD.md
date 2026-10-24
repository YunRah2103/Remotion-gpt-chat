# Whole-catalogue body rebuild — 24 October 2026

The previous pass changed trim but retained the basic silhouettes. This revision replaces the underlying surface evaluators and main volumes across all 36 procedural models. `createFleetVehicle({variant,quality:'hero'})` selects it automatically. `reference:'v4-approved'` retains the older supercar; imported authored GLBs remain their separate path.

Road models use class-specific bonnet/boot height stations, full wheel haunches, a lower central bonnet, formed shoulder/door/rocker cross sections and individually arched/tapered greenhouse profiles. Roof, liner, glass bases and pillars share fitted evaluators. The supercar gains a forward cabin, shorter roof and rear haunch architecture. Axles, wheel radii and catalogue dimensions stay canonical.

Both Formula cars receive rebuilt monocoques, engine covers and class-specific sidepod volumes. Three bikes receive distinct tanks, tail/seat volumes and closed fairing or radiator shoulders. Commercials receive section-built hollow cabs, stronger cab rake and coherent glazing; the tractor sleeper and cargo-box shoulders are also rebuilt. Window apertures and cab roof cutaways remain open.

`bodyRevision:'fleet-rebuild-20261024'` identifies the selected rebuild on the rig. The new inventory script records main body vertex hashes, separate from materials or accessories. A baseline comparison against ecf54f1f confirms changed primary body geometry in all 36 IDs.

The six-page matched contact entry is `src/yunex/modelling-kit/rebuild-review-entry.tsx`, composition `FleetRebuildSheet`, frame 0–5 (six models per page). Default front-quarter views use identical camera/lighting for before and after. Set `profile:true` for side inspections. This is static shape evidence, separate from moving footage.

These are editable original illustrative models, not manufacturer-accurate CAD. Geometry changes and green tests do not certify premium realism or owner approval. Mechanical animation, static/dynamic cutaways and complete moving productions remain subject to their own review.


Validation: full combined suite 300/300 passed with zero failures/skips. A subsequent focused specialty run passed 11/11 after correcting bike windshield winding, with failing-before/passing-after outward-normal checks. TypeScript and whitespace checks pass. Independent review found no critical/important regression; the minor winding finding was fixed. Every road wheel aperture was independently sampled at 101 points with no arch/deck crossing.

Six matched before/after pages cover all 36 IDs. The moving supercar sample renders frames0–107 (3.6 seconds) at1080×1920/30fps and is correctly converted to limited BT.709 yuv420p H.264, fully decoded and inspected through sequence samples. Static gallery pages are scaled900×600 inspection images, not moving proof of every vehicle. Main-body geometry evidence is in modelling-kit/evidence/full-fleet-rebuild-meshes.json. Owner visual approval remains pending.
