import React, {useMemo} from 'react';
import * as THREE from 'three';

/** A5 lookdev: material, lighting and purposeful atmospheric overlays only.
 *  No vehicle, turbo mechanism, A4 camera, or central film edits.
 *  All transforms follow +Y up, +Z vehicle forward, 1 unit = 1 metre.
 */
export const YUNEX_LOOK = Object.freeze({
  background: '#08121D', shadow: '#071018', petrol: '#10242C',
  teal: '#0D817F', tealHighlight: '#43C7B9', graphite: '#4B606D',
  steel: '#C5D0D1', warmMetal: '#D1A77C', tyre: '#11171C',
  rim: '#171D27', glass: '#102733', asphalt: '#202D34',
  exhaust: '#FF8A36', exhaustRed: '#F15C3A',
  intake: '#53CFFF', charge: '#8CEBE3', tungsten: '#FFB46C',
} as const);

export type LookVariant = 'road' | 'turbine' | 'charge';
export type SurfaceName =
  | 'tealPaint' | 'tealTrim' | 'carbon' | 'glass' | 'tyre' | 'rim'
  | 'brakeSteel' | 'asphalt' | 'warmHousing' | 'graphiteHousing'
  | 'machinedSteel' | 'intercooler' | 'hotPipe' | 'coldPipe'
  | 'roadStripe' | 'glowingExhaust' | 'glowingIntake' | 'glowingCharge';

export type SurfaceToken = Readonly<{
  color: string; metalness: number; roughness: number;
  clearcoat?: number; clearcoatRoughness?: number;
  emissive?: string; emissiveIntensity?: number;
  transparent?: boolean; opacity?: number;
}>;

/** Material values are intentionally film-continuous across separate scenes. */
export const YunexMaterials: Readonly<Record<SurfaceName, SurfaceToken>> = Object.freeze({
  tealPaint:       {color:YUNEX_LOOK.teal,metalness:.68,roughness:.19,clearcoat:1,clearcoatRoughness:.105},
  tealTrim:        {color:'#256E73',metalness:.76,roughness:.285,clearcoat:.65,clearcoatRoughness:.19},
  carbon:          {color:'#13252C',metalness:.32,roughness:.38,clearcoat:.27,clearcoatRoughness:.23},
  glass:           {color:YUNEX_LOOK.glass,metalness:.23,roughness:.075,clearcoat:1,clearcoatRoughness:.06,transparent:true,opacity:.91},
  tyre:            {color:YUNEX_LOOK.tyre,metalness:.035,roughness:.86},
  rim:             {color:YUNEX_LOOK.rim,metalness:.84,roughness:.24,clearcoat:.35,clearcoatRoughness:.18},
  brakeSteel:      {color:'#8BA2A8',metalness:.9,roughness:.32},
  asphalt:         {color:YUNEX_LOOK.asphalt,metalness:.12,roughness:.88},
  warmHousing:     {color:'#866150',metalness:.78,roughness:.36},
  graphiteHousing: {color:YUNEX_LOOK.graphite,metalness:.86,roughness:.3},
  machinedSteel:   {color:YUNEX_LOOK.steel,metalness:.91,roughness:.23},
  intercooler:     {color:'#789BA3',metalness:.83,roughness:.35},
  hotPipe:         {color:'#805449',metalness:.8,roughness:.38},
  coldPipe:        {color:'#416D80',metalness:.72,roughness:.34},
  roadStripe:      {color:'#C7D2CB',metalness:.05,roughness:.72},
  glowingExhaust:  {color:YUNEX_LOOK.exhaust,metalness:0,roughness:.8,emissive:YUNEX_LOOK.exhaust,emissiveIntensity:1.6},
  glowingIntake:   {color:YUNEX_LOOK.intake,metalness:0,roughness:.8,emissive:YUNEX_LOOK.intake,emissiveIntensity:1.25},
  glowingCharge:   {color:YUNEX_LOOK.charge,metalness:0,roughness:.8,emissive:YUNEX_LOOK.charge,emissiveIntensity:1.2},
});

/** Global named surface adapter for A1/A2 materials — preserves their geometries, rigs, ports, transforms and animations.
 *  This is OPT-IN. A6 can use applyYunexMaterials(ref.current) after loading a locked model.
 *  The returned disposer restores original mesh materials and releases only our clones.
 */
