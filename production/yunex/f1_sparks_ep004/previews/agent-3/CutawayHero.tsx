/** Optical technical cutaway: uses unmodified Agent 1 FULL hero factory.
 * Only hides foreground geometry for macro readability. All actual mesh
 * positions, plank/skids, Agent 2 contact timing remain unchanged.
 */
import React,{useEffect,useMemo} from 'react';
import * as THREE from 'three';
import {buildF1HeroVehicle,applyF1HeroMotion} from '../../mechanics/index.ts';
import {disposeObject} from '../../../../../src/yunex/world-kit/geometry.ts';
import type {VehicleMotionState} from '../../shared/contract.ts';

const VISIBLE_TECHNICAL_PARTS=[
 'EP004-skid-',
 'EP004-composite-plank-',
 'EP004-plank-mount',
 'EP004-carbon-underfloor-strake',
];
export const CUTAWAY_MASK_DESCRIPTION='Actual Agent 1 metal skid and composite plank, optical-only shell removal';
export function shouldShowOnUnderfloorSection(meshName:string):boolean {
 return VISIBLE_TECHNICAL_PARTS.some(prefix=>meshName.startsWith(prefix));
}
export const CutawayHero:React.FC<{motion:VehicleMotionState}>=({motion})=>{
 const model=useMemo(()=>buildF1HeroVehicle(),[]);
 useEffect(()=>()=>disposeObject(model),[model]);
 applyF1HeroMotion(model,motion,1);
 model.traverse(node=>{
   if(node instanceof THREE.Mesh)node.visible=shouldShowOnUnderfloorSection(node.name);
 });
 return <primitive object={model}/>;
};
