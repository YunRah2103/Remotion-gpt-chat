/** Shared illustrative continuous track centreline bump profile.
 * Both EP004 dynamics contact calculation AND night road geometry must
 * consume the same deterministic metre heights, not recreate independent bumps.
 * This 1D sampling is along existing world-kit `sampleRoute('track', distanceM)`.
 */
export function sampleTrackSurface(distanceM:number): {heightM:number; slopeMPerM:number} {
  if (!Number.isFinite(distanceM)) throw new Error('track distance must be finite');
  // Isolated gentle bumps (metres), useful for clearly read contact after aero heave.
  // Callers choose a continuous route-distance range around the event.
  const bumps: readonly [number,number,number][]=[
    [72,0.029,1.75],
    [138,0.019,1.15],
  ];
  let heightM=0,slopeMPerM=0;
  for(const [centre,amp,width] of bumps){
    const x=(distanceM-centre)/width;
    const e=Math.exp(-(x*x));
    heightM+=amp*e;
    slopeMPerM+=amp*e*(-2*x/width);
  }
  return {heightM,slopeMPerM};
}
