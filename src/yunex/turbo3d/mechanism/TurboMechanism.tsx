import React, {useMemo} from 'react';
import * as THREE from 'three';
import {TURBO_PALETTE as C, TURBO_PIVOTS, TURBO_PORTS} from './ports';

export type TurboMechanismProps = {
  frame: number;
  rotationPhase?: number;
  cutaway?: number; // 0 enclosed, 1 open cutaway
  exploded?: number; // 0 assembled, 1 illustrated part separation along shaft
  visibility?: number;
  variant?: 'turbo' | 'full';
};

const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const p=(v:readonly number[])=>[v[0],v[1],v[2]] as [number,number,number];
const Mat:React.FC<{color:string;opacity?:number;metalness?:number;roughness?:number}>=
({color,opacity=1,metalness=.74,roughness=.32})=>
  <meshPhysicalMaterial color={color} opacity={opacity} transparent={opacity<1}
    depthWrite={opacity>=1} metalness={metalness} roughness={roughness}
    clearcoat={.55} clearcoatRoughness={.15} side={THREE.DoubleSide}/>;

const CylinderX:React.FC<{a:[number,number,number];b:[number,number,number];r:number;color:string;sides?:number}>=
({a,b,r,color,sides=28})=>{
 const v0=new THREE.Vector3(...a),v1=new THREE.Vector3(...b);
 const d=new THREE.Vector3().subVectors(v1,v0);
 const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());
 return <mesh position={v0.add(v1).multiplyScalar(.5).toArray()} quaternion={q} castShadow>
   <cylinderGeometry args={[r,r,d.length(),sides]}/><Mat color={color}/>
 </mesh>;
};
const CurvePipe:React.FC<{points:readonly (readonly number[])[];r:number;color:string}>=({points,r,color})=>{
 const curve=useMemo(()=>new THREE.CatmullRomCurve3(points.map(q=>new THREE.Vector3(...p(q))),false,'catmullrom',.22),[points]);
 const geo=useMemo(()=>new THREE.TubeGeometry(curve,72,r,12,false),[curve,r]);
 return <mesh castShadow receiveShadow geometry={geo}><Mat color={color}/></mesh>;
};
/** All 11 blades are genuine multi-segment curved 3D surfaces, not texture cards. */
const Blade:React.FC<{angle:number;compressor:boolean}>=({angle,compressor})=>{
 const geo=useMemo(()=>{
  const vertices:number[]=[],indices:number[]=[];
  for(const side of [-1,1])for(let i=0;i<=8;i++){
   const t=i/8,rad=.18+i*.068,theta=angle+(compressor?-1:1)*t*.65+side*.033;
   vertices.push(side*.039+Math.sin(t*Math.PI)*.07,rad*Math.cos(theta),rad*Math.sin(theta));
  }
  for(let i=0;i<8;i++){const a=i,b=i+1,c=i+9,d=i+10;
    indices.push(a,b,c,b,d,c,c,b,a,c,d,b);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  g.setIndex(indices);g.computeVertexNormals();return g;
 },[angle,compressor]);
 return <mesh geometry={geo} castShadow><Mat color={compressor?'#B7F3FA':'#E8B58B'} roughness={.2}/></mesh>;
};
const Rotor:React.FC<{compressor:boolean;phase:number;x:number}>=({compressor,phase,x})=>
  <group name={compressor?'COMPRESSOR_ROTOR':'TURBINE_ROTOR'} position={[x,0,0]} rotation={[phase,0,0]}>
   <CylinderX a={[-.14,0,0]} b={[.14,0,0]} r={.22} color={compressor?'#8CBFCB':'#E4AD80'}/>
   {Array.from({length:11},(_,i)=><Blade key={i} angle={i*2*Math.PI/11} compressor={compressor}/>)}
   <mesh rotation={[0,Math.PI/2,0]}><torusGeometry args={[.71,.037,9,68]}/>
     <Mat color={compressor?'#86CBDD':'#C18B63'}/></mesh>
  </group>;
/** Original tapered scroll casting: its widening channel is volumetric geometry, not a torus ring. */
const SpiralScroll:React.FC<{compressor:boolean}>=({compressor})=>{
 const geo=useMemo(()=>{
  const verts:number[]=[],indices:number[]=[];const N=85,M=12,s=compressor?1:-1;
  for(let i=0;i<=N;i++){
   const t=i/N,a=.50+t*Math.PI*1.90,r=.73+t*.075,thickness=.12+.12*t;
   for(let j=0;j<=M;j++){
    const b=j*2*Math.PI/M;
    verts.push(s*.025+Math.cos(b)*thickness,(r+Math.sin(b)*thickness)*Math.cos(a),(r+Math.sin(b)*thickness)*Math.sin(a));
   }
  }
  for(let i=0;i<N;i++)for(let j=0;j<M;j++){
   const a=i*(M+1)+j,b=a+M+1;indices.push(a,b,a+1,b,b+1,a+1);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
  g.setIndex(indices);g.computeVertexNormals();return g;
 },[compressor]);
 return <mesh geometry={geo} castShadow><Mat color={compressor?'#416F86':'#895440'} roughness={.37}/></mesh>;
};
const Housing:React.FC<{compressor:boolean;x:number;cutaway:number}>=({compressor,x,cutaway})=>{
 const sign=compressor?1:-1,base=compressor?'#547789':'#8A5A47';
 return <group name={compressor?'COMPRESSOR_HOUSING':'TURBINE_HOUSING'} position={[x,0,0]}>
   <SpiralScroll compressor={compressor}/>
   <mesh rotation={[0,Math.PI/2,0]} position={[sign*.13,0,0]}>
     <torusGeometry args={[.74,.061,12,64]}/><Mat color={compressor?'#A8D0D8':'#CDB098'} roughness={.21}/></mesh>
   <mesh rotation={[0,Math.PI/2,0]} position={[-sign*.13,0,0]}>
     <torusGeometry args={[.71,.043,10,64]}/><Mat color="#A0AEB2" roughness={.2}/></mesh>
   <mesh rotation={[0,Math.PI/2,0]} position={[sign*.19,0,0]}>
     <torusGeometry args={[.54,.023,9,56]}/><Mat color={compressor?'#C2E5E9':'#DDB394'} roughness={.18}/></mesh>
   {cutaway<.99?<mesh rotation={[0,0,Math.PI/2]} position={[sign*.31,0,0]}>
     <cylinderGeometry args={[.66,.66,.055,56]}/><Mat color={base} opacity={Math.max(.025,1-cutaway)}/></mesh>:null}
   {Array.from({length:12},(_,i)=>{
     const a=i*Math.PI/6;return <group key={i} rotation={[a,0,0]}>
      <mesh position={[sign*.14,.87,0]} rotation={[0,0,Math.PI/2]}>
        <cylinderGeometry args={[.056,.056,.07,8]}/><Mat color="#C2D1D1" roughness={.25}/></mesh>
      <mesh position={[sign*.19,.87,0]}>
        <boxGeometry args={[.012,.07,.012]}/><Mat color="#384650"/></mesh>
     </group>;
   })}
 </group>;
};
/** Cast four-cylinder block with independent coil packs, valve cover and visible charge plenum. */
const Engine:React.FC=()=> <group name="FOUR_CYLINDER_ENGINE" position={[0,-1.65,-3.15]}>
 <mesh castShadow><boxGeometry args={[2.85,1.25,1.38]}/><Mat color="#364C5B" roughness={.42}/></mesh>
 <mesh castShadow position={[0,-.69,0]}><boxGeometry args={[3.02,.28,1.55]}/><Mat color="#243743"/></mesh>
 {Array.from({length:8},(_,i)=><mesh key={i} position={[0,-.48+i*.12,.705]}>
   <boxGeometry args={[2.7,.033,.068]}/><Mat color={i%2?'#6B8490':'#879AA0'} roughness={.27}/></mesh>)}
 <mesh castShadow position={[0,.75,0]}><boxGeometry args={[3.05,.24,1.48]}/><Mat color="#8A9DA6" roughness={.21}/></mesh>
 <mesh castShadow position={[0,.96,0]}><boxGeometry args={[2.91,.19,1.31]}/><Mat color="#2A4653" roughness={.22}/></mesh>
 <mesh position={[0,1.08,0]}><boxGeometry args={[1.52,.036,.77]}/><Mat color="#B4C6C8" roughness={.15}/></mesh>
 {[-1.05,-.35,.35,1.05].map((x,i)=><group key={i} position={[x,1.09,0]}>
   <mesh castShadow><boxGeometry args={[.31,.14,.36]}/><Mat color="#142632" metalness={.46}/></mesh>
   <mesh position={[0,.081,0]}><boxGeometry args={[.20,.019,.23]}/><Mat color="#D9C8AC"/></mesh>
   <mesh position={[0,-.19,.66]}><boxGeometry args={[.13,.30,.19]}/><Mat color="#637B86"/></mesh>
 </group>)}
 {[-1.23,1.23].map(x=>[-.57,.57].map(z=><mesh key={x+'-'+z} position={[x,.83,z]}>
   <cylinderGeometry args={[.067,.067,.09,8]}/><Mat color="#C5CFCD"/></mesh>))}
 {/* This plenum terminates at the immutable ENGINE_INTAKE port. */}
 <mesh name="CHARGE_PLENUM" position={[.77,.39,0]}><boxGeometry args={[.35,.34,1.10]}/><Mat color="#577B86"/></mesh>
 <mesh position={[-.63,.85,0]}><sphereGeometry args={[.064,12,8]}/><meshBasicMaterial color="#F6BD72"/></mesh>
</group>;
const Intercooler:React.FC=()=> <group name="INTERCOOLER" position={[3.08,-.51,-1.45]}>
 <mesh castShadow><boxGeometry args={[.85,1.45,1.5]}/><Mat color="#253E4C"/></mesh>
 {Array.from({length:19},(_,i)=><mesh key={i} position={[.445,-.65+i*.073,0]}>
  <boxGeometry args={[.038,.034,1.31]}/><Mat color={i%2?'#B0CFD1':'#7799A3'} roughness={.22}/></mesh>)}
 {Array.from({length:11},(_,i)=><mesh key={i} position={[.47,0,-.60+i*.12]}>
   <boxGeometry args={[.031,1.27,.025]}/><Mat color="#577481"/></mesh>)}
 {[-.72,.72].map(z=><mesh key={z} position={[0,0,z]}>
   <boxGeometry args={[.94,1.52,.10]}/><Mat color="#809BA4"/></mesh>)}
 {[-.7,.7].map(y=><mesh key={y} position={[0,y,0]}>
   <boxGeometry args={[.95,.09,1.5]}/><Mat color="#C1D6D7"/></mesh>)}
</group>;
const exhaustManifold:readonly (readonly number[])[]=[
 [-1.1,-1.02,-3.1],[-1.65,-1,-2.8],[-1.9,-.48,-1.8],[-1.48,.23,-.52],TURBO_PORTS.EXHAUST_IN];
const exhaustBranch:readonly (readonly number[])[]=[
 [-.45,-1.15,-3.1],[-.72,-.75,-2.7],[-1.50,-.72,-2.42],[-1.9,-.48,-1.8]];
const exhaustTail:readonly (readonly number[])[]=[
 TURBO_PORTS.EXHAUST_OUT,[-2.65,-.18,-.6],[-3.12,-.52,-1.55],[-3.65,-.56,-2.5]];
const cleanFilter:readonly (readonly number[])[]=[
 [4.1,.24,.35],[3.4,.18,.15],[2.75,.03,.02],TURBO_PORTS.CLEAN_AIR_IN];
const compressedPipe:readonly (readonly number[])[]=[
 TURBO_PORTS.COMPRESSED_AIR_OUT,[1.46,1.16,.49],[2.13,1.31,-.10],[2.82,.76,-.88],TURBO_PORTS.INTERCOOLER_IN];
const cooledPipe:readonly (readonly number[])[]=[
 TURBO_PORTS.INTERCOOLER_OUT,[2.55,-1.42,-2.18],[1.80,-1.20,-2.75],TURBO_PORTS.ENGINE_INTAKE];
/** Exported ports are named coordinate anchors, NOT floating decorative spheres. */
const PortDot:React.FC<{where:readonly number[];name:string}>=({where,name})=>
 <group name={name} position={p(where)}/>;

/** Local shaft +X, negative turbine, positive compressor. Both rotors share EXACT phase. */
export const TurboMechanism:React.FC<TurboMechanismProps>=({
 frame,rotationPhase=0,cutaway=1,exploded=0,visibility=1,variant='full',
})=>{
 const phase=rotationPhase+frame*.165,gap=clamp(exploded)*.48;
 return <group name="YUNEX_TURBO_MECHANISM" visible={visibility>0}>
   <group name="SHAFT" rotation={[phase,0,0]}>
     <CylinderX a={[-1.83,0,0]} b={[1.83,0,0]} r={.11} color="#DBDFDA"/>
     <CylinderX a={[-.35,0,0]} b={[-.28,0,0]} r={.185} color="#C0CDCF"/>
     <CylinderX a={[.28,0,0]} b={[.35,0,0]} r={.185} color="#C0CDCF"/>
   </group>
   <group name="BEARING_CENTER_HOUSING">
     <CylinderX a={[-.39,0,0]} b={[.39,0,0]} r={.36} color="#344854"/>
     {Array.from({length:9},(_,i)=><CylinderX key={i} a={[-.30+i*.075,0,0]} b={[-.282+i*.075,0,0]} r={.415} color={i%2?'#87989D':'#647A87'}/>)}
     <CylinderX a={[-.53,0,0]} b={[-.42,0,0]} r={.29} color="#738793"/>
     <CylinderX a={[.42,0,0]} b={[.53,0,0]} r={.29} color="#738793"/>
   </group>
   <group name="TURBINE_CIRCUIT">
     <Housing compressor={false} x={TURBO_PIVOTS.TURBINE_ROTOR[0]-gap} cutaway={clamp(cutaway)}/>
     <Rotor compressor={false} x={TURBO_PIVOTS.TURBINE_ROTOR[0]-gap} phase={phase}/>
     <CylinderX a={[-2.22,0,0]} b={[-1.44,0,0]} r={.24} color="#825B4C"/><mesh position={[-2.1,0,0]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.26,.042,10,38]}/><Mat color="#B99778"/></mesh>
     <CylinderX a={[-.60,0,0]} b={[-.26,0,0]} r={.33} color="#5B6368"/>
     <CylinderX a={[-1.24,1.26,-.55]} b={[-1.23,1.07,-.55]} r={.19} color="#B39A7E"/>
     <CylinderX a={[-1.23,1.07,-.55]} b={[-1.13,.78,-.14]} r={.045} color="#D6C6B3"/>
     {variant==='full'?<React.Fragment>
       <CurvePipe points={exhaustManifold} r={.17} color="#885944"/>
       <CurvePipe points={exhaustBranch} r={.11} color="#8B6048"/>
       <CurvePipe points={exhaustTail} r={.16} color="#8C604D"/>
     </React.Fragment>:null}
   </group>
   <group name="FRESH_AIR_CIRCUIT">
     <Housing compressor x={TURBO_PIVOTS.COMPRESSOR_ROTOR[0]+gap} cutaway={clamp(cutaway)}/>
     <Rotor compressor x={TURBO_PIVOTS.COMPRESSOR_ROTOR[0]+gap} phase={phase}/>
     <CylinderX a={[1.44,0,0]} b={[2.22,0,0]} r={.24} color="#527C91"/><mesh position={[2.1,0,0]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.26,.042,10,38]}/><Mat color="#A5D1D8"/></mesh>
     <CylinderX a={[.26,0,0]} b={[.60,0,0]} r={.33} color="#657C88"/>
     {variant==='full'?<React.Fragment>
       <CurvePipe points={cleanFilter} r={.18} color="#416B84"/>
       <CurvePipe points={compressedPipe} r={.16} color="#4B8295"/>
       <CurvePipe points={cooledPipe} r={.16} color="#619D9D"/>
       <CylinderX a={[3.87,.24,.35]} b={[4.47,.24,.35]} r={.30} color="#284C60"/>
     </React.Fragment>:null}
   </group>
   {variant==='full'?<><Engine/><Intercooler/></>:null}
   {Object.entries(TURBO_PORTS).map(([name,where])=>
      <PortDot key={name} name={name} where={where}/>)}
 </group>;
};
