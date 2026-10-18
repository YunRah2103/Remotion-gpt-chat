import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import type {BrakeAssemblyPose, WheelKey} from '../contracts.ts';
import {
  clamp01, padCenterZ, MAX_CUTAWAY_EXPLOSION_M,
  ROTOR_FACE_HALF_SPACING_M, PAD_HALF_THICKNESS_M,
} from './mechanics.ts';

export type BrakeAssemblyOptions = {
  wheelRadiusM: number;
  wheel: WheelKey;
  accent?: string;
  /** Rotor is mounted behind the original outer rim, in the steering-pivot frame. */
  axialOffsetM?: number;
};

export type BrakeRig = {
  root: THREE.Group;
  rotor: THREE.Group;
  insidePad: THREE.Group;
  outsidePad: THREE.Group;
  insideCaliper: THREE.Group;
  outsideCaliper: THREE.Group;
  bridge: THREE.Group;
  heat: THREE.Mesh;
  pressureChannel: THREE.Mesh;
  pistons: Array<{mesh: THREE.Mesh; side: -1 | 1; restZ: number}>;
};

function material(color: string, metalness: number, roughness: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({color, metalness, roughness, side: THREE.DoubleSide});
}

function addMesh(
  parent: THREE.Object3D, name: string, geometry: THREE.BufferGeometry,
  mat: THREE.Material, position: [number, number, number] = [0, 0, 0],
  rotation: [number, number, number] = [0, 0, 0],
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function bar(
  parent: THREE.Object3D, name: string, xyz: [number,number,number],
  length: [number,number,number], mat: THREE.Material, rotationZ = 0,
) {
  return addMesh(parent, name, new THREE.BoxGeometry(...length), mat, xyz, [0,0,rotationZ]);
}

function sculptedCaliperCheek(radius: number): THREE.ExtrudeGeometry {
  // Compact, bevelled forged body follows a short arc of the brake disc.
  const r=radius,shape=new THREE.Shape();
  shape.moveTo(-r*.30,-r*.19);
  shape.quadraticCurveTo(-r*.40,-r*.06,-r*.31,r*.11);
  shape.lineTo(-r*.19,r*.26);
  shape.quadraticCurveTo(0,r*.36,r*.18,r*.27);
  shape.quadraticCurveTo(r*.36,r*.22,r*.37,r*.04);
  shape.lineTo(r*.32,-r*.19);
  shape.quadraticCurveTo(r*.23,-r*.31,0,-r*.29);
  shape.quadraticCurveTo(-r*.22,-r*.30,-r*.30,-r*.19);
  const geometry=new THREE.ExtrudeGeometry(shape,{
    depth:.016,bevelEnabled:true,bevelThickness:.004,
    bevelSize:.004,bevelSegments:3,curveSegments:12,steps:1,
  });
  geometry.translate(0,0,-.008);
  return geometry;
}

function rotorAnnulus(radius: number): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.absarc(0,0,radius,0,Math.PI*2,false);
  const bore = new THREE.Path();
  bore.absarc(0,0,radius*.36,0,Math.PI*2,true);
  shape.holes.push(bore);
  // Actual drilled holes in both faces, not dark paint pretending to be through-holes.
  for (const ring of [0,1]) {
    const count = ring ? 18 : 14;
    const rr = radius*(ring ? .80 : .62);
    for (let i=0;i<count;i++) {
      const angle = (i+(ring?.22:0))*Math.PI*2/count;
      const hole = new THREE.Path();
      hole.absarc(Math.cos(angle)*rr,Math.sin(angle)*rr,
        radius*(ring?.028:.024),0,Math.PI*2,true);
      shape.holes.push(hole);
    }
  }
  return new THREE.ExtrudeGeometry(shape,{
    depth:.0036,steps:1,bevelEnabled:false,curveSegments:14,
  });
}

