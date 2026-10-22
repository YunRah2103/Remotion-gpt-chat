/**
 * EP005 / V3 coachbuilt hero overhaul.
 *
 * Additive, fully modelled geometry parented to live V3 wheel-roll,
 * body-shell, engine, cabin and driver nodes. No baked or cloned rig, no
 * world-fixed decorative pieces, and no change to the A1/A2 nozzle contract.
 * Fictional ~4.7m mid-engine car; not a claim of licensed OEM geometry.
 */
import * as T from 'three';
import {vehicleSpec} from '../../../../src/yunex/world-kit/catalog.ts';
import {bodyHalfWidth,bodyTop} from '../../../../src/yunex/world-kit/vehicle-body.ts';

type V3=[number,number,number];
type Finish=ReturnType<typeof finishes>;

function finish(color:string,metalness:number,roughness:number,emissive?:string,emissiveIntensity=0){
 const m=new T.MeshPhysicalMaterial({
  color,metalness,roughness,clearcoat:metalness>.1?.85:.12,
  clearcoatRoughness:.10,side:T.DoubleSide,
  emissive:emissive??'#000000',emissiveIntensity,
 });
 m.userData.baseline={
  opacity:m.opacity,transparent:m.transparent,depthWrite:m.depthWrite,
  emissive:m.emissive.getHex(),intensity:m.emissiveIntensity
 };
 m.userData.shaderTransparent=m.transparent;
 return m;
}
function finishes(){return {
 pearl:finish('#859ba3',.62,.16),
 blueShadow:finish('#263e4b',.59,.23),
 carbon:finish('#0b161b',.32,.31),
 carbonEdge:finish('#29383e',.52,.25),
 satin:finish('#8b929c',.82,.25),
 polished:finish('#c8d5d8',.91,.16),
 titanium:finish('#56636b',.88,.34),
 caliper:finish('#d9a65c',.42,.28),
 redLamp:finish('#ef2c35',.05,.20,'#ff211c',1.7),
 iceLamp:finish('#d8fcff',.05,.18,'#82e8ff',1.35),
 suede:finish('#1c252c',.02,.84),
 seat:finish('#27363d',.02,.74),
 stitched:finish('#b5bcc4',.15,.50),
 oled:finish('#102833',.15,.29,'#45c5d6',.32),
 brushed:finish('#596973',.7,.30),
};}
function add(parent:T.Object3D,name:string,geometry:T.BufferGeometry,mat:T.Material,pos:V3=[0,0,0],rot:V3=[0,0,0]){
 const o=new T.Mesh(geometry,mat);
 o.name=name;o.position.set(...pos);o.rotation.set(...rot);
 o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;
}
function spline(parent:T.Object3D,name:string,pts:V3[],radius:number,mat:T.Material){
 return add(parent,name,new T.TubeGeometry(
  new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)),false,'centripetal'),
  Math.max(32,pts.length*9),radius,8,false),mat);
}
/** Sweep individual purpose-shaped diffuser fins instead of rectangular planks. */
function diffuserFin(z:number,m:Finish){
 const p=[
  [-1.78,.20,z-.010],[-2.40,.16,z-.010],[-2.39,.29,z-.010],[-1.88,.25,z-.010],
  [-1.78,.20,z+.010],[-2.40,.16,z+.010],[-2.39,.29,z+.010],[-1.88,.25,z+.010]
 ];
 const triangles=[
  0,1,2,0,2,3,4,6,5,4,7,6,
  0,4,5,0,5,1,1,5,6,1,6,2,
  2,6,7,2,7,3,3,7,4,3,4,0
 ];
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute(p.flat(),3));
 g.setIndex(triangles);g.computeVertexNormals();
 return {g,m:m.carbonEdge};
}
/** Main surfaces explicitly use physical lacquer rather than plastic-looking default paint. */
function exterior(shell:T.Object3D,m:Finish){
 const paint=new Set(['arched-body','roof','window-frame','rear-spoiler','cabin-pillar','coachbuilt-corner-duct-rim']);
 shell.traverse(o=>{
  if(!(o instanceof T.Mesh)||!paint.has(o.name))return;
  o.material=m.pearl;
 });
 const s=vehicleSpec('supercar');
 // Three distinct die-matched upper body highlights, bent with the actual flank.
 for(const side of [-1,1]){
  const belt:V3[]=[],lower:V3[]=[];
  for(let i=0;i<=28;i++){
   const x=-1.88+i/28*3.45;
   const upper=bodyTop(s,x)-.11,low=.37;
   belt.push([x,upper,side*(bodyHalfWidth(s,x,upper)+.008)]);
   lower.push([x,low,side*(bodyHalfWidth(s,x,low)+.011)]);
  }
  spline(shell,'overhaul-shoulder-contour-'+side,belt,.0037,m.blueShadow);
  spline(shell,'overhaul-side-skirt-contour-'+side,lower,.006,m.carbon);
  // Functional-looking brake-cooling vanes sit low and BEHIND the wheel arch.
  for(let i=0;i<4;i++){
   const x=-.92+i*.080;
   const y=.45+i*.012;
   const z=side*(bodyHalfWidth(s,x,y)+.009);
   const vane=add(shell,'overhaul-side-intake-vane-'+side+'-'+i,
     new T.BoxGeometry(.015,.092,.012),m.satin,[x,y,z]);
   vane.rotation.z=-.32;
  }
  // Sculpted boomerang upper LED, separate from real recessed red tail apertures.
  spline(shell,'overhaul-rear-led-upper-'+side,[
   [-2.379,.755,side*.51],[-2.392,.795,side*.67],
   [-2.376,.772,side*.89],[-2.340,.690,side*.96]
  ],.014,m.redLamp);
  spline(shell,'overhaul-rear-led-lower-'+side,[
   [-2.380,.713,side*.52],[-2.396,.730,side*.71],
   [-2.376,.705,side*.87]
  ],.006,m.redLamp);
  // Recessed-duct illumination strips are thin luminous optics, not flood boxes.
  spline(shell,'overhaul-front-drl-'+side,[
   [2.365,.665,side*.46],[2.350,.688,side*.59],
   [2.326,.666,side*.74],[2.275,.588,side*.83]
  ],.010,m.iceLamp);
  for(let n=0;n<3;n++)add(shell,'overhaul-projector-'+side+'-'+n,
   new T.SphereGeometry(.031,16,10),m.iceLamp,
   [2.353,.623,side*(.49+n*.085)]);
  // Arch lips follow physically curved wheel aperture rather than a cartoon torus.
  for(const xAxle of [-s.wheelbase/2,s.wheelbase/2]){
   const arc:V3[]=[];
   for(let k=0;k<=18;k++){
    const a=k/18*Math.PI;
    const x=xAxle+Math.cos(a)*(s.radius*1.13);
    const y=s.radius+Math.sin(a)*(s.radius*1.18);
    arc.push([x,y,side*(bodyHalfWidth(s,x,y)+.006)]);
   }
   spline(shell,'overhaul-arch-lip-'+side+'-'+xAxle,arc,.0045,m.blueShadow);
  }
 }
 // A rear aero blade with an actual curved wing element and full-width highlight.
 const wing=new T.Shape();
 wing.moveTo(-.14,-.70);wing.quadraticCurveTo(.03,-.76,.15,-.64);
 wing.quadraticCurveTo(.20,0,.15,.64);
 wing.quadraticCurveTo(.03,.76,-.14,.70);
 wing.quadraticCurveTo(-.03,0,-.14,-.70);
 const wingGeo=new T.ExtrudeGeometry(wing,{depth:.025,bevelEnabled:true,bevelSegments:3,steps:1,bevelThickness:.006,bevelSize:.007});
 wingGeo.rotateX(-Math.PI/2);
 add(shell,'overhaul-curved-carbon-wing',wingGeo,m.carbon,[-1.76,1.022,0]);
 spline(shell,'overhaul-wing-trailing-highlight',[
  [-1.61,1.046,-.66],[-1.57,1.045,0],[-1.61,1.046,.66]
 ],.006,m.polished);
 // Fine flush vents reveal form; don't cover radiator apertures with giant boxes.
 for(const side of [-1,1])for(let i=0;i<5;i++){
  const x=.88+i*.095,y=bodyTop(s,x)+.044;
  spline(shell,'overhaul-bonnet-louvre-'+side+'-'+i,
   [[x,y,side*.21],[x+.030,y-.003,side*.29],[x+.040,y-.008,side*.36]],
   .0042,m.carbon);
 }
 // Exhaust pair is inboard of these true deep diffuser fins; ports remain unobstructed.
 for(const z of [-.83,-.28,.28,.83]){
  const {g,m:mat}=diffuserFin(z,m);
  add(shell,'overhaul-shaped-diffuser-fin-'+z,g,mat);
 }
 spline(shell,'overhaul-diffuser-edge',[
  [-2.37,.17,-.89],[-2.40,.17,-.45],[-2.40,.17,.45],[-2.37,.17,.89]
 ],.008,m.carbon);
}
/** Real rolling forged spokes, barrels and centre locks; NO static decorative wheel discs. */
function runningGear(hero:T.Group,m:Finish){
 const s=vehicleSpec('supercar');
 for(const position of ['front-left','front-right','rear-left','rear-right']){
  const pivot=hero.getObjectByName('mount-'+position);
  const roll=pivot?.getObjectByName('wheel-roll');
  if(!roll)throw new Error('V3 wheel roll missing: '+position);
  const side=position.endsWith('left')?1:-1;
  const face=side*.167,r=s.radius;
  add(roll,'overhaul-rolled-barrel-'+position,
   new T.TorusGeometry(r*.69,.017,12,96),m.polished,[0,0,face]);
  add(roll,'overhaul-forged-outer-edge-'+position,
   new T.TorusGeometry(r*.78,.007,8,96),m.titanium,[0,0,face+side*.007]);
  add(roll,'overhaul-hub-face-'+position,
   new T.CylinderGeometry(.057,.057,.022,32),m.brushed,
   [0,0,face+side*.015],[Math.PI/2,0,0]);
  // Deep concave tapered multi-spokes with small bevels and real holes between.
  for(let k=0;k<10;k++){
   const a=k*2*Math.PI/10;
   const sh=new T.Shape();
   sh.moveTo(-.025,r*.15);
   sh.lineTo(-.033,r*.39);
   sh.lineTo(-.054,r*.675);
   sh.lineTo(-.014,r*.71);
   sh.lineTo(.014,r*.71);
   sh.lineTo(.054,r*.675);
   sh.lineTo(.033,r*.39);
   sh.lineTo(.025,r*.15);
   sh.closePath();
   const g=new T.ExtrudeGeometry(sh,{depth:.015,bevelEnabled:true,
    bevelThickness:.002,bevelSize:.0015,bevelSegments:2});
   g.rotateZ(a);
   add(roll,'overhaul-forged-spoke-'+position+'-'+k,g,m.satin,
    [0,0,face-side*.012]);
  }
  // Circular drilled brake rotor follows the rolling hub. Caliper from V3 remains stationary.
  add(roll,'overhaul-ventilated-rotor-'+position,
   new T.TorusGeometry(r*.51,.020,12,72),m.brushed,[0,0,face-side*.040]);
  for(let k=0;k<24;k++){
   const a=k*Math.PI/12;
   add(roll,'overhaul-rotor-vent-'+position+'-'+k,
    new T.SphereGeometry(.005,6,5),m.carbon,
    [Math.cos(a)*r*.55,Math.sin(a)*r*.55,face-side*.018]);
  }
  pivot.userData.overhaulForgedRunningGear=true;
 }
}
/** Trim is tightly parented to V3 dashboard/seat/driver nodes. */
function cockpit(hero:T.Group,m:Finish){
 const cabin=hero.getObjectByName('interior');
 if(!cabin)throw new Error('Premium V3 cabin not found');
 const seats:T.Object3D[]=[];
 cabin.traverse(o=>{if(o.name==='bucket-seat-shell')seats.push(o);});
 for(const [index,seat] of seats.entries()){
  add(seat,'overhaul-seat-Alcantara-inset-'+index,
   new T.BoxGeometry(.36,.25,.008),m.suede,[-.20,.38,0],[0,-Math.PI/2,0]);
  for(const side of [-1,1]){
   spline(seat,'overhaul-seat-contrast-stitch-'+index+'-'+side,[
    [-.19,.20,side*.12],[-.20,.32,side*.14],
    [-.21,.46,side*.14],[-.22,.56,side*.10]
   ],.0022,m.stitched);
  }
 }
 const dashboard=hero.getObjectByName('dashboard');
 if(dashboard){
  for(let k=0;k<5;k++)add(dashboard,'overhaul-dash-air-vent-'+k,
   new T.TorusGeometry(.020,.003,6,18),m.satin,
   [.022,.074,(k-2)*.14],[0,Math.PI/2,0]);
  // Small instrument cluster with restrained illuminated scale subdivisions.
  add(dashboard,'overhaul-digital-dial-surround',
   new T.BoxGeometry(.014,.088,.29),m.carbon,[.026,.119,0]);
  for(let k=0;k<13;k++){
   add(dashboard,'overhaul-rpm-tick-'+k,
    new T.BoxGeometry(.002,.006,.008),k>9?m.redLamp:m.iceLamp,
    [.038,.153,(k-6)*.017]);
  }
 }
 // No anonymous blonde mannequin: preserve articulation and make full driver suit opaque.
 const driver=hero.getObjectByName('driver-rig');
 if(!driver)throw new Error('Rigged V3 driver not found');
 driver.traverse(o=>{
  if(!(o instanceof T.Mesh))return;
  const orig=Array.isArray(o.material)?o.material[0]:o.material;
  if(!(orig instanceof T.MeshStandardMaterial))return;
  const c=orig.color;
  if(c.r>.43 && c.g>.22 && c.b<.28)o.material=m.seat;
 });
 const head=driver.getObjectByName('head');
 if(head){
  add(head,'overhaul-helmet-glass-optic',new T.SphereGeometry(.068,28,18),
   m.blueShadow,[.079,.018,0]).scale.set(.29,.52,.91);
  spline(head,'overhaul-helmet-visor-trim',[
   [.078,.06,-.047],[.088,.071,0],[.078,.06,.047]
  ],.003,m.polished);
 }
 const engine=hero.getObjectByName('engine');
 if(engine){
  const bounds=new T.Box3().setFromObject(engine);
  const centre=bounds.getCenter(new T.Vector3());
  // Engine is built at the V3 powertrain origin; routed feed lines follow it
  // through all road poses, never hide the animated crank and turbo in opaque boxes.
  for(const side of [-1,1]){
   spline(engine,'overhaul-V8-plenum-charge-'+side,[
    [-.26,.22,side*.32],[-.05,.29,side*.32],[.18,.25,side*.22],
    [.30,.13,side*.12]
   ],.013,m.brushed);
   for(let k=0;k<4;k++)add(engine,'overhaul-v8-coil-detail-'+side+'-'+k,
    new T.CylinderGeometry(.013,.013,.03,12),m.caliper,
    [-.23+k*.13,.32,side*.22],[0,0,Math.PI/2]);
  }
  engine.userData.overhaulMechanicalDetails=true;
  // Force bounds query to catch missing, empty original assembly at runtime.
  if(!Number.isFinite(centre.x)||bounds.isEmpty())throw new Error('Empty EP005 V8 assembly');
 }
}
export function applyEp005CoachbuiltOverhaul(hero:T.Group):T.Group{
 if(hero.userData.ep005CoachbuiltOverhaul)throw new Error('Overhaul must be applied once per fresh rig');
 const shell=hero.getObjectByName('body-shell');
 if(!shell)throw new Error('Expected original V3 body shell');
 const m=finishes();
 exterior(shell,m);
 runningGear(hero,m);
 cockpit(hero,m);
 // NEVER modify, mask or reparent mount:exhaust-tip-left/right here.
 const ports=['mount:exhaust-tip-left','mount:exhaust-tip-right'];
 for(const name of ports){
  const port=hero.getObjectByName(name);
  if(!port||!port.parent||!port.parent.name.includes('exhaust-tube'))
   throw new Error('Lost modelled nozzle mount '+name);
 }
 hero.userData.ep005CoachbuiltOverhaul='V3-58d coachbuilt + fitted Episode-005 physical-quality layer';
 return hero;
}
