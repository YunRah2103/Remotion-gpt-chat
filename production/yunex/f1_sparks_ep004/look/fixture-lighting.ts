/** Lightweight deterministic night floodlight budget.
 * The structures and emissive lenses remain visible; only the nearest
 * actual point lights participate in shading. No random/strobe effects.
 */
export const FLOOD_FALLOFF_M = 42;
export function lampIntensityWeight(distanceM: number, lampDistanceM: number, lapLengthM: number): number {
  if (![distanceM,lampDistanceM,lapLengthM].every(Number.isFinite) || lapLengthM <= 0) throw new Error('Invalid track distance');
  const wrap = (x: number) => ((x % lapLengthM) + lapLengthM) % lapLengthM;
  const gap = Math.abs(wrap(distanceM) - wrap(lampDistanceM));
  const arc = Math.min(gap, lapLengthM - gap);
  // Gentle spatial rolloff, never temporal random flicker.
  return arc >= FLOOD_FALLOFF_M ? 0 : (1 - (arc / FLOOD_FALLOFF_M) ** 2) ** 2;
}
