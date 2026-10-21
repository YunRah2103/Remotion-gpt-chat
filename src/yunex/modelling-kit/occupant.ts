import * as T from 'three';
import {box,mesh,surface} from '../world-kit/geometry.ts';
import {interiorLayout} from '../world-kit/interiors.ts';
import type {VehicleSpec,VehicleOptions} from '../world-kit/catalog.ts';

type OccupantRig={root:T.Group;wheel:T.Object3D;hip:T.Vector3;k:number;radius:number;parts:Map<string,T.Object3D>;anchors:T.Vector3[]};
const rigs=new WeakMap<T.Object3D,OccupantRig>();
const v=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
function segment(parent:T.Group,name:string,material:T.Material,radius:number){
 const m=mesh(parent,new T.CylinderGeometry(radius*.88,radius,1,12),material,[0,0,0],[0,0,0],name);return m;
}
function connect(o:T.Object3D,a:T.Vector3,b:T.Vector3){const d=b.clone().sub(a);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(v(0,1,0),d.clone().normalize());o.scale.y=d.length();}
/** Equal-length two-link solution, with a preferred bend normal. No accumulated pose. */
function elbow(a:T.Vector3,b:T.Vector3,length:number,bend:T.Vector3){
 const d=b.clone().sub(a),distance=d.length(),axis=d.normalize(),normal=bend.clone().addScaledVector(axis,-bend.dot(axis)).normalize();
 return a.clone().add(b).multiplyScalar(.5).addScaledVector(normal,Math.sqrt(Math.max(.0001,length*length-distance*distance/4)));
}
export function createDriver(shell:T.Group,s:VehicleSpec,o:Partial<VehicleOptions>={}){
 if(s.family==='bike')throw new Error('Seated driver does not support motorcycles');
 const formula=s.family==='formula',l=interiorLayout(s),k=formula?.68:Math.min(1,l.k),sign=o.steeringSide==='left'?1:-1;
 const wheel=shell.getObjectByName(formula?'racing-steering-wheel':'steering-wheel');if(!wheel)throw new Error(`Missing steering hardpoint for ${s.id}`);
 const root=new T.Group();root.name='driver-rig';shell.add(root);root.userData.accuracy='Illustrative articulated mannequin; no injury prediction';
 const hip=formula?v(-.36,.48,0):v(l.frontSeat,l.floor+.255*k,sign*s.width*.235);
 const gold=surface('#cda65f',.32,.42),dark=surface('#252c31',.25,.62),belt=surface('#153c45',0,.88),mark=surface('#f2d48c',.1,.55);
 if(formula){for(const name of ['racing-seat','racing-seat-back','cockpit']){const old=shell.getObjectByName(name);if(old)old.visible=false;}box(shell,dark,[.48,.065,.36],[-.36,.435,0],.035,'driver-seat-cushion');const back=box(shell,dark,[.08,.34,.34],[-.53,.60,0],.04,'driver-seat-back');back.rotation.z=-.28;}
 const parts=new Map<string,T.Object3D>();const add=(x:T.Object3D)=>{parts.set(x.name,x);return x;};
 add(box(root,gold,[.21*k,.16*k,.30*k],hip.toArray(),.045,'pelvis'));
 add(box(root,gold,[.20*k,.30*k,.32*k],[0,0,0],.06,'thorax'));
 add(mesh(root,new T.SphereGeometry(.105*k,24,16),gold,[0,0,0],[0,0,0],'head'));parts.get('head')!.scale.set(1,.128/.105,.88);
 add(segment(root,'neck',dark,.045*k));
 for(const side of ['left','right']){
  for(const name of ['upper-arm','forearm','thigh','shin'])add(segment(root,`${name}-${side}`,gold,(name==='thigh'?.067:name==='shin'?.047:.038)*k));
  for(const name of ['shoulder','elbow','knee'])add(mesh(root,new T.SphereGeometry((name==='knee'?.048:.04)*k,12,8),dark,[0,0,0],[0,0,0],`${name}-${side}`));
  const hand=add(box(root,gold,[.095*k,.07*k,.065*k],[0,0,0],.018,`hand-${side}`));
  for(let i=0;i<4;i++)box(hand,mark,[.045*k,.013*k,.012*k],[.025*k,-.026*k,(i-1.5)*.014*k],.004,'finger');
  add(box(root,dark,[.21*k,.075*k,.085*k],[0,0,0],.018,`foot-${side}`));
  const existingPedals=shell.getObjectByName('pedals')?.children.filter(p=>p.name==='pedal');
  const pad=formula?box(shell,dark,[.08,.035,.06],[.40,.38,(side==='left'?1:-1)*.07],.008,'formula-pedal'):existingPedals?.[side==='left'?0:1];
  if(!pad)throw new Error('Missing pedal hardpoint');
  const pedalTarget=new T.Object3D();pedalTarget.name=`pedal-target-${side}`;pedalTarget.position.set(-.04*k,.04*k,0);pad.add(pedalTarget);
  const target=new T.Object3D();target.name=`grip-target-${side}`;if(formula)target.position.set((side==='left'?-1:1)*.11,0,0);else target.position.set(0,0,(side==='left'?1:-1)*.17*l.k);wheel.add(target);
 }
 // Flat textile ribbons, with fixed vehicle anchors and a moving chest guide.
 for(const name of ['belt-diagonal','belt-lower','belt-lap'])add(mesh(root,new T.BoxGeometry(.008,.045,1),belt,[0,0,0],[0,0,0],name));
 add(box(root,dark,[.045,.05,.065],[0,0,0],.008,'belt-latch'));
 const anchors=[hip.clone().add(v(-.18*k,.49*k,sign*.18*k)),hip.clone().add(v(.08*k,-.03*k,-sign*.16*k)),hip.clone().add(v(-.10*k,-.03*k,sign*.18*k))];
 const radius=formula?.11:.17*l.k;rigs.set(root,{root,wheel,hip,k,radius,parts,anchors});animateDriver(root,0,0,0);return root;
}
export function animateDriver(root:T.Group,steer:number,braking:number,impact:number){
 const rig=rigs.get(root);if(!rig)return;const {hip,k,parts,wheel,anchors}=rig;
 // Wheel pose is shared by driver grips and the visible steering mesh.
 if(wheel.name==='racing-steering-wheel')wheel.rotation.x=-steer*2.5;
 const lean=.09*braking+.18*impact,chest=hip.clone().add(v(.035*k+lean*k,.26*k,0));
 const thorax=parts.get('thorax')!;thorax.position.copy(chest);thorax.rotation.z=-lean*.9;
 const head=chest.clone().add(v(.01*k+impact*.035*k,.29*k,0));parts.get('head')!.position.copy(head);parts.get('head')!.rotation.z=-impact*.18;
 connect(parts.get('neck')!,chest.clone().add(v(.01*k,.16*k,0)),head.clone().add(v(0,-.10*k,0)));
 root.parent!.updateMatrixWorld(true);const inverse=new T.Matrix4().copy(root.matrixWorld).invert();
 for(const side of ['left','right']){
  const sign=side==='left'?1:-1,shoulder=chest.clone().add(v(0,.09*k,sign*.17*k));
  const hand=wheel.getObjectByName(`grip-target-${side}`)!.getWorldPosition(new T.Vector3()).applyMatrix4(inverse);
  const joint=elbow(shoulder,hand,Math.max(.25*k,shoulder.distanceTo(hand)*.505),v(-.3,-1,sign*.5));
  parts.get(`shoulder-${side}`)!.position.copy(shoulder);parts.get(`elbow-${side}`)!.position.copy(joint);
  connect(parts.get(`upper-arm-${side}`)!,shoulder,joint);connect(parts.get(`forearm-${side}`)!,joint,hand);parts.get(`hand-${side}`)!.position.copy(hand);
  const h=hip.clone().add(v(0,0,sign*.095*k)),foot=root.parent!.getObjectByName(`pedal-target-${side}`)!.getWorldPosition(new T.Vector3()).applyMatrix4(inverse);
  foot.x+=(side==='right'?braking*.012:0);
  const knee=elbow(h,foot,Math.max(.33*k,h.distanceTo(foot)*.505),v(0,1,0));parts.get(`knee-${side}`)!.position.copy(knee);connect(parts.get(`thigh-${side}`)!,h,knee);connect(parts.get(`shin-${side}`)!,knee,foot);parts.get(`foot-${side}`)!.position.copy(foot);
 }
 // Route the diagonal through the forward chest guide so it stays outside the torso.
 const guide=chest.clone().add(v(.113*k,.09*k,Math.sign(anchors[0].z-hip.z)*.10*k));
 const ribbon=(name:string,a:T.Vector3,b:T.Vector3)=>{const m=parts.get(name)!,d=b.clone().sub(a);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(v(0,0,1),d.clone().normalize());m.scale.z=d.length();};
 ribbon('belt-diagonal',anchors[0],guide);ribbon('belt-lower',guide,anchors[1]);ribbon('belt-lap',anchors[2],anchors[1]);parts.get('belt-latch')!.position.copy(anchors[1]);
 root.updateMatrixWorld(true);
}
