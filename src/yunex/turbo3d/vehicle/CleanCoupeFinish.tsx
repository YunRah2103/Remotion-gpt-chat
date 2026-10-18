import React, {useMemo} from 'react';
import * as THREE from 'three';

/**
 * V7 simple coupe finish.  A small, deliberately restrained set of
 * physical accessories on the original V6.3 sculpted car.
 *
 * +Z front, metres / Y-up.  No parent transforms, mechanical anchors,
 * wheel pivots, public props or shot timing are changed.
 */
type Pt = [number, number, number];

const SmoothTrim: React.FC<{points:Pt[];radius:number;color:string;name:string}>=
({points,radius,color,name})=>{
  const path=useMemo(()=>new THREE.CatmullRomCurve3(
    points.map(p=>new THREE.Vector3(...p)),false,'centripetal'
  ),[points]);
  const geo=useMemo(()=>new THREE.TubeGeometry(path,32,radius,8,false),[path,radius]);
  return <mesh name={name} geometry={geo} castShadow>
    <meshStandardMaterial color={color} roughness={.26} metalness={.78}/>
  </mesh>;
};

const ExhaustTip:React.FC<{x:number}>=({x})=><group name="DUAL_REAR_EXHAUST" position={[x,.427,-2.341]}>
  <mesh rotation={[Math.PI/2,0,0]} castShadow>
    <cylinderGeometry args={[.064,.069,.105,28,1,true]}/>
    <meshStandardMaterial color="#97B0B5" roughness={.22} metalness={.91} side={THREE.DoubleSide}/>
  </mesh>
  <mesh position={[0,0,-.056]}>
    <circleGeometry args={[.052,28]}/>
    <meshStandardMaterial color="#03080C" roughness={.93} side={THREE.DoubleSide}/>
  </mesh>
  <mesh position={[0,0,-.060]}>
    <torusGeometry args={[.057,.007,8,28]}/>
    <meshStandardMaterial color="#C3D5D2" roughness={.22} metalness={.9}/>
  </mesh>
</group>;

/** Smooth, body-integrated ducktail instead of the old rectangular spoiler. */
export const SmoothDucktail:React.FC=()=> <group name="SMOOTH_DUCKTAIL_AERO">
  <mesh position={[0,.959,-2.055]} scale={[.815,.046,.204]} castShadow>
    <sphereGeometry args={[1,36,14]}/>
    <meshPhysicalMaterial name="AERO_REAR_SPOILER" color="#112B34" metalness={.7}
      roughness={.24} clearcoat={.85} clearcoatRoughness={.17}/>
  </mesh>
  <mesh position={[0,.985,-2.099]} scale={[.70,.012,.12]}>
    <sphereGeometry args={[1,28,12]}/>
    <meshStandardMaterial color="#337477" metalness={.78} roughness={.20}/>
  </mesh>
</group>;

export const CleanCoupeFinish:React.FC=()=> <group name="V7_CLEAN_COUPE_FINISH">
  {[-1,1].map(side=><group key={side}>
    {/* Single calm side reflection / waistline; no loud striping or lettering. */}
    <SmoothTrim name="SIDE_SHOULDER_CATCHLIGHT"
      points={[
        [side*.923,.804,-.71],
        [side*.915,.802,-.31],
        [side*.926,.803,.22],
        [side*.942,.790,.91]
      ]}
      radius={.009} color="#3B9B99"/>
    {/* Concise carbon side sill that visually lowers the car. */}
    <SmoothTrim name="LOW_SIDE_SKIRT"
      points={[
        [side*.856,.386,-.86],
        [side*.904,.383,-.56],
        [side*.907,.377,.08],
        [side*.936,.379,.91]
      ]}
      radius={.023} color="#0B1A23"/>
    <mesh name="REAR_QUARTER_BLADE" position={[side*.897,.511,-.752]}
      rotation={[0,side*.21,0]} castShadow>
      <boxGeometry args={[.047,.065,.32]}/>
      <meshPhysicalMaterial color="#145259" metalness={.69} roughness={.26} clearcoat={.7}/>
    </mesh>
    <ExhaustTip x={side*.525}/>
  </group>)}
  <SmoothDucktail/>
</group>;
