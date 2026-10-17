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
const Housing:React.FC<{compressor:boolean;x:number;cutaway:number}>=({compressor,x,cutaway})=>{
 const s=compressor?1:-1, base=compressor?'#547789':'#8A5A47';
 return <group name={compressor?'COMPRESSOR_HOUSING':'TURBINE_HOUSING'} position={[x,0,0]}>
   <mesh rotation={[0,Math.PI/2,0]}><torusGeometry args={[.69,.23,16,72]}/><Mat color={base}/></mesh>
   <mesh rotation={[0,Math.PI/2,0]} position={[s*.12,0,0]}>
    <torusGeometry args={[.70,.052,10,64]}/><Mat color={C.steel}/></mesh>
   {cutaway<.99?<mesh rotation={[0,0,Math.PI/2]} position={[s*.30,0,0]}>
    <cylinderGeometry args={[.72,.65,.058,64]}/><Mat color={base} opacity={.96*(1-cutaway)+.02}/></mesh>:null}
   {Array.from({length:12},(_,i)=>{
     const a=2*i*Math.PI/12;
     return <mesh key={i} position={[s*.12,Math.cos(a)*.78,Math.sin(a)*.78]} rotation={[a,0,0]}>
       <boxGeometry args={[.065,.09,.14]}/><Mat color="#99A8AA"/></mesh>;
   })}
  </group>;
};
const Engine:React.FC=()=> <group name="FOUR_CYLINDER_ENGINE" position={[0,-1.65,-3.15]}>
  <mesh castShadow><boxGeometry args={[2.8,1.25,1.30]}/><Mat color="#667E8A" roughness={.42}/></mesh>
  {[-1.05,-.35,.35,1.05].map(x=><mesh key={x} position={[x,0,.668]}>
    <boxGeometry args={[.075,.84,.045]}/><Mat color="#B6C5CA" roughness={.29}/></mesh>)}
  <mesh castShadow position={[0,.74,0]}><boxGeometry args={[3,.30,1.42]}/><Mat color="#83949C"/></mesh>
  {[-1.05,-.35,.35,1.05].map(x=><group key={x} position={[x,.9,0]}>
   <CylinderX a={[-.11,0,0]} b={[.11,0,0]} r={.14} color="#D9E0DF" sides={18}/>
   <mesh position={[0,.12,0]}><boxGeometry args={[.15,.08,.9]}/><Mat color={C.steel}/></mesh>
  </group>)}
  <mesh position={[0,-.5,.72]}><boxGeometry args={[2.66,.24,.19]}/><Mat color="#172B34"/></mesh>
  <mesh position={[-.63,.85,0]}><sphereGeometry args={[.085,16,12]}/>
   <meshBasicMaterial color="#F9D17B"/></mesh>
</group>;
const Intercooler:React.FC=()=> <group name="INTERCOOLER" position={[3.08,-.51,-1.45]}>
 <mesh castShadow><boxGeometry args={[.85,1.42,1.38]}/><Mat color="#253C4B"/></mesh>
 {Array.from({length:16},(_,i)=><mesh key={i} position={[.44,-.62+i*.083,0]}>
  <boxGeometry args={[.028,.046,1.31]}/><Mat color={i%2?'#AFCDD0':'#768F9A'}/></mesh>)}
 {[-.68,.68].map(z=><mesh key={z} position={[0,0,z]}>
  <boxGeometry args={[.93,1.44,.08]}/><Mat color="#7796A6"/></mesh>)}
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
     <CylinderX a={[-1.42,0,0]} b={[1.42,0,0]} r={.115} color="#E4DCD2"/>
     <CylinderX a={[-.28,0,0]} b={[.28,0,0]} r={.25} color="#697B88"/>
     <mesh position={[0,.13,.02]}><boxGeometry args={[1.10,.043,.065]}/><Mat color="#E8C692"/></mesh>
   </group>
   <group name="TURBINE_CIRCUIT">
     <Housing compressor={false} x={TURBO_PIVOTS.TURBINE_ROTOR[0]-gap} cutaway={clamp(cutaway)}/>
     <Rotor compressor={false} x={TURBO_PIVOTS.TURBINE_ROTOR[0]-gap} phase={phase}/>
     <CylinderX a={[-2.22,0,0]} b={[-1.44,0,0]} r={.24} color="#825B4C"/>
     <CylinderX a={[-.60,0,0]} b={[-.26,0,0]} r={.33} color="#5B6368"/>
     {variant==='full'?<React.Fragment>
       <CurvePipe points={exhaustManifold} r={.17} color="#885944"/>
       <CurvePipe points={exhaustBranch} r={.11} color="#8B6048"/>
       <CurvePipe points={exhaustTail} r={.16} color="#8C604D"/>
     </React.Fragment>:null}
   </group>
   <group name="FRESH_AIR_CIRCUIT">
     <Housing compressor x={TURBO_PIVOTS.COMPRESSOR_ROTOR[0]+gap} cutaway={clamp(cutaway)}/>
     <Rotor compressor x={TURBO_PIVOTS.COMPRESSOR_ROTOR[0]+gap} phase={phase}/>
     <CylinderX a={[1.44,0,0]} b={[2.22,0,0]} r={.24} color="#527C91"/>
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
