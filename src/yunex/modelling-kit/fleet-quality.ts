/** Structural checks for every V5 family. Visual quality is deliberately a separate, pending gate. */
import * as T from 'three';
import {vehicleSpec} from '../world-kit/catalog.ts';
import {fleetProfile} from './fleet-profiles.ts';
export function auditFleetVehicle(root:T.Object3D){
 const s=vehicleSpec(root.userData.variant),c=fleetProfile(s),issues:string[]=[],shell=root.getObjectByName('body-shell');
 if(root.userData.bodyArchitecture!=='fleet-v5')issues.push('Not a V5 fleet vehicle');
 const mounts=root.children.filter(o=>o.name.startsWith('mount-'));
 if(mounts.length!==(s.family==='bike'?2:s.axles*2))issues.push('Wrong axle count');
 for(const m of mounts){const rest=m.userData.restPosition as number[]|undefined;if(!rest||Math.abs(rest[1]-s.radius)>1e-5)issues.push(`Broken wheel mount: ${m.name}`);}
 const body=root.getObjectByName('arched-body') as T.Mesh|undefined;
 root.traverseVisible(o=>{if(o instanceof T.Mesh){for(const key of ['position','normal']){const a=o.geometry.getAttribute(key);if(a&&!Array.from(a.array).every(Number.isFinite))issues.push(`Nonfinite ${key}: ${o.name}`);}}});
 const road=!['formula','bike'].includes(s.family)&&!['box-truck','tractor-truck'].includes(s.id);
 if(road){
  for(const name of ['arched-body','windshield','a-pillar','formed-wheel-arch'])if(!root.getObjectByName(name)&&!(s.id==='supercar'&&name==='formed-wheel-arch'))issues.push(`Missing surface: ${name}`);
  const roof=root.getObjectByName('roof');
  if(!c.open&&!c.targa&&!roof)issues.push('Missing enclosed roof');
  if(c.open&&roof?.visible)issues.push('Open roadster has closed roof');
  if(roof){const box=new T.Box3().setFromObject(roof),localTop=root.worldToLocal(new T.Vector3(box.max.x,box.max.y,box.max.z)).y-(shell?.position.y??0);if(Math.abs(localTop-c.roof)>.06)issues.push('Roof height outside profile');}
  if(body){
   root.updateMatrixWorld(true);const cast=new T.Raycaster();
   for(const x of [-s.wheelbase/2,s.wheelbase/2])for(const side of [-1,1]){
    const point=new T.Vector3(x,s.radius,side*(s.width/2+.5)).applyMatrix4(body.matrixWorld),direction=new T.Vector3(0,0,-side).transformDirection(body.matrixWorld);cast.set(point,direction);cast.far=.8;
    if(cast.intersectObject(body,false).length)issues.push('Body surface crosses wheel centre aperture');
   }
  }
 }
 return {variant:s.id,architecture:c.kind,state:issues.length?'fail' as const:'pass' as const,issues,visualApproval:'pending',limitations:['Rest pose only; call before animation or placement.','Ray samples do not prove absence of all intersections.','No numerical test certifies realism, glass continuity or cinematic appearance.']};
}
