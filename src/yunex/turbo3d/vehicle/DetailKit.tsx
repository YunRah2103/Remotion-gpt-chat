import React, {useMemo} from 'react';
import * as THREE from 'three';

/** A1 v2 close-up geometry. Entirely authored 3D meshes, metres / Y-up / +Z forward. */
const PI=Math.PI;
const graphite='#0A131C', alloy='#9FB8C1', bronze='#BD815D';
type P3=[number,number,number];
const Hose:React.FC<{points:P3[];radius?:number;color?:string;metalness?:number}>=({points,radius=.028,color='#628C98',metalness=.6})=>{
  const path=useMemo(()=>new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),[points]);
  return <mesh castShadow><tubeGeometry args={[path,24,radius,8,false]}/><meshStandardMaterial color={color} metalness={metalness} roughness={.32}/></mesh>;
};
export const LightShell:React.FC<{side:number}>=({side})=>{
  // The shell is an actual bevelled, sharply swept polygon, rather than a headlamp cuboid.
  const shell=useMemo(()=>{
    const shape=new THREE.Shape();
    shape.moveTo(-.225,-.16);shape.lineTo(.125,-.23);shape.lineTo(.255,-.07);
    shape.lineTo(.205,.185);shape.quadraticCurveTo(-.025,.215,-.22,.09);
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape,{depth:.035,steps:1,bevelEnabled:true,bevelThickness:.015,bevelSize:.013,bevelSegments:2,curveSegments:5});
  },[]);
  const y=.705;
  return <group name="LAYERED_HEADLAMP_ASSEMBLY" position={[side*.636,y,1.939]}>
    <group rotation={[PI/2,0,side*-.02]}>
      <mesh geometry={shell} castShadow>
        <meshPhysicalMaterial name="HEADLAMP_RECESSED_HOUSING" color="#07111B" metalness={.51} roughness={.20} clearcoat={.72}/>
      </mesh>
    </group>
    <mesh position={[0,.018,.0]} castShadow><boxGeometry args={[.435,.018,.30]}/>
      <meshStandardMaterial color="#263D46" metalness={.55} roughness={.26}/></mesh>
    {[-.09,.076].map((dx,i)=><group key={i} position={[dx,.052,.045]}>
      <mesh rotation={[PI/2,0,0]}><cylinderGeometry args={[i===0?.074:.055,i===0?.074:.055,.021,24]}/>
        <meshStandardMaterial name="HEADLAMP_PROJECTOR_BEZEL" color="#BECED2" metalness={.88} roughness={.17}/></mesh>
      <mesh position={[0,.014,0]}><sphereGeometry args={[i===0?.053:.041,18,12]}/>
        <meshPhysicalMaterial name="HEADLAMP_PROJECTOR_LENS" color="#C3F8FF" emissive="#7ADDF1" emissiveIntensity={1.8} roughness={.12} transmission={.13} clearcoat={1}/></mesh>
    </group>)}
    <Hose points={[[-.191,.069,.109],[-.11,.09,.160],[.035,.093,.143],[.175,.08,.025]]} radius={.014} color="#BBF9FC" metalness={.06}/>
    <Hose points={[[-.17,.066,-.08],[-.015,.075,-.131],[.153,.07,-.108]]} radius={.010} color="#5196A9"/>
    <mesh position={[0,.100,.016]}><boxGeometry args={[.429,.008,.30]}/>
      <meshPhysicalMaterial name="HEADLAMP_OUTER_CLEAR_LENS" color="#8CC7D7" metalness={.08} roughness={.095} transparent opacity={.16} clearcoat={1} depthWrite={false}/></mesh>
  </group>;
};

/** Recess on the +Z front face, including real sidewalls and slats rather than a black sticker. */
export const FrontDuct:React.FC<{side:number}>=({side})=><group name="FRONT_BUMPER_RECESSED_DUCT" position={[side*.42,.535,2.36]}>
  <mesh position={[0,0,-.112]}><boxGeometry args={[.340,.116,.010]}/>
    <meshStandardMaterial name="FRONT_DUCT_DEPTH_BACK" color="#020A0D" roughness={1}/></mesh>
  <mesh position={[0,-.071,.005]}><boxGeometry args={[.405,.023,.213]}/>
    <meshStandardMaterial name="FRONT_DUCT_LOWER_LIP" color="#182F39" metalness={.52} roughness={.33}/></mesh>
  <mesh position={[0,.070,.005]}><boxGeometry args={[.407,.020,.215]}/>
    <meshStandardMaterial name="FRONT_DUCT_UPPER_LIP" color="#2B565A" metalness={.6} roughness={.3}/></mesh>
  {[-1,1].map(s=><mesh key={s} position={[s*.2,0,-.015]}>
    <boxGeometry args={[.022,.14,.175]}/><meshStandardMaterial color="#1F333E" metalness={.48}/></mesh>)}
  {[-.09,0,.09].map(x=><mesh key={x} position={[x,0,.07]} rotation={[0,.03*side,0]}>
    <boxGeometry args={[.012,.117,.12]}/><meshStandardMaterial name="FRONT_INTAKE_GUIDE_VANES" color="#4A777D" metalness={.72} roughness={.3}/></mesh>)}
  <mesh position={[0,0,-.105]}><boxGeometry args={[.34,.006,.09]}/>
    <meshStandardMaterial color="#09161E" roughness={.63}/></mesh>
