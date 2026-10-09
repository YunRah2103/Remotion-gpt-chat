/**
 * Agent G: physically volumetric 20in split-five-spoke wheel + 255/35R20-style tyre.
 * World: X axle (outboard +X), Y up, Z lateral; dimensions in metres.
 * This wheel is original illustrative geometry, not a manufacturer CAD asset.
 * The ONLY animated transform is its parent X-axis rotation and its axial
 * displacement in the opening's expressly illustrative exploded-view.
 */
import React, {useMemo} from 'react';
import * as THREE from 'three';

export const WHEEL_SPECS = Object.freeze({
  rimBeadDiameterM: 0.508, tyreWidthM: 0.255, aspectRatio: 0.35,
  tyreOutsideDiameterM: 0.508 + 2 * 0.255 * 0.35,
  rotorDiameterM: 0.390, caliperMaxRadiusM: 0.231,
  barrelInnerRadiusM: 0.245, spokeRearX: 0.100,
  caliperMaxX: 0.075, barrelFrontX: 0.129, barrelRearX: -0.130,
  wheelMassNotModelled: true,
});
const metal = (color: string, roughness: number, metalness=0.84) =>
  new THREE.MeshStandardMaterial({color,metalness,roughness,side:THREE.DoubleSide});
const tireRubber = new THREE.MeshStandardMaterial({
  color:'#27292b',roughness:.88,metalness:0.015,side:THREE.DoubleSide,
});
const darkRecess = metal('#14181b',.57,.31);
const forged = metal('#89939a',.29);
const chamfer = metal('#c0c6c7',.26);
const inset = metal('#3b454b',.42);
const bolts = metal('#aeb7bd',.23);

/** A closed profiled tyre surface, with true circumferential rain grooves.
 * THREE.LatheGeometry's axis is Y; -90° Z rotation maps that to the car's +X.
 * The deliberately varying section has a real curved shoulder and sidewall.
 */
function tireGeometry():THREE.BufferGeometry {
  const p:THREE.Vector2[]=[];
  const sec:[number,number][]=[
    [-.132,.254],[-.134,.270],[-.131,.282],[-.126,.295],
    [-.117,.313],[-.105,.330],[-.095,.339],[-.086,.342],
    [-.071,.343],[-.065,.340],[-.057,.340],[-.052,.343],
    [-.028,.343],[-.022,.338],[-.013,.338],[-.008,.343],
    [.018,.343],[.025,.338],[.034,.338],[.040,.343],
    [.059,.343],[.067,.339],[.076,.339],[.085,.343],
    [.096,.341],[.106,.332],[.118,.315],[.127,.292],
    [.134,.273],[.131,.256],[.119,.253],
    // Bead and inner carcass: this is hollow, NOT a solid balloon.
    [.107,.251],[-.107,.251],[-.132,.254],
  ];
  for(const [x,r] of sec)p.push(new THREE.Vector2(r,x));
  const g=new THREE.LatheGeometry(p,144);
  g.rotateZ(-Math.PI/2);
  g.computeVertexNormals();
  return g;
}
function axialCylinder(radius:number,depth:number,segments=80,open=false){
  const g=new THREE.CylinderGeometry(radius,radius,depth,segments,1,open);
  g.rotateZ(-Math.PI/2); // initial Y axis becomes +X
  return g;
}
function torus(r:number,tube:number):THREE.BufferGeometry{
  const g=new THREE.TorusGeometry(r,tube,10,120);
  g.rotateY(Math.PI/2); // XY plane -> YZ; normal becomes X
  return g;
}
function sculptedSpokeGeometry(angle:number,branch:-1|1):THREE.ExtrudeGeometry{
  // Native 3D bevelled forged spoke, tapered at the hub with broad load path.
  // XY shape coordinates are converted into the actual wheel plane YZ.
  const a=angle+branch*.105;
  const along=(r:number,theta:number):[number,number]=>[
    -r*Math.sin(theta),r*Math.cos(theta),
  ];
  const s=new THREE.Shape();
  const polygon=[
    along(.052,a-.045),along(.092,a-.066),
    along(.204,a+branch*.020-.052),along(.247,a+branch*.029-.032),
    along(.247,a+branch*.029+.032),along(.202,a+branch*.020+.052),
    along(.092,a+.066),along(.052,a+.045),
  ];
  polygon.forEach(([x,y],i)=>i===0?s.moveTo(x,y):s.lineTo(x,y));
  s.closePath();
  const g=new THREE.ExtrudeGeometry(s,{
    depth:.016,steps:1,bevelEnabled:true,bevelSize:.0024,
    bevelThickness:.0028,bevelSegments:2,curveSegments:4,
  });
  g.rotateY(Math.PI/2);
  return g;
}

/** Tiny cast shoulder blocks as true instanced geometry, not a tread decal. */
function TreadBlocks(){
  const instance=useMemo(()=>{
    const geom=new THREE.BoxGeometry(.017,.0075,.034);
    const count=60*2;
    const mesh=new THREE.InstancedMesh(geom,
      new THREE.MeshStandardMaterial({color:'#343537',roughness:.94}),count);
    const transform=new THREE.Object3D();
    for(let side=0;side<2;side++)for(let i=0;i<60;i++){
      const phi=i*Math.PI*2/60+(side===0?.035:0);
      const r=.3413;
      const axial=side===0?-.104:.104;
      transform.position.set(axial,r*Math.cos(phi),r*Math.sin(phi));
      // Box local Y is radial, local Z follows the tangent direction.
      transform.rotation.set(phi,0,side===0?-.09:.09);
      transform.updateMatrix();
      mesh.setMatrixAt(side*60+i,transform.matrix);
    }
    mesh.instanceMatrix.needsUpdate=true;
    return mesh;
  },[]);
  return <primitive object={instance} name="SculptedShoulderBlocks"/>;
}

