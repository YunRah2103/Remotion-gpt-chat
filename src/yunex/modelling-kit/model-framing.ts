import * as T from 'three';
import type {V3} from '../world-kit/geometry.ts';
/** Fit actual visible mesh boxes rather than the oversized whole-car AABB. Includes instanced rally tread. */
export function fitModelCamera(root:T.Object3D,camera:{position:V3;target:V3;fov:number},aspect:number){
 if(!(aspect>0)||!Number.isFinite(aspect))throw Error('Invalid camera aspect');
 const target=new T.Vector3(...camera.target),back=new T.Vector3(...camera.position).sub(target).normalize(),right=new T.Vector3(0,1,0).cross(back).normalize(),up=back.clone().cross(right),tan=Math.tan(camera.fov*Math.PI/360);let distance=.15,points=0;
 root.updateMatrixWorld(true);const point=new T.Vector3(),matrix=new T.Matrix4(),instance=new T.Matrix4();
 root.traverseVisible(o=>{if(!(o instanceof T.Mesh))return;if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();const box=o.geometry.boundingBox;if(!box||box.isEmpty())return;
  for(let i=0;i<(o instanceof T.InstancedMesh?o.count:1);i++){
   matrix.copy(o.matrixWorld);if(o instanceof T.InstancedMesh){o.getMatrixAt(i,instance);matrix.multiply(instance);}
   for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){point.set(x,y,z).applyMatrix4(matrix).sub(target);distance=Math.max(distance,point.dot(back)+Math.abs(point.dot(right))/(tan*aspect*.86),point.dot(back)+Math.abs(point.dot(up))/(tan*.64));points++;}
  }
 });
 if(!points||!Number.isFinite(distance))throw Error('Camera needs finite visible geometry');
 return {...camera,position:target.clone().addScaledVector(back,distance).toArray() as V3};
}
