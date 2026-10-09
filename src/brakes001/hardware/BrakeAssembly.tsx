/**
 * CarbonCeramic001 original 390 mm one-corner engineering model.
 * World convention: metres; X = axle, Y = up, Z = outboard camera-facing radial axis.
 * Caliper and upright DO NOT rotate. Only RotorAssembly spins around global X;
 * PadInner and PadOuter slide toward opposite friction faces along X.
 * This is non-manufacturer-specific technical illustration, NOT factory CAD.
 * The model intentionally uses TRUE perforated extruded face geometry and
 * separate curved internal cooling vanes, not glowing decal approximations.
 */
import React, {useMemo} from 'react';
import * as THREE from 'three';

export const BRAKE_DIMENSIONS = {
  rotorOuterDiameterMetres: 0.390,
  frictionOuterRadius: 0.195,
  frictionInnerRadius: 0.113,
  discThicknessMetres: 0.031,
  faceThicknessMetres: 0.005,
  ventCount: 44,
  perforationCountPerFace: 64,
  restPadGapMetres: 0.003,
} as const;

type Props = {
  rotorAngleRad?: number;
  padGapMetres?: number;
  heat01?: number;
  exploded01?: number;
  showUpright?: boolean;
};

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const centreAngle = Math.PI / 4; // radial location in the YZ brake plane

function faceGeometry() {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 0.195, 0, Math.PI * 2, false);
  const hubHole = new THREE.Path();
  hubHole.absarc(0, 0, 0.113, 0, Math.PI * 2, true);
  shape.holes.push(hubHole);
  for (let ring = 0; ring < 2; ring++) {
    const r = ring === 0 ? 0.147 : 0.175;
    for (let k = 0; k < 32; k++) {
      const a = (k + ring * 0.47) * Math.PI * 2 / 32;
      const p = new THREE.Path();
      p.absarc(r * Math.cos(a), r * Math.sin(a),
        ring === 0 ? 0.0027 : 0.0031, 0, Math.PI * 2, true);
      shape.holes.push(p);
    }
  }
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: 0.0048, steps: 1, curveSegments: 7, bevelEnabled: false,
  });
  // XY annulus -> YZ plane; face normal is X; GLB pivots have the same axis.
  g.rotateY(Math.PI / 2);
  g.computeVertexNormals();
  return g;
}

function sectorShape(inner: number, outer: number, a0: number, a1: number) {
  // angle from +Y toward +Z; local extrusion plane XY maps to world YZ
  const s = new THREE.Shape();
  const pts = 18;
  for (let i = 0; i <= pts; i++) {
    const a = a0 + (a1 - a0) * i / pts;
    const r = outer;
    const x = -r * Math.sin(a), y = r * Math.cos(a);
    if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
  }
  for (let i = pts; i >= 0; i--) {
    const a = a0 + (a1 - a0) * i / pts;
    s.lineTo(-inner * Math.sin(a), inner * Math.cos(a));
  }
  s.closePath();
  return s;
}

function extrudedSector(inner: number, outer: number, thickness: number, a0: number, a1: number) {
  const g = new THREE.ExtrudeGeometry(sectorShape(inner,outer,a0,a1), {
    depth: thickness, steps: 1, bevelEnabled: true,
    bevelThickness: 0.0005, bevelSize: 0.00045,
    bevelSegments: 1, curveSegments: 10,
  });
  g.rotateY(Math.PI / 2);
  return g;
}

/** Real curved multi-radius forged caliper cheeks, not rectangular boxes.
 * Returned vertices are in world YZ brake-plane coordinates (axle X).
 * The inner cheek plane at |X|=.0365 clears pads at |X|<=.0312.
 */
