import React, {useEffect, useMemo} from 'react';
import * as T from 'three';
import {animateVehicle, createVehicle, disposeObject} from '../../../../src/yunex/world-kit/index.ts';
import type {VehicleMotionState, WheelId} from '../shared/contract.ts';
import {EP004} from '../shared/contract.ts';
import {
  getSkidDescriptors, SKID_BOTTOM_Y_M, SKID_LAYOUT,
  SKID_THICKNESS_M, SKID_WIDTH_M, PLANK_HALF_LENGTH_M, PLANK_HALF_WIDTH_M,
} from './skids.ts';

export {getSkidDescriptors} from './skids.ts';
export type F1HeroVehicleProps = Readonly<{
  motion: VehicleMotionState;
  /** Technical reveal only: body ghosting; no geometry/contact positions change. */
  reveal01?: number;
}>;

const clamp01 = (v: number) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
function physical(color: string, metalness: number, roughness: number, clearcoat=0): T.MeshPhysicalMaterial {
  return new T.MeshPhysicalMaterial({color, metalness, roughness, clearcoat, clearcoatRoughness: .20});
}
function block(parent: T.Group, name: string, dimensions: readonly [number,number,number],
  position: readonly [number,number,number], mat: T.Material): T.Mesh {
  const m=new T.Mesh(new T.BoxGeometry(...dimensions),mat);
  m.name=name; m.position.set(...position); m.castShadow=true; m.receiveShadow=true;
  parent.add(m); return m;
}
function tube(parent: T.Group,name:string,points: readonly (readonly [number,number,number])[],
  r:number,mat:T.Material): T.Mesh {
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
  const m=new T.Mesh(new T.TubeGeometry(curve,32,r,8,false),mat);
  m.name=name; m.castShadow=true; parent.add(m); return m;
}
function link(parent:T.Group,name:string,a:readonly [number,number,number],
 b:readonly [number,number,number],radius:number,material:T.Material) {
  const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start);
  const m=new T.Mesh(new T.CylinderGeometry(radius,radius,delta.length(),12),material);
  m.name=name;m.position.copy(start).add(end).multiplyScalar(.5);
  m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());
  m.castShadow=true;parent.add(m);
  return m;
}
const WHEEL_IDS: Readonly<Record<string, WheelId>>={
  '1.71,0.83':'front-left', '1.71,-0.83':'front-right',
  '-1.71,0.83':'rear-left', '-1.71,-0.83':'rear-right',
};

/** One EP004-only, shared hero factory. Reuses original modern-formula vehicle,
 * its native wheel pivots/roll groups, body shape and the original paint factory.
 * No changes to src/yunex/world-kit or other episodes.
 */
