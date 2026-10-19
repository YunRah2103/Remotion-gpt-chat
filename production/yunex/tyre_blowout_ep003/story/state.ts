import {assertEpisodeTime} from '../shared/contract.ts';
import type {StoryRequest, Vec3, WheelFrame} from '../shared/contract.ts';

/**
 * Story visuals consume authoritative Agent 1 / Agent 2 frame values.
 * Never integrate motion, predict yaw, or invent force/pressure quantities.
 */
export type StoryVisualState = {
  readonly segment: StoryRequest['segment'];
  readonly intensity: number;
  readonly pressureLoss01: number;
  readonly deformation01: number;
  readonly releaseMist01: number;
  readonly contactGlow01: number;
  readonly wheelCenterM: Vec3;
  readonly wheelRadiusM: number;
  readonly lateralCue: null | {
    readonly side: -1 | 1;
    readonly lengthM: number; // solely an illustration scale, never a force measurement
    readonly totalLateralForceN: number; // sourced exclusively from the four wheels
  };
  readonly label: null | 'PRESSURE DROPS' | 'CONTACT CHANGES' | 'STEADY THE WHEEL' | 'SLOW DOWN GRADUALLY';
  readonly labelOpacity: number;
  readonly exitEstablished: boolean;
};

export const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));
export const ease01 = (n: number): number => {
  const t = clamp01(n);
  return t * t * (3 - 2 * t);
};

const wheelOrder = ['front-left', 'front-right', 'rear-left', 'rear-right'] as const;

function allLateralForces(wheels: StoryRequest['dynamics']['wheels']): null | number {
  const values = wheelOrder.map(id => wheels[id]?.lateralForceN);
  if (values.some(n => n === undefined || !Number.isFinite(n))) return null;
  return (values as number[]).reduce((a, b) => a + b, 0);
}

export function sampleStoryVisuals(request: StoryRequest): StoryVisualState {
  const {tSec, dynamics, tyre, segment} = request;
  assertEpisodeTime(tSec);
  assertEpisodeTime(dynamics.tSec);
  assertEpisodeTime(tyre.tSec);
  if (Math.abs(tSec - dynamics.tSec) > 1 / 30 + 1e-5 ||
      Math.abs(tSec - tyre.tSec) > 1 / 30 + 1e-5) {
    throw new Error('StoryRequest frames must represent the same simulation time');
  }
  const failed: WheelFrame = dynamics.wheels['front-right'];
  if (!failed || failed.wheel !== 'front-right') throw new Error('Expected authoritative front-right wheel frame');
  if (!failed.hubWorldM.every(Number.isFinite) || !Number.isFinite(failed.rollingRadiusM) ||
      failed.rollingRadiusM <= 0 || !Number.isFinite(tyre.effectiveRadiusM) ||
      tyre.effectiveRadiusM <= 0 || !Number.isFinite(tyre.pressureRatio) ||
      tyre.pressureRatio < 0 || tyre.pressureRatio > 1 ||
      !Number.isFinite(tyre.sidewallCompression) ||
      !Number.isFinite(tyre.failureProgress) ||
      !Number.isFinite(dynamics.yawRad)) {
    throw new Error('Invalid wheel, tyre or pose values: cannot draw misleading story graphics');
  }

  const loss = clamp01(1 - tyre.pressureRatio);
  const deformation = clamp01(tyre.sidewallCompression);
  const progress = clamp01(tyre.failureProgress);
  const abruptness = clamp01((progress - 0.04) / 0.42);
  const aftermath = ease01((tSec - 1.15) / 0.6);
  const releaseMist01 = clamp01(loss * abruptness * (1 - aftermath));
  const contactGlow01 = clamp01(Math.max(deformation, loss * 0.4));
  const force = allLateralForces(dynamics.wheels);
  // A cue is drawn ONLY when all four lateral forces are supplied, and its sign
  // follows summed authoritative local +Z-left force. Never guess a rightward pull.
  const lateralCue = (segment === 'forces' && force !== null && Math.abs(force) > 1)
    ? {side: Math.sign(force) as -1 | 1,
       lengthM: 0.45 + 0.45 * clamp01(Math.abs(force) / 2000),
       totalLateralForceN: force}
    : null;
  const label = segment === 'pressure' && loss > 0.08 ? 'PRESSURE DROPS'
    : segment === 'forces' && contactGlow01 > .12 ? 'CONTACT CHANGES'
    : segment === 'reaction' && dynamics.stage === 'initial-stabilisation' ? 'STEADY THE WHEEL'
    : segment === 'recovery' && dynamics.stage === 'gradual-slowdown' ? 'SLOW DOWN GRADUALLY'
    : null;
  const labelOpacity = label === null ? 0 : Math.min(0.95, ease01((tSec - .05) / .32));
  return {
    segment,
    intensity: ease01(progress),
    pressureLoss01: loss,
    deformation01: deformation,
    releaseMist01,
    contactGlow01,
    wheelCenterM: failed.hubWorldM,
    wheelRadiusM: tyre.effectiveRadiusM,
    lateralCue,
    label, labelOpacity,
    exitEstablished: dynamics.stage === 'safe-exit',
  };
}