/** Original physical mechanism for the YUNEX road-car kit; all distances are metres. */
export function createBrakeAssembly(options: BrakeAssemblyOptions): BrakeRig {
  if (!(options.wheelRadiusM > .1) || !Number.isFinite(options.wheelRadiusM)) {
    throw new Error('Brake wheel radius must be positive and expressed in metres');
  }
  const R = options.wheelRadiusM*.645;
  const root = new THREE.Group();
  root.name = 'yunex-brake-' + options.wheel;
  root.position.z = options.axialOffsetM ?? 0;

  const castIron = material('#77818a',.87,.32);
  const machined = material('#a8b4bc',.88,.25);
  const darkSteel = material('#303c46',.73,.45);
  const hubSteel = material('#54616a',.92,.3);
  const friction = material('#353943',.12,.91);
  const caliperGold = material(options.accent??'#d2a36c',.72,.28);
  const caliperInset = material('#514435',.55,.35);
  const hydraulic = material('#899fab',.8,.26);
  const heatMat = new THREE.MeshBasicMaterial({
    color:'#dc773a',transparent:true,opacity:0,
    depthWrite:false,blending:THREE.AdditiveBlending,
    side:THREE.DoubleSide,
  });

  const rotor = new THREE.Group();
  rotor.name = 'rotating-rotor';
  root.add(rotor);

  // Two drilled iron friction cheeks and open radial ventilation channels.
  const faces = rotorAnnulus(R);
  for(const side of [-1,1]) {
    const plate = addMesh(rotor,'rotor-drilled-face',faces,castIron,
      [0,0,side*ROTOR_FACE_HALF_SPACING_M-.0018]);
    plate.userData.rotorPart = true;
    addMesh(rotor,'rotor-outer-lip',
      new THREE.TorusGeometry(R*.978,.0036,7,96),machined,
      [0,0,side*(ROTOR_FACE_HALF_SPACING_M+.0018)]);
    addMesh(rotor,'rotor-inner-machined-ring',
      new THREE.TorusGeometry(R*.365,.0042,7,80),machined,
      [0,0,side*(ROTOR_FACE_HALF_SPACING_M+.0018)]);
    for (let groove=0;groove<2;groove++){
      addMesh(rotor,'concentric-machining',
        new THREE.TorusGeometry(R*(.73+groove*.17),.00065,3,96),
        darkSteel,[0,0,side*(ROTOR_FACE_HALF_SPACING_M+.002)]);
    }
  }
  for (let i=0;i<28;i++) {
    const a=i*Math.PI*2/28;
    bar(rotor,'curved-ventilation-vane',
      [Math.cos(a)*R*.78,Math.sin(a)*R*.78,0],
      [R*.34,R*.044,.018],hubSteel,a+.21);
  }
  // Hat, wheel bearing and hub studs rotate as one assembly.
  addMesh(rotor,'bearing-hub',new THREE.CylinderGeometry(R*.37,R*.37,.056,64),
    hubSteel,[0,0,0],[Math.PI/2,0,0]);
  addMesh(rotor,'hub-step',new THREE.CylinderGeometry(R*.25,R*.25,.068,56),
    machined,[0,0,0],[Math.PI/2,0,0]);
  addMesh(rotor,'axle-cap',new THREE.CylinderGeometry(R*.13,R*.13,.074,48),
    darkSteel,[0,0,0],[Math.PI/2,0,0]);
  for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5;
    const p:[number,number,number]=[Math.cos(a)*R*.27,Math.sin(a)*R*.27,.04];
    addMesh(rotor,'hub-fastener',new THREE.CylinderGeometry(.008,.008,.008,12),
      machined,p,[Math.PI/2,0,0]);
  }

  // Real opposed pads (stationary), their backing plates and four pistons.
  const pistons: Array<{mesh: THREE.Mesh; side: -1 | 1; restZ: number}> = [];
  const insidePad = new THREE.Group();
  const outsidePad = new THREE.Group();
  const insideCaliper = new THREE.Group();
  const outsideCaliper = new THREE.Group();
  const bridge = new THREE.Group();
  const centers:[number,number]=[R*.78,R*.36];

  for (const [side,pad,cal] of [
    [-1,insidePad,insideCaliper],[1,outsidePad,outsideCaliper],
  ] as const){
    pad.name = side===-1?'inboard-pad':'outboard-pad';
    cal.name = side===-1?'inboard-caliper':'outboard-caliper';
    root.add(pad,cal);
    const px=centers[0],py=centers[1];
    bar(pad,'friction-lining',[px,py,0],
      [R*.42,R*.56,PAD_HALF_THICKNESS_M*2],friction,-.21);
    bar(pad,'steel-backing',[px,py,side*PAD_HALF_THICKNESS_M],
      [R*.45,R*.60,.0038],hubSteel,-.21);
    // Forged caliper cheeks remain knuckle-fixed. Educational split moves
    // the entire cheek to expose pistons; it is NEVER represented as squeeze.
    const calZ=side*(ROTOR_FACE_HALF_SPACING_M+.045);
    cal.position.z=calZ;
    addMesh(cal,'sculpted-forged-caliper-cheek',
      sculptedCaliperCheek(R),caliperGold,[px,py,0],[0,0,-.20]);
    // Machined circular bosses read as actual piston positions.
    for(const y of [-1,1]){
      addMesh(cal,'piston-boss-cover',
        new THREE.CylinderGeometry(R*.12,R*.12,.003,28),
        caliperInset,[px+y*R*.13,py+y*R*.13,side*.017],[Math.PI/2,0,0]);
      addMesh(cal,'piston-boss-shoulder',
        new THREE.TorusGeometry(R*.119,.0025,8,28),
        machined,[px+y*R*.13,py+y*R*.13,side*.020]);
    }
    for(const y of [-1,1]){
      const piston = addMesh(cal,'hydraulic-piston',
        new THREE.CylinderGeometry(R*.122,R*.122,.018,28),
        hydraulic,[px+y*R*.12,py+y*R*.18,-side*.017],[Math.PI/2,0,0]);
      pistons.push({mesh:piston,side,restZ:piston.position.z});
      addMesh(cal,'piston-seal',
        new THREE.TorusGeometry(R*.129,.0025,7,28),
        darkSteel,[px+y*R*.12,py+y*R*.18,-side*.025]);
    }
    addMesh(cal,'bleed-screw',new THREE.CylinderGeometry(.007,.007,.021,10),
      machined,[px-R*.20,py+R*.31,side*.014],[0,0,Math.PI/2]);
  }
  root.add(bridge);
  bar(bridge,'top-bridge',[R*.69,R*.72,0],
    [R*.49,R*.12,.103],caliperGold,.10);
  bar(bridge,'lower-cross-member',[R*.63,-R*.035,0],
    [R*.41,R*.095,.105],caliperGold,-.20);
  for(const z of [-.049,.049]){
    addMesh(bridge,'caliper-through-bolt',
      new THREE.CylinderGeometry(.0075,.0075,.014,12),
      machined,[R*.76,R*.72,z],[Math.PI/2,0,0]);
  }
  // Cast mounting ears, a banjo connection and curved flexible brake hose.
  for (const yy of [.23,.48]){
    const a=yy*R;
    bar(root,'knuckle-mount-ear',[R*.31,a,-.05],
      [R*.16,R*.12,.027],darkSteel,.16);
    addMesh(root,'mount-bolt',new THREE.CylinderGeometry(.010,.010,.011,16),
      machined,[R*.31,a,-.066],[Math.PI/2,0,0]);
  }
  const hosePoints=[
    new THREE.Vector3(-R*.24,R*1.15,-.085),
    new THREE.Vector3(R*.12,R*.97,-.080),
    new THREE.Vector3(R*.35,R*.78,-.064),
    new THREE.Vector3(R*.54,R*.61,-.038),
  ];
  const hoseCurve=new THREE.CatmullRomCurve3(hosePoints);
  addMesh(root,'hydraulic-flex-hose',
    new THREE.TubeGeometry(hoseCurve,42,.006,8,false),
    hydraulic);
  // A subtle amber pressure trace represents hydraulic pressure, not fluid
  // travelling through the system or a literal real-world pressure scale.
  const pressureChannel=addMesh(root,'illustrative-hydraulic-pressure',
    new THREE.TubeGeometry(hoseCurve,42,.0032,8,false),
    new THREE.MeshStandardMaterial({color:'#dbb477',emissive:'#d38a3e',emissiveIntensity:0,roughness:.24}));
  addMesh(root,'banjo-hydraulic-fitting',
    new THREE.CylinderGeometry(.013,.013,.024,18),
    machined,[R*.54,R*.61,-.038],[0,0,Math.PI/2]);

  const heat = addMesh(rotor,'illustrative-radiant-heat',
    new THREE.TorusGeometry(R*.9,.009,8,96),heatMat,
    [0,0,.018]);
  heat.userData.illustrativeOnly=true;
  return {root,rotor,insidePad,outsidePad,insideCaliper,outsideCaliper,bridge,heat,pressureChannel,pistons};
}

