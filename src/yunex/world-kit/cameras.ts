import type {VehicleSpec} from './catalog.ts';
import type {V3} from './geometry.ts';
export type CameraPreset='front-three-quarter'|'rear-three-quarter'|'side'|'top';
export function vehicleCamera(spec:VehicleSpec,preset:CameraPreset,portrait=false):{position:V3;target:V3;fov:number}{
 const radius=Math.max(3,spec.length*(portrait?1.7:1.12)),target:V3=[0,spec.height*.45,0];
 const positions:Record<CameraPreset,V3>={
  'front-three-quarter':[radius*.78,radius*.39,radius*.62],
  'rear-three-quarter':[-radius*.78,radius*.39,radius*.62],
  side:[0,radius*.27,radius],
  top:[.01,radius*1.15,0],
 };
 return {position:positions[preset],target,fov:38};
}
