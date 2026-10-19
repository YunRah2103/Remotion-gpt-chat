/**
 * EP003 signed right-hand emergency refuge, in metres. +X is travel direction;
 * -Z is the vehicle's right side. This is *local scenery*, not the dynamics path.
 * Existing highway edge = -7.05, original right barrier = -7.8.
 */
export const REFUGE = Object.freeze({
  startX: 4,
  fullWidthX: 40,
  endX: 110,
  mainRoadEdgeZ: -7.05,
  originalRailZ: -7.8,
  outerRailZ: -14,
  safeStopCentreZ: -10.50,
  markedStartX: 48,
  markedEndX: 101,
  vehicleWidthM: 1.94,
  vehicleLengthM: 4.94,
  reserveM: 0.55,
});

/** Zero derivative at both ends avoids a kink in the metal barrier / road edge. */
export function refugeTaper(t: number): number {
  if (!Number.isFinite(t)) throw new Error('Nonfinite taper');
  const u = Math.max(0, Math.min(1, t));
  return u * u * (3 - 2 * u);
}

export function refugeRailZ(x: number): number {
  if (!Number.isFinite(x)) throw new Error('Nonfinite road coordinate');
  const fraction = (x - REFUGE.startX) / (REFUGE.fullWidthX - REFUGE.startX);
  return REFUGE.originalRailZ +
    (REFUGE.outerRailZ - REFUGE.originalRailZ) * refugeTaper(fraction);
}

/** Width measured from the old road edge; does not misrepresent a normal shoulder. */
export function refugePavedWidthM(x: number): number {
  return Math.max(0, REFUGE.mainRoadEdgeZ - refugeRailZ(x));
}

/**
 * Checks a whole-car footprint including reserves, not just the vehicle centre.
 * Absolute render coordinates; illustration only, not a stopping-path promise.
 */
export function fitsStoppedGrandTourer(x: number, z: number): boolean {
  if (![x, z].every(Number.isFinite)) return false;
  const halfLength = REFUGE.vehicleLengthM / 2;
  const halfWidth = REFUGE.vehicleWidthM / 2;
  const rear = x - halfLength, front = x + halfLength;
  const outerAtFootprint = Math.max(refugeRailZ(rear), refugeRailZ(front));
  return rear >= REFUGE.markedStartX &&
    front <= REFUGE.markedEndX &&
    z + halfWidth + REFUGE.reserveM < REFUGE.mainRoadEdgeZ &&
    z - halfWidth - REFUGE.reserveM > outerAtFootprint;
}