export function applyBrakeAssemblyPose(rig: BrakeRig, pose: BrakeAssemblyPose): void {
  if(!Number.isFinite(pose.wheelRotationRad)) throw new Error('Non-finite wheel angle');
  rig.rotor.rotation.z=pose.wheelRotationRad;
  const separation=clamp01(pose.cutaway01)*MAX_CUTAWAY_EXPLOSION_M;
  rig.insidePad.position.z=padCenterZ(pose,-1);
  rig.outsidePad.position.z=padCenterZ(pose,1);
  rig.insideCaliper.position.z=-(ROTOR_FACE_HALF_SPACING_M+.045)-separation;
  rig.outsideCaliper.position.z=(ROTOR_FACE_HALF_SPACING_M+.045)+separation;
  // Two opposed hydraulic pistons on each cheek move by genuine millimetres.
  for(const piston of rig.pistons){
    piston.mesh.position.z=piston.restZ-piston.side*Math.max(0,Math.min(.0012,pose.padTravelM));
  }
  const pressureMat=rig.pressureChannel.material as THREE.MeshStandardMaterial;
  pressureMat.emissiveIntensity=.12+clamp01(pose.pressure01)*.85;
  rig.bridge.visible=separation<.025;
  const glow=rig.heat.material as THREE.MeshBasicMaterial;
  glow.opacity=clamp01(pose.heatIllustration01)*.16;
  glow.color.setRGB(.85,.26,.07);
}

export type BrakeAssemblyProps=BrakeAssemblyOptions & {pose: BrakeAssemblyPose};
/** Can be mounted directly inside an existing wheel steering knuckle. */
export const BrakeAssembly: React.FC<BrakeAssemblyProps> = (options) => {
  const rig=useMemo(()=>createBrakeAssembly(options),[
    options.wheelRadiusM,options.wheel,options.accent,options.axialOffsetM,
  ]);
  useEffect(()=>()=>{rig.root.traverse((obj)=>{
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      const mats=Array.isArray(obj.material)?obj.material:[obj.material];
      mats.forEach(m=>m.dispose());
    }
  });},[rig]);
  applyBrakeAssemblyPose(rig,options.pose);
  return <primitive object={rig.root}/>;
};
