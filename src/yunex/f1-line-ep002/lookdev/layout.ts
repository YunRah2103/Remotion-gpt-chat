/** Pure, deterministic positioning helpers for the Agent 4 cinematography proof.
 * Preview choreography is deliberately NOT a source of race speed / lap-time claims.
 */
export type V3=[number,number,number];
export type RoadPose={position:V3;yaw:number};
export const RACE_LOOK={turnAnchor:[65,0,18] as V3,trackHalfWidthM:6,kerbCentreM:6.4,boardSetbackM:16.2} as const;
export const lateralNormal=(yaw:number):V3=>[Math.sin(yaw),0,Math.cos(yaw)];
export function offsetPose(pose:RoadPose,offsetM:number):RoadPose{
 if(!Number.isFinite(offsetM)||!Number.isFinite(pose.yaw)||!pose.position.every(Number.isFinite))throw Error('Finite pose and offset required');
 const n=lateralNormal(pose.yaw);
 return {position:[pose.position[0]+n[0]*offsetM,pose.position[1],pose.position[2]+n[2]*offsetM],yaw:pose.yaw};
}
export function closestRouteDistance(sample:(d:number)=>RoadPose,lengthM:number,anchor:V3=RACE_LOOK.turnAnchor){
 if(!(lengthM>0&&Number.isFinite(lengthM)))throw Error('Positive track length required');
 let bestD=0,bestSq=Infinity;
 for(let i=0;i<1024;i++){const d=lengthM*i/1024,p=sample(d).position;
  const sq=(p[0]-anchor[0])**2+(p[2]-anchor[2])**2;
  if(sq<bestSq){bestSq=sq;bestD=d;}
 }
 return bestD;
}
export type PreviewCar={distanceM:number;offsetM:number};
export function previewCarPositions(timeSeconds:number,anchorDistanceM:number):{shortcut:PreviewCar;racing:PreviewCar}{
 if(!Number.isFinite(timeSeconds)||!Number.isFinite(anchorDistanceM))throw Error('Finite preview inputs required');
 // Cars are staggered 16m along the same kit route for a non-colliding lookdev comparison.
 // A1/A2 replace these positions in the integrated film.
 const travel=11.5*timeSeconds;
 return {shortcut:{distanceM:anchorDistanceM-29+travel,offsetM:0.4},
         racing:{distanceM:anchorDistanceM-45+travel,offsetM:timeSeconds<2?2.4:5.25}};
}
export function normalizedShadowFocus(focus:V3):V3{
 if(!focus.every(Number.isFinite))throw Error('Finite focus required');
 return [focus[0],focus[1],focus[2]];
}
