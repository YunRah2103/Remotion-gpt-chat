/**
 * EP006 Agent 1 — rally vehicle.
 * A deterministic adapter around the existing V4 studio rally-hatch.
 * Coordinates: metres, +X forward, +Y up, +Z left.
 * Owns no trajectory/terrain solver and requires no Agent 2 dependency.
 */
import * as THREE from 'three';
import {createCinematicVehicle} from '../../modelling-kit/rig.ts';
import {vehicleSpec} from '../../world-kit/catalog.ts';

export const EP006_RALLY_SUSPENSION = Object.freeze({
  wheelbaseM: 2.62,
  wheelRadiusM: 0.36,
  /** Positive values bring the hub nearer the chassis. */
  maximumCompressionM: 0.092,
  /** Negative values extend the wheel below ride position. */
  maximumDroopM: 0.155,
  /** Approximate additional contact-patch flattening, not sprung travel. */
  maximumTyreDeflectionM: 0.022,
  nominalHubHeightM: 0.36,
});

export type Ep006Corner = 'front-left'|'front-right'|'rear-left'|'rear-right';
export const EP006_CORNERS: readonly Ep006Corner[] =
  ['front-left','front-right','rear-left','rear-right'] as const;
export type Ep006WheelPose = {
  compressionM:number;
  steerRad:number;
  spinRad:number;
  contact:boolean;
  surfaceHeightM:number;
};
export type Ep006MotionPose = {
  frame:number;
  timeSeconds:number;
  phase:'approach'|'takeoff'|'airborne'|'touchdown'|'rebound'|'driving';
  jumpId:'J1'|'J2'|null;
  positionM:[number,number,number];
  rotationRad:[number,number,number];
  velocityMps:[number,number,number];
  wheels:Record<Ep006Corner,Ep006WheelPose>;
  impact01:number;
  dust01:number;
  gravel01:number;
  event?:string|null;
};

type Rod = THREE.Mesh<THREE.CylinderGeometry,THREE.MeshStandardMaterial>;
type CornerRig = {
  mount:THREE.Group;
  roll:THREE.Object3D;
  tyre:THREE.Mesh<THREE.BufferGeometry>;
  tyreRest:Float32Array;
  rest:THREE.Vector3;
  inner:THREE.Vector3[];
  upper:THREE.Vector3;
  arms:{object:Rod;from:THREE.Vector3;outerOffset:THREE.Vector3}[];
  damperBody:Rod;
  damperPiston:Rod;
  spring:THREE.Mesh;
  topJoint:THREE.Mesh;
  bottomJoint:THREE.Mesh;
  bumpStop:THREE.Mesh;
  cvShaft:Rod;
  boot:THREE.Mesh;
};
export type Ep006SuspensionHardpoint = {
  corner:Ep006Corner;
  hubRestM:[number,number,number];
  strutTopM:[number,number,number];
  strutBottomAtRestM:[number,number,number];
  innerArmM:[number,number,number][];
  compressionRangeM:[number,number];
};
type VehicleRig = {corners:Record<Ep006Corner,CornerRig>;hardpoints:Ep006SuspensionHardpoint[]};
const rigs = new WeakMap<THREE.Group,VehicleRig>();
const up = new THREE.Vector3(0,1,0);
const metal = new THREE.MeshStandardMaterial({color:'#aebbc4',metalness:.84,roughness:.28});
const shadow = new THREE.MeshStandardMaterial({color:'#18242b',metalness:.44,roughness:.56});
const steel = new THREE.MeshStandardMaterial({color:'#555f67',metalness:.75,roughness:.37});
const accent = new THREE.MeshStandardMaterial({color:'#e7ac3a',metalness:.54,roughness:.24});
const blue = new THREE.MeshStandardMaterial({color:'#325c7b',metalness:.72,roughness:.27});

