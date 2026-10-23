import * as T from 'three';
import {box,mesh,rod,surface} from '../world-kit/geometry.ts';
import {interiorLayout} from '../world-kit/interiors.ts';
import type {VehicleSpec,VehicleOptions} from '../world-kit/catalog.ts';
/** Surface detail only: existing seat, steering and restraint hardpoints stay authoritative. */
export function enhanceCabin(shell:T.Group,s:VehicleSpec,_options:Partial<VehicleOptions>={}){
 const interior=shell.getObjectByName('interior');
 if(!interior||interior.userData.cabinDepth)return;
 interior.userData.cabinDepth=true;
 const l=interiorLayout(s),rubber=surface('#172025',0,.92),thread=surface('#747a78',0,.94),alloy=surface('#a5adb0',.65,.35);
 const detail=(o:T.Object3D)=>{o.userData.cabinDetail=true;return o;};
 // One instanced mesh per cushion gives recess marks without hundreds of draw calls.
 const seats:T.Object3D[]=[];interior.traverse(o=>{if(o.name==='seat-cushion')seats.push(o);});
 for(const seat of seats){
  const size=new T.Box3().setFromBufferAttribute((seat as T.Mesh).geometry.getAttribute('position') as T.BufferAttribute).getSize(new T.Vector3());
  const dots=detail(new T.InstancedMesh(new T.CircleGeometry(.0017,5),rubber,60)) as T.InstancedMesh;dots.name='seat-perforations';
  const matrix=new T.Matrix4(),q=new T.Quaternion().setFromEuler(new T.Euler(-Math.PI/2,0,0));
  for(let row=0;row<10;row++)for(let col=0;col<6;col++)dots.setMatrixAt(row*6+col,matrix.compose(new T.Vector3((row-4.5)*.027,size.y/2+.001,(col-2.5)*size.z*.105),q,new T.Vector3(1,1,1)));
  seat.add(dots);
  for(const z of [-1,1])detail(rod(seat as T.Group,thread,[-.17,size.y/2+.002,z*size.z*.35],[.17,size.y/2+.002,z*size.z*.35],.0013)).name='upholstery-piping';
 }
 const wheel=interior.getObjectByName('steering-wheel');
 if(wheel){
  for(const sign of [-1,1]){
   for(let i=0;i<3;i++)detail(box(wheel as T.Group,rubber,[.012,.016,.019],[-.026,(-.025+i*.023)*l.k,sign*.079*l.k],.003,'steering-button'));
   detail(rod(interior as T.Group,rubber,[wheel.position.x+.045,wheel.position.y-.015,wheel.position.z+sign*.05],[wheel.position.x+.025,wheel.position.y+.015,wheel.position.z+sign*.16],.009)).name='column-stalk';
   // Thin seam crosses the leather rim at each hand grip.
   for(let i=0;i<5;i++)detail(box(wheel as T.Group,thread,[.003,.002,.025],[-.026,(i-2)*.014,sign*.17*l.k],.0005,'grip-stitch'));
  }
 }
 for(const sign of [-1,1]){
  const z=sign*(l.innerWidth/2-.07),y=l.floor+Math.max(.12,l.belt-l.floor-.05)*.63+.04;
  detail(box(interior as T.Group,rubber,[.16,.012,.052],[l.frontSeat+.05,y,z],.005,'door-switch-bank'));
  for(let i=0;i<3;i++)detail(box(interior as T.Group,alloy,[.026,.006,.018],[l.frontSeat+.005+i*.041,y+.009,z],.002,'window-switch'));
  detail(mesh(interior as T.Group,new T.CylinderGeometry(.045,.045,.006,16),rubber,[l.frontSeat+.21,l.floor+.16,z],[Math.PI/2,0,0],'door-speaker'));
 }
 const pedals=interior.getObjectByName('pedals');
 for(const pedal of pedals?.children??[])if(pedal.name==='pedal')for(let i=0;i<4;i++)detail(box(pedal as T.Group,rubber,[.01,.003,.06],[(i-1.5)*.023,.024,0],.001,'pedal-tread'));
}
