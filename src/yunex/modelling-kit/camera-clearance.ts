import * as T from 'three';
import type {V3} from '../world-kit/geometry.ts';
export type ClearanceView={position:V3;target:V3;fov:number};
/** Sparse visible-surface rays expose solid foreground obstructions before a costly render.
 * A centre ray alone misses posts crossing the bonnet, glass or wheels.
 * This diagnostic does not replace moving footage or guarantee silhouette/beauty.
 */
export function auditCameraClearance(vehicle:T.Object3D,world:T.Object3D,view:ClearanceView,aspect:number){
 if(!Number.isFinite(aspect)||aspect<=0)throw Error('Camera clearance needs a positive finite aspect ratio, such as 1080/1920');
 if(!view||![view.position,view.target].every(v=>Array.isArray(v)&&v.length===3&&v.every(Number.isFinite))||!Number.isFinite(view.fov)||view.fov<10||view.fov>120||new T.Vector3(...view.position).distanceToSquared(new T.Vector3(...view.target))<1e-8)throw Error('Camera clearance needs finite different position/target and fov 10..120');
 if(!vehicle||!world)throw Error('Camera clearance needs the actual posed vehicle and environment objects');
 vehicle.updateWorldMatrix(true,true);world.updateWorldMatrix(true,true);
 const camera=new T.PerspectiveCamera(view.fov,aspect,.025,500);camera.position.fromArray(view.position);camera.lookAt(new T.Vector3(...view.target));camera.updateMatrixWorld(true);
 const solid=(h:T.Intersection)=>{for(let o:T.Object3D|null=h.object;o;o=o.parent)if(!o.visible)return false;if(!(h.object instanceof T.Mesh))return false;const m=Array.isArray(h.object.material)?h.object.material[h.face?.materialIndex??0]:h.object.material;return m&&(!m.transparent||m.opacity>.95);};
 const blockers=new Map<string,{name:string;instance?:number;nearestDistance:number;samples:number}>();let targetSamples=0,blockedSamples=0;
 for(let row=0;row<5;row++)for(let col=0;col<7;col++){
  const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(-.8+col*1.6/6,-.6+row*.3),camera);
  const target=ray.intersectObject(vehicle,true).find(solid);if(!target)continue;targetSamples++;ray.far=target.distance-.025;
  const hit=ray.intersectObject(world,true).find(solid);if(!hit)continue;blockedSamples++;
  const key=hit.object.uuid+':'+hit.instanceId,entry=blockers.get(key)??{name:hit.object.name||hit.object.type,...(hit.instanceId===undefined?{}:{instance:hit.instanceId}),nearestDistance:hit.distance,samples:0};entry.nearestDistance=Math.min(entry.nearestDistance,hit.distance);entry.samples++;blockers.set(key,entry);
 }
 const blockedFraction=targetSamples?blockedSamples/targetSamples:0,state=!targetSamples||blockedFraction>.10?'fail':'pass';
 return {state,targetSamples,blockedSamples,blockedFraction,blockers:[...blockers.values()],guidance:!targetSamples?'Vehicle missed by review grid; correct framing and inspect a native moving window.':blockedSamples?'Widen the lens or move the camera start/end poses inside the obstruction; repeat at first/middle/last and flagged frames.':'No solid obstruction found on sampled vehicle rays; inspect the full moving shot.',limitations:['Sparse rays can miss small or transient obstructions.','Transparent obstructions and artistic framing are not certified.','A technical pass is not visual acceptance.']};
}