export function buildF1HeroVehicle(): T.Group {
  const root=createVehicle({
    variant:'formula-modern', color:'#12ada8', accent:'#dd9754',
    wheelColor:'#b0c4d0', lights:true, interior:false,
  });
  root.name='EP004-F1-HERO';
  const carbon=physical('#111b20',.32,.48);
  const carbonEdge=physical('#25373b',.44,.39);
  const titanium=physical('#b9c6c7',.87,.22);
  const titaniumEdge=physical('#d9bfa4',.77,.32);
  const brass=physical('#b59158',.75,.35);
  const liner=physical('#352f2a',.04,.82);
  const aeroPaint=physical('#0a908d',.52,.22,.9);

  // Structural carbon floor is immediately below, and physically mounted to, the kit floor.
  // No disembodied plank/slab: its longitudinal side ribs and bridge saddles mount to this floor.
  const structure=new T.Group();structure.name='EP004-STRUCTURAL-FLOOR';root.add(structure);
  block(structure,'EP004-carbon-floor',[4.23,.07,.89],[0,.162,0],carbon);
  for(const sign of [-1,1]) {
    block(structure,'EP004-floor-edge',[3.80,.065,.13],[-.08,.177,sign*.49],carbonEdge);
    for(let i=0;i<9;i++){
      const x=-1.68+i*.40;
      block(structure,'EP004-carbon-underfloor-strake',[.29,.037,.018],[x,.114,sign*(.29+(i%3)*.058)],carbonEdge);
    }
  }
  // The separate nonmetallic plank assembly lives between the metal skids.
  const plank=new T.Group();plank.name='EP004-PLANK-ASSEMBLY';root.add(plank);
  const plankBottom=.0655,plankThickness=.041,plankCentreY=plankBottom+plankThickness/2;
  for(const sign of [-1,1])
    block(plank,'EP004-composite-plank-side-rail',
      [PLANK_HALF_LENGTH_M*2,plankThickness,.055],
      [0,plankCentreY,sign*(PLANK_HALF_WIDTH_M-.0275)],liner);

  const ordered=[...SKID_LAYOUT].sort((a,b)=>a.xM-b.xM);
  let prev=-PLANK_HALF_LENGTH_M;
  for(const s of ordered){
    const begin=s.xM-s.lengthM/2;
    if(begin>prev+.0001){
      block(plank,'EP004-composite-plank-segment',
        [begin-prev,plankThickness,SKID_WIDTH_M],
        [(prev+begin)/2,plankCentreY,0],liner);
    }
    prev=s.xM+s.lengthM/2;
  }
  if(prev<PLANK_HALF_LENGTH_M)
    block(plank,'EP004-composite-plank-segment',
      [PLANK_HALF_LENGTH_M-prev,plankThickness,SKID_WIDTH_M],
      [(prev+PLANK_HALF_LENGTH_M)/2,plankCentreY,0],liner);

  // Metallic skids are discrete, named, meshable and inserted between plank sections.
  // Their exact BOTTOM points are exported via getSkidDescriptors(), never inferred
  // from arbitrary decorative meshes.
  for(const s of SKID_LAYOUT){
    const y=SKID_BOTTOM_Y_M+SKID_THICKNESS_M/2;
    const metal=block(plank,`EP004-skid-${s.id}`,
      [s.lengthM,SKID_THICKNESS_M,SKID_WIDTH_M],[s.xM,y,0],titanium);
    metal.userData={metalSkid:true,skidId:s.id,material:s.material,
      mandatory:s.mandatory,localBottomPoint:[s.xM,SKID_BOTTOM_Y_M,0]};
    for(const sign of [-1,1]) {
      block(plank,`EP004-skid-${s.id}-bevel`,
        [s.lengthM-.014,.003,.014],[s.xM,y+.010,sign*(SKID_WIDTH_M/2-.007)],titaniumEdge);
      for(const xdir of [-1,1])
        block(plank,`EP004-skid-${s.id}-fastener`,
          [.016,.004,.016],[s.xM+xdir*(s.lengthM/2-.060),y+.012,sign*.107],brass);
    }
  }

  // Standoffs make the plank visibly attached to carbon floor, not floating in space.
  for(const x of [-1.53,-.46,.66,1.63])for(const z of [-.16,.16]){
    block(structure,'EP004-plank-mount',[.105,.026,.08],[x,.118,z],carbonEdge);
  }
  // Halo / extra authentic-looking aero geometry. All are original and unbranded.
  const trim=physical('#18262c',.40,.42);
  tube(root,'EP004-halo-centre-bow',
    [[-.74,.78,-.26],[-.59,1.00,-.20],[-.35,1.043,0],[-.59,1.00,.20],[-.74,.78,.26]],.023,carbon);
  link(root,'EP004-halo-stem',[-.35,1.035,0],[.09,.80,0],.031,carbon);
  for(const sign of [-1,1]) {
    block(root,'EP004-front-wing-second-element',[.42,.027,.80],[2.31,.295,sign*.51],aeroPaint);
    block(root,'EP004-rear-wing-upper-element',[.28,.052,.81],[-2.20,1.002,sign*.40],aeroPaint);
    block(root,'EP004-endplate-detail',[.025,.21,.245],[2.31,.35,sign*.95],carbon);
    tube(root,'EP004-flow-vane',[[.38,.32,sign*.40],[.10,.38,sign*.61],[-.40,.43,sign*.73]],.012,carbonEdge);
    for(const axleX of [-EP004.wheelbaseM/2,EP004.wheelbaseM/2]){
      const inner=sign*.31,outer=sign*.73;
      const id: WheelId = axleX>0?(sign>0?'front-left':'front-right'):(sign>0?'rear-left':'rear-right');
      const lA:[number,number,number]=[axleX+.14,.305,inner],lB:[number,number,number]=[axleX,.365,outer];
      const uA:[number,number,number]=[axleX-.16,.52,inner],uB:[number,number,number]=[axleX,.37,outer];
      for (const [name,a,b,r,mat] of [
        ['EP004-suspension-lower',lA,lB,.018,trim],
        ['EP004-suspension-upper',uA,uB,.013,carbonEdge],
      ] as const) {
        const linkMesh=link(root,name,a,b,r,mat);
        linkMesh.userData={ep004Suspension:true,attachmentId:id,inner:[...a],outer:[...b],
          originalLengthM:new T.Vector3(...a).distanceTo(new T.Vector3(...b))};
      }
    }
  }
  // Give the kit's body a local, independently adjustable fade for reveal shots.
  root.traverse(o=>{
    if(!(o instanceof T.Mesh))return;
    if(o.name==='single-seater-body'||o.name==='sidepod'||o.name==='engine-cover'){
      const copy=(o.material as T.MeshStandardMaterial).clone();
      copy.transparent=true;copy.depthWrite=true;o.material=copy;
      o.userData.ep004GhostShell=true;
    }
  });
  // Runtime QA is exercised by BOTH native Remotion previews. It compares the
  // actual mesh bounds, not just independently duplicated descriptor constants.
  assertHeroSkidGeometry(root);
  root.userData={...root.userData,ep004:true,skidDescriptors:getSkidDescriptors()};
  return root;
}

