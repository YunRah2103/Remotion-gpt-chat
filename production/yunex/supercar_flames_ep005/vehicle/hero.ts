/** EP005 bespoke supercar. Source rig; GLB is NOT an animated replacement. */
import * as T from 'three';
import {createCinematicVehicle} from '../../../../src/yunex/modelling-kit/rig.ts';
import {applyEdits,buildComponents} from '../../../../src/yunex/modelling-kit/authoring.ts';
import type {EpisodeRecipe} from '../../../../src/yunex/modelling-kit/recipe.ts';
import input from '../../../../src/yunex/studio-projects/ep005-a1-hero/recipe.json';
import contract from './exhaust-contract.json';

export const HERO_RECIPE=input as unknown as EpisodeRecipe;
export const EP005_EXHAUST_MOUNTS=['exhaust-tip-left','exhaust-tip-right'] as const;
export type ExhaustOutlet={name:typeof EP005_EXHAUST_MOUNTS[number];mount:T.Object3D;position:T.Vector3;direction:T.Vector3;innerRadius:number};

/** Metadata for cutaway fades used by V3's existing animator. */
function registeredMaterial(mat:T.MeshStandardMaterial){
 mat.userData.baseline={opacity:mat.opacity,transparent:mat.transparent,depthWrite:mat.depthWrite,emissive:mat.emissive.getHex(),intensity:mat.emissiveIntensity};
 mat.userData.shaderTransparent=mat.transparent;
 return mat;
}
function paint(hex:string,metalness:number,roughness:number,emission?:string){
 return registeredMaterial(new T.MeshPhysicalMaterial({color:hex,metalness,roughness,clearcoat:.95,clearcoatRoughness:.13,emissive:emission??'#000000',emissiveIntensity:emission ? .55 : 0,side:T.DoubleSide}));
}
function add(parent:T.Object3D,name:string,geo:T.BufferGeometry,mat:T.Material,pos:[number,number,number],rot:[number,number,number]=[0,0,0]){
 const m=new T.Mesh(geo,mat);m.name=name;m.position.set(...pos);m.rotation.set(...rot);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
/**
 * Creates a fresh original V3 supercar with the private suspension/driver/engine
 * WeakMap registrations intact. Never clone or editModel() this animated vehicle.
 * Coordinates: metres, +X forwards, +Y up, +Z left.
 */
export function createEp005Hero():T.Group{
 const options=HERO_RECIPE.vehicle;
 const hero=createCinematicVehicle({...options,variant:'supercar',quality:'hero',lights:true,optimize:false,steeringSide:'right'});
 hero.name='ep005-sculpted-supercar';
 if(options.components)buildComponents(hero,options.components);
 if(options.model)applyEdits(hero,options.model);
 const shell=hero.getObjectByName('body-shell');
 if(!shell)throw new Error('EP005 requires original V3 body-shell rig');
 const dark=paint('#080f16',.22,.58),forged=paint('#1c272f',.55,.28);
 const alloy=paint('#b8c7cc',.94,.21),red=paint('#e52c2b',.08,.33,'#df1215');
 const cyan=paint('#31d1ce',.08,.32,'#0c8086');

 // Hollow OUTLET barrels, internal recesses, heat-shield lips and retainer bolts.
 // The real named emission anchor is fixed to each tube; it is not an independent
 // point floating in world space or parented to the chassis rather than body shell.
 for(const sign of [1,-1] as const){
  const side=sign>0?'left':'right',z=sign*.57;
  const barrel=add(shell,`ep005-${side}-nozzle-barrel`,
   new T.CylinderGeometry(.105,.105,.22,48,2,true),alloy,[-2.355,.42,z],[0,0,Math.PI/2]);
  barrel.userData.role='open-ended stainless exhaust shroud';
  add(shell,`ep005-${side}-nozzle-interior`,
   new T.CylinderGeometry(.085,.085,.222,48,1,true),dark,[-2.357,.42,z],[0,0,Math.PI/2]);
  add(shell,`ep005-${side}-rolled-lip`,
   new T.TorusGeometry(.099,.009,10,52),alloy,[-2.465,.42,z],[0,-Math.PI/2,0]);
  add(shell,`ep005-${side}-heat-shield`,
   new T.TorusGeometry(.124,.007,8,48),forged,[-2.30,.42,z],[0,-Math.PI/2,0]);
  for(let i=0;i<6;i++){const a=i*Math.PI/3;
   add(shell,`ep005-${side}-nozzle-retainer-${i}`,
    new T.SphereGeometry(.007,8,6),forged,[-2.46,.42+Math.sin(a)*.119,z+Math.cos(a)*.119]);
  }
  // Twin recessed light blades, instead of a broad illuminated rectangle.
  for(let n=0;n<2;n++)add(shell,`ep005-${side}-lightblade-${n}`,
   new T.BoxGeometry(.018,.012,.275),red,[-2.375,.678+n*.036,sign*.75]);
  // A visible open mesh grille occupies body-adjacent space, not the pipe exit.
  for(let n=0;n<5;n++)add(shell,`ep005-${side}-rear-grille-${n}`,
   new T.BoxGeometry(.018,.011,.24),dark,[-2.373,.73+n*.035,sign*.31]);
 }
 for(let i=0;i<4;i++)add(shell,`ep005-diffuser-strake-${i}`,
  new T.BoxGeometry(.51,.12,.013),forged,[-2.11,.21,(i-1.5)*.31]);
 // Wing profiles and dashboard are already component-driven (jointTracks work).
 // Fine cabin details retain original steering, pedals, seats and dummy hardpoints.
 const dash=hero.getObjectByName('dashboard');
 if(dash){
  for(let i=0;i<9;i++)add(dash,`ep005-shift-light-${i}`,
   new T.BoxGeometry(.008,.008,.019),i<6?cyan:red,[.033,.125,(i-4)*.028]);
 }
 const interior=hero.getObjectByName('interior');
 if(interior){
  add(interior,'ep005-leather-tunnel-inlay',new T.BoxGeometry(.48,.009,.11),forged,[-.20,.54,0]);
  for(const side of [-1,1])add(interior,`ep005-harness-chest-guide-${side}`,
   new T.BoxGeometry(.045,.007,.135),forged,[-.21,.68,side*.44]);
 }
 for(const spec of contract.ports){
  const mount=hero.getObjectByName(spec.node);
  if(!mount||!mount.parent||mount.parent.name!==spec.component)throw new Error(`Unfitted EP005 exhaust mount: ${spec.id}`);
  const expected=new T.Vector3(spec.position[0],spec.position[1],spec.position[2]);
  if(mount.position.distanceTo(expected)>1e-6)throw new Error(`Moved EP005 outlet: ${spec.id}`);
  mount.userData.nozzleInnerRadius=spec.innerRadius;
  mount.userData.nozzleOuterRadius=spec.outerRadius;
  mount.userData.exitDirection=[...spec.direction];
 }
 hero.updateMatrixWorld(true);
 return hero;
}
/** Read dynamically, after rig animation AND car world route placement. */
export function resolveEp005ExhaustPorts(vehicle:T.Group):ExhaustOutlet[]{
 vehicle.updateMatrixWorld(true);
 return contract.ports.map(spec=>{
  const mount=vehicle.getObjectByName(spec.node);
  if(!mount)throw new Error(`Missing EP005 exhaust mount: ${spec.node}`);
  const dir=new T.Vector3(spec.direction[0],spec.direction[1],spec.direction[2]).transformDirection(mount.matrixWorld).normalize();
  return {name:spec.id as ExhaustOutlet['name'],mount,position:mount.getWorldPosition(new T.Vector3()),direction:dir,innerRadius:spec.innerRadius};
 });
}