</group>;

/** Side opening reaches inboard, with real fore/aft wall faces, a deep cavity and 3 vanes. */
export const SideDuct:React.FC<{side:number}>=({side})=><group name="SIDE_RECESSED_AIR_DUCT" position={[side*.925,.648,-1.135]}>
  <mesh position={[-side*.135,0,0]} castShadow><boxGeometry args={[.035,.275,.62]}/>
    <meshStandardMaterial name="SIDE_DUCT_DEPTH_BACK" color="#02090E" roughness={.96}/></mesh>
  {[-1,1].map(s=><group key={s}>
    <mesh position={[-side*.036,s*.143,0]}><boxGeometry args={[.20,.025,.67]}/>
      <meshStandardMaterial name="SIDE_DUCT_SILL" color={s===1?'#2D6566':'#101D24'} metalness={.65} roughness={.29}/></mesh>
    <mesh position={[-side*.045,0,s*.335]}><boxGeometry args={[.22,.272,.028]}/>
      <meshStandardMaterial color="#14333E" metalness={.5} roughness={.45}/></mesh>
  </group>)}
  {[-.188,0,.188].map(z=><mesh key={z} position={[side*.077,-.006,z]} rotation={[0,side*.17,0]}>
    <boxGeometry args={[.024,.218,.057]}/>
    <meshStandardMaterial name="SIDE_DUCT_GUIDE_VANE" color="#93BDBF" metalness={.77} roughness={.24}/></mesh>)}
  <mesh position={[side*.085,.13,0]}><boxGeometry args={[.025,.029,.7]}/>
    <meshPhysicalMaterial name="SIDE_DUCT_MACHINED_LIP" color="#87BAB8" metalness={.88} roughness={.21} clearcoat={.5}/></mesh>
</group>;