export function surfaceForSlot(slot: string): SurfaceName | null {
  const n=slot.toUpperCase();
  if (/BODY_TEAL|ROOFLINE_TEAL|PERFORATED_BUMPER_FASCIA/.test(n)) return 'tealPaint';
  if (/REAR_SPOILER|SIDE_MIRROR|SPLITTER|DIFFUSER|CARBON/.test(n)) return 'carbon';
  if (/GLASS|WINDOW|WINDSCREEN/.test(n)) return 'glass';
  if (/TYRE|TIRE|RUBBER/.test(n)) return 'tyre';
  if (/ENGINE_BAY_TURBO_HOUSING_HINT/.test(n)) return 'warmHousing';
  if (/ENGINE_PLENUM_RIBBED_METAL|ENGINE_BAY_FASTENERS|ENGINE_BAY_BRACING/.test(n)) return 'machinedSteel';
  if (/RIM|SPOKE|WHEEL_METAL/.test(n)) return 'rim';
  if (/BRAKE|DISC/.test(n)) return 'brakeSteel';
  if (/RACE_ASPHALT|ROAD_SURFACE|ROAD_ASPHALT/.test(n)) return 'asphalt';
  if (/WHITE_ROAD_EDGE|CENTRE_DASHED_LINE/.test(n)) return 'roadStripe';
  if (/INTERCOOLER|COOLER_CORE|COOLER_FIN/.test(n)) return 'intercooler';
  if (/FOUR_CYLINDER_ENGINE|CYLINDER_BANK_COVER/.test(n)) return 'graphiteHousing';
  if (/TURBINE_HOUSING|HOT_HOUSING|EXHAUST_HOUSING/.test(n)) return 'warmHousing';
  if (/COMPRESSOR_HOUSING|TURBO_HOUSING|BEARING_CASE/.test(n)) return 'graphiteHousing';
  if (/TURBINE_ROTOR|SHAFT|COMPRESSOR_ROTOR|MACHINED_STEEL/.test(n)) return 'machinedSteel';
  if (/TURBINE_CIRCUIT/.test(n)) return 'hotPipe';
  if (/FRESH_AIR_CIRCUIT/.test(n)) return 'coldPipe';
  if (/EXHAUST_PIPE|HOT_PIPE|EXHAUST_MANIFOLD/.test(n)) return 'hotPipe';
  if (/CLEAN_AIR|COMPRESSED_PIPE|COLD_PIPE/.test(n)) return 'coldPipe';
  return null;
}

export function makeYunexMaterial(surface: SurfaceName): THREE.MeshPhysicalMaterial {
  const t=YunexMaterials[surface];
  return new THREE.MeshPhysicalMaterial({
    color:t.color, metalness:t.metalness, roughness:t.roughness,
    clearcoat:t.clearcoat??0, clearcoatRoughness:t.clearcoatRoughness??.25,
    emissive:t.emissive??'#000000', emissiveIntensity:t.emissiveIntensity??0,
    transparent:t.transparent??false, opacity:t.opacity??1,
  });
}

export function applyYunexMaterials(root: THREE.Object3D): () => void {
  const replaced: Array<{mesh: THREE.Mesh; original: THREE.Material | THREE.Material[]; created: THREE.MeshPhysicalMaterial}>=[];
  root.traverse((object)=>{
    if (!(object instanceof THREE.Mesh)) return;
    const current=Array.isArray(object.material)?object.material[0]:object.material;
    // Prefer A1 named material. A2 often names the controlling parent group
    // instead of the individual mesh, so walk upward only as far as a named
    // mechanism circuit. Never recolour emissive head/taillamp optics.
    const originalName=(current?.name || object.name || '').toUpperCase();
    if (/HEADLAMP|REAR_LED|PROJECTOR|TAIL_LIGHT|GLOW|EMISSIVE/.test(originalName)) return;
    let slot=surfaceForSlot(originalName);
    if(!slot){
      let parent=object.parent,depth=0;
      while(parent && depth<4 && !slot){
        const n=(parent.name||'').toUpperCase();
        if (/^(SHAFT|TURBINE_ROTOR|COMPRESSOR_ROTOR|TURBINE_HOUSING|COMPRESSOR_HOUSING|TURBINE_CIRCUIT|FRESH_AIR_CIRCUIT|FOUR_CYLINDER_ENGINE|INTERCOOLER)$/.test(n)){
          slot=surfaceForSlot(n);
        }
        parent=parent.parent;depth++;
      }
    }
    if (!slot) return;
    const created=makeYunexMaterial(slot);
    replaced.push({mesh:object,original:object.material,created});
    object.material=created;
  });
  return ()=>{for(const r of replaced){r.mesh.material=r.original;r.created.dispose();}};
}

export const YunexSurface:React.FC<{surface:SurfaceName; opacity?:number}>=({surface,opacity})=>{
  const m=YunexMaterials[surface];
  return <meshPhysicalMaterial name={'YUNEX_'+surface.toUpperCase()}
    color={m.color} metalness={m.metalness} roughness={m.roughness}
    clearcoat={m.clearcoat??0} clearcoatRoughness={m.clearcoatRoughness??.25}
    emissive={m.emissive??'#000000'} emissiveIntensity={m.emissiveIntensity??0}
    transparent={(opacity??m.opacity??1)<1 || !!m.transparent}
    opacity={opacity??m.opacity??1} />;
};

