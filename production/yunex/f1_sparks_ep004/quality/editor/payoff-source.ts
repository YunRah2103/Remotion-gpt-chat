/**
 * Editorial race payoff approaches the SAME original A2/A4 physical 72 m bump
 * at the film's final frames, rather than exhausting real sparks in its opening.
 * Route and contact are never faked or reset inside the shot. A negative source
 * start distance is legal: sampleRoute wraps on the original closed circuit,
 * while sampleTrackSurface retains the original 72 m metal-road contact crest.
 */
export const PAYOFF_START_DISTANCE_M=-92.8;
export const PAYOFF_SOURCE_IN_SEC=.145;
export const PAYOFF_SOURCE_RATE=.43;
export function editorialStartDistance(shot:string,originalDistanceM:number):number{
 return shot==='racing-payoff'?PAYOFF_START_DISTANCE_M:originalDistanceM;
}
