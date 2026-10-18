import * as T from 'three';
import {routeLength,sampleRoute} from '../../world-kit/environments.ts';
import {clamp01,heatLuminance} from './math.ts';

export const BRAKING_PALETTE = Object.freeze({
  paint:'#35546e', glass:'#263f50', forgedMetal:'#9faab1',
  caliper:'#d2a36c', tyre:'#181c1f', asphalt:'#404950',
  shadows:'#1c2c33', sky:'#b9ced5', sun:'#fff1d9'
});
type Role='paint'|'glass'|'rubber'|'metal'|'caliper'|'trim'|'asphalt'|'runoff'|'kerb'|'background'|'original';
const roleForVehicle=(m:T.Mesh,material:T.Material):Role=>{
  const n=m.name, parent=m.parent?.name||'';
  if(n==='brake-caliper')return 'caliper';
  if(['arched-body','roof','mirror','rear-spoiler'].includes(n))return 'paint';
  if(['windshield','rear-glass','side-glass'].includes(n))return 'glass';
  if(['sill','grille','underbody','front-lip','rear-diffuser'].includes(n))return 'trim';
  if(material instanceof T.MeshStandardMaterial){
    const c=material.color.getHexString();
    if(c==='35546e')return 'paint';
    if(c==='15191c')return 'rubber';
    if(c==='abb9bf'||c==='647079')return 'metal';
  }
  if(parent==='wheel-roll')return 'metal';
  return 'original';
};
const roleForWorld=(m:T.Mesh):Role=>{
  if(m.name==='circuit-asphalt')return 'asphalt';
  if(m.name==='runoff')return 'runoff';
  if(m.name==='red-white-curbs')return 'kerb';
  if(m.name==='terrain'||m.name==='grandstand-roof')return 'background';
  return 'original';
};
function tune(original:T.Material,role:Role):T.Material {
  const m=original.clone();
  if(!(m instanceof T.MeshStandardMaterial))return m;
  if(role==='paint'){
    m.color.set(BRAKING_PALETTE.paint);m.metalness=.46;m.roughness=.26;
    if(m instanceof T.MeshPhysicalMaterial){
      m.clearcoat=.87;m.clearcoatRoughness=.16;
    }
  } else if(role==='glass'){
    m.color.set(BRAKING_PALETTE.glass);m.metalness=.27;m.roughness=.12;
    if(m instanceof T.MeshPhysicalMaterial){m.clearcoat=1;m.clearcoatRoughness=.09;}
  } else if(role==='rubber'){
    m.color.set(BRAKING_PALETTE.tyre);m.metalness=.01;m.roughness=.93;
  } else if(role==='metal'){
    m.color.set(BRAKING_PALETTE.forgedMetal);m.metalness=.82;m.roughness=.35;
  } else if(role==='caliper'){
    m.color.set(BRAKING_PALETTE.caliper);m.metalness=.58;m.roughness=.31;
    if(m instanceof T.MeshPhysicalMaterial)m.clearcoat=.34;
  } else if(role==='trim'){
    m.color.set('#18252c');m.metalness=.23;m.roughness=.51;
  } else if(role==='asphalt'){
    m.color.set(BRAKING_PALETTE.asphalt);m.metalness=.015;m.roughness=.98;
    m.side=T.DoubleSide;
  } else if(role==='runoff'){
    m.color.set('#aaa18f');m.metalness=0;m.roughness=1;m.side=T.DoubleSide;
  } else if(role==='background'){
    m.roughness=Math.max(m.roughness,.78);
  } else if(role==='kerb'){
    m.roughness=.75;m.metalness=.02;
  }
  m.needsUpdate=true;
  return m;
}
/**
 * Apply the finish ONLY to an episode-local, newly created kit object.
 * Original kit source and geometry are never touched. Materials are cloned and
 * old detached materials are disposed. Caller disposes finished model on unmount.
 */
function finishObject(root:T.Object3D,role:(mesh:T.Mesh,mat:T.Material)=>Role):void {
  const copies=new Map<T.Material,Map<Role,T.Material>>();
  const old=new Set<T.Material>();
  root.traverse((obj)=>{
    if(!(obj instanceof T.Mesh))return;
    const ref=(mat:T.Material):T.Material=>{
      old.add(mat);
      const selected=role(obj,mat);let byRole=copies.get(mat);
      if(!byRole){byRole=new Map();copies.set(mat,byRole);}
      let result=byRole.get(selected);
      if(!result){result=tune(mat,selected);byRole.set(selected,result);}
      return result;
    };
    obj.material=Array.isArray(obj.material)?obj.material.map(ref):ref(obj.material);
  });
  old.forEach(m=>m.dispose());
}
export function finishKitCar(root:T.Object3D):void {finishObject(root,roleForVehicle);}
export function finishKitCircuit(root:T.Object3D):void {finishObject(root,(m)=>roleForWorld(m));}

/** A1 hook: a freshly allocated material for their mesh, never geometry edits.
 * Values are artistic cues, NOT measured disc temperature. Dispose returned
 * material with its assembly; replace per render/shot rather than each frame. */
export function makeBrakeMaterial(role:'disc'|'pad'|'caliper',heatIllustration01=0):T.MeshStandardMaterial {
  const heat=heatLuminance(heatIllustration01);
  if(role==='disc')return new T.MeshStandardMaterial({
    color:'#828c8f',metalness:.86,roughness:.37,
    emissive:'#a74a18',emissiveIntensity:heat
  });
  if(role==='pad')return new T.MeshStandardMaterial({
    color:'#303333',metalness:.23,roughness:.83,
    emissive:'#a74a18',emissiveIntensity:heat*.55
  });
  return new T.MeshStandardMaterial({
    color:BRAKING_PALETTE.caliper,metalness:.56,roughness:.30,
    emissive:'#bd6229',emissiveIntensity:heat*.20
  });
}
/** Low-cost asphalt aggregate, restricted to the original kit road surface.
 * Per-instance deterministic positions. NO replacement road mesh or UV rewrite. */
export function createAsphaltGrain(seed=12,count=1800):T.InstancedMesh {
  let state=(seed|0)>>>0;
  const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const geometry=new T.PlaneGeometry(1,1);
  const material=new T.MeshBasicMaterial({
    color:'#b2b7b8',transparent:true,opacity:.105,depthWrite:false,
    side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1
  });
  const mesh=new T.InstancedMesh(geometry,material,count),dummy=new T.Object3D();
  mesh.name='braking-lookdev-asphalt-grain';
  const length=routeLength('track');
  for(let i=0;i<count;i++){
    const d=rand()*length,offset=(rand()-.5)*10.35,route=sampleRoute('track',d);
    dummy.position.set(route.position[0]+Math.sin(route.yaw)*offset,.0105,
                       route.position[2]+Math.cos(route.yaw)*offset);
    dummy.rotation.order='YXZ';dummy.rotation.set(-Math.PI/2,route.yaw,0);
    dummy.scale.set(.025+rand()*.10,.04+rand()*.19,1);dummy.updateMatrix();
    mesh.setMatrixAt(i,dummy.matrix);
    const shade=.46+rand()*.31;
    mesh.setColorAt(i,new T.Color().setRGB(shade,shade,shade));
  }
  mesh.instanceMatrix.needsUpdate=true;
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  mesh.frustumCulled=false;return mesh;
}
export const heatLightIntensity=(heatIllustration01:number):number=>
  1.1*heatLuminance(clamp01(heatIllustration01));
