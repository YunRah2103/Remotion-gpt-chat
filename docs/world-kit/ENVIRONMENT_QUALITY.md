# Detailed environment revision

All 20 original locations retain their IDs, metre scale, route sampling and day/dusk/night controls. The 35 vehicle variants, shared interiors and 55-part companion library remain compatible. This revision adds depth and readable surface detail for reusable stylised automotive videos, using only native Three.js geometry and generated textures.

| Locations | Added detail |
|---|---|
| Highway | Direction gantries, shoulder texture/rumble strips, reflectors, layered roadside trees and grass |
| City | Storefront glass/awnings, façade pilasters/cornices, balconies, rooftop equipment, distant skyline, paving joints, curbs and drains |
| Track | Catch fencing, grandstand seating, pit-lane markings, control glazing and work lights |
| Coast | Shaped coastal land, rippled sea, rock armour, promenade rails and verge grass |
| Mountain | Continuous ridged terrain with snow at altitude, retaining walls, boulders and grass |
| Forest | Clustered broadleaf canopies, tiered conifers, rolling ground and verge vegetation |
| Desert | Continuous dune terrain, angular rocks, sparse scrub and road delineators |
| Snow | Mountain relief, layered snow-covered conifers, snow banks and depth stakes |
| Tunnel | Segment joints, guidance reflectors, service doors and illuminated exit markers |
| Bridge | Rippled water, deck texture, fine railings and masts |
| Industrial | Clerestory windows, roof vents, loading-zone hatching and safety bollards |
| Parking | Footpath strips, surface texture and edge-light housings |
| Airfield | Runway edge lamps, hangar headers and control-tower mast |
| Garage | Floor joints, open ceiling structure, paired service-lift posts, tool boards and wall band |
| Showroom | Tiled floor, secondary display pads, door handles and architectural lighting strips |
| Suburb | Porches, doors, hedges and fuller trees |
| Harbour | Rippled dock water, retaining edge, dock masts and loading-zone detail |
| Canyon | Continuous stratified terrain, angular roadside rocks and scrub |
| Rally | Shaped ground, dirt microtexture, boulders and verge vegetation |
| Service station | Pump islands, canopy light panels, shop-front mullions and local evening lighting |

Roads have deterministic asphalt grain and subtle bump; ground and concrete use their own procedural maps. Generated DataTextures require no network, canvas, image downloads or texture installation. Repeated scenery uses instancing. Shared textures are disposed once by `disposeObject`; cloned materials and unused maps are released. Terrain begins outside the driving corridor.

## Native inspection

```bash
npm run check
npm run worldkit:test
npm run partskit:test
npm run worldkit:review-worlds
```

The environment review renders 20 vehicle-height views, 20 overview views, four night views and three tall-truck portrait views. `EnvironmentOverview` is an additional Studio composition with location-specific framing; use it to inspect the scenery. The silent moving reel visits all 20 locations over 20 seconds. Inspection outputs are 960×540 at 12fps; the source landscape compositions remain 1920×1080 at 30fps and portrait compositions 1080×1920.

Quality tests check generated textures and authored detail for every location, exactly-once texture disposal, and sampled clearances across all 20 routes. The corridor ray checks cover three lateral offsets every 8m from −72m to +72m, up to 4.2m height. These checks are a sampled scenery envelope, not physical collision simulation. Static water, grass and trees do not simulate weather or wind. Indoor locations remain open camera sets that accommodate the largest included truck.

Output: `out/world-kit-scenic`. Existing GLB vehicles and mechanical parts are reusable with the upgraded procedural environments; environments are delivered as source, not baked environment GLBs.

Final source validation: TypeScript passed, all 40 world-kit tests passed (including all 700 vehicle/world pairings), and all 19 mechanical-part tests passed. Independent review's two important findings—an obstructed city overview and unsupported airfield headers—were corrected; the airfield alignment has a regression check. Final native outputs contain all 47 inspection stills and the complete 240-frame moving reel.
