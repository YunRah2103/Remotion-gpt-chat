/**
 * EP005 / V3 rear optical and bumper finish.
 *
 * A continuous pair of body-hugging smoked lamp lenses replaces three
 * conflicting generations of retrofitted rectangles and glowing tubes.
 * The lenses are physically curved in the rear X plane and are authored as
 * smooth, indexed meshes rather than a collection of bright props.
 *
 * Vehicle-local axes: +X forward, +Y upward, +Z driver side/left.
 * This stays within the A1 animated body-shell; Agent 2 exhaust mounts, wheel
 * pivots, and the active rear wing are deliberately untouched.
 */
import * as T from 'three';

type PatchOptions={
 name:string;
 side:-1|1;
 halfHeight:number;
 xOffset:number;
 material:T.Material;
 yOffset?:number;
};

function smooth(t:number){const u=T.MathUtils.clamp(t,0,1);return u*u*(3-2*u);}
function glass(color:string,emissive:string,intensity:number,roughness:number,transparent=false){
 const m=new T.MeshPhysicalMaterial({
  color,metalness:.05,roughness,clearcoat:1,clearcoatRoughness:.11,
  emissive,emissiveIntensity:intensity,
  side:T.DoubleSide,transparent,opacity:transparent?.89:1,depthWrite:!transparent,
  envMapIntensity:1.4,
 });
 m.userData.baseline={
  opacity:m.opacity,transparent:m.transparent,depthWrite:m.depthWrite,
  emissive:m.emissive.getHex(),intensity:m.emissiveIntensity
 };
 m.userData.shaderTransparent=m.transparent;
 return m;
}
/** One curving continuous lens surface. Both edges taper to a rounded end. */
function lampPatch(shell:T.Object3D,o:PatchOptions){
 const columns=48,rows=8,positions:number[]=[],indices:number[]=[];
 for(let i=0;i<=columns;i++){
  const u=i/columns;
  const z=o.side*(.432+.488*u);
  const taper=.13+.87*Math.pow(Math.max(0,1-Math.pow(2*u-1,4)),.48);
  const centerY=.732+.018*Math.sin(Math.PI*u)-.041*smooth((u-.78)/.22)+(o.yOffset??0);
  const depth=-2.366+.041*smooth((u-.72)/.28)-.007*Math.sin(Math.PI*u)+o.xOffset;
  for(let j=0;j<=rows;j++){
   const v=j/rows;
   // Cross-lens crown catches highlights; it isn't a flat rectangular plate.
   const x=depth-.0028*(1-Math.pow(2*v-1,2));
   positions.push(x,centerY+(2*v-1)*o.halfHeight*taper,z);
  }
 }
 for(let i=0;i<columns;i++)for(let j=0;j<rows;j++){
  const a=i*(rows+1)+j,b=a+rows+1;
  indices.push(a,a+1,b,a+1,b+1,b);
 }
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 geometry.setIndex(indices);geometry.computeVertexNormals();
 geometry.computeBoundingBox();geometry.computeBoundingSphere();
 const surface=new T.Mesh(geometry,o.material);
 surface.name=o.name;surface.castShadow=false;surface.receiveShadow=false;
 shell.add(surface);
 return surface;
}
const rejectedRearNames=new Set([
 'tail-lamp-housing','tail-light-strip','rear-reflector',
 'ep005-tail-light-left','ep005-tail-light-right'
]);
/**
 * Do not hide front headlamps with shared V3 lens/bucket names.
 * Nested parts are located in body-shell local coordinates before filtering.
 */
function hideOldRearOptics(shell:T.Object3D){
 shell.updateMatrixWorld(true);
 let hidden=0;
 shell.traverse(o=>{
  if(!(o instanceof T.Mesh))return;
  const p=shell.worldToLocal(o.getWorldPosition(new T.Vector3()));
  const legacyShared=p.x < -1.78&&
   (o.name==='lamp-bucket'||o.name==='lamp-lens'||o.name==='lamp-reflector');
  const bespokeBars=o.name.startsWith('overhaul-rear-led-')||
   /^ep005-(left|right)-rear-grille-/.test(o.name);
  if(rejectedRearNames.has(o.name)||legacyShared||bespokeBars){
   o.visible=false;hidden++;
  }
 });
 if(hidden<8)throw new Error('Expected multiple generations of rear light assemblies');
 return hidden;
}
export function refineEp005RearFinish(hero:T.Group):T.Group{
 if(hero.userData.ep005RearFinishVersion)throw new Error('Rear finish already applied');
 const shell=hero.getObjectByName('body-shell');
 if(!shell)throw new Error('EP005 moving body shell not found');
 // The source exhaust mounts are immutable during optical finishing.
 const mountNames=['mount:exhaust-tip-left','mount:exhaust-tip-right'];
 const mounts=mountNames.map(name=>{
  const o=hero.getObjectByName(name);
  if(!o||!o.parent||!o.parent.name.includes('exhaust-tube'))
   throw new Error('Missing live physical tailpipe: '+name);
  return {o,parent:o.parent,position:o.position.clone(),quaternion:o.quaternion.clone()};
 });
 const hidden=hideOldRearOptics(shell);
 const housing=glass('#111c23','#000000',0,.34);
 const smoked=glass('#32171c','#070101',.06,.17,true);
 const diffuser=glass('#d63840','#e41b24',.76,.23);
 for(const side of [-1,1] as const){
  const tag=side===1?'left':'right';
  lampPatch(shell,{
   name:'ep005-integrated-tail-housing-'+tag,
   side,halfHeight:.054,xOffset:.009,material:housing
  });
  lampPatch(shell,{
   name:'ep005-continuous-smoked-tail-lens-'+tag,
   side,halfHeight:.046,xOffset:0,material:smoked
  });
  lampPatch(shell,{
   name:'ep005-flush-diffused-led-'+tag,
   side,halfHeight:.0068,xOffset:-.011,yOffset:.009,material:diffuser
  });
 }
 for(const item of mounts){
  if(item.o.parent!==item.parent||
    item.o.position.distanceTo(item.position)>1e-9||
    item.o.quaternion.angleTo(item.quaternion)>1e-9)
   throw new Error('Rear optical finishing moved the exhaust ABI');
 }
 hero.userData.ep005RearFinishVersion=3;
 hero.userData.ep005SupersededRearOptics=hidden;
 hero.updateMatrixWorld(true);
 return hero;
}
