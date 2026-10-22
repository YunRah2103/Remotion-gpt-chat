import * as THREE from 'three';

/** All lengths are metres. Agent 6 owns these names, transforms, dimensions and car. */
export type ExhaustSide = 'left' | 'right';
export type V3 = readonly [number, number, number];
export interface ExhaustMount {
  id: ExhaustSide;
  nodeName: string;
  /** Mouth centre expressed in the named node's local coordinates. */
  mouthOffset: V3;
  /** Unit-ish OUTWARD direction expressed in the named node's local coordinates. */
  outward: V3;
  innerRadiusM: number;
  outerDiameterM: number;
}
export interface ExhaustMountManifest {
  version: 1;
  coordinateConvention: 'three-y-up-metres';
  owner: 'agent6';
  mounts: readonly ExhaustMount[];
}
export interface WorldExhaustPort {
  id: ExhaustSide;
  origin: THREE.Vector3;
  outward: THREE.Vector3;
  innerRadiusM: number;
  outerDiameterM: number;
  frame: number;
  fps: number;
}

/** Consumes an authoritative Agent 6 manifest; NO fallback or invented pipe positions. */
export function sampleActualPorts(
  car: THREE.Object3D, manifest: ExhaustMountManifest, frame: number, fps = 30,
): WorldExhaustPort[] {
  if (manifest.version !== 1 || manifest.coordinateConvention !== 'three-y-up-metres'
      || manifest.owner !== 'agent6' || manifest.mounts.length !== 2)
    throw Error('Agent 6 v1 twin-port exhaust manifest required');
  if (!Number.isInteger(frame) || frame < 0 || !(fps > 0))
    throw Error('Invalid absolute frame / fps');
  car.updateWorldMatrix(true, true);
  const seen = new Set<ExhaustSide>();
  return manifest.mounts.map(m => {
    if (seen.has(m.id) || !['left','right'].includes(m.id))
      throw Error('Exhaust ports must have unique left/right ids');
    seen.add(m.id);
    if (!m.nodeName || m.mouthOffset.some(v => !Number.isFinite(v))
       || m.outward.some(v => !Number.isFinite(v))
       || !Number.isFinite(m.innerRadiusM) || !Number.isFinite(m.outerDiameterM)
       || m.outerDiameterM < .075 || m.outerDiameterM > .16
       || m.innerRadiusM < .025 || m.innerRadiusM >= m.outerDiameterM * .5)
      throw Error('Exhaust port dimensions/axes invalid; do not enlarge pipes to fit flames');
    const node = car.getObjectByName(m.nodeName);
    if (!node) throw Error('Missing Agent 6 exhaust mount: ' + m.nodeName);
    const origin = node.localToWorld(new THREE.Vector3(...m.mouthOffset));
    const localDirection = new THREE.Vector3(...m.outward);
    if (localDirection.lengthSq() < .5) throw Error('Exhaust outward axis missing');
    const outward = localDirection.normalize().transformDirection(node.matrixWorld);
    if (![...origin.toArray(), ...outward.toArray()].every(Number.isFinite))
      throw Error('Non-finite world exhaust port');
    return {id:m.id, origin, outward, innerRadiusM:m.innerRadiusM,
      outerDiameterM:m.outerDiameterM, frame, fps};
  });
}