function rod(parent:THREE.Object3D,name:string,radius:number,material:THREE.MeshStandardMaterial):Rod {
  const object=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,1,12),material);
  object.name=name;object.castShadow=true;object.receiveShadow=true;
  parent.add(object);return object;
}
function between(object:THREE.Object3D,a:THREE.Vector3,b:THREE.Vector3) {
  const direction=b.clone().sub(a),len=direction.length();
  if(len<1e-5)throw new Error('EP006 suspension endpoints coincide');
  object.position.copy(a).addScaledVector(direction,.5);
  object.quaternion.setFromUnitVectors(up,direction.multiplyScalar(1/len));
  object.scale.set(1,len,1);
}
function sphere(parent:THREE.Object3D,name:string,r:number,material:THREE.Material) {
  const m=new THREE.Mesh(new THREE.SphereGeometry(r,12,8),material);
  m.name=name;m.castShadow=true;parent.add(m);return m;
}
function coil(parent:THREE.Object3D,name:string) {
  const points:THREE.Vector3[]=[];
  for(let i=0;i<=360;i++){
    const u=i/360,a=u*Math.PI*2*12;
    const end=Math.min(1,u*24,(1-u)*24);
    const radius=.051*(.75+.25*Math.max(0,end));
    points.push(new THREE.Vector3(Math.cos(a)*radius,u-.5,Math.sin(a)*radius));
  }
  const path=new THREE.CatmullRomCurve3(points);
  const object=new THREE.Mesh(new THREE.TubeGeometry(path,360,.0075,6,false),accent);
  object.name=name;object.castShadow=true;parent.add(object);return object;
}
function skidStructure(shell:THREE.Group) {
  const chassis=new THREE.Group();chassis.name='ep006-reinforced-underbody';shell.add(chassis);
  // These members remain fixed to the existing V4 body-shell, not the wheel mounts.
  const rails=[-.64,.64];
  for(const z of rails) {
    const rail=rod(chassis,'ep006-rocker-rail',.038,steel);
    between(rail,new THREE.Vector3(-1.58,.20,z),new THREE.Vector3(1.59,.20,z));
  }
  for(const x of [-1.42,-.73,.02,.72,1.42]) {
    const cross=rod(chassis,'ep006-chassis-crossmember',.027,metal);
    between(cross,new THREE.Vector3(x,.22,-.65),new THREE.Vector3(x,.22,.65));
  }
  for(const side of [-1,1])for(const x of [-.78,.61]) {
    const a=rod(chassis,'ep006-tubular-chassis-diagonal',.021,shadow);
    between(a,new THREE.Vector3(x-.32,.22,side*.62),new THREE.Vector3(x+.36,.25,side*.14));
  }
  const guard=new THREE.Mesh(new THREE.BoxGeometry(1.65,.026,1.04),metal);
  guard.name='ep006-central-armour-panel';guard.position.set(.12,.137,0);
  guard.castShadow=true;guard.receiveShadow=true;chassis.add(guard);
  const centre=new THREE.Mesh(new THREE.BoxGeometry(.71,.045,.68),steel);
  centre.name='ep006-rear-differential-protection';centre.position.set(-1.05,.204,0);
  chassis.add(centre);
  for(const x of [-.49,.36,.84])for(const z of [-.44,.44]){
    const bolt=new THREE.Mesh(new THREE.CylinderGeometry(.011,.011,.011,8),shadow);
    bolt.name='ep006-skid-bolt';bolt.position.set(x,.115,z);chassis.add(bolt);
  }
  return chassis;
}
function createCorner(root:THREE.Group,corner:Ep006Corner,mount:THREE.Group):CornerRig {
  const rest=new THREE.Vector3(...mount.userData.restPosition as [number,number,number]);
  const side=rest.z>0?1:-1;
  // Keep V4 wheels, hub, brake, rolling rig, axle, driver and shell. The generic
  // low-travel links are hidden only on this private model instance.
  const old=root.getObjectByName('links-'+mount.name);
  if(old)old.visible=false;
  const assembly=new THREE.Group();assembly.name='ep006-'+corner+'-suspension';root.add(assembly);
  const roll=mount.getObjectByName('wheel-roll');
  const tyre=mount.getObjectByName('tyre') as THREE.Mesh<THREE.BufferGeometry>|undefined;
  if(!roll||!tyre||!tyre.geometry.getAttribute('position'))throw new Error('V4 rally hub/tyre missing at '+corner);
  const tyreRest=Float32Array.from(tyre.geometry.getAttribute('position').array as ArrayLike<number>);
  const top=new THREE.Vector3(rest.x-.095,.79,side*.565);
  const inner=[
    new THREE.Vector3(rest.x-.225,.37,side*.43),
    new THREE.Vector3(rest.x+.205,.37,side*.43),
    new THREE.Vector3(rest.x-.175,.60,side*.51),
    new THREE.Vector3(rest.x+.155,.60,side*.51),
  ];
  const offsets=[
    new THREE.Vector3(-.055,-.105,-side*.062),
    new THREE.Vector3(.055,-.105,-side*.062),
    new THREE.Vector3(-.030,.077,-side*.055),
    new THREE.Vector3(.038,.077,-side*.055),
  ];
  const arms=inner.map((from,i)=>({
    object:rod(assembly,i<2?'ep006-forged-lower-control-arm':'ep006-forged-upper-control-arm',i<2?.026:.019,shadow),
    from,outerOffset:offsets[i],
  }));
  // Connected strut: body and exposed piston overlap; spring endpoints follow
  // the same top and bottom attachment as the shock itself.
  const damperBody=rod(assembly,'ep006-shock-body',.042,blue);
  const damperPiston=rod(assembly,'ep006-chrome-piston',.018,metal);
  const spring=coil(assembly,'ep006-twelve-turn-coil');
  const topJoint=sphere(assembly,'ep006-upper-strut-bearing',.054,steel);
  const bottomJoint=sphere(assembly,'ep006-lower-knuckle-bearing',.048,steel);
  const bumpStop=new THREE.Mesh(new THREE.CylinderGeometry(.050,.062,.078,16),accent);
  bumpStop.name='ep006-progressive-bump-stop';assembly.add(bumpStop);
  const cvShaft=rod(assembly,'ep006-articulating-drive-axle',.024,metal);
  const boot=new THREE.Mesh(new THREE.SphereGeometry(.055,12,8),shadow);
  boot.name='ep006-cv-joint-boot';assembly.add(boot);
  return {mount,roll,tyre,tyreRest,rest,inner,upper:top,arms,damperBody,damperPiston,spring,topJoint,bottomJoint,bumpStop,cvShaft,boot};
}

