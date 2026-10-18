import * as T from 'three';
import {routeLength,sampleRoute} from '../../world-kit/environments.ts';
import type {BrakingSimulationState} from '../contracts.ts';

export const BRAKING_PALETTE=Object.freeze({
  paint:'#35546e',glass:'#19303e',forgedMetal:'#a0a9ad',
  caliper:'#d2a36c',tyre:'#171a1c',asphalt:'#2d3439',
  shadows:'#112029',sky:'#9eb9c7',sun:'#fff0d2'
});
export const clamp01=(v:number)=>Number.isFinite(v)?Math.min(1,Math.max(0,v)):0;
/** Intentionally indicative of transient surface illumination; not a measured disc temperature.
 * The budget is Agent 2's pad/rotor work and is not all kinetic-energy dissipation. */
export function illustrativeHeatFromEnergy(state?:BrakingSimulationState):number {
  if(!state)return 0;
  const energetic=clamp01(state.brakeHeatJ/1600000);
  const braking=clamp01((state.wheel['front-left'].brakePressure01-.12)/.70);
  const motion=clamp01((state.speedMps-2)/19);
  return clamp01(energetic*braking*motion);
}
type Role='paint'|'glass'|'tyre'|'brushed'|'cast-iron'|'caliper'|'trim'|'asphalt'|'runoff'|'barrier'|'grass'|'structure'|'other';
const rolesForCar=(mesh:T.Mesh,material:T.Material):Role=>{
  const n=mesh.name;
  if(n==='rotor-drilled-face'||n==='rotor-outer-lip'||n==='concentric-machining'||n==='curved-ventilation-vane')return 'cast-iron';
  if(n==='sculpted-forged-caliper-cheek'||n==='top-bridge'||n==='lower-cross-member'||n==='brake-caliper')return 'caliper';
  if(['hub-step','hub-fastener','piston-boss-shoulder','hydraulic-piston','hub-cap','bearing-hub','axle-cap','bleed-screw','banjo-hydraulic-fitting'].includes(n))return 'brushed';
  if(['windshield','rear-glass','side-glass'].includes(n))return 'glass';
  if(['arched-body','roof','mirror','rear-spoiler'].includes(n))return 'paint';
  if(['underbody','sill','grille','front-lip','rear-diffuser','side-intake','piston-seal'].includes(n))return 'trim';
  if(material instanceof T.MeshStandardMaterial){
    const c=material.color.getHexString();
    if(c==='35546e')return 'paint';
    if(c==='15191c'||c==='171a1c')return 'tyre';
    if(c==='abb9bf'||c==='647079'||c==='a8b4bc')return 'brushed';
  }
  return 'other';
};
const roleForTrack=(m:T.Mesh):Role=>{
  if(m.name==='circuit-asphalt')return 'asphalt';
  if(m.name==='runoff')return 'runoff';
  if(m.name==='circuit-barriers')return 'barrier';
  if(m.name==='terrain'||m.name==='tree-crowns')return 'grass';
  if(['grandstand-roof','pit-garage','pit-door','grandstand','grandstand-support'].includes(m.name))return 'structure';
  return 'other';
};
function finish(material:T.Material,role:Role):T.Material {
  const next=material.clone();
  if(!(next instanceof T.MeshStandardMaterial))return next;
  if(role==='paint'){
    next.color.set(BRAKING_PALETTE.paint);
    next.metalness=.42;next.roughness=.355;next.envMapIntensity=.54;
    if(next instanceof T.MeshPhysicalMaterial){
      next.clearcoat=.61;next.clearcoatRoughness=.30;
      next.iridescence=0;
    }
  }else if(role==='glass'){
    next.color.set(BRAKING_PALETTE.glass);next.metalness=.18;
    next.roughness=.22;next.envMapIntensity=.46;
    if(next instanceof T.MeshPhysicalMaterial){
      next.clearcoat=.75;next.clearcoatRoughness=.23;
    }
  }else if(role==='tyre'){
    next.color.set(BRAKING_PALETTE.tyre);
    next.metalness=0;next.roughness=.94;next.envMapIntensity=.06;
  }else if(role==='brushed'){
    next.color.set('#a7b2b7');next.metalness=.79;next.roughness=.33;
    next.envMapIntensity=.66;
  }else if(role==='cast-iron'){
    next.color.set('#596166');next.metalness=.72;next.roughness=.52;
    next.envMapIntensity=.28;next.emissive=new T.Color('#a54b29');
    next.emissiveIntensity=0;
  }else if(role==='caliper'){
    next.color.set(BRAKING_PALETTE.caliper);
    next.metalness=.48;next.roughness=.39;
    next.envMapIntensity=.47;
    if(next instanceof T.MeshPhysicalMaterial){
      next.clearcoat=.55;next.clearcoatRoughness=.24;
    }
  }else if(role==='trim'){
    next.color.set('#15232b');next.metalness=.2;next.roughness=.60;
  }else if(role==='asphalt'){
    next.color.set(BRAKING_PALETTE.asphalt);next.metalness=0;
    next.roughness=.99;next.side=T.DoubleSide;
  }else if(role==='runoff'){
    next.color.set('#898577');next.metalness=0;next.roughness=1;
    next.side=T.DoubleSide;
  }else if(role==='barrier'){
    next.color.set('#657173');next.metalness=.30;next.roughness=.68;
  }else if(role==='grass'){
    next.color.set('#56644d');next.metalness=0;next.roughness=1;
  }else if(role==='structure'){
    next.color.set('#647078');next.metalness=.15;next.roughness=.80;
  }
  next.needsUpdate=true;return next;
}
export type FinishHandle={
  setHeat:(strength:number)=>void;
  dispose:()=>void;
  touchedMeshes:number;
};
/**
 * IMPORTANT: applies to the CALLER'S EXISTING instance, never makes a new
 * vehicle, track or brake assembly. Original material pointers remain valid.
 * Restore originals before destroying the caller's scene; dispose only OUR
 * replacement materials, never shared kit materials or mesh geometries.
 */