function forgedCheekGeometry(side: -1 | 1): THREE.BufferGeometry {
  const angular = 28, radial = 9;
  const verts: number[] = [], triangles: number[] = [];
  const width = radial + 1, layerSize = (angular + 1) * width;
  const at = (layer:number,i:number,j:number) => layer*layerSize+i*width+j;
  for (let layer=0;layer<2;layer++) {
    for (let i=0;i<=angular;i++) {
      const u=i/angular, angle=centreAngle-.295+.59*u;
      for (let j=0;j<=radial;j++) {
        const v=j/radial, scallop=Math.pow(Math.sin(3*Math.PI*u),2);
        const r0=.142+.008*scallop, r1=.217-.012*scallop;
        const r=r0+(r1-r0)*v;
        const lobes=.5+.5*Math.cos(6*Math.PI*u);
        const relief=Math.pow(Math.max(0,Math.sin(Math.PI*v)),.65)*(.5+.5*lobes);
        const x=side*(layer===0 ? .055+.015*relief : .0365);
        verts.push(x,r*Math.cos(angle),r*Math.sin(angle));
      }
    }
  }
  const quad=(a:number,b:number,c:number,d:number,reverse:boolean)=>{
    if(reverse)triangles.push(a,c,b,a,d,c);
    else triangles.push(a,b,c,a,c,d);
  };
  for(let i=0;i<angular;i++)for(let j=0;j<radial;j++) {
    const a=at(0,i,j),b=at(0,i+1,j),c=at(0,i+1,j+1),d=at(0,i,j+1);
    quad(a,b,c,d,side>0);
    quad(at(1,i,j),at(1,i,j+1),at(1,i+1,j+1),at(1,i+1,j),side>0);
  }
  const rim: [number,number][]=[];
  for(let i=0;i<=angular;i++)rim.push([i,0]);
  for(let j=1;j<=radial;j++)rim.push([angular,j]);
  for(let i=angular-1;i>=0;i--)rim.push([i,radial]);
  for(let j=radial-1;j>0;j--)rim.push([0,j]);
  for(let k=0;k<rim.length;k++) {
    const [i,j]=rim[k], [ii,jj]=rim[(k+1)%rim.length];
    quad(at(0,i,j),at(0,ii,jj),at(1,ii,jj),at(1,i,j),side>0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
  g.setIndex(triangles);g.computeVertexNormals();
  return g;
}

function annulusSegmentGeometry(inner: number, outer: number, depth: number, phase: number) {
  const s = new THREE.Shape();
  const points = 5;
  for (let i = 0; i <= points; i++) {
    const r = inner + (outer-inner) * i / points;
    const a = phase + 0.17 * i / points;
    const xx = r*Math.cos(a), yy = r*Math.sin(a);
    if (i===0) s.moveTo(xx,yy); else s.lineTo(xx,yy);
  }
  for (let i = points; i >= 0; i--) {
    const r = inner + (outer-inner) * i / points;
    const a = phase + 0.17 * i / points + 0.054;
    s.lineTo(r*Math.cos(a),r*Math.sin(a));
  }
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s,{depth, bevelEnabled:false,steps:1});
  g.rotateY(Math.PI/2);
  return g;
}

function noiseCarbonTexture() {
  // Stable deterministic dark ceramic composite, never a heated neon disc.
  const n = 128;
  const px = new Uint8Array(n*n*4);
  let state = 0x71c0ffae;
  for (let i=0;i<n*n;i++) {
    state = (Math.imul(state, 1664525)+1013904223)>>>0;
    const grain = (state >>> 26) - 32;
    const luma = 70 + Math.round(grain * 0.33);
    px[i*4] = luma + 5; px[i*4+1] = luma + 7;
    px[i*4+2] = luma + 9; px[i*4+3] = 255;
  }
  const t=new THREE.DataTexture(px,n,n,THREE.RGBAFormat);
  t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3,3); t.magFilter=THREE.LinearFilter;
  t.minFilter=THREE.LinearMipmapLinearFilter; t.generateMipmaps=true;
  t.colorSpace=THREE.SRGBColorSpace;
  t.needsUpdate=true;
  return t;
}

function AxialCylinder({radius,length,position,material,segments=48,name}: {
  radius:number;length:number;position:[number,number,number];
  material:THREE.Material;segments?:number;name?:string;
}) {
  return <mesh name={name} position={position} rotation={[0,0,Math.PI/2]} material={material}>
    <cylinderGeometry args={[radius,radius,length,segments]}/>
  </mesh>;
}

