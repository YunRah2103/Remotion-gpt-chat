import * as T from 'three';
import {createVehicle} from '../../../../src/yunex/world-kit/vehicles.ts';
import {animateVehicle} from '../../../../src/yunex/world-kit/motion.ts';
import {disposeObject} from '../../../../src/yunex/world-kit/geometry.ts';
import {createPart} from '../../../../src/yunex/parts-kit/models.ts';
import {animatePart} from '../../../../src/yunex/parts-kit/motion.ts';
import {EP003_SCENE} from '../shared/contract.ts';
import type {TyreFrame,WheelFrame,WheelId,VehicleDynamicsFrame} from '../shared/contract.ts';
import {MAX_LOADED_DROP_M,sampleTyreFailure} from './sampleTyreFailure.ts';
import {sampleRubberVertex} from './roadContact.ts';
import type {TyreFailureParams} from './sampleTyreFailure.ts';

export type TyreDamageStyle='pressure-only'|'light-scuff';
type DeformedMesh={mesh:T.Mesh;rest:Float32Array;kind:'tyre'|'groove'|'bead'};
export type PreparedTyreRig={
  vehicle:T.Group; wheelId:WheelId; steering:T.Group; roll:T.Group;
  meshes:DeformedMesh[]; suspension:T.Group; restPivotY:number;
};
/** Deliberately binds to the original wheel hierarchy, retaining rims, hubs and calipers. */
export function prepareTyreRig(wheelId:WheelId='front-right',exposure=0):PreparedTyreRig {
  if(!Number.isFinite(exposure)||exposure<0||exposure>1)throw new Error('Invalid cutaway exposure');
  const vehicle=createVehicle({variant:'grand-tourer',color:EP003_SCENE.paint,accent:'#d0a767',wheelColor:'#bbc6c8',interior:true});
  const front=wheelId.startsWith('front'), right=wheelId.endsWith('right');
  const x=(front?1:-1)*EP003_SCENE.wheelbaseM/2;
  const z=(right?-1:1)*(EP003_SCENE.vehicleWidthM/2-.09);
  let steering:T.Group|undefined;
  vehicle.traverse(o=>{if(o instanceof T.Group&&o.children.some(v=>v.userData.wheel)&&Math.abs(o.position.x-x)<1e-5&&Math.abs(o.position.z-z)<1e-5)steering=o;});
  const roll=steering?.children.find(o=>o.userData.wheel);
  if(!steering||!(roll instanceof T.Group))throw new Error('Original wheel hierarchy not found');
  const meshes:DeformedMesh[]=[];
  for(const o of roll.children){
    if(!(o instanceof T.Mesh))continue;
    const kind=o.name==='tyre'?'tyre':o.name==='tyre-groove'?'groove':o.name==='sidewall-bead'?'bead':null;
    if(!kind)continue;
    // Clone BEFORE deformation so the approved world-kit shared geometry remains intact.
    o.geometry=o.geometry.clone();
    const attr=o.geometry.getAttribute('position') as T.BufferAttribute;
    meshes.push({mesh:o,rest:new Float32Array(attr.array as ArrayLike<number>),kind});
  }
  if(!meshes.some(m=>m.kind==='tyre'))throw new Error('Original rubber mesh missing');
  // This PARTS-kit suspension uses its own illustrative motion metadata.
  // Geometry of the approved wheel, hub and brake is never duplicated.
  const suspension=createPart({variant:'double-wishbone',accent:'#caa96b'});
  suspension.name='ep003-exposed-front-suspension';
  suspension.position.set(x,.18, (right?-1:1)*.50);
  suspension.rotation.y=right?Math.PI:0;
  suspension.visible=exposure>0;
  vehicle.add(suspension);
  if(exposure>0){
    const opacity=1-.78*exposure;
    const mats=new Set<T.Material>();
    vehicle.traverse(o=>{
      if(o instanceof T.Mesh){
        if(['arched-body','body-shell','bonnet','hood','roof','door-skin','fender','front-fender','sill','cabin','side-window','windscreen','windshield'].includes(o.name)){
          for(const mat of Array.isArray(o.material)?o.material:[o.material])mats.add(mat);
        }
      }
    });
    mats.forEach(m=>{
      const p=m as T.MeshStandardMaterial;
      if('opacity'in p){p.transparent=true;p.opacity=opacity;p.depthWrite=false;p.needsUpdate=true;}
    });
  }
  return {vehicle,wheelId,steering,roll,meshes,suspension,restPivotY:steering.position.y};
}
/**
 * Contact deformation evaluated in the road frame after applying wheel spin:
 * contact patch stays under the hub while rotating rubber flows through it.
 * All positions are calculated from the stored original geometry per frame.
 */
