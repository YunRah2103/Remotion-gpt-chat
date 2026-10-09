import React from 'react';
import * as THREE from 'three';

/**
 * Reusable, opt-in lighting/material presets for original R3F engineering films.
 * Scene units are schematic metres; tune lighting against true GLB materials.
 */
export type StudioLightingPreset = 'soft-studio'|'hard-metal'|'inspection';
export type EngineeringMaterial = 'machined-aluminium'|'brushed-steel'|'rubber'|'painted-body'|'safety-glass'|'dark-polymer';

export const materialParameters: Record<EngineeringMaterial, {
  color: string; metalness: number; roughness: number; transparent?: boolean; opacity?: number;
}> = {
  'machined-aluminium': {color:'#aab5bd', metalness:.9,roughness:.3},
  'brushed-steel': {color:'#71828b',metalness:.92,roughness:.4},
  'rubber': {color:'#15191d',metalness:.03,roughness:.93},
  'painted-body': {color:'#c6ded9',metalness:.62,roughness:.23},
  'safety-glass': {color:'#b1d6dc',metalness:.06,roughness:.1,transparent:true,opacity:.35},
  'dark-polymer': {color:'#333a43',metalness:.11,roughness:.64},
};

export const EngineeringSurface: React.FC<{finish: EngineeringMaterial}> = ({finish}) => (
  <meshStandardMaterial {...materialParameters[finish]} side={THREE.DoubleSide}/>
);

export const StudioLightingRig:React.FC<{
  preset?: StudioLightingPreset;
  scale?: number;
  showGround?: boolean;
}>=({preset='soft-studio',scale=1,showGround=true})=>{
  const cfg = {
    'soft-studio':{key:3.2,fill:1.6,rim:2.5,ambient:.8,world:'#101b25'},
    'hard-metal':{key:5.0,fill:.65,rim:3.7,ambient:.4,world:'#080f17'},
    inspection:{key:2.0,fill:1.8,rim:.8,ambient:1.2,world:'#1b2630'},
  }[preset];
  return <>
    <color attach="background" args={[cfg.world]}/>
    <hemisphereLight args={['#e5f2ff','#34404a',cfg.ambient]}/>
    <directionalLight position={[4*scale,7*scale,5*scale]} intensity={cfg.key} color="#fff1dc" castShadow shadow-mapSize={[2048,2048]}/>
    <directionalLight position={[-5*scale,2*scale,3*scale]} intensity={cfg.fill} color="#a1d3f2"/>
    <pointLight position={[-2*scale,4*scale,-4*scale]} intensity={cfg.rim} color="#ecfff6" decay={2}/>
    {showGround && <mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[0,-1.15*scale,0]}>
      <planeGeometry args={[200*scale,200*scale]}/>
      <meshStandardMaterial color="#172029" metalness={.18} roughness={.83}/>
    </mesh>}
  </>;
};
