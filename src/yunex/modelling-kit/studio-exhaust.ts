/** Studio-only outlet hardware. Metres; vehicle +X forward, +Y up, +Z left. */
import * as T from 'three';
import type {VehicleSpec} from '../world-kit/catalog.ts';

export type StudioExhaustOptions={outerDiameter?:number;wallThickness?:number;depth?:number;centerHeight?:number;lateralOffset?:number;rearProtrusion?:number};
export type StudioExhaustOutlet={side:'left'|'right';mount:T.Group;outerDiameter:number;innerDiameter:number;wallThickness:number;direction:readonly [-1,0,0]};
export type StudioExhaustResult={group:T.Group;outerDiameter:number;outlets:StudioExhaustOutlet[];mounts:Partial<Record<'left'|'right',T.Group>>};
const positive=(name:string,value:number)=>{if(!Number.isFinite(value)||value<=0)throw new Error(`${name} must be finite and positive`);};

/**
 * Each stable mount is at the physical outlet mouth. Mount-local +Z is exhaust
 * flow (vehicle -X), +Y is up, +X is vehicle +Z. Attach effects using local +Z.
 * No effect state, engine animation or EP005 interfaces are changed here.
 */
export function installStudioExhaust(shell:T.Group,s:VehicleSpec,options:StudioExhaustOptions={}):StudioExhaustResult{
 if(shell.children.some(child=>child.name==='studio-exhaust'))throw new Error('Studio exhaust is already installed');
 if(!['supercar','coupe','rally-hatch'].includes(s.id))throw new Error(`Studio exhaust unsupported for ${s.id}`);
 for(const key of ['length','width'] as const)positive(key,s[key]);
 const {outerDiameter=.112,wallThickness=.004,depth=.22,centerHeight=.43,lateralOffset=s.width*(s.id==='rally-hatch'?.32:.27),rearProtrusion=.075}=options;
 for(const [name,value] of Object.entries({outerDiameter,wallThickness,depth,centerHeight,lateralOffset,rearProtrusion}))positive(name,value);
 if(outerDiameter<.060||outerDiameter>.180)throw new Error('Studio exhaust outer diameter must be 0.060–0.180 metres (recommended 0.105–0.120)');
 if(wallThickness>=outerDiameter/2||wallThickness>.012)throw new Error('Exhaust wall must leave an open bore and be at most 12 mm');
 if(lateralOffset+outerDiameter/2>=s.width/2)throw new Error('Exhaust outlet must fit inside vehicle width');
 if(centerHeight<outerDiameter/2||depth> s.length/2||rearProtrusion>depth)throw new Error('Exhaust dimensions do not fit vehicle');
 const group=new T.Group();group.name='studio-exhaust';
 const metal=new T.MeshStandardMaterial({color:'#8a8e94',metalness:.95,roughness:.25});
 const inner=new T.MeshStandardMaterial({color:'#262a30',metalness:.65,roughness:.66,side:T.BackSide});
 const trim=new T.MeshStandardMaterial({color:'#11161a',metalness:.35,roughness:.45,side:T.DoubleSide});
 const lipMat=metal.clone();lipMat.side=T.DoubleSide;
 const radius=outerDiameter/2,innerRadius=radius-wallThickness;
 const outlets:StudioExhaustOutlet[]=[],mounts:StudioExhaustResult['mounts']={};
 for(const side of (s.id==='rally-hatch'?['right']:['left','right']) as ('left'|'right')[]){
  const mount=new T.Group();mount.name=`exhaust-outlet-${side}`;mount.position.set(-s.length/2-rearProtrusion,centerHeight,(side==='left'?1:-1)*lateralOffset);
  mount.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(-1,0,0));
  const add=(geometry:T.BufferGeometry,material:T.Material,name:string,z:number)=>{const m=new T.Mesh(geometry,material);m.name=name;m.position.z=z;m.castShadow=true;m.receiveShadow=true;mount.add(m);return m;};
  // CylinderGeometry is explicitly uncapped: no disk seals the central bore.
  const outerWall=add(new T.CylinderGeometry(radius,radius,depth,48,1,true),metal,'studio-exhaust-outer-wall',-depth/2);outerWall.rotation.x=Math.PI/2;
  const innerWall=add(new T.CylinderGeometry(innerRadius,innerRadius,depth,48,1,true),inner,'studio-exhaust-inner-wall',-depth/2);innerWall.rotation.x=Math.PI/2;
  add(new T.RingGeometry(innerRadius,radius,48),lipMat,'studio-exhaust-lip',0);
  add(new T.RingGeometry(innerRadius,radius,48),lipMat,'studio-exhaust-rear-wall',-depth);
  // A shallow open annulus frames the aperture in the diffuser, behind the lip.
  add(new T.RingGeometry(radius+.004,radius+.025,48),trim,'studio-exhaust-recess-trim',-.028);
  mount.userData={role:'exhaust-outlet',side,outerDiameter,innerDiameter:outerDiameter-2*wallThickness,wallThickness,depth,localFlowAxis:[0,0,1],vehicleFlowAxis:[-1,0,0]};
  group.add(mount);mounts[side]=mount;
  outlets.push({side,mount,outerDiameter,innerDiameter:outerDiameter-2*wallThickness,wallThickness,direction:[-1,0,0]});
 }
 group.userData={outerDiameter,units:'metres',flowAxis:'-X',outletNames:outlets.map(o=>o.mount.name)};
 shell.add(group);shell.updateWorldMatrix(true,true);
 return {group,outerDiameter,outlets,mounts};
}