export const BrakeAssembly: React.FC<Props> = ({
  rotorAngleRad=0, padGapMetres=0.003, heat01=0,
  exploded01=0, showUpright=true,
}) => {
  const faces=useMemo(faceGeometry,[]);
  const vanes=useMemo(()=>Array.from({length:44},(_,i)=>
    annulusSegmentGeometry(0.116,0.192,0.021,i*Math.PI*2/44)),[]);
  const padLining=useMemo(()=>extrudedSector(0.126,0.187,0.008,
    centreAngle-0.245,centreAngle+0.245),[]);
  const padBack=useMemo(()=>extrudedSector(0.124,0.190,0.003,
    centreAngle-0.26,centreAngle+0.26),[]);
  const padShim=useMemo(()=>extrudedSector(0.125,0.191,0.0007,
    centreAngle-0.252,centreAngle+0.252),[]);
  const caliperCheeks=useMemo(()=>[
    forgedCheekGeometry(-1),forgedCheekGeometry(1),
  ],[]);
  const caliperBridge=useMemo(()=>extrudedSector(.204,.227,.136,
    centreAngle-.265,centreAngle+.265),[]);
  const caliperEdge=useMemo(()=>extrudedSector(.210,.216,.004,
    centreAngle-.235,centreAngle+.235),[]);
  const caliperRibs=useMemo(()=>[-.185,.185].map((a)=>
    extrudedSector(.143,.202,.008,centreAngle+a-.045,centreAngle+a+.045)),[]);
  const caliperCrown=useMemo(()=>extrudedSector(.226,.230,.084,
    centreAngle-.23,centreAngle+.23),[]);
  const carbonMap=useMemo(noiseCarbonTexture,[]);

  const hot=clamp(heat01), explode=clamp(exploded01), gap=Math.max(0,Math.min(0.012,padGapMetres));
  const rotorMat=useMemo(()=>new THREE.MeshStandardMaterial({
    map:carbonMap, color:'#afb6b9',metalness:0.19,roughness:0.72,
    side:THREE.DoubleSide,
  }),[carbonMap]);
  // Heat is only a subtle material response; the Master may render a labelled
  // scientific FALSE-COLOUR OVERLAY during the thermal segment.
  const faceMat=rotorMat.clone();
  faceMat.color.setRGB(1+hot*.13, 1-hot*.19, 1-hot*.33);
  const vaneMat=useMemo(()=>new THREE.MeshStandardMaterial({
    color:'#41474a',metalness:0.24,roughness:0.75,side:THREE.DoubleSide,
  }),[]);
  const alloy=useMemo(()=>new THREE.MeshStandardMaterial({
    color:'#909eaa',metalness:0.82,roughness:0.26,
  }),[]);
  const caliper=useMemo(()=>new THREE.MeshStandardMaterial({
    color:'#364d5b',metalness:0.68,roughness:0.25,
  }),[]);
  const caliperTrim=useMemo(()=>new THREE.MeshStandardMaterial({
    color:'#b8c5c8',metalness:0.89,roughness:0.25,
  }),[]);
  const pad=useMemo(()=>new THREE.MeshStandardMaterial({
    color:'#3b3431',metalness:0.03,roughness:0.93,
  }),[]);
  const steel=useMemo(()=>new THREE.MeshStandardMaterial({
    color:'#444b52',metalness:0.81,roughness:0.36,
  }),[]);
  const black=useMemo(()=>new THREE.MeshStandardMaterial({
    color:'#1b242c',metalness:0.32,roughness:0.64,
  }),[]);

  // Stationary 6-piston caliper: sculpted forged cheeks are separate from the rotor.
  // All components under RotorAssembly rotate as a rigid hub/disc.
  return <group name="CarbonCeramicBrake001">
    <group name="RotorAssembly" rotation={[rotorAngleRad,0,0]}>
      <group name="FrictionRing">
        <mesh name="FrictionFaceInner" geometry={faces}
          position={[-0.0155,0,0]} material={faceMat}/>
        <mesh name="FrictionFaceOuter" geometry={faces}
          position={[0.0107,0,0]} material={faceMat}/>
        <group name="CurvedInternalCoolingVanes" position={[-0.0104,0,0]}>
          {vanes.map((g,i)=><mesh key={i} name={`VentVane_${String(i+1).padStart(2,'0')}`}
            geometry={g} material={vaneMat}/>)}
        </group>
        <AxialCylinder name="RotorOuterRimShadow" radius={0.1125} length={0.029}
          position={[0,0,0]} material={black}/>
      </group>
      <group name="RotorHat" position={[0.010+explode*0.045,0,0]}>
        <AxialCylinder name="ForgedHatShell" radius={0.109} length={0.0105}
          position={[0,0,0]} material={alloy}/>
        <AxialCylinder name="HatRaisedRegister" radius={0.073} length={0.023}
          position={[0.010,0,0]} material={steel}/>
        {Array.from({length:12},(_,i)=>{
          const a=i*Math.PI*2/12;
          return <group key={i} position={[0.006,0.099*Math.sin(a),0.099*Math.cos(a)]}>
            <AxialCylinder radius={0.0042} length={0.004}
              position={[0,0,0]} material={caliperTrim} segments={12}/>
            <AxialCylinder radius={0.0023} length={0.005}
              position={[0.003,0,0]} material={steel} segments={12}/>
          </group>;
        })}
      </group>
      <group name="Hub" position={[0.026+explode*0.083,0,0]}>
        <AxialCylinder radius={0.056} length={0.034}
          position={[0,0,0]} material={steel}/>
        <AxialCylinder radius={0.045} length={0.0045}
          position={[0.02,0,0]} material={alloy}/>
        {Array.from({length:5},(_,i)=>{
          const a=i*Math.PI*2/5;
          return <AxialCylinder key={i} radius={0.0057} length={0.016}
            position={[0.024,0.033*Math.cos(a),0.033*Math.sin(a)]}
            material={black} segments={10}/>;
        })}
      </group>
    </group>
    <group name="CaliperBody">
      {([-1,1] as const).map((side,i)=>
        <group key={side} position={[side*explode*.062,0,0]}>
          <mesh name={side<0?'ForgedCaliperCheek_Inboard':'ForgedCaliperCheek_Outboard'}
            geometry={caliperCheeks[i]} material={caliper}/>
          <mesh name={side<0?'InboardSatinContour':'OutboardSatinContour'}
            geometry={caliperEdge}
            position={[side<0?-.063:.059,0,0]}
            material={caliperTrim}/>
          {caliperRibs.map((rib,k)=>
            <mesh key={k} name={`CaliperReinforcement_${side}_${k}`}
              geometry={rib}
              position={[side<0?-.068:.060,0,0]} material={caliper}/>)}
          {[-.17,0,.17].map((delta,piston)=>{
            const a=centreAngle+delta, r=.164;
            return <group key={piston}
              name={`PistonBore_${side}_${piston}`}
              position={[side*.033,r*Math.cos(a),r*Math.sin(a)]}>
              <AxialCylinder radius={.015} length={.005}
                position={[0,0,0]} material={steel} segments={40}/>
              <AxialCylinder radius={.012} length={.005}
                position={[-side*.003,0,0]} material={caliperTrim} segments={40}/>
              <AxialCylinder radius={.013} length={.001}
                position={[-side*.006,0,0]} material={black} segments={40}/>
            </group>;
          })}
          <mesh name={`CaliperFixingTab_${side}`}
            position={[side*.066,.094,.106]} material={steel}>
            <boxGeometry args={[.014,.034,.026]}/>
          </mesh>
        </group>)}
      <mesh name="CurvedCaliperBridge" geometry={caliperBridge}
        position={[-.068,0,0]} material={caliper}/>
      <mesh name="BridgeMachinedCrown"
        geometry={caliperCrown}
        position={[-.042,0,0]} material={caliperTrim}/>
      {[-.22,.22].map((delta,i)=>{
        const a=centreAngle+delta;
        return <AxialCylinder key={i} name={`BridgePin_${i}`}
          radius={.005} length={.136}
          position={[0,.205*Math.cos(a),.205*Math.sin(a)]}
          material={caliperTrim} segments={18}/>;
      })}
      <mesh name="BleederNipple" position={[.063,.164,.139]} material={caliperTrim}>
        <cylinderGeometry args={[.004,.0055,.023,16]}/>
      </mesh>
      <mesh name="MountingBracket" position={[-.073,.108,.093]} material={steel}>
        <boxGeometry args={[.020,.058,.029]}/>
      </mesh>
    </group>
    <group name="PadInner" position={[-0.0155-gap-explode*.038,0,0]}>
      <mesh name="InnerFrictionLining" geometry={padLining}
        position={[-.008,0,0]} material={pad}/>
      <mesh name="InnerBackingPlate" geometry={padBack}
        position={[-.011,0,0]} material={steel}/>
      <mesh name="InnerAntiSquealShim" geometry={padShim}
        position={[-.0117,0,0]} material={caliperTrim}/>
      {[-.225,.225].map((offset,k)=>{
        const a=centreAngle+offset;
        return <mesh key={k} name={`InnerPadRetentionEar_${k}`}
          position={[-.018,.177*Math.cos(a),.177*Math.sin(a)]}
          material={steel}><boxGeometry args={[.005,.011,.012]}/></mesh>;
      })}
    </group>
    <group name="PadOuter" position={[0.0155+gap+explode*.038,0,0]}>
      <mesh name="OuterFrictionLining" geometry={padLining}
        position={[0,0,0]} material={pad}/>
      <mesh name="OuterBackingPlate" geometry={padBack}
        position={[.008,0,0]} material={steel}/>
      <mesh name="OuterAntiSquealShim" geometry={padShim}
        position={[.0112,0,0]} material={caliperTrim}/>
      {[-.225,.225].map((offset,k)=>{
        const a=centreAngle+offset;
        return <mesh key={k} name={`OuterPadRetentionEar_${k}`}
          position={[.018,.177*Math.cos(a),.177*Math.sin(a)]}
          material={steel}><boxGeometry args={[.005,.011,.012]}/></mesh>;
      })}
    </group>
    {showUpright && <group name="UprightSupport" position={[-0.09,0,0]}>
      <AxialCylinder radius={0.068} length={0.018} position={[0,0,0]}
        material={black}/>
      <mesh name="ForgedUprightRib" position={[0,0.035,0.062]}
        rotation={[0.25,-0.4,0.12]} material={steel}>
        <boxGeometry args={[0.028,0.116,0.022]}/>
      </mesh>
      <mesh name="HubCarrierLug" position={[0,0.098,0.056]}
        material={alloy}><boxGeometry args={[0.034,0.026,0.030]}/></mesh>
    </group>}
  </group>;
};

export default BrakeAssembly;
