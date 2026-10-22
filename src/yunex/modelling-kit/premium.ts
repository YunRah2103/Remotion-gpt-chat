import * as T from 'three';
import {box,mesh,rod,surface} from '../world-kit/geometry.ts';
import type {VehicleSpec} from '../world-kit/catalog.ts';
import {interiorLayout} from '../world-kit/interiors.ts';
import {coachworkField} from './coachwork.ts';

/** Continuous styling field applied to shell parts together, keeping trim on its skin. */
export function sculptShell(shell:T.Group,s:VehicleSpec){
 if(!shell.getObjectByName('arched-body'))return;
 shell.updateMatrixWorld(true);const world=new T.Vector3(),local=new T.Vector3(),inverse=new T.Matrix4();
 const warp=(p:T.Vector3)=>coachworkField(p,s);
 shell.traverse(o=>{if(!(o instanceof T.Mesh))return;let ancestor:T.Object3D|null=o;while(ancestor&&ancestor!==shell){if(ancestor.name==='interior')return;ancestor=ancestor.parent;}
  const old=o.geometry,g=old.clone(),a=g.attributes.position,norm=g.attributes.normal;inverse.copy(o.matrixWorld).invert();
  const toWorld=new T.Matrix3().getNormalMatrix(o.matrixWorld),toLocal=new T.Matrix3().getNormalMatrix(inverse),j=new T.Matrix3(),e=.0001,normal=new T.Vector3();
  for(let i=0;i<a.count;i++){
   world.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);const p=world.clone(),mapped=warp(p.clone());
   // Preserve interpolated normals across clipped T-junctions. Recomputing them from
   // the clipped triangles produces bright ripples in clearcoat on an intact bonnet.
   if(norm){const dx=warp(p.clone().add(new T.Vector3(e,0,0))).sub(mapped).divideScalar(e),dy=warp(p.clone().add(new T.Vector3(0,e,0))).sub(mapped).divideScalar(e),dz=warp(p.clone().add(new T.Vector3(0,0,e))).sub(mapped).divideScalar(e);j.set(dx.x,dy.x,dz.x,dx.y,dy.y,dz.y,dx.z,dy.z,dz.z).invert().transpose();normal.fromBufferAttribute(norm,i).applyMatrix3(toWorld).applyMatrix3(j).applyMatrix3(toLocal).normalize();norm.setXYZ(i,normal.x,normal.y,normal.z);}
   local.copy(mapped).applyMatrix4(inverse);a.setXYZ(i,local.x,local.y,local.z);
  }g.computeBoundingSphere();o.geometry=g;old.dispose();
 });
}
export function roadHeroDetails(shell:T.Group,s:VehicleSpec){
 if(!['normal','sports','suv'].includes(s.family))return;
 const layout=interiorLayout(s),belt=layout.belt,front=s.length/2,black=surface('#0b1219',.2,.28),metal=surface('#667b86',.85,.24),leather=surface('#18242b',.05,.78),stitch=surface('#879c9d',.1,.7);
 const source=shell.getObjectByName('projector-light') as T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>|undefined;
 const led=new T.MeshStandardMaterial({color:'#e0f4ff',emissive:'#bcdfff',emissiveIntensity:source?.material.emissiveIntensity??.15});
 // Retain original recessed light buckets, add a sharp three-dimensional DRL signature.
 for(const side of [-1,1]){
  const z=side*s.width*.31,y=belt-(s.family==='sports'?.135:.15); const lampWidth=s.width*.20;
  const pts=[new T.Vector3(front-.008,y-.017,z-side*lampWidth*.42),new T.Vector3(front-.008,y-.017,z+side*lampWidth*.28),new T.Vector3(front-.012,y+.012,z+side*lampWidth*.42)];
  mesh(shell,new T.TubeGeometry(new T.CatmullRomCurve3(pts),18,.006,6,false),led,[0,0,0],[0,0,0],'led-signature');

  const innerZ=side*s.width*.235,interior=shell.getObjectByName('interior');
  if(!interior)continue;
  const oldSeat=interior.getObjectByName(side>0?'front-seat-left':'front-seat-right');if(oldSeat)oldSeat.visible=false;
  const seat=new T.Group();seat.name='bucket-seat-shell';seat.position.set(layout.frontSeat,layout.floor+.15,innerZ);seat.scale.y=layout.k;(interior??shell).add(seat);
  const back=box(seat,leather,[.12,.51,.39],[-.20,.28,0],.045,'seat-back');back.rotation.z=-.14;
  box(seat,leather,[.45,.09,.37],[0,.03,0],.035,'seat-cushion');
  for(const sign of [-1,1]){box(seat,leather,[.37,.15,.06],[-.03,.09,sign*.19],.022,'seat-bolster');rod(seat,stitch,[-.18,.16,sign*.15],[-.22,.48,sign*.15],.002).name='seat-stitch';}
  box(seat,leather,[.12,.13,.24],[-.25,.62,0],.035,'sport-headrest');
  box(seat,black,[.03,.06,.12],[-.13,.43,0],.012,'harness-aperture');
 }
 // Thin forged rim edge plus valve stems; original pivots/rotors remain the authority.
 if(shell.getObjectByName('interior'))box(shell,metal,[.04,.015,.22],[.16,.79,0],.005,'console-switch-bank');
}
function aerofoil(parent:T.Group,mat:T.Material,chord:number,span:number,pos:[number,number,number],name:string,angle=0){
 const sh=new T.Shape(),n=32;
 const point=(i:number,upper:boolean)=>{const u=i/n,thick=.10*chord*Math.sin(Math.PI*u)**.65,camber=.065*chord*Math.sin(Math.PI*u);return [chord*(u-.5),camber+(upper?thick:-thick)] as const;};
 for(let i=0;i<=n;i++){const p=point(i,true);if(i===0)sh.moveTo(...p);else sh.lineTo(...p);}for(let i=n;i>=0;i--)sh.lineTo(...point(i,false));sh.closePath();
 const g=new T.ExtrudeGeometry(sh,{depth:span,bevelEnabled:false,curveSegments:8});g.translate(0,0,-span/2);const wing=mesh(parent,g,mat,pos,[0,0,angle],name);return wing;
}
export function formulaHeroDetails(shell:T.Group,mounts:T.Group[],s:VehicleSpec){
 if(s.id!=='formula-modern')return;
 const carbon=surface('#122129',.5,.31),paint=new T.MeshPhysicalMaterial({color:shell.getObjectByName('single-seater-body') instanceof T.Mesh?(shell.getObjectByName('single-seater-body') as T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>).material.color:'#14a998',metalness:.5,roughness:.23,clearcoat:1});
 shell.traverse(o=>{if(['front-wing','rear-wing','wing-flap','wing-endplate'].includes(o.name))o.visible=false;});
 for(let i=0;i<4;i++)aerofoil(shell,i===0?paint:carbon,.34-i*.035,s.width*(.97-i*.04),[s.length*.43-i*.13,.22+i*.045,0],'front-aerofoil',-.10-i*.06);
 for(let i=0;i<2;i++)aerofoil(shell,paint,.30,s.width*.78,[-s.length*.41+i*.09,.88+i*.10,0],'rear-aerofoil',.16+i*.12);
 aerofoil(shell,carbon,.21,s.width*.59,[-s.length*.39,.46,0],'rear-beam-wing',.14);
 for(const side of [-1,1]){
  box(shell,carbon,[.56,.24,.026],[s.length*.40,.29,side*s.width*.49],.018,'front-wing-endplate');
  box(shell,paint,[.45,.38,.027],[-s.length*.40,.91,side*s.width*.395],.025,'rear-wing-endplate');
  const path=new T.CatmullRomCurve3([new T.Vector3(-1.60,.14,side*.45),new T.Vector3(-.75,.10,side*.48),new T.Vector3(.4,.12,side*.48),new T.Vector3(.85,.17,side*.42)]);
  const tunnel=mesh(shell,new T.TubeGeometry(path,28,.115,12,true),carbon,[0,0,0],[0,0,0],'venturi-tunnel');tunnel.scale.y=.55;tunnel.position.y=.09;
  for(let i=0;i<5;i++)box(shell,carbon,[.30,.11,.016],[.9-i*.12,.19,side*(.39+i*.055)],.003,'floor-fence');
 }
 for(const mount of mounts){const roll=mount.getObjectByName('wheel-roll')!;for(const side of [-1,1]){
  const cover=mesh(roll,new T.CylinderGeometry(s.radius*.68,s.radius*.68,.015,48),carbon,[0,0,side*.165],[Math.PI/2,0,0],'aero-wheel-cover');
  const strip=new T.Mesh(new T.TorusGeometry(s.radius*.66,.004,5,48),paint);strip.position.copy(cover.position);strip.name='wheel-cover-stripe';roll.add(strip);
 }}
}
