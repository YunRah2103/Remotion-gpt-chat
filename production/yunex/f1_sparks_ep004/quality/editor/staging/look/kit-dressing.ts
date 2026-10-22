/**
 * Agent 11 / Kit V2 ONLY exterior detail.
 *
 * Keep Agent 4 NightCircuitWorld as the ONLY world and ONLY driveable road.
 * The V2 factory is used to obtain its authored premium track dressing,
 * then its entire duplicate factory (INCLUDING flat circuit-asphalt) is
 * disposed before any Three scene is mounted.
 */
import * as T from 'three';
import {createCinematicEnvironment} from '../../../../../../../src/yunex/modelling-kit/environments.ts';
import {disposeObject} from '../../../../../../../src/yunex/world-kit/geometry.ts';
import {QUALITY_NIGHT, qualityWetness} from './palette.ts';

const ALLOWED_KIT_DETAILS = new Set(['pit-box-canopies', 'circuit-tyre-stacks']);

function illuminatedPitDetail(target: T.Group): void {
  // Existing A4 pits are at z~-62.4. These are thin luminous fascia details,
  // not a second roof, track, barrier or foreground floodlight row.
  const strip = new T.MeshStandardMaterial({
    color: '#d8e4d7', emissive: QUALITY_NIGHT.warmPractical,
    emissiveIntensity: 0.63, metalness: 0.12, roughness: 0.48,
  });
  const supports = new T.MeshStandardMaterial({
    color: '#263c46', metalness: 0.68, roughness: 0.39,
  });
  for (let i = 0; i < 8; i++) {
    const x = -28 + i * 7;
    const line = new T.Mesh(new T.BoxGeometry(4.9, 0.055, 0.065), strip);
    line.name = 'quality-pit-practical-strip';
    line.position.set(x, 3.16, -61.09);
    target.add(line);
    const end = new T.Mesh(new T.BoxGeometry(0.07, 0.20, 0.18), supports);
    end.name = 'quality-pit-endcap';
    end.position.set(x + 2.48, 3.12, -61.1);
    target.add(end);
  }
}

export function createQualityKitDressing(wetness: number = QUALITY_NIGHT.kitWetness): T.Group {
  qualityWetness(wetness);
  // EXACT V2 factory required by Issue #238. It is never added to the film.
  const temporaryKitWorld = createCinematicEnvironment({
    kind: 'track', timeOfDay: 'night', seed: QUALITY_NIGHT.kitSeed,
    quality: 'hero', wetness,
  });
  const premium = temporaryKitWorld.getObjectByName('premium-world-detail');
  if (!(premium instanceof T.Group)) {
    disposeObject(temporaryKitWorld);
    throw new Error('V2 kit premium-world-detail unavailable');
  }
  premium.removeFromParent();
  // No circuit-asphalt/curbs/edge lines, terrain, route, barrier or sky survives.
  disposeObject(temporaryKitWorld);

  const selected = new T.Group();
  selected.name = 'quality-v2-off-road-dressing';
  for (const child of [...premium.children]) {
    if (!ALLOWED_KIT_DETAILS.has(child.name)) continue;
    child.removeFromParent();
    // Tyre stacks are kit-made, shifted *away* from the track, not camera-side:
    // A4 controls barriers and all actual race road surfaces.
    if (child.name === 'circuit-tyre-stacks') child.position.z += 14;
    selected.add(child);
  }
  disposeObject(premium);
  if (selected.children.length !== ALLOWED_KIT_DETAILS.size) {
    disposeObject(selected);
    throw new Error('V2 track premium dressing has changed; review geometry first');
  }
  illuminatedPitDetail(selected);
  selected.userData = {
    source: 'YUNEX modelling kit V2 / createCinematicEnvironment',
    physicalTrackOwner: 'Agent 4 NightCircuitWorld',
    contactSurfaceCount: 0,
    duplicateRoadCount: 0,
    kitWetnessConfigured: wetness,
    // Contact lights and real sparks are handled by A4/A2, never here.
    sparkEmitterCount: 0,
  };
  return selected;
}

/** Fast assert against accidental future changes to the kit factory. */
export function assertNoAdditionalRoad(dressing: T.Object3D): void {
  let count = 0;
  dressing.traverse(node => {
    if (node.userData.contactSurface ||
        ['circuit-asphalt', 'ep004-canonical-bump-asphalt', 'road', 'red-white-curbs', 'edge-lines'].includes(node.name)) {
      count++;
    }
  });
  if (count) throw new Error('Kit dressing contains a competing road surface (' + count + ')');
}
