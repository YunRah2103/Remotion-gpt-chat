/**
 * EP005 physical-quality layer. Adds fitted geometry to a fresh V3 rig.
 * No clone/editModel(), no shared kit mutations, no absolute world-space parts.
 * All lengths are illustrative metres for a fictional mid-engine supercar.
 */
import * as T from 'three';
import {vehicleSpec} from '../../../../src/yunex/world-kit/catalog.ts';
import {bodyHalfWidth} from '../../../../src/yunex/world-kit/vehicle-body.ts';

type V3=[number,number,number];
function material(color:string,roughness:number,metalness:number,opts:{clearcoat?:number;coatRoughness?:number;emissive?:string;emission?:number}={}){
 const m=new T.MeshPhysicalMaterial({
  color,roughness,metalness,clearcoat:opts.clearcoat??0,
  clearcoatRoughness:opts.coatRoughness??.2,
  emissive:opts.emissive??'#000000',emissiveIntensity:opts.emission??0,
  side:T.DoubleSide
 });
 m.userData.baseline={opacity:m.opacity,transparent:m.transparent,depthWrite:m.depthWrite,emissive:m.emissive.getHex(),intensity:m.emissiveIntensity};
 m.userData.shaderTransparent=m.transparent;
 return m;
}
const mats=()=>({
 paint:material('#163951',.135,.55,{clearcoat:1,coatRoughness:.065}),
 carbon:material('#10191d',.31,.32,{clearcoat:.32,coatRoughness:.17}),
 carbonEdge:material('#202e36',.27,.53,{clearcoat:.45,coatRoughness:.12}),
 machined:material('#92aab5',.22,.88,{clearcoat:.5,coatRoughness:.11}),
 titanium:material('#42565d',.33,.85,{clearcoat:.23,coatRoughness:.16}),
 copper:material('#be8e67',.23,.77),
 rubber:material('#141a1e',.87,.03),
 suede:material('#26353f',.83,.02),
 suit:material('#273841',.72,.04),
 visor:material('#071c26',.06,.25,{clearcoat:1,coatRoughness:.045}),
 piping:material('#5ba7ae',.3,.39),
 lamps:material('#bd2227',.29,.18,{emissive:'#f3392d',emission:.6})
});
function mesh(p:T.Object3D,name:string,g:T.BufferGeometry,m:T.Material,pos:V3,rot:V3=[0,0,0]){
 const a=new T.Mesh(g,m);a.name=name;a.position.set(...pos);a.rotation.set(...rot);
 a.castShadow=true;a.receiveShadow=true;p.add(a);return a;
}
function tube(p:T.Object3D,name:string,points:V3[],r:number,m:T.Material){
 return mesh(p,name,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(a=>new T.Vector3(...a))),Math.max(24,points.length*12),r,8,false),m,[0,0,0]);
}
/** Diagnostic-friendly mechanical cladding, fitted to actual V3 assembly geometry. */
function boundsLocal(root:T.Object3D):T.Box3{
 root.updateMatrixWorld(true);
 const inverse=root.matrixWorld.clone().invert(),box=new T.Box3();
 root.traverseVisible(o=>{
  if(!(o instanceof T.Mesh))return;
  const geo=o.geometry;geo.computeBoundingBox();
  if(!geo.boundingBox)return;
  const corners=[
   ...[-1,1].flatMap(x=>[-1,1].flatMap(y=>[-1,1].map(z=>new T.Vector3(x<0?geo.boundingBox!.min.x:geo.boundingBox!.max.x,y<0?geo.boundingBox!.min.y:geo.boundingBox!.max.y,z<0?geo.boundingBox!.min.z:geo.boundingBox!.max.z))))
  ];
  const tr=inverse.clone().multiply(o.matrixWorld);
  for(const c of corners)box.expandByPoint(c.applyMatrix4(tr));
 });
 return box;
}
function enhanceEngine(engine:T.Object3D,m:ReturnType<typeof mats>){
 const b=boundsLocal(engine);
 if(b.isEmpty())return;
 const s=b.getSize(new T.Vector3()),c=b.getCenter(new T.Vector3());
 // Low profile central plenum between V-bank heads; do not hide the crankshaft
 // or the existing animated turbomachinery and pistons in a solid generic box.
 const long=Math.min(s.x*.46,.66),wide=Math.min(s.z*.34,.42);
 const top=b.max.y+.018;
 const cover=mesh(engine,'ep005-v8-plenum',new T.CapsuleGeometry(Math.max(.035,wide*.22),Math.max(.04,long*.42),4,16),m.carbonEdge,[c.x,top+.08,c.z],[0,0,Math.PI/2]);
 cover.scale.set(1,1.17,1.35);
 for(const side of [-1,1]){
  for(let i=0;i<4;i++){
   const x=c.x+(i-1.5)*Math.min(.105,long*.18),z=c.z+side*wide*.66;
   const h=mesh(engine,`ep005-v8-bank-${side}-rib-${i}`,new T.BoxGeometry(.022,.027,wide*.27),m.machined,[x,top+.025,z]);
   h.rotation.y=side*.16;
  }
  tube(engine,`ep005-v8-bank-${side}-oil-feed`,[
   [c.x-long*.48,top+.017,c.z+side*wide*.5],
   [c.x,top+.035,c.z+side*wide*.51],
   [c.x+long*.48,top+.017,c.z+side*wide*.5]
  ],.009,m.copper);
 }
 engine.userData.ep005EngineDetail=true;
}
/** Wheel detail is parented beneath wheel-roll, so spokes and nuts rotate correctly. */
function enhanceWheels(root:T.Group,m:ReturnType<typeof mats>){
 const mountNames=['mount-front-left','mount-front-right','mount-rear-left','mount-rear-right'];
 const spec=vehicleSpec('supercar'),r=spec.radius,w=.28;
 for(const name of mountNames){
  const pivot=root.getObjectByName(name);
  const roll=pivot?.getObjectByName('wheel-roll');
  if(!pivot||!roll)throw new Error(`Missing V3 steer/roll wheel: ${name}`);
  const sign=name.endsWith('left')?1:-1;
  const zz=sign*w*.53;
  // Forged stepped barrel seat plus rotating center-lock cap.
  mesh(roll,`ep005-${name}-forged-face`,new T.TorusGeometry(r*.64,.011,10,72),m.titanium,[0,0,zz]);
  mesh(roll,`ep005-${name}-outer-bead`,new T.TorusGeometry(r*.73,.006,8,72),m.machined,[0,0,zz-sign*.003]);
  mesh(roll,`ep005-${name}-centrelock`,new T.CylinderGeometry(.047,.047,.017,20,1,false),m.carbon,[0,0,zz+sign*.019],[Math.PI/2,0,0]);
  for(let i=0;i<10;i++){
   const a=i*Math.PI/5;
   mesh(roll,`ep005-${name}-rotating-bolt-${i}`,new T.CylinderGeometry(.006,.006,.009,8),m.titanium,[Math.cos(a)*r*.60,Math.sin(a)*r*.60,zz+sign*.005],[Math.PI/2,0,0]);
  }
  // Rotating rim trim only; native V3 brake-caliper remains stationary.
  pivot.userData.ep005WheelEnhanced=true;
 }
}
function enhanceCockpit(root:T.Group,m:ReturnType<typeof mats>){
 const driver=root.getObjectByName('driver-rig');
 if(!driver)throw new Error('EP005 expects V3 articulated driver');
 // Replace mannequin's raw golden construction-surface shading with an
 // upholstered, full-suit palette; preserve vertex skin and all weakmap bones.
 driver.traverse(o=>{
  if(!(o instanceof T.Mesh))return;
  const old=Array.isArray(o.material)?o.material[0]:o.material;
  if(!(old instanceof T.MeshStandardMaterial))return;
  const clr=old.color.getHexString();
  if(clr==='cda65f')o.material=m.suit;
  else if(clr==='252c31')o.material=m.carbon;
 });
 const head=driver.getObjectByName('head');
 if(head){
  // Small fitted helmet details FOLLOW moving head, not the car shell.
  mesh(head,'ep005-helmet-visor',new T.SphereGeometry(.069,24,16),m.visor,[.071,.017,0]).scale.set(.38,.54,.98);
  tube(head,'ep005-helmet-crown-seam',[[.012,.094,-.045],[.012,.105,0],[.012,.094,.045]],.004,m.piping);
 }
 const thorax=driver.getObjectByName('thorax');
 if(thorax){
  for(const side of [-1,1]){
   const v=mesh(thorax,`ep005-suit-piping-${side}`,new T.CapsuleGeometry(.008,.13,3,6),m.piping,[.108,.015,side*.15]);
   v.rotation.z=-.23;
  }
 }
 const cabin=root.getObjectByName('interior');
 if(!cabin)return;
 // Stitch each authentic movable bucket seat, not a new disconnected seat box.
 const seats:T.Object3D[]=[];cabin.traverse(o=>{if(o.name==='bucket-seat-shell')seats.push(o);});
 for(const [i,seat] of seats.entries()){
  for(const side of [-1,1]){
   tube(seat,`ep005-seat-${i}-bolster-piping-${side}`,[
    [-.19,.18,side*.14],[-.20,.29,side*.15],[-.21,.43,side*.14],[-.22,.56,side*.11]
   ],.003,m.piping);
  }
 }
 const dash=cabin.getObjectByName('dashboard');
 if(dash)mesh(dash,'ep005-dash-antiglare',new T.BoxGeometry(.09,.013,.63),m.suede,[-.014,.104,0]);
}
/** Add near-body sweep lines and aero edge finishes without changing body/wheel fit. */
function enhanceExterior(root:T.Group,m:ReturnType<typeof mats>){
 const shell=root.getObjectByName('body-shell');
 if(!shell)throw new Error('Missing V3 body shell');
 const s=vehicleSpec('supercar');
 shell.traverse(o=>{
  if(!(o instanceof T.Mesh))return;
  const mat=Array.isArray(o.material)?o.material[0]:o.material;
  if(!(mat instanceof T.MeshStandardMaterial))return;
  // Existing paint is allocated per mesh by the V3 hero; replace only
  // the matching body-color family, leaving tyre, brake and glass untouched.
  if(mat.color.getHexString()==='17384f')o.material=m.paint;
  else if(['side-intake','front-lip','rear-diffuser','sill','grille'].some(n=>o.name===n))o.material=m.carbon;
 });
 for(const side of [-1,1]){
  const points:V3[]=[];
  for(let i=0;i<=12;i++){
   const x=-1.09+i/12*2.60,y=.55+.012*Math.sin(i/12*Math.PI);
   points.push([x,y,side*(bodyHalfWidth(s,x,y)+.009)]);
  }
  tube(shell,`ep005-${side}-coachwork-character-line`,points,.005,m.carbonEdge);
  const c:V3[]=[];
  for(let i=0;i<=8;i++){
   const x=-1.27+i/8*1.55,y=.27;
   c.push([x,y,side*(bodyHalfWidth(s,x,y)+.015)]);
  }
  tube(shell,`ep005-${side}-carbon-sill-edge`,c,.008,m.carbon);
  // Fitted intake fin is inside the opening's flank rather than floating proud.
  for(let n=0;n<3;n++){
   const x=-.83+n*.10;
   mesh(shell,`ep005-${side}-intake-vanes-${n}`,new T.BoxGeometry(.014,.07,.014),m.titanium,[x,.70,side*(bodyHalfWidth(s,x,.7)+.01)]);
  }
 }
 // Nose-to-wing highlight accents visually taper with the real sculpted shell.
 tube(shell,'ep005-bonnet-centre-crease',[[.56,.92,0],[1.07,.86,0],[1.64,.69,0],[2.07,.46,0]],.006,m.paint);
}
export function applyEp005PremiumDetails(hero:T.Group){
 const m=mats();
 enhanceExterior(hero,m);
 enhanceWheels(hero,m);
 enhanceCockpit(hero,m);
 const engine=hero.getObjectByName('engine');
 if(engine)enhanceEngine(engine,m);
 return hero;
}
