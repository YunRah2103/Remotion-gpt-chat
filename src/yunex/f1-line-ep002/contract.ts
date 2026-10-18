/** Shared read-only cross-agent types for YUNEX Racing Line EP002. */
export type V3=[number,number,number];
export type RaceCarId='shortcut'|'racing';
export type RacePose={position:V3;yaw:number;curvatureInvM:number};
export type RacePath={
 id:RaceCarId;
 lengthM:number;
 entryDistanceM:number;
 apexDistanceM:number;
 exitDistanceM:number;
 /** Arc-distance measured along this car's actual line, not the kit's centre line. */
 sampleAtDistance:(distanceM:number)=>RacePose;
};
export type CarFrameState={
 id:RaceCarId;
 timeSeconds:number;
 pathDistanceM:number;
 worldPose:RacePose;
 speedMps:number;
 longitudinalAccelMps2:number;
 lateralAccelMps2:number;
 steerRad:number;
 travelDistanceM:number;
 brake01:number;
 throttle01:number;
 gripUtilization01:number;
};
export type RaceFrameState={
 frame:number;
 fps:number;
 timeSeconds:number;
 cars:Record<RaceCarId,CarFrameState>;
};
export type RaceCameraShot='opening'|'shortcut'|'wide-entry'|'apex'|'force'|'exit'|'final';
export type RaceCameraPose={position:V3;target:V3;fov:number};
export const RACE_COLORS={shortcut:'#25AFA8',racing:'#F5A44B',asphalt:'#303940',text:'#F5F6F4'} as const;
export const RACE_REFERENCE={fps:30,width:1080,height:1920,frames:780,environment:'track',vehicle:'formula-modern',cornerAnchor:[65,0,18] as V3} as const;