export type YunexLightsProps={sceneVariant?:LookVariant; intensity?:number; augment?:boolean; shadows?:boolean};
const RATIOS:Record<LookVariant,{key:number;rim:number;blue:number;fill:number}>={
  road: {key:2.3,rim:3.5,blue:1.5,fill:.64},
  turbine:{key:3.0,rim:3.3,blue:2.1,fill:.87},
  charge:{key:2.5,rim:2.25,blue:3.5,fill:.91},
};
/** High camera-left cool key; warm sunset camera-right rim in every variant. */
export const YunexLights:React.FC<YunexLightsProps>=({
  sceneVariant='road',intensity=1,augment=false,shadows=true,
})=>{
  const q=RATIOS[sceneVariant],k=intensity*(augment?.38:1);
  return <>
    <hemisphereLight color="#B7D5E3" groundColor="#10232F" intensity={q.fill*k}/>
    <directionalLight position={[-6,10,7]} color="#D6F2F2" intensity={q.key*k}
      castShadow={shadows} shadow-mapSize-width={shadows?1024:256} shadow-mapSize-height={shadows?1024:256}
      shadow-bias={-.0002} shadow-camera-left={-13} shadow-camera-right={13}
      shadow-camera-top={14} shadow-camera-bottom={-14}/>
    <directionalLight position={[7,5,-5]} color={YUNEX_LOOK.tungsten} intensity={q.rim*k}/>
    <directionalLight position={[3,4,8]} color="#5CC7EA" intensity={q.blue*k}/>
  </>;
};

/** Cheap polygonal pools of light — no physical volumetric renderer or random seeds.
 *  Props driven only by the supplied Remotion frame; translucent surface pools do NOT imply gas mixing.
 */
export const RoadAtmosphere:React.FC<{frame:number; visibility?:number}>=({frame,visibility=1})=>{
  const zShift=(frame*.27)%12;
  return <group name="A5_ROAD_ATMOSPHERE" visible={visibility>0}>
    {Array.from({length:8},(_,i)=>{
      const z=((i*12-zShift+60)%96)-48,side=i%2===0?-1:1;
      return <group key={i} position={[side*5.25,0,z]}>
        <mesh rotation={[-Math.PI/2,0,0]} position={[0,.012,0]} scale={[2.25,4.5,1]}>
          <circleGeometry args={[1,18]}/>
          <meshBasicMaterial color="#D69A63" transparent opacity={visibility*(.08+.025*(i%3))} depthWrite={false}/>
        </mesh>
        <mesh position={[0,3.3,0]} scale={[.25,3.15,.25]}>
          <coneGeometry args={[1,1,8,1,true]}/>
          <meshBasicMaterial color="#FFA95D" transparent opacity={visibility*.035}
            depthWrite={false} side={THREE.DoubleSide}/>
        </mesh>
      </group>;
    })}
    {Array.from({length:8},(_,i)=>{
      const z=((i*17+frame*.15+95)%120)-60;
      return <mesh key={i} position={[(i%2?1:-1)*(2.9+i*.24),.07,z]}
        scale={[2.3,.035,4.9]} rotation={[0,i*.42,0]}>
        <sphereGeometry args={[1,8,5]}/>
        <meshBasicMaterial color="#6BABB7" transparent opacity={visibility*.025}
          depthWrite={false}/>
      </mesh>;
    })}
  </group>;
};

/** Restricted to exhaust side of the *mechanism*, never cyan intake.
 *  Three cheap rising translucent rings convey thermal shimmer without screen-space refraction.
 */
export const ExhaustHeat:React.FC<{frame:number;position?:[number,number,number];intensity?:number}>=({
 frame,position=[-1.13,.72,.43],intensity=1,
})=><group name="A5_EXHAUST_HEAT" position={position}>
 {Array.from({length:5},(_,i)=>{
   const t=((frame*.012+i/5)%1+1)%1;
   return <mesh key={i} rotation={[Math.PI/2,0,0]} position={[-.10,t*.88,0]}
     scale={[.35+t*.30,.16+t*.22,1]}>
     <torusGeometry args={[1,.045,5,16]}/>
     <meshBasicMaterial color={i%2?'#FFB476':'#F15C3A'} transparent
       opacity={intensity*.14*(1-t)} depthWrite={false}/>
   </mesh>;
 })}
</group>;

/** 10 controlled moving specular blades for an existing rotating shaft region.
 *  Overlay only; A2 owns the actual turbine geometry.
 */
export const RotorGlimmer:React.FC<{frame:number;position?:[number,number,number];intensity?:number}>=({
 frame,position=[-1.13,0,0],intensity=1,
})=><group position={position} rotation={[frame*.165,0,0]} name="A5_ROTOR_GLIMMER">
 {Array.from({length:10},(_,i)=>{const a=i*Math.PI/5;return <mesh key={i}
   position={[0,Math.cos(a)*.59,Math.sin(a)*.59]} rotation={[a,0,0]}>
   <boxGeometry args={[.009,.19,.027]}/>
   <meshBasicMaterial color="#FFCE97" transparent opacity={.16*intensity} depthWrite={false}/>
 </mesh>;})}
</group>;

export const LOOKDEV_SCENE_BACKGROUND = YUNEX_LOOK.background;
