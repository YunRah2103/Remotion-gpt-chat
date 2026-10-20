import React,{useEffect,useMemo} from 'react';
import * as THREE from 'three';
import {disposeObject} from '../../../../src/yunex/world-kit/geometry.ts';
import {applyF1HeroMotion,buildF1HeroVehicle} from '../mechanics/F1HeroVehicle.tsx';
import type {VehicleMotionState} from '../shared/contract.ts';

/** A camera section of EXACT Agent 1 physical meshes.
 * No fake/disembodied plank or skid: every named mesh is from buildF1HeroVehicle.
 * The rest of the opaque racing car is hidden solely in this technical cutaway.
 * The original metric geometry, relative placements and skid contact points remain
 * untouched. Material grading only improves separation on a small phone screen.
 */
export const MECHANICAL_NAMES = [
 'EP004-carbon-floor','EP004-floor-edge','EP004-carbon-underfloor-strake',
 'EP004-composite-plank-side-rail','EP004-composite-plank-segment',
 'EP004-skid-forward','EP004-skid-middle','EP004-skid-rear',
 'EP004-skid-forward-bevel','EP004-skid-middle-bevel','EP004-skid-rear-bevel',
 'EP004-skid-forward-fastener','EP004-skid-middle-fastener','EP004-skid-rear-fastener',
 'EP004-plank-mount',
] as const;
export const cutawayIsActualPart=(name:string)=>MECHANICAL_NAMES.includes(name as typeof MECHANICAL_NAMES[number]);
function cutawayModel():THREE.Group {
 const root=buildF1HeroVehicle();
 const tan=new THREE.MeshStandardMaterial({color:'#c09d67',roughness:.78,metalness:.03,side:THREE.DoubleSide});
 const carbon=new THREE.MeshStandardMaterial({color:'#25343f',roughness:.58,metalness:.19,side:THREE.DoubleSide});
 const silver=new THREE.MeshPhysicalMaterial({color:'#e9f0f2',metalness:.72,roughness:.18,emissive:'#d6edf6',emissiveIntensity:.10,side:THREE.DoubleSide});
 const brass=new THREE.MeshStandardMaterial({color:'#d7ae6e',metalness:.55,roughness:.32});
 let realSkids=0,realPlank=0,realCarbon=0;
 root.traverse(o=>{
   if(!(o instanceof THREE.Mesh))return;
   o.visible=cutawayIsActualPart(o.name);
   if(!o.visible)return;
   if(o.name.includes('composite-plank')){o.material=tan;realPlank++;}
   else if(o.name==='EP004-carbon-floor'||o.name.includes('floor-edge')||o.name.includes('carbon-underfloor')){o.material=carbon;realCarbon++;}
   else if(o.name.startsWith('EP004-skid-')) {
     o.material=o.name.includes('fastener')?brass:silver;
     if(o.userData.metalSkid===true)realSkids++;
   }
   o.castShadow=false;
 });
 if(realSkids<3||realPlank<3||realCarbon<1)
   throw new Error('Technical cutaway missing actual integrated car materials');
 return root;
}
export const StoryMechanicalCutaway:React.FC<{motion:VehicleMotionState}>=({motion})=>{
 const root=useMemo(cutawayModel,[]);
 useEffect(()=>()=>disposeObject(root),[root]);
 applyF1HeroMotion(root,motion,1);
 return <primitive object={root}/>;
};
