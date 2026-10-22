import {sampleRoute,routeLength} from "../../../../src/yunex/world-kit/environments.ts";
import type {RoutePose} from "../../../../src/yunex/world-kit/environments.ts";
export const EP005_ROUTE = Object.freeze({
 kind:"track" as const,seed:12,timeOfDay:"dusk" as const,wetness:.10,roadY:0,
 lapMetres:routeLength("track"),startDistance:55,previewSpeedMps:12,
 roadHalfWidth:6,curbOffset:6.4,existingBarrierOffset:11.7,
 cameraClearanceNormalOffset:12,tallFixtureMinNormalOffset:19.2,
 canonicalSampler:"src/yunex/world-kit/environments.ts::sampleRoute('track',d)" as const
});
export function sampleEP005Route(distanceMetres:number):RoutePose{
 if(!Number.isFinite(distanceMetres))throw Error("EP005 closed-loop distance must be finite");
 return sampleRoute(EP005_ROUTE.kind,distanceMetres);
}
export function previewDistance(frame:number,fps=30):number {
 if(!Number.isFinite(frame)||frame<0||!Number.isFinite(fps)||fps<=0)
  throw Error("Finite nonnegative frame and positive fps required");
 return EP005_ROUTE.startDistance+EP005_ROUTE.previewSpeedMps*frame/fps;
}
export function trackPoint(distanceMetres:number,normalOffset=0,height=0){
 const pose=sampleEP005Route(distanceMetres);
 return {position:[pose.position[0]+Math.sin(pose.yaw)*normalOffset,height,
   pose.position[2]+Math.cos(pose.yaw)*normalOffset] as [number,number,number],yaw:pose.yaw};
}
export const EP005_CAMERA_CLEARANCE=Object.freeze({
 roadTopY:0,laneCentre:"V3 track centreline",
 rearAndSideCameraNormalCorridor:12,tallFixturesBeginBeyondNormalOffset:19.2,
 note:"Original V3 track asphalt, curb and +/-11.7m barriers unchanged. No parallel road."
});