/** Builds a fresh existing studio V4 rally-hatch with independent EP006 engineering hardware. */
export function createEp006RallyVehicle():THREE.Group {
  const root=createCinematicVehicle({variant:'rally-hatch',bodyDetail:'studio',quality:'hero',driver:true});
  root.name='ep006-v4-rally-hatch';
  const shell=root.getObjectByName('body-shell') as THREE.Group|undefined;
  if(!shell)throw new Error('V4 rally shell missing');
  const spec=vehicleSpec('rally-hatch');
  if(Math.abs(spec.radius-EP006_RALLY_SUSPENSION.wheelRadiusM)>.0001)throw new Error('Rally wheel radius changed in kit');
  skidStructure(shell);
  const corners={} as Record<Ep006Corner,CornerRig>;
  const hardpoints:Ep006SuspensionHardpoint[]=[];
  for(const corner of EP006_CORNERS){
    const mount=root.getObjectByName('mount-'+corner) as THREE.Group|undefined;
    if(!mount||!Array.isArray(mount.userData.restPosition))throw new Error('Missing original V4 mount: '+corner);
    const rig=createCorner(root,corner,mount);corners[corner]=rig;
    hardpoints.push({
      corner,hubRestM:rig.rest.toArray() as [number,number,number],
      strutTopM:rig.upper.toArray() as [number,number,number],
      strutBottomAtRestM:[rig.rest.x,rig.rest.y-.045,rig.rest.z-Math.sign(rig.rest.z)*.082],
      innerArmM:rig.inner.map(p=>p.toArray() as [number,number,number]),
      compressionRangeM:[-EP006_RALLY_SUSPENSION.maximumDroopM,EP006_RALLY_SUSPENSION.maximumCompressionM],
    });
  }
  rigs.set(root,{corners,hardpoints});
  root.userData.ep006Vehicle='V4 studio rally-hatch with original exterior';
  root.userData.ep006Suspension=EP006_RALLY_SUSPENSION;
  return root;
}

