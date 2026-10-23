import * as T from 'three';
import type {V3} from '../world-kit/geometry.ts';
/** Back the camera away along its viewing axis until a centred box fits the safe frame. */
export function fitInspectionCamera(position:V3,target:V3,size:V3,aspect:number,fov:number):V3{
 const back=new T.Vector3().fromArray(position).sub(new T.Vector3().fromArray(target));
 const original=back.length();back.normalize();
 const right=new T.Vector3(0,1,0).cross(back).normalize(),up=back.clone().cross(right);
 const tan=Math.tan(fov*Math.PI/360),safe=.86;
 let distance=original;
 for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1]){
  const corner=new T.Vector3(x*size[0]/2,y*size[1]/2,z*size[2]/2),depth=corner.dot(back);
  distance=Math.max(distance,depth+Math.abs(corner.dot(right))/(tan*aspect*safe),depth+Math.abs(corner.dot(up))/(tan*safe));
 }
 return back.multiplyScalar(distance).add(new T.Vector3().fromArray(target)).toArray() as V3;
}