/** Fail fast if contact coordinates diverge from actual *metal* mesh bottoms.
 * Agent 2 samples these points for real skid/asphalt contact; the entire
 * factory stays in metric vehicle-local space and has no hidden offsets.
 */
export function assertHeroSkidGeometry(root:T.Group):void {
  for (const descriptor of getSkidDescriptors()) {
    const named=root.getObjectByName(`EP004-skid-${descriptor.id}`);
    if (!(named instanceof T.Mesh) || named.userData.metalSkid!==true) {
      throw new Error(`Missing physical metallic skid geometry: ${descriptor.id}`);
    }
    const bounds=named.geometry.boundingBox ?? (named.geometry.computeBoundingBox(),named.geometry.boundingBox);
    if(!bounds)throw new Error(`Missing geometric bounds: ${descriptor.id}`);
    const expected=descriptor.localBottomPoint;
    const actual:[number,number,number]=[
      named.position.x+(bounds.min.x+bounds.max.x)*.5,
      named.position.y+bounds.min.y,
      named.position.z+(bounds.min.z+bounds.max.z)*.5,
    ];
    // All skid parents are at vehicle-local origin, so this mesh-bounds point
    // becomes the exact contact location before authoritative vehicle motion.
    if (actual.some((v,i)=>Math.abs(v-expected[i])>1e-6)){
      throw new Error(`Metal skid ${descriptor.id} mesh/descriptor mismatch: ${actual.join(',')}`);
    }
    if(Math.abs(actual[1]-EP004.initialSkidBottomClearanceM)>1e-6) {
      throw new Error(`Metal skid ${descriptor.id} fails baseline clearance`);
    }
  }
}

/** Absolute-frame setting; no frame integration and no second route solver. */
export function applyF1HeroMotion(root:T.Group,motion:VehicleMotionState,reveal01=0):void {
  if(!Number.isFinite(motion.tSec))throw new Error('Finite motion.tSec required');
  // Respect Agent 2's authoritative rolled wheel phase; factory wheel radius is .36m.
  animateVehicle(root,-motion.wheelRotationRad*EP004.wheelRadiusM,0);
  const [x,y,z]=motion.worldPosition;
  root.position.set(x,y,z);
  root.rotation.order='YXZ';
  // +Y yaw, +Z pitch (nose-up), +X roll (vehicle-longitudinal).
  root.rotation.set(motion.rollRad,motion.yawRad,motion.pitchRad);
  root.traverse(o=>{
    if(o.userData.ep004Suspension && o instanceof T.Mesh){
      const id=o.userData.attachmentId as WheelId;
      const a=new T.Vector3(...(o.userData.inner as [number,number,number]));
      const b=new T.Vector3(...(o.userData.outer as [number,number,number]));
      b.y+=Math.max(0,motion.wheelCompressionM[id]??0);
      const delta=b.clone().sub(a),distance=delta.length();
      o.position.copy(a.add(b).multiplyScalar(.5));
      o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());
      o.scale.y=distance/(o.userData.originalLengthM as number);
    }
    if(o.userData.steering && o.name.startsWith('steer-')){
      const key=`${Math.round(o.position.x*100)/100},${Math.round(o.position.z*100)/100}`;
      const id=WHEEL_IDS[key];
      if(id)o.position.y=EP004.wheelRadiusM+Math.max(0,motion.wheelCompressionM[id]??0);
    }
    if(o.userData.ep004GhostShell && o instanceof T.Mesh){
      const m=o.material as T.MeshStandardMaterial;
      m.opacity=1-.83*clamp01(reveal01);
      m.depthWrite=reveal01<.2;
      m.needsUpdate=true;
    }
  });
}

export const F1HeroVehicle:React.FC<F1HeroVehicleProps>=({motion,reveal01=0})=>{
 const model=useMemo(()=>buildF1HeroVehicle(),[]);
 useEffect(()=>()=>disposeObject(model),[model]);
 applyF1HeroMotion(model,motion,reveal01);
 return <primitive object={model}/>;
};

/** Technical in-motion car cutaway. Physical skid points remain fixed and exact;
 * only body materials are ghosted. NO sparks should be emitted by this component.
 */
export const UnderfloorReveal:React.FC<F1HeroVehicleProps>=({motion,reveal01=1})=>
 <F1HeroVehicle motion={motion} reveal01={reveal01}/>;