/** World-local, unscaled suspension hardpoints for Agent 2's chassis/landing solver. */
export function ep006RallyHardpoints(root:THREE.Group):readonly Ep006SuspensionHardpoint[]{
  const rig=rigs.get(root);
  if(!rig)throw new Error('Use createEp006RallyVehicle first');
  return rig.hardpoints.map(h=>({...h,hubRestM:[...h.hubRestM],strutTopM:[...h.strutTopM],
    strutBottomAtRestM:[...h.strutBottomAtRestM],
    innerArmM:h.innerArmM.map(p=>[...p] as [number,number,number]),
    compressionRangeM:[...h.compressionRangeM]}));
}
function deformContactPatch(rig:CornerRig,wheel:Ep006WheelPose){
  const pos=rig.tyre.geometry.getAttribute('position') as THREE.BufferAttribute;
  const src=rig.tyreRest;
  const deflect=wheel.contact
    ?Math.min(EP006_RALLY_SUSPENSION.maximumTyreDeflectionM,.009+Math.max(0,wheel.compressionM)*.145)
    :0;
  const sine=Math.sin(wheel.spinRad),cosine=Math.cos(wheel.spinRad);
  // Local tyre-vertex deformation tracks WORLD-down even while the wheel rotates.
  // Interior rim/hub meshes stay perfectly round. Airborne tyres fully recover.
  for(let i=0;i<pos.count;i++){
    const j=i*3,x=src[j],y=src[j+1],z=src[j+2];
    const worldDown=x*sine+y*cosine;
    const u=Math.max(0,Math.min(1,(-worldDown-.20)/.155));
    const lateral=Math.max(0,1-Math.pow(Math.abs(z)/.18,4));
    const lift=deflect*u*u*(3-2*u)*lateral;
    pos.setXYZ(i,x+sine*lift,y+cosine*lift,z);
  }
  pos.needsUpdate=true;
  rig.tyre.geometry.computeVertexNormals();
}
/** Absolute frame pose only. Repeated/out-of-order calls produce identical geometry. */
export function applyEp006RallyPose(root:THREE.Group,pose:Ep006MotionPose):void {
  const rig=rigs.get(root);
  if(!rig)throw new Error('Use createEp006RallyVehicle first');
  const finite=(n:number)=>typeof n==='number'&&Number.isFinite(n);
  if(!Number.isInteger(pose.frame)||pose.frame<0||!finite(pose.timeSeconds))throw Error('Invalid EP006 frame/time');
  if(pose.positionM.length!==3||pose.rotationRad.length!==3||pose.velocityMps.length!==3||
    ![...pose.positionM,...pose.rotationRad,...pose.velocityMps,pose.impact01,pose.dust01,pose.gravel01].every(finite))throw Error('Nonfinite EP006 pose');
  root.position.set(...pose.positionM);
  root.rotation.set(...pose.rotationRad,'XYZ');
  for(const corner of EP006_CORNERS){
    const r=rig.corners[corner],w=pose.wheels[corner];
    if(!w||![w.compressionM,w.steerRad,w.spinRad,w.surfaceHeightM].every(finite)||typeof w.contact!=='boolean')
      throw Error('Invalid pose for '+corner);
    if(w.compressionM < -EP006_RALLY_SUSPENSION.maximumDroopM-1e-6 ||
       w.compressionM > EP006_RALLY_SUSPENSION.maximumCompressionM+1e-6)
      throw Error('Travel outside EP006 stop bounds: '+corner);
    if(Math.abs(w.steerRad)>.7)throw Error('Unreasonable steering angle at '+corner);
    // Compression positive moves hub up RELATIVE TO SHELL, droop negative lowers it.
    r.mount.position.copy(r.rest).add(new THREE.Vector3(0,w.compressionM,0));
    r.mount.rotation.y=w.steerRad;
    r.roll.rotation.z=w.spinRad; // Conventional forward travel uses NEGATIVE spinRad.
    r.roll.rotation.x=0;
    const hub=r.mount.position;
    const bottom=hub.clone().add(new THREE.Vector3(0,-.045,-Math.sign(hub.z)*.082));
    for(const a of r.arms)between(a.object,a.from,hub.clone().add(a.outerOffset));
    r.topJoint.position.copy(r.upper);
    r.bottomJoint.position.copy(bottom);
    // Shock casing and piston overlap throughout compression and full droop.
    const along=bottom.clone().sub(r.upper);
    const caseEnd=r.upper.clone().addScaledVector(along,.65);
    const pistonTop=r.upper.clone().addScaledVector(along,.39);
    between(r.damperBody,r.upper,caseEnd);
    between(r.damperPiston,pistonTop,bottom);
    between(r.spring,r.upper.clone().lerp(bottom,.09),r.upper.clone().lerp(bottom,.92));
    r.bumpStop.position.copy(r.upper).addScaledVector(along,.27);
    r.bumpStop.quaternion.setFromUnitVectors(up,along.clone().normalize());
    const shaftStart=new THREE.Vector3(hub.x,hub.y,Math.sign(hub.z)*.24);
    const shaftEnd=hub.clone().add(new THREE.Vector3(0,0,-Math.sign(hub.z)*.135));
    between(r.cvShaft,shaftStart,shaftEnd);
    r.boot.position.copy(shaftEnd);
    deformContactPatch(r,w);
  }
  root.updateMatrixWorld(true);
}
