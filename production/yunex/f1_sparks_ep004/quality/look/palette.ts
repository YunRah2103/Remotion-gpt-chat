/** Scene-local calibration values: deliberately restrained and deterministic. */
export const QUALITY_NIGHT = Object.freeze({
  kitSeed: 12,
  kitWetness: 0.08,
  sparkLightGain: 0.82,
  ink: '#14232d',
  glass: '#81b7c2',
  canopy: '#cfdfd4',
  warmPractical: '#ffe0a9',
  maximumWetness: 0.16,
});

export function qualityWetness(value: number): number {
  if (!Number.isFinite(value) || value < 0 || value > QUALITY_NIGHT.maximumWetness) {
    throw new RangeError('Night circuit wetness must be a finite value in 0..0.16');
  }
  return value;
}

export function validatedSparkGain(value: number): number {
  if (!Number.isFinite(value) || value < 0 || value > 1.5) {
    throw new RangeError('Spark bounce gain must be within 0..1.5');
  }
  return value;
}
