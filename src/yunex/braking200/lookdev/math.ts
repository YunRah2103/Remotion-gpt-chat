/** Small seek-stable utilities; no wall-clock time, mutable RNG, or browser APIs. */
export type Point3 = readonly [number,number,number];
export const clamp01 = (x:number):number => Number.isFinite(x)?Math.max(0,Math.min(1,x)):0;
/** Artistic luminance ramp only. Input MUST come from the producer's shared braking state. */
export const heatLuminance = (heatIllustration01:number):number =>
  0.24*Math.pow(clamp01(heatIllustration01),1.6);
/** Kit: forward +X, up +Y, left +Z; yaw is rotation about +Y. */
export function worldFromCar(local:Point3,position:Point3,yaw:number):Point3 {
  const c=Math.cos(yaw),s=Math.sin(yaw);
  return [position[0]+local[0]*c+local[2]*s,
          position[1]+local[1],
          position[2]-local[0]*s+local[2]*c];
}
export function calibrationHeat(t:number):number {
  // PREVIEW-ONLY short visual calibration pulse; never use as simulation output.
  return t<=.8?0:0.4*clamp01((t-.8)/.7)*(1-.65*clamp01((t-2)/1.5));
}
