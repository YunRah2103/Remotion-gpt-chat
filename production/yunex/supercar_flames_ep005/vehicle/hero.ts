/** EP005 bespoke supercar. Source rig; GLB is NOT an animated replacement. */
import * as T from 'three';
import {createCinematicVehicle} from '../../../../src/yunex/modelling-kit/rig.ts';
import {applyEdits,buildComponents} from '../../../../src/yunex/modelling-kit/authoring.ts';
import type {EpisodeRecipe} from '../../../../src/yunex/modelling-kit/recipe.ts';
import input from '../../../../src/yunex/studio-projects/ep005-a1-hero/recipe.json';
import contract from './exhaust-contract.json';
import {applyEp005PremiumDetails} from './premium-details.ts';
import {applyEp005CoachbuiltOverhaul} from './coachbuilt-overhaul.ts';
import {resculptEp005Supercar} from './body-proportions.ts';

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

 // Modelled recessed twin 116mm tips, replacing former 210mm megaphones.
 // Named emission nodes continue following real tube meshes on the V3 body.
 hero.traverse(o=>{if(o.name==='exhaust-tip'||o.name==='exhaust-bore')o.visible=false;});
 for(const sign of [1,-1] as const){
  const side=sign>0?'left':'right',z=sign*.57;
  // A 68mm feed transitions into the 88mm clear opening without solid plug.
  add(shell,'ep005-'+side+'-tapered-nozzle-transition',
   new T.CylinderGeometry(.044,.034,.125,48,3,true),dark,[-2.3175,.42,z],[0,0,Math.PI/2]);
  const barrel=add(shell,'ep005-'+side+'-nozzle-barrel',
   new T.CylinderGeometry(.058,.058,.120,48,2,true),alloy,[-2.320,.42,z],[0,0,Math.PI/2]);
  barrel.userData.role='116mm outside stainless tip, close to bumper';
  add(shell,'ep005-'+side+'-nozzle-interior',
   new T.CylinderGeometry(.044,.044,.084,48,1,true),dark,[-2.338,.42,z],[0,0,Math.PI/2]);
  add(shell,'ep005-'+side+'-rolled-lip',
   new T.TorusGeometry(.055,.0025,9,48),alloy,[-2.380,.42,z],[0,-Math.PI/2,0]);
  add(shell,'ep005-'+side+'-bumper-recess-surround',
   new T.RingGeometry(.060,.065,48),forged,[-2.348,.42,z],[0,-Math.PI/2,0]);
  for(let n=0;n<2;n++)add(shell,'ep005-'+side+'-lightblade-'+n,
   new T.BoxGeometry(.018,.012,.275),red,[-2.375,.678+n*.036,sign*.75]);
  for(let n=0;n<5;n++)add(shell,'ep005-'+side+'-rear-grille-'+n,
   new T.BoxGeometry(.018,.011,.24),dark,[-2.373,.73+n*.035,sign*.31]);
 }
 for(let i=0;i<4;i++)add(shell,'ep005-diffuser-strake-'+i,
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
  mount.userData.radius=spec.innerRadius;
  mount.userData.direction=[...spec.direction];
  mount.userData.nozzleInnerRadius=spec.innerRadius;
  mount.userData.nozzleOuterRadius=spec.outerRadius;
  mount.userData.exitDirection=[...spec.direction];
 }
 applyEp005PremiumDetails(hero);
 applyEp005CoachbuiltOverhaul(hero);
 resculptEp005Supercar(hero);
 // V3 remembers shader material fade baselines *before* episode components
 // are authored. Register fresh episode materials so engine cutaways reveal
 // genuine internals rather than leaving opaque aftermarket geometry.
 hero.traverse(o=>{
  if(!(o instanceof T.Mesh))return;
  const all=Array.isArray(o.material)?o.material:[o.material];
  for(const m of all)if(m instanceof T.MeshStandardMaterial&&!m.userData.baseline){
   m.userData.baseline={opacity:m.opacity,transparent:m.transparent,depthWrite:m.depthWrite,emissive:m.emissive.getHex(),intensity:m.emissiveIntensity};
   m.userData.shaderTransparent=m.transparent;
  }
 });
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
