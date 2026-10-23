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

/**
 * Direct adapter for NEW Agent 6 PR #270's sampleExhaustWorld(car,frame).
 * It intentionally accepts their already-transformed WORLD vectors. The
 * candidate GLB and its correction transform remain owned by Agent 6.
 * NEVER apply the local vehicle transform a second time.
 */
export interface Agent6SampledWorldPort {
  frame: number;
  name: 'exhaust-left' | 'exhaust-right';
  worldOrigin: V3;
  worldOutward: V3;
  innerRadiusM: number;
  visibleOuterDiameterM: number;
}
export function adaptAgent6WorldPorts(
  raw: readonly Agent6SampledWorldPort[], frame: number, fps = 30,
): WorldExhaustPort[] {
  if (raw.length !== 2 || !(fps > 0) || !Number.isInteger(frame) || frame < 0)
    throw Error('Agent 6 sampled left/right moving world ports required');
  const ids = new Set<string>();
  return raw.map(p => {
    if (p.frame !== frame || !['exhaust-left','exhaust-right'].includes(p.name)
      || ids.has(p.name) || p.worldOrigin.length !== 3 || p.worldOutward.length !== 3)
      throw Error('Missing, repeated or out-of-time Agent 6 exhaust sample');
    ids.add(p.name);
    const origin = new THREE.Vector3(...p.worldOrigin);
    const outward = new THREE.Vector3(...p.worldOutward);
    if (![...origin.toArray(),...outward.toArray()].every(Number.isFinite)
       || outward.length() < .99 || outward.length() > 1.01
       || !(p.visibleOuterDiameterM >= .105 && p.visibleOuterDiameterM <= .120)
       || !(p.innerRadiusM >= .025 && p.innerRadiusM < p.visibleOuterDiameterM*.5))
      throw Error('Malformed or oversized Agent 6 live exhaust sample');
    return {
      id: p.name==='exhaust-left'?'left':'right', origin,
      outward:outward.normalize(),frame,fps,innerRadiusM:p.innerRadiusM,
      outerDiameterM:p.visibleOuterDiameterM,
    };
  });
}

/**
 * Production-only gate for the appearance-approved teal V4 car.
 * Previous Candidate-A and Candidate-B world transforms are INVALID.
 * Agent 6 must issue a NEW native-port manifest with real shot provenance.
 *
 * These metadata assertions complement (do not replace) editor's SHA256 media
 * verification and human pixel approval. No fake example port coordinates.
 */
export interface ApprovedV4PortLock {
  version: 2;
  vehicle: 'v4-a-supercar';
  coordinateConvention: 'world-three-y-up-metres';
  referenceKitCommit: string;
  referenceApprovalUrl: string;
  agent6ShotCommit: string;
  v4PortManifestSha256: string;
}
const LOCKED_V4_REFERENCE='9052a539e10a7cb97487c1435455bb9962ad58e1';
const LOCKED_V4_APPROVAL='https://github.com/YunRah2103/Remotion-gpt-chat/issues/247#issuecomment-6355059494';

export function adaptApprovedV4WorldPorts(
  raw: readonly Agent6SampledWorldPort[],
  frame: number,
  lock: ApprovedV4PortLock,
  fps = 30,
): WorldExhaustPort[] {
  if (lock.version !== 2 || lock.vehicle !== 'v4-a-supercar'
      || lock.coordinateConvention !== 'world-three-y-up-metres'
      || lock.referenceKitCommit !== LOCKED_V4_REFERENCE
      || lock.referenceApprovalUrl !== LOCKED_V4_APPROVAL
      || !/^[a-f0-9]{40}$/.test(lock.agent6ShotCommit)
      || !/^[a-f0-9]{64}$/.test(lock.v4PortManifestSha256)
      || [
        'bc0185ece668d6ebb1f0f58adbc62edec0ce2cb4',
      ].includes(lock.agent6ShotCommit))
    throw Error('Missing approved V4-specific Agent 6 source and port provenance (old candidate barred)');
  const ports=adaptAgent6WorldPorts(raw,frame,fps);
  // Geometric cross-check, AFTER consuming authoritative frame-varying world data.
  // Do not project the jet into a static 2D image coordinate.
  const l=ports.find(p=>p.id==='left')!,r=ports.find(p=>p.id==='right')!;
  const span=l.origin.distanceTo(r.origin);
  if (span < .35 || span > 1.75
      || l.outward.dot(r.outward) < .75
      || Math.abs(l.origin.y-r.origin.y) > .2)
    throw Error('Live V4 twin-exhaust sample fails physical spacing/axis checks');
  return ports;
}
