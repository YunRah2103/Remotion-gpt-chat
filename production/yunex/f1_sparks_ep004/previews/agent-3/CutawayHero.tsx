/** True-mesh optical cutaway: every position and dimension is exactly
 * Agent 1's F1HeroVehicle. Material-only false-colour lighting helps viewers
 * see titanium silver vs composite amber, while 12%-opaque existing car
 * silhouette preserves their mounting context. NEVER repositions skid/plank.
 */
import React,{useEffect,useMemo} from 'react';
import * as THREE from 'three';
import {buildF1HeroVehicle,applyF1HeroMotion} from '../../mechanics/index.ts';
import {disposeObject} from '../../../../../src/yunex/world-kit/geometry.ts';
import type {VehicleMotionState} from '../../shared/contract.ts';

const REAL_TECHNICAL_PREFIXES=[
 'EP004-skid-',
 'EP004-composite-plank-',
 'EP004-plank-mount',
 'EP004-carbon-underfloor-strake',
];
export const CUTAWAY_MASK_DESCRIPTION='Actual Agent 1 metal skids and composite plank, optical false-colour only';
export function shouldShowOnUnderfloorSection(meshName:string):boolean {
 return REAL_TECHNICAL_PREFIXES.some(prefix=>meshName.startsWith(prefix));
}
function opticalMaterial(name:string):THREE.Material{
 if(name.startsWith('EP004-skid-')){
   return new THREE.MeshStandardMaterial({
     color:'#d8eaf3',emissive:'#648d9d',emissiveIntensity:.22,
     metalness:.72,roughness:.24,
   });
 }
 if(name.startsWith('EP004-composite-plank-')){
   return new THREE.MeshStandardMaterial({
     color:'#ac8b63',emissive:'#6c4c2b',emissiveIntensity:.28,
     metalness:.02,roughness:.72,
   });
 }
 if(name.startsWith('EP004-plank-mount')||name.startsWith('EP004-carbon-underfloor-strake')){
   return new THREE.MeshStandardMaterial({
     color:'#1d3335',roughness:.48,metalness:.30,
   });
 }
 // This is the unmodified APPROVED moving hero silhouette: the same actual
 // F1 chassis and tyres with a 3D X-ray presentation, not a loose tray.
 const opacity=name==='EP004-carbon-floor'?.20:.11;
 return new THREE.MeshBasicMaterial({
   color:'#65dbd5',transparent:true,opacity,depthWrite:false,
   side:THREE.DoubleSide,
 });
}
export const CutawayHero:React.FC<{motion:VehicleMotionState}>=({motion})=>{
 const model=useMemo(()=>{
   const root=buildF1HeroVehicle();
   root.traverse(node=>{
     if(!(node instanceof THREE.Mesh))return;
     node.material=opticalMaterial(node.name);
     node.visible=true;
     if(!shouldShowOnUnderfloorSection(node.name)){
       // Hero shell is a faint optical context rather than occluding plank.
       node.castShadow=false;node.receiveShadow=false;
       if(node.userData.ep004GhostShell)delete node.userData.ep004GhostShell;
     }
   });
   return root;
 },[]);
 useEffect(()=>()=>disposeObject(model),[model]);
 applyF1HeroMotion(model,motion,0);
 return <primitive object={model}/>;
};
