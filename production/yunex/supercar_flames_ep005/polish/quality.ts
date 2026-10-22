/**
 * EP005 Agent 6 — restrained material/geometry finish over Agent 1's real car.
 * All new elements live on existing V3 body-shell or wheel-roll; exhaust tubes,
 * mounts, driver controls, wheelbase and Agent 1 geometry are never replaced.
 */
import * as THREE from 'three';
import {vehicleSpec} from '../../../../src/yunex/world-kit/catalog.ts';
import {bodyHalfWidth} from '../../../../src/yunex/world-kit/vehicle-body.ts';
const PREFIX='ep005-a6-';
type V3=[number,number,number];
function mat(color:string,roughness:number,metalness:number,clearcoat=0,emissive='#000000',emissiveIntensity=0){
 const m=new THREE.MeshPhysicalMaterial({color,roughness,metalness,clearcoat,clearcoatRoughness:.10,emissive,emissiveIntensity,side:THREE.DoubleSide});
 m.userData.baseline={opacity:m.opacity,transparent:m.transparent,depthWrite:m.depthWrite,emissive:m.emissive.getHex(),intensity:m.emissiveIntensity};
 m.userData.shaderTransparent=m.transparent;
 return m;
}
function add(parent:THREE.Object3D,name:string,g:THREE.BufferGeometry,m:THREE.Material,p:V3,r:V3=[0,0,0]){
 const o=new THREE.Mesh(g,m);o.name=PREFIX+name;o.position.set(...p);o.rotation.set(...r);
 o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;
}
function path(parent:THREE.Object3D,name:string,points:V3[],thickness:number,m:THREE.Material){
 return add(parent,name,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),Math.max(20,points.length*9),thickness,6,false),m,[0,0,0]);
}
/** Idempotent when called on a single already-constructed Agent 1 hero. */
export function applyEp005HeroPolish(hero:THREE.Group):THREE.Group{
 if(hero.userData.ep005A6Polished)return hero;
 const shell=hero.getObjectByName('body-shell');
 if(!shell)throw Error('Agent 6 requires a fresh EP005/V3 body-shell');
 for(const name of ['mount:exhaust-tip-left','mount:exhaust-tip-right']){
  if(!hero.getObjectByName(name))throw Error('Agent 1 exhaust port absent: '+name);
 }
 const spec=vehicleSpec('supercar');
 const graphite=mat('#111a20',.28,.55,.4),titanium=mat('#b0bac1',.20,.9,.5);
 const carbon=mat('#17242b',.36,.36,.55),highlight=mat('#66b7b5',.22,.5,.8);
 const brakeMetal=mat('#788992',.35,.86,.12),brakeHeat=mat('#82564b',.40,.76,.15);
 const iridescent=mat('#243e4d',.16,.61,1);
 // Optical highlight ribbons track actual authored body width; they do not flatten the shell.
 for(const side of [-1,1] as const){
  const shoulder:V3[]=[];
  for(let i=0;i<=17;i++){
   const x=-1.13+2.53*i/17,y=.62+.028*Math.sin(i/17*Math.PI);
   shoulder.push([x,y,side*(bodyHalfWidth(spec,x,y)+.018)]);
  }
  path(shell,'shoulder-specular-'+side,shoulder,.006,iridescent);
  const sill:V3[]=[];
  for(let i=0;i<=15;i++){
   const x=-1.15+i/15*2.43,y=.235;
   sill.push([x,y,side*(bodyHalfWidth(spec,x,y)+.023)]);
  }
  path(shell,'split-carbon-sill-'+side,sill,.012,graphite);
  // A discreet forged side-blade and flush leading fin enrich silhouette, not generic boxes.
  path(shell,'front-canard-'+side,[
   [1.63,.315,side*.79],[1.82,.314,side*.865],[2.02,.298,side*.80]
  ],.014,carbon);
  add(shell,'rear-fender-vent-'+side,new THREE.BoxGeometry(.20,.016,.012),graphite,[-1.28,.69,side*.94],[0,side*.11,side*.07]);
  for(let k=0;k<3;k++)add(shell,'fender-vent-slat-'+side+'-'+k,
   new THREE.BoxGeometry(.165,.008,.011),titanium,[-1.25,.73+k*.022,side*.947],[0,0,side*.08]);
  // Thin nose accent catches a tight specular glint without toy-neon body fill.
  path(shell,'front-lamp-eyebrow-'+side,[
   [2.12,.59,side*.49],[2.04,.60,side*.66],[1.89,.57,side*.81]
  ],.007,highlight);
 }
 // Rear diffuser blades remain ABOVE road and clear of Agent 1's 85mm outlet bores.
 for(const z of [-.69,-.28,.28,.69]){
  add(shell,'diffuser-air-fence-'+String(z),new THREE.BoxGeometry(.48,.080,.010),
   carbon,[-2.12,.19,z],[0,0,0]);
 }
 // Brake rotor and wheel detail are mounted in original rotating wheels, not static hubs.
 for(const side of ['front-left','front-right','rear-left','rear-right']){
  const pivot=hero.getObjectByName('mount-'+side);
  const wheel=pivot?.getObjectByName('wheel-roll');
  if(!pivot||!wheel)throw Error('Original V3 rolling wheel absent: '+side);
  const sign=side.endsWith('left')?1:-1,z=sign*.152,r=spec.radius;
  add(wheel,'rotor-microgroove-'+side,new THREE.TorusGeometry(r*.49,.0035,6,64),
   brakeMetal,[0,0,z],[0,0,0]);
  add(wheel,'rim-chamfer-'+side,new THREE.TorusGeometry(r*.755,.005,8,64),
   titanium,[0,0,sign*.15],[0,0,0]);
  for(let i=0;i<5;i++){
   const a=i*2*Math.PI/5;
   add(wheel,'forged-spoke-highlight-'+side+'-'+i,
    new THREE.BoxGeometry(r*.225,.013,.010),i%2?brakeMetal:titanium,
    [Math.cos(a)*r*.29,Math.sin(a)*r*.29,sign*.151],[0,0,a]);
  }
  // Brake caliper touches the steering mount, NOT wheel-roll, so it won't spin.
  add(pivot,'caliper-inset-'+side,new THREE.BoxGeometry(.10,.075,.022),
   brakeHeat,[r*.47,r*.08,sign*.149],[0,0,0]);
 }
 hero.userData.ep005A6Polished=true;
 hero.updateMatrixWorld(true);
 return hero;
}
export function countEp005PolishDetails(hero:THREE.Object3D):number{
 let count=0;hero.traverse(n=>{if(n.name.startsWith(PREFIX))count++;});return count;
}