export function deformRubber(rig:PreparedTyreRig,frame:TyreFrame):void {
  for(const {mesh,rest,kind} of rig.meshes){
    const attr=mesh.geometry.getAttribute('position') as T.BufferAttribute;
    const out=attr.array as Float32Array;
    for(let i=0;i<rest.length;i+=3){
      let [x,y,z]=sampleRubberVertex([rest[i],rest[i+1],rest[i+2]],frame,kind);
      // Contact is fixed in *world* asphalt coordinates, not just the wheel
      // plane: body pitch/roll and steering tilt its local radial axes.
      // A final small radial carcass flattening prevents sidewall vertices
      // from piercing y=0 as the real 3D pose changes. Hub remains untouched.
      const e=mesh.matrixWorld.elements;
      const localRadialWorldY=e[1]*x+e[5]*y;
      const roadWorldY=localRadialWorldY+e[9]*z+e[13];
      if(roadWorldY<0 && localRadialWorldY<-1e-8){
        const scale=Math.max(0,Math.min(1,(-e[9]*z-e[13])/localRadialWorldY));
        x*=scale;y*=scale;
      }
      out[i]=x;out[i+1]=y;out[i+2]=z;
    }
    attr.needsUpdate=true;
    mesh.geometry.computeVertexNormals();
    mesh.geometry.computeBoundingSphere();
    mesh.geometry.computeBoundingBox();
  }
}
/**
 * Dynamics-first application. A WheelFrame overrides preview-only hub placement
 * and phase when provided; the car position/steer must come from Agent 2.
 */
export function applyTyreFrame(rig:PreparedTyreRig,frame:TyreFrame,options:{
  dynamics?:VehicleDynamicsFrame;
  wheelFrame?:WheelFrame;
  /** Only for the clearly-labelled preview motion fixture, never final footage. */
  fixtureDistanceM?:number;
  fixtureSteerRad?:number;
  /** Visual world translation only. Applied identically to Agent 2 body AND all four hub poses. */
  worldOffsetM?:readonly [number,number,number];
  exposure?:number;
}={}):void {
  const {vehicle,steering,roll}=rig;
  const d=options.dynamics;
  const currentWheel=options.wheelFrame??d?.wheels[rig.wheelId];
  const spin=currentWheel?.spinRad??frame.angularPhaseRad;
  animateVehicle(vehicle,d?.distanceTravelledM??options.fixtureDistanceM??0,d?.driverSteerRad??options.fixtureSteerRad??0);
  if(d){
    const offset=options.worldOffsetM??[0,0,0];
    vehicle.position.set(d.positionM[0]+offset[0],d.positionM[1]+offset[1],d.positionM[2]+offset[2]);
    // Three Euler axes are X=pitch, Y=yaw, Z=roll. The former swapped X/Z.
    // This preserves Agent 2's true body attitude while wheels remain placed
    // at their authoritative world-space hub coordinates below.
    vehicle.rotation.set(d.pitchRad,d.yawRad,d.rollRad,'YXZ');
  }else {vehicle.position.set(0,0,0);vehicle.rotation.set(0,0,0);}
  roll.rotation.z=spin;
  // The preview has one illustrated collapsing corner. In final integration,
  // Agent 2 owns ALL wheel hubs, individual spins, and steering angles.
  steering.position.y=frame.effectiveRadiusM;
  if(!d&&currentWheel){
    vehicle.updateMatrixWorld(true);
    steering.position.copy(vehicle.worldToLocal(new T.Vector3(...currentWheel.hubWorldM)));
    steering.rotation.y=currentWheel.steeringRad;
  }
  if(d){
    vehicle.updateMatrixWorld(true);
    vehicle.traverse(o=>{
      if(!(o instanceof T.Group)||!o.children.some(v=>v.userData.wheel))return;
      const front=o.position.x>0,right=o.position.z<0;
      const id:WheelId=`${front?'front':'rear'}-${right?'right':'left'}`;
      const state=options.wheelFrame&&id===rig.wheelId?options.wheelFrame:d.wheels[id];
      if(!state)return;
      const offset=options.worldOffsetM??[0,0,0];
      const local=vehicle.worldToLocal(new T.Vector3(
        state.hubWorldM[0]+offset[0],state.hubWorldM[1]+offset[1],state.hubWorldM[2]+offset[2]));
      o.position.copy(local);
      o.rotation.y=state.steeringRad;
      const rotating=o.children.find(v=>v.userData.wheel);
      if(rotating)rotating.rotation.z=state.spinRad;
    });
  }
  if(rig.suspension.visible){
    // Drive the reused double-wishbone with Agent 2's actual vertical-compression state.
    // In development-only previews, fallback derives the same visual range from tyre support.
    const compression=d?.wheels[rig.wheelId].verticalCompressionM;
    const fraction=compression===undefined
      ?(EP003_SCENE.wheelRadiusM-frame.effectiveRadiusM)/MAX_LOADED_DROP_M
      :(compression-.010)/.054;
    animatePart(rig.suspension,{compression:Math.max(0,Math.min(1,fraction))});
    rig.suspension.visible=(options.exposure??1)>0;
  }
  // Use the ACTUAL Agent 2 hub altitude for road-space clipping. Its small
  // extra dynamic suspension displacement changes real ground clearance; the
  // effective rolling radius is still owned by Agent 2 (not decremented twice).
  vehicle.updateMatrixWorld(true);
  const hubHeight=steering.getWorldPosition(new T.Vector3()).y;
  const contactRadius=d?Math.min(frame.effectiveRadiusM,hubHeight):frame.effectiveRadiusM;
  deformRubber(rig,{...frame,angularPhaseRad:spin,
    effectiveRadiusM:Math.max(0,contactRadius)});
  vehicle.updateMatrixWorld(true);
}
export const disposeTyreRig=(rig:PreparedTyreRig)=>disposeObject(rig.vehicle);

/** Convenience for callers without a full VehicleDynamicsFrame yet. */
export function frameForTyre(tSec:number,phaseRad:number,params:TyreFailureParams={}):TyreFrame{
  return sampleTyreFailure(tSec,{...params,angularPhaseRad:phaseRad});
}
