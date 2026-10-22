import {sampleRoute} from "../../../../src/yunex/world-kit/environments.ts";
import type {RoutePose} from "../../../../src/yunex/world-kit/environments.ts";

/** EP005 A3/A4 shared proposal: one *existing* V3 route, not a second road. */
export const EP005_ROUTE = Object.freeze({
  kind: "city" as const,
  seed: 12,
  timeOfDay: "night" as const,
  wetness: 0.16,
  roadY: 0,
  travelAxis: "+X",
  laneZ: -1.85,
  startDistance: -48,
  endDistance: 66,
  previewSpeedMps: 12,
  sceneClearanceHalfWidth: 6.15,
  postMinimumAbsZ: 7.75,
  portalHeadroom: 6.9,
  canonicalSampler: "sampleRoute('city', metres)" as const,
});
export function sampleEP005Route(distanceMetres: number): RoutePose {
  if (!Number.isFinite(distanceMetres) || distanceMetres < -80 || distanceMetres > 78)
    throw Error("EP005 city road distance outside reviewed -80..78 m segment (no wrap allowed)");
  return sampleRoute(EP005_ROUTE.kind, distanceMetres);
}
export function previewDistance(frame: number, fps = 30): number {
  if (!Number.isFinite(frame) || !Number.isFinite(fps) || fps <= 0 || frame < 0)
    throw Error("Expected nonnegative finite frame and positive fps");
  return EP005_ROUTE.startDistance + (12 * frame) / fps;
}
export const EP005_CAMERA_CLEARANCE = Object.freeze({
  road: {zMin: -6.15, zMax: 6.15, yMin: 0, yMax: 5.5},
  headroomMetres: 6.9,
  fixtureMinAbsZ: 7.75,
  note: "Hard scenic fixtures outside +/-7.75m Z; moving vehicle in Z=-1.85m lane. Existing V3 city geometry retained.",
});