export const PremiumWheel:React.FC<{side:number;z:number;travelMeters:number}>=({side,z,travelMeters})=>{
  const spin=-travelMeters/.355;
  return <group name={z>0?'FRONT_WHEEL':'REAR_WHEEL'} position={[side*.858,.355,z]}>
    <group name="STATIONARY_BRAKE_CALIPER" position={[side*.052,0,0]}>
      <mesh rotation={[0,0,PI/2]}><cylinderGeometry args={[.241,.241,.018,44]}/>
        <meshStandardMaterial name="DRILLED_BRAKE_DISC" color="#8DA4AC" metalness={.91} roughness={.27}/></mesh>
      {Array.from({length:20},(_,i)=>{const a=PI*2*i/20;return <mesh key={i} position={[side*.021,Math.cos(a)*.188,Math.sin(a)*.188]}>
        <sphereGeometry args={[.012,6,5]}/><meshStandardMaterial color="#21313B" roughness={.71}/></mesh>;})}
      <group position={[side*.072,.18,.09]} rotation={[.24,0,0]}>
        <mesh castShadow><boxGeometry args={[.077,.117,.17]}/><meshStandardMaterial name="BRAKE_CALIPER_BRONZE" color="#D39B70" metalness={.76} roughness={.3}/></mesh>
        <mesh position={[side*.043,0,0]}><boxGeometry args={[.012,.054,.13]}/><meshStandardMaterial color="#3A454D" metalness={.63}/></mesh>
      </group>
    </group>
    <group name="WHEEL_PIVOT_X" rotation={[spin,0,0]}>
      <mesh rotation={[0,0,PI/2]} castShadow><cylinderGeometry args={[.294,.294,.205,44]}/>
        <meshStandardMaterial name="RUBBER_SIDEWALL" color="#0A1017" roughness={.92}/></mesh>
      <mesh rotation={[0,PI/2,0]} castShadow>
        <torusGeometry args={[.297,.057,15,44]}/><meshStandardMaterial name="TYRE_TREAD" color="#080B10" roughness={.96}/></mesh>
      <mesh rotation={[0,PI/2,0]} position={[side*.112,0,0]}>
        <torusGeometry args={[.27,.018,10,48]}/><meshStandardMaterial name="RIM_OUTER_LIP" color="#9EB9B9" metalness={.94} roughness={.18}/></mesh>
      <mesh rotation={[0,0,PI/2]} position={[side*.127,0,0]}>
        <cylinderGeometry args={[.246,.246,.022,42]}/>
        <meshStandardMaterial name="RIM_GRAPHITE" color="#111D26" metalness={.86} roughness={.29}/>
      </mesh>
      <mesh rotation={[0,PI/2,0]} position={[side*.149,0,0]}>
        <torusGeometry args={[.229,.011,8,44]}/><meshStandardMaterial color="#2A4F58" metalness={.89} roughness={.19}/></mesh>
      {Array.from({length:10},(_,i)=>{
        const a=i*PI*2/10;
        return <group key={i} rotation={[a,0,0]}>
          <mesh position={[side*.163,.13,-.018]} rotation={[.19,0,side*-.17]} castShadow>
            <boxGeometry args={[.035,.215,.029]}/>
            <meshStandardMaterial name="RIM_MACHINED_SPOKE" color="#9BAEB6" metalness={.89} roughness={.20}/>
          </mesh>
          <mesh position={[side*.173,.177,.037]} rotation={[-.19,0,side*.18]} castShadow>
            <boxGeometry args={[.023,.117,.021]}/><meshStandardMaterial color="#3F7A7B" metalness={.85} roughness={.27}/></mesh>
        </group>;
      })}
      <mesh rotation={[0,0,PI/2]} position={[side*.185,0,0]}>
        <cylinderGeometry args={[.070,.070,.033,32]}/>
        <meshStandardMaterial name="UNBRANDED_WHEEL_HUB" color="#C2CFCE" metalness={.96} roughness={.17}/></mesh>
      {Array.from({length:5},(_,i)=>{const a=i*PI*2/5;return <mesh key={i} rotation={[0,0,PI/2]} position={[side*.206,Math.sin(a)*.052,Math.cos(a)*.052]}>
        <cylinderGeometry args={[.012,.012,.012,8]}/><meshStandardMaterial name="HUB_LUGS" color="#263C44" metalness={.68} roughness={.27}/></mesh>;})}
      {Array.from({length:26},(_,i)=>{const a=i*PI*2/26;return <mesh key={i} position={[side*.107,Math.cos(a)*.343,Math.sin(a)*.343]} rotation={[a,0,0]}>
        <boxGeometry args={[.16,.015,.030]}/><meshStandardMaterial name="TREAD_GROOVE_HINT" color="#171C20" roughness={.95}/></mesh>;})}
    </group>
  </group>;
};

