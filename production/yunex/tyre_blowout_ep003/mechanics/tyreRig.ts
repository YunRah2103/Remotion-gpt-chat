import * as T from 'three';
import {createVehicle} from '../../../../src/yunex/world-kit/vehicles.ts';
import {animateVehicle} from '../../../../src/yunex/world-kit/motion.ts';
import {disposeObject} from '../../../../src/yunex/world-kit/geometry.ts';
import {createPart} from '../../../../src/yunex/parts-kit/models.ts';
import {animatePart} from '../../../../src/yunex/parts-kit/motion.ts';
import {EP003_SCENE} from '../shared/contract.ts';
import type {TyreFrame,WheelFrame,WheelId,VehicleDynamicsFrame} from '../shared/contract.ts';
import {sampleTyreFailure} from './sampleTyreFailure.ts';
import type {TyreFailureParams} from './sampleTyreFailure.ts';

export type TyreDamageStyle='pressure-only'|'frayed-edge';
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
  vehicle.traverse(o=>{if(o instanceof T.Group&&o.userData.steering&&Math.abs(o.position.x-x)<1e-5&&Math.abs(o.position.z-z)<1e-5)steering=o;});
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
  suspension.position.set(x,.168, (right?-1:1)*.50);
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
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
/**
 * Contact deformation is evaluated in the road frame by adding wheel spin to
 * each ORIGINAL mesh vertex. This avoids the classic "dent spinning with wheel"
 * error. No cumulative geometry edits: every frame begins from pristine vertices.
 * Only rubber, tread grooves and sidewall beads deform; rim/caliper stay rigid.
 */
export function deformRubber(rig:PreparedTyreRig,frame:TyreFrame):void {
  const nominal=EP003_SCENE.wheelRadiusM;
  const hubHeight=frame.effectiveRadiusM;
  const phase=frame.angularPhaseRad;
  const compression=clamp(frame.sidewallCompression,0,1);
  for(const {mesh,rest,kind} of rig.meshes){
    const attr=mesh.geometry.getAttribute('position') as T.BufferAttribute;
    const out=attr.array as Float32Array;
    for(let i=0;i<rest.length;i+=3){
      const x=rest[i],y=rest[i+1],z=rest[i+2];
      const r=Math.hypot(x,y);
      if(r<1e-8){out[i]=x;out[i+1]=y;out[i+2]=z;continue;}
      const theta=Math.atan2(y,x)+phase;
      const sin=Math.sin(theta);
      const tread=kind==='groove'?1:kind==='bead'?.50:clamp((r-.265)/.09,0,1);
      const shrink=.023*compression*tread;
      let newR=r-shrink;
      // Actual contact plateau: minimum tyre y = wheel hub height - tyre radius.
      // This cap is in ground coordinates, NOT the spinning wheel's texture frame.
      if(sin<-.06&&compression>0){
        const touching=hubHeight/(-sin);
        if(kind==='bead'||tread>.05){
          // Apply full ground cap even at the first frame of pressure loss.
          // Partial blending can briefly drive rubber through the road.
          newR=Math.min(newR,touching);
        }
      }
      // A little extra sidewall fullness near the bottom, never inflated outwards radially.
      const sidewall=(kind==='tyre'?clamp((.345-r)/.074,0,1):0);
      const nearGround=Math.pow(Math.max(0,-sin),5);
      const bulge=.021*compression*sidewall*nearGround;
      const ratio=newR/r;
      out[i]=x*ratio;
      out[i+1]=y*ratio;
      out[i+2]=z+Math.sign(z)*bulge;
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
  exposure?:number;
}={}):void {
  const {vehicle,steering,roll}=rig;
  const d=options.dynamics;
  const currentWheel=options.wheelFrame??d?.wheels[rig.wheelId];
  const spin=currentWheel?.spinRad??frame.angularPhaseRad;
  animateVehicle(vehicle,d?.distanceTravelledM??options.fixtureDistanceM??0,d?.driverSteerRad??options.fixtureSteerRad??0);
  if(d){
    vehicle.position.set(...d.positionM);
    vehicle.rotation.set(d.rollRad,d.yawRad,d.pitchRad,'YXZ');
  }else {vehicle.position.set(0,0,0);vehicle.rotation.set(0,0,0);}
  roll.rotation.z=spin;
  // Contact-lowering preview fixture; authoritative hubWorldM supersedes it.
  steering.position.y=frame.effectiveRadiusM;
  if(currentWheel&&d){
    vehicle.updateMatrixWorld(true);
    const local=vehicle.worldToLocal(new T.Vector3(...currentWheel.hubWorldM));
    steering.position.y=local.y;
  }
  if(rig.suspension.visible){
    // PARTS suspension rises when compression increases, hence inverted on collapse.
    animatePart(rig.suspension,{compression:.6*(1-frame.failureProgress)});
    rig.suspension.visible=(options.exposure??1)>0;
  }
  deformRubber(rig,{...frame,angularPhaseRad:spin});
  vehicle.updateMatrixWorld(true);
}
export const disposeTyreRig=(rig:PreparedTyreRig)=>disposeObject(rig.vehicle);

/** Convenience for callers without a full VehicleDynamicsFrame yet. */
export function frameForTyre(tSec:number,phaseRad:number,params:TyreFailureParams={}):TyreFrame{
  return sampleTyreFailure(tSec,{...params,angularPhaseRad:phaseRad});
}