export const Tire:React.FC=()=>{
  const geometry=useMemo(tireGeometry,[]);
  const bead=useMemo(()=>torus(.255,.0036),[]);
  const mould=useMemo(()=>torus(.300,.0009),[]);
  return <group name="Tire">
    <mesh name="255_35_R20_Style_TreadAndSidewalls" geometry={geometry} material={tireRubber}/>
    <mesh name="OuterBead" geometry={bead} position={[.129,0,0]} material={darkRecess}/>
    <mesh name="InnerBead" geometry={bead} position={[-.129,0,0]} material={darkRecess}/>
    <mesh name="OuterSidewallMoulding" geometry={mould} position={[.121,0,0]} material={inset}/>
    <mesh name="InnerSidewallMoulding" geometry={mould} position={[-.121,0,0]} material={inset}/>
    <TreadBlocks/>
  </group>;
};

const RimBarrel:React.FC=()=>{
  const outer=useMemo(()=>axialCylinder(.253,.259,120,true),[]);
  const inner=useMemo(()=>axialCylinder(.245,.259,120,true),[]);
  const lip=useMemo(()=>torus(.251,.008),[]);
  const edge=useMemo(()=>torus(.241,.0021),[]);
  return <group name="RimBarrel">
    <mesh name="ForgedBarrelOuterSurface" geometry={outer} material={forged}/>
    <mesh name="ForgedBarrelInnerSurface" geometry={inner} material={inset}/>
    <mesh name="OutboardRimLip" geometry={lip} position={[.129,0,0]} material={chamfer}/>
    <mesh name="InboardRimLip" geometry={lip} position={[-.129,0,0]} material={forged}/>
    <mesh name="MachinedInnerLip" geometry={edge} position={[.140,0,0]} material={chamfer}/>
    <mesh name="InnerBeadSeat" geometry={edge} position={[-.134,0,0]} material={inset}/>
  </group>;
};

export const AlloyRim:React.FC=()=>{
  const branches=useMemo(()=>Array.from({length:5},(_,i)=>
    ([-1,1] as const).map(side=>sculptedSpokeGeometry(i*2*Math.PI/5,side))).flat(),[]);
  const sideHighlight=useMemo(()=>torus(.231,.0017),[]);
  return <group name="AlloyRim">
    <RimBarrel/>
    <mesh name="DeepInnerForgeDetail" geometry={sideHighlight}
      position={[.091,0,0]} material={darkRecess}/>
    {branches.map((geometry,i)=><mesh key={i}
      name={'ForgedSplitSpoke_'+String(i+1).padStart(2,'0')}
      geometry={geometry} position={[.106,0,0]} material={forged}/>)}
    <mesh name="MachinedOuterSpokeRing" geometry={sideHighlight}
      position={[.125,0,0]} material={chamfer}/>
  </group>;
};

export const CentreHub:React.FC=()=>{
  const core=useMemo(()=>axialCylinder(.067,.041,80),[]);
  const cap=useMemo(()=>axialCylinder(.043,.007,64),[]);
  const accent=useMemo(()=>torus(.045,.003),[]);
  return <group name="CentreHub">
    <mesh name="StructuralSpokeBoss" geometry={core} position={[.117,0,0]} material={forged}/>
    <mesh name="PlainUnbrandedCentreCap" geometry={cap} position={[.143,0,0]} material={inset}/>
    <mesh name="CentreMachinedRing" geometry={accent} position={[.147,0,0]} material={chamfer}/>
  </group>;
};

export const LugHardware:React.FC=()=>{
  const socket=useMemo(()=>axialCylinder(.0105,.0028,16),[]);
  const bolt=useMemo(()=>axialCylinder(.0075,.0036,12),[]);
  const valve=useMemo(()=>axialCylinder(.004,.023,12),[]);
  return <group name="LugHardware">
    {Array.from({length:5},(_,i)=>{
      const a=(i+.5)*Math.PI*2/5;
      const y=.057*Math.cos(a),z=.057*Math.sin(a);
      return <group key={i} name={'FiveBolt_'+(i+1)}>
        <mesh geometry={socket} position={[.143,y,z]} material={darkRecess}/>
        <mesh geometry={bolt} position={[.146,y,z]} material={bolts}/>
      </group>;
    })}
    <mesh name="MetalValveStem" geometry={valve}
      position={[.131,.222,-.117]} material={bolts}/>
  </group>;
};

export type WheelProps={
  angleRad:number;
  /** ONLY an instructional exploded view; never normal operating wheel motion. */
  axialCutawayMetres?:number;
  opacity?:number;
};
export const WheelAssembly:React.FC<WheelProps>=({
  angleRad, axialCutawayMetres=0,opacity=1,
})=>{
  // Visibility cut only after the wheel has exited the camera frame. Do not
  // fake a semi-transparent wheel on top of the real disc.
  if(opacity<=0)return null;
  return <group name="WheelAssembly"
    position={[axialCutawayMetres,0,0]} rotation={[angleRad,0,0]}>
    <Tire/>
    <AlloyRim/>
    <CentreHub/>
    <LugHardware/>
  </group>;
};
export default WheelAssembly;