export const EngineBayDetail:React.FC<{visible:boolean}>=({visible})=><group name="ENGINE_BAY" visible={visible}>
  <mesh position={[0,.852,-1.49]}><boxGeometry args={[1.49,.06,.93]}/>
    <meshStandardMaterial name="ENGINE_BAY_RECESSED_BLACK" color="#06131B" metalness={.29} roughness={.66}/></mesh>
  {[-1,1].map(s=><group key={s}>
    <mesh position={[s*.695,.93,-1.46]} castShadow><boxGeometry args={[.055,.20,.82]}/>
      <meshStandardMaterial name="ENGINE_BAY_BRACING" color="#809DA1" metalness={.78} roughness={.32}/></mesh>
    <mesh position={[s*.44,1.013,-1.49]} rotation={[0,0,s*-.32]} castShadow>
      <boxGeometry args={[.28,.155,.57]}/>
      <meshStandardMaterial name="CYLINDER_BANK_COVER" color="#355461" metalness={.72} roughness={.33}/></mesh>
    <mesh position={[s*.47,1.121,-1.48]} castShadow><boxGeometry args={[.11,.025,.46]}/>
      <meshStandardMaterial color="#B7CBCB" metalness={.91} roughness={.20}/></mesh>
    <mesh position={[s*.52,.952,-1.775]} rotation={[0,0,PI/2]} castShadow>
      <cylinderGeometry args={[.117,.14,.22,18]}/>
      <meshStandardMaterial name="ENGINE_BAY_TURBO_HOUSING_HINT" color="#8FA6B1" metalness={.88} roughness={.28}/></mesh>
    <mesh position={[s*.52,.952,-1.775]} rotation={[0,PI/2,0]}>
      <torusGeometry args={[.109,.025,9,24]}/>
      <meshStandardMaterial color="#BD906C" metalness={.81} roughness={.34}/></mesh>
    <Hose points={[[s*.5,1.025,-1.72],[s*.64,1.16,-1.62],[s*.58,1.182,-1.25],[s*.31,1.12,-1.16]]} radius={.042} color="#678D9C"/>
    <Hose points={[[s*.25,.93,-1.72],[s*.34,.895,-1.87],[s*.60,.91,-1.91]]} radius={.026} color="#C18763"/>
    {[-.13,.0,.13].map(o=><mesh key={o} position={[s*.39,1.116,-1.48+o]}>
      <cylinderGeometry args={[.028,.028,.052,10]}/>
      <meshStandardMaterial name="ENGINE_BAY_FASTENERS" color="#B4C1BB" metalness={.88} roughness={.2}/></mesh>)}
  </group>)}
  <mesh position={[0,1.065,-1.43]} castShadow><boxGeometry args={[.49,.195,.48]}/>
    <meshPhysicalMaterial name="ENGINE_INTAKE_PLENUM" color="#233F4A" metalness={.73} roughness={.24} clearcoat={.45}/></mesh>
  <mesh position={[0,1.173,-1.43]}><boxGeometry args={[.385,.027,.35]}/>
    <meshStandardMaterial name="ENGINE_PLENUM_RIBBED_METAL" color="#93BEC0" metalness={.85} roughness={.22}/></mesh>
  {[-.13,-.065,0,.065,.13].map(x=><mesh key={x} position={[x,1.192,-1.43]}>
    <boxGeometry args={[.019,.017,.32]}/><meshStandardMaterial color="#132931" metalness={.58}/></mesh>)}
  <Hose points={[[0,1.13,-1.22],[0,1.23,-1.11],[.26,1.17,-1.04]]} radius={.048} color="#7B9FA4"/>
  <mesh position={[0,.95,-1.885]}><boxGeometry args={[.79,.08,.13]}/>
    <meshStandardMaterial name="EXHAUST_MANIFOLD_ZONE" color="#B08060" metalness={.69} roughness={.37}/></mesh>
  {[-.32,-.15,.15,.32].map(x=><Hose key={x} points={[[x,1.005,-1.67],[x,.945,-1.79],[x*.82,.94,-1.88]]} radius={.021} color={bronze}/>)}
  <mesh position={[0,.868,-1.1]}><boxGeometry args={[1.41,.063,.055]}/>
    <meshStandardMaterial name="ENGINE_BAY_FRONT_BULKHEAD" color="#789499" metalness={.66} roughness={.32}/></mesh>
</group>;

export const HingedEngineDeck:React.FC<{open:number}>=({open})=>{
  const t=Math.max(0,Math.min(1,open));
  const eased=t*t*(3-2*t);
  return <group name="ENGINE_ACCESS_DECK" position={[0,.914,-.978]} rotation={[eased*1.14,0,0]}>
    <mesh name="REAR_DECK_SKIN" position={[0,.02,-.45]} castShadow>
      <boxGeometry args={[1.49,.065,.91]}/>
      <meshPhysicalMaterial name="ENGINE_COVER" color="#0D817F" metalness={.7} roughness={.23} clearcoat={.9} clearcoatRoughness={.16}/>
    </mesh>
    <mesh position={[0,-.029,-.45]}><boxGeometry args={[1.27,.020,.77]}/>
      <meshStandardMaterial name="ENGINE_DECK_UNDERSIDE" color="#172B36" metalness={.45} roughness={.46}/></mesh>
    {[-.57,-.29,0,.29,.57].map(x=><mesh key={x} position={[x,-.052,-.45]}>
      <boxGeometry args={[.037,.049,.76]}/><meshStandardMaterial color="#5F8589" metalness={.78} roughness={.31}/></mesh>)}
    {[-.39,-.23,-.07,.09,.25,.41].map(x=><group key={x} position={[x,.060,-.66]}>
      <mesh><boxGeometry args={[.078,.018,.29]}/><meshStandardMaterial name="ENGINE_DECK_VENT" color="#071A22" metalness={.43} roughness={.52}/></mesh>
      <mesh position={[0,.013,0]}><boxGeometry args={[.031,.009,.25]}/><meshStandardMaterial color="#36636B" metalness={.57}/></mesh>
    </group>)}
  </group>;
};
