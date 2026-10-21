import * as T from 'three';
import {box,mesh,rod,surface} from '../world-kit/geometry.ts';
import type {VehicleSpec} from '../world-kit/catalog.ts';

/** Instanced original geometry: tread is shared within each wheel, no textures/assets. */
export function tyreDetail(roll:T.Object3D,r:number,width:number,slick:boolean){
 const mat=surface('#20252a',.02,.88),count=slick?48:120;
 const geo=new T.BoxGeometry(slick?.009:.035,slick?.003:.008,slick?.015:width*.26);
 const tread=new T.InstancedMesh(geo,mat,count),dummy=new T.Object3D();tread.name='hero-tread';tread.castShadow=true;
 for(let i=0;i<count;i++){const ring=slick?0:i%3,a=Math.floor(i/(slick?1:3))*Math.PI*2/(slick?48:40);dummy.position.set(Math.cos(a)*(r+.001),Math.sin(a)*(r+.001),(ring-1)*width*.29);if(slick)dummy.position.z=width*.41;dummy.rotation.set(0,0,a-Math.PI/2);dummy.updateMatrix();tread.setMatrixAt(i,dummy.matrix);}
 roll.add(tread);
 for(const side of [-1,1]){
  mesh(roll,new T.TorusGeometry(r*.91,.0025,5,64),mat,[0,0,side*width*.47],[0,0,0],'sidewall-mould-ring');
  for(let i=0;i<12;i++){const a=i*Math.PI/6;const mark=box(roll,mat,[.018,.006,.002],[Math.cos(a)*r*.88,Math.sin(a)*r*.88,side*width*.505],.001,'sidewall-mark');mark.rotation.z=a;}
 }
}
export function floorAssembly(shell:T.Group,s:VehicleSpec){
 const g=new T.Group();g.name='underfloor';shell.add(g);
 const carbon=surface('#18252a',.45,.35),wood=surface('#997347',.03,.76),titanium=surface('#adb9bf',.9,.24);
 box(g,carbon,[s.wheelbase+.5,.045,s.width*.69],[-.12,.105,0],.018,'carbon-floor');
 box(g,wood,[s.wheelbase*.78,.025,.27],[-.15,.070,0],.008,'composite-plank');
 for(const x of [-.8,.8])box(g,titanium,[.22,.010,.19],[x,.055,0],.004,'metal-skid');
 for(const side of [-1,1])for(let i=0;i<4;i++){
  const f=box(g,carbon,[.70,.13,.016],[-s.wheelbase*.47,.17,side*(.20+i*.13)],.003,'diffuser-strake');f.rotation.z=-.14;
 }
 return g;
}
export function suspensionLinks(root:T.Group,mount:T.Group,s:VehicleSpec){
 const g=new T.Group();g.name=`links-${mount.name}`;root.add(g);
 const metal=surface('#83949f',.8,.3),carbon=surface('#17272b',.4,.38),accent=surface('#e6a63d',.55,.28);
 const side=Math.sign(mount.position.z)||1,x=mount.position.x;
 // Named endpoint data is updated in absolute vehicle coordinates every frame.
 for(const h of [.04,.19])for(const dx of [-.18,.18]){
  const a:[number,number,number]=[x+dx,s.radius+h,side*s.width*.20],b:[number,number,number]=[x,s.radius+h*.3,mount.position.z-side*.07];
  const link=rod(g,carbon,a,b,.018);link.name='wishbone';link.userData.link={a,b};
 }
 const formula=s.family==='formula';
 const a:[number,number,number]=formula?[x*.62,s.radius+.26,side*.18]:[x-.12,s.radius+.30,side*s.width*.25],b:[number,number,number]=formula?[x*.62+.10,s.radius+.08,side*.18]:[x,s.radius,mount.position.z-side*.09];
 if(formula){const p=rod(g,carbon,[x*.62,s.radius+.20,side*.22],[x,s.radius+.02,mount.position.z-side*.07],.012);p.name='inboard-pushrod';p.userData.link={a:[x*.62,s.radius+.20,side*.22],b:[x,s.radius+.02,mount.position.z-side*.07]};}
 const damper=rod(g,metal,a,b,.026);damper.name='damper';damper.userData.link={a,b};
 const curve=new T.CatmullRomCurve3(Array.from({length:97},(_,i)=>{const t=i/96;return new T.Vector3(Math.cos(t*Math.PI*14)*.05,t,Math.sin(t*Math.PI*14)*.05);}));
 const spring=mesh(g,new T.TubeGeometry(curve,96,.008,5,false),accent);spring.name='coil-spring';spring.userData.link={a,b,unit:true};
 return g;
}