export function applyBrakingFinishes(root:T.Object3D,kind:'car'|'track'):FinishHandle {
  const patched: {mesh:T.Mesh;original:T.Material|T.Material[]}[]=[];
  const replacements=new Set<T.Material>();
  const ironMaterials=new Set<T.MeshStandardMaterial>();
  const clones=new Map<T.Material,Map<Role,T.Material>>();
  const roleFor=kind==='car'?rolesForCar:(m:T.Mesh)=>roleForTrack(m);
  root.traverse(obj=>{
    if(!(obj instanceof T.Mesh))return;
    const old=obj.material;
    const wrap=(material:T.Material):T.Material=>{
      const role=roleFor(obj,material);
      if(role==='other')return material;
      let variants=clones.get(material);
      if(!variants){variants=new Map();clones.set(material,variants);}
      let replacement=variants.get(role);
      if(!replacement){
        replacement=finish(material,role);variants.set(role,replacement);
        replacements.add(replacement);
      }
      if(role==='cast-iron'&&replacement instanceof T.MeshStandardMaterial)ironMaterials.add(replacement);
      return replacement;
    };
    const updated=Array.isArray(old)?old.map(wrap):wrap(old);
    const changed=Array.isArray(old)
      ?(updated as T.Material[]).some((v:T.Material,i:number)=>v!==old[i])
      :updated!==old;
    if(changed){
      patched.push({mesh:obj,original:old});
      obj.material=updated;
    }
  });
  let active=true;
  return {
    touchedMeshes:patched.length,
    setHeat:(strength)=>{
      if(!active)return;
      const e=.12*Math.pow(clamp01(strength),1.4);
      ironMaterials.forEach(mat=>{mat.emissiveIntensity=e;});
    },
    dispose:()=>{
      if(!active)return;
      active=false;
      patched.forEach(({mesh,original})=>{mesh.material=original;});
      replacements.forEach(mat=>mat.dispose());
      ironMaterials.clear();
    }
  };
}
/** Artist-owned road grain: independent sparse millimetre flecks, no new road.
 * CPU-software safe instances, seeded, with dark+light gravel variation. */
export function createAsphaltGrain(seed=12,count=4200):T.InstancedMesh{
  let state=(seed>>>0);
  const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const geo=new T.PlaneGeometry(1,1);
  const material=new T.MeshBasicMaterial({
    color:'#bec1bf',transparent:true,opacity:.14,depthWrite:false,
    side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1
  });
  const mesh=new T.InstancedMesh(geo,material,count),dummy=new T.Object3D();
  mesh.name='lookdev-existing-track-fine-aggregate';
  const length=routeLength('track');
  for(let i=0;i<count;i++){
    const d=rand()*length,across=(rand()-.5)*11.1,route=sampleRoute('track',d);
    dummy.position.set(route.position[0]+Math.sin(route.yaw)*across,.012,
      route.position[2]+Math.cos(route.yaw)*across);
    dummy.rotation.set(-Math.PI/2,route.yaw,0,'YXZ');
    dummy.scale.set(.015+rand()*.075,.018+rand()*.15,1);
    dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
    const tint=.23+rand()*.57;
    mesh.setColorAt(i,new T.Color().setRGB(tint,tint*.98,tint*.94));
  }
  mesh.instanceMatrix.needsUpdate=true;
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  mesh.frustumCulled=false;return mesh;
}
export function disposeOwnedObject(root:T.Object3D):void {
  const geos=new Set<T.BufferGeometry>(),mats=new Set<T.Material>();
  root.traverse(obj=>{
    if(obj instanceof T.InstancedMesh)obj.dispose();
    if(obj instanceof T.Mesh){
      geos.add(obj.geometry);
      (Array.isArray(obj.material)?obj.material:[obj.material]).forEach(m=>mats.add(m));
    }
  });
  geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());
}
