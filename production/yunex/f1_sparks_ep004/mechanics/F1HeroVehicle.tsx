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
/** Smooth longitudinal loft avoids a blocky nose without changing any kit pivot. */
function aeroLoft(parent:T.Group,name:string,sections:readonly {
 x:number;y:number;halfHeight:number;halfWidth:number
}[],material:T.Material):T.Mesh {
 const verts:number[]=[];const indices:number[]=[];const around=20;
 for(const sec of sections)for(let k=0;k<around;k++){
   const a=k*2*Math.PI/around;
   verts.push(sec.x,sec.y+sec.halfHeight*Math.sin(a),sec.halfWidth*Math.cos(a));
 }
 for(let i=0;i<sections.length-1;i++)for(let k=0;k<around;k++){
   const a=i*around+k,b=i*around+(k+1)%around;
   indices.push(a,a+around,b,b,a+around,b+around);
 }
 for(let side=0;side<2;side++){
   const i=side*(sections.length-1)*around;
   for(let k=1;k<around-1;k++)indices.push(i,i+(side?k+1:k),i+(side?k:k+1));
 }
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(verts,3));
 geometry.setIndex(indices);geometry.computeVertexNormals();
 const m=new T.Mesh(geometry,material);m.name=name;m.castShadow=true;m.receiveShadow=true;
 parent.add(m);return m;
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
    variant:'formula-modern', color:'#0c8091', accent:'#ffb45e',
    wheelColor:'#6e8592', lights:true, interior:false,
  });
  root.name='EP004-F1-HERO';
  const carbon=physical('#111b20',.32,.48);
  const carbonEdge=physical('#25373b',.44,.39);
  const titanium=physical('#b9c6c7',.87,.22);
  const titaniumEdge=physical('#d9bfa4',.77,.32);
  const brass=physical('#b59158',.75,.35);
  const liner=physical('#352f2a',.04,.82);
  const aeroPaint=physical('#047d99',.62,.20,.95);
  const sapphire=physical('#062f43',.58,.24,.95);
  const highlight=physical('#24d5c4',.68,.19,.95);
  const satin=physical('#59666e',.73,.28);
  const tyreTrim=physical('#2f3840',.05,.84);

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
  // V2 aerodynamic refinement: continuous profiled nose, stepped wings,
  // inset sidepod intake channels, rear diffuser and unbranded wheel graphics.
  // All parts are mounted to the same vehicle root and preserve wheel factories.
  aeroLoft(root,'EP004-V2-sculpted-nose',[
    {x:.68,y:.48,halfHeight:.205,halfWidth:.27},
    {x:1.12,y:.455,halfHeight:.16,halfWidth:.245},
    {x:1.70,y:.37,halfHeight:.115,halfWidth:.152},
    {x:2.22,y:.298,halfHeight:.083,halfWidth:.09},
    {x:2.54,y:.272,halfHeight:.044,halfWidth:.058},
  ],aeroPaint);
  // Tapered engine-cowl dorsal ridge and clean paint/carbon separation.
  aeroLoft(root,'EP004-V2-engine-spine',[
    {x:-1.84,y:.67,halfHeight:.05,halfWidth:.095},
    {x:-1.43,y:.78,halfHeight:.16,halfWidth:.145},
    {x:-.96,y:.91,halfHeight:.13,halfWidth:.128},
    {x:-.68,y:.83,halfHeight:.08,halfWidth:.118},
  ],sapphire);
  tube(root,'EP004-V2-engine-spine-accent',
    [[-1.73,.716,0],[-1.34,.939,0],[-1.00,1.040,0],[-.76,.938,0]],.009,highlight);
  for(const sign of [-1,1]){
    // Front wing has stacked carbon main plane, two narrow flaps and endplate.
    block(root,'EP004-V2-front-flap-inner',[.28,.021,.83],[2.34,.356,sign*.46],carbon);
    block(root,'EP004-V2-front-flap-upper',[.24,.018,.73],[2.17,.422,sign*.52],aeroPaint);
    block(root,'EP004-V2-wing-edge',[.055,.013,.77],[2.46,.337,sign*.50],highlight);
    block(root,'EP004-V2-front-endplate',[.43,.24,.022],[2.33,.342,sign*.996],sapphire);
    block(root,'EP004-V2-endplate-tip',[.25,.018,.027],[2.43,.468,sign*.999],highlight);
    // Dark intake funnels read as open channels, not body-colour bricks.
    block(root,'EP004-V2-sidepod-inlet',[.17,.16,.056],[-.07,.505,sign*.728],carbon);
    block(root,'EP004-V2-sidepod-inlet-rim',[.018,.175,.061],[.015,.506,sign*.733],highlight);
    for(let i=0;i<3;i++){
      block(root,'EP004-V2-sidepod-vortex-vane',[.35,.015,.045],
        [-.37-i*.22,.345+i*.015,sign*(.73+i*.014)],sapphire);
    }
    // Floor remains thin, with aerodynamic body-mounted edges away from skids.
    block(root,'EP004-V2-floor-tunnel-fence',[2.58,.044,.018],
      [-.43,.245,sign*.744],carbon);
    block(root,'EP004-V2-floor-edge-highlight',[2.60,.011,.017],
      [-.42,.267,sign*.744],highlight);
    // Rear diffuser strakes grow out of the rear underfloor assembly.
    for(let i=0;i<4;i++){
      block(root,'EP004-V2-diffuser-strake',[.66,.12,.021],
        [-1.80,.20,sign*(.15+i*.145)],carbon);
    }
    // Multi-element rear wing and braced swan-neck mounts.
    block(root,'EP004-V2-rear-upper-flap',[.24,.031,.77],
      [-2.19,1.145,sign*.44],sapphire);
    block(root,'EP004-V2-rear-wing-highlight',[.031,.015,.72],
      [-2.055,1.15,sign*.44],highlight);
    block(root,'EP004-V2-rear-endplate',[.39,.29,.025],
      [-2.20,1.035,sign*.85],carbon);
    link(root,'EP004-V2-wing-support',[-1.69,.59,sign*.20],
      [-2.13,1.055,sign*.23],.020,satin);
    // No team marks or sponsored logos.
    tube(root,'EP004-V2-halo-highlight',
      [[-.69,.82,sign*.20],[-.59,1.03,sign*.18],[-.37,1.07,sign*.015]],
      .009,highlight);
  }
  // Wheel styling follows the REAL wheel-roll node; steering/suspension pivot
  // and wheel phase are still exclusively controlled by the kit.
  root.traverse(o=>{
    if(!(o instanceof T.Group)||o.name!=='wheel-roll')return;
    for(const sign of [-1,1]){
      const z=sign*.32*.50; // factory Formula tyre width is .32m
      const trimRing=new T.Mesh(new T.TorusGeometry(.251,.008,8,64),tyreTrim);
      trimRing.name='EP004-V2-tyre-sidewall-ring';trimRing.position.z=z;
      o.add(trimRing);
      const innerRing=new T.Mesh(new T.TorusGeometry(.215,.005,8,64),highlight);
      innerRing.name='EP004-V2-rim-accent-ring';innerRing.position.z=sign*.169;
      o.add(innerRing);
      const hub=new T.Mesh(new T.CylinderGeometry(.055,.055,.01,32),sapphire);
      hub.name='EP004-V2-wheel-hub-cap';hub.rotation.x=Math.PI/2;
      hub.position.z=sign*.182;o.add(hub);
    }
  });
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
