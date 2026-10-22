/** A reusable original rally hatch, using the same wheel, driver and suspension rigs as the road catalogue. */
import * as T from 'three';
import type {VehicleSpec} from '../world-kit/catalog.ts';
import {box,mesh,rod,surface} from '../world-kit/geometry.ts';
import type {V3} from '../world-kit/geometry.ts';
import {interiorLayout} from '../world-kit/interiors.ts';
import {bodyHalfWidth} from '../world-kit/vehicle-body.ts';
import {coachworkField} from './coachwork.ts';
import {cutOpening} from '../world-kit/cavity.ts';
import {coachbuiltField} from './coachbuilt.ts';
export function rallyDetails(shell:T.Group,mounts:T.Group[],s:VehicleSpec,refined=true){
 if(s.bodyStyle!=='rally')return;
 const source=shell.getObjectByName('arched-body') as T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>,paint=new T.MeshPhysicalMaterial({color:source.material.color,metalness:.30,roughness:.24,clearcoat:1}),carbon=surface('#18232a',.1,.65),white=new T.MeshStandardMaterial({color:'#f0f4e7',emissive:'#dbe8db',emissiveIntensity:.7}),red=surface('#be323f',.25,.31),l=interiorLayout(s),front=s.length/2;
 for(const cx of [-s.wheelbase/2,s.wheelbase/2])for(const side of [-1,1]){
  const shape=new T.Shape(),ri=s.radius*1.115,ro=s.radius*1.29;for(let i=0;i<=48;i++){const a=i/48*Math.PI,x=Math.cos(a)*ro,y=Math.sin(a)*ro;if(i)shape.lineTo(x,y);else shape.moveTo(x,y);}for(let i=48;i>=0;i--){const a=i/48*Math.PI;shape.lineTo(Math.cos(a)*ri,Math.sin(a)*ri);}shape.closePath();
  const geo=new T.ExtrudeGeometry(shape,{depth:.09,bevelEnabled:true,bevelThickness:.008,bevelSize:.008,bevelSegments:3});geo.translate(0,0,-.045);mesh(shell,geo,paint,[cx,s.radius,side*(s.width/2-.02)],[0,0,0],'rally-wide-arch');
  box(shell,carbon,[.026,.26,.23],[cx-s.radius*1.10,.24,side*(s.width/2-.055)],.009,'rally-mudflap');
 }
 for(const z of [-.4,.4])rod(shell,carbon,[front-.06,.49,z],[front+.06,.53,z],.018).name='rally-light-bar-mount';
 const bar=rod(shell,carbon,[front+.06,.53,-.53],[front+.06,.53,.53],.024);bar.name='rally-light-bar';
 for(const z of [-.39,-.13,.13,.39]){mesh(shell,new T.CylinderGeometry(.108,.116,.10,32),carbon,[front+.06,.65,z],[0,0,Math.PI/2],'rally-spotlight');mesh(shell,new T.CylinderGeometry(.092,.092,.012,32),white,[front+.119,.65,z],[0,0,Math.PI/2],'rally-spotlight-lens');}
 const scoop=new T.Shape();scoop.moveTo(-.18,0);scoop.quadraticCurveTo(-.18,.13,0,.13);scoop.quadraticCurveTo(.18,.13,.18,0);scoop.lineTo(.13,0);scoop.quadraticCurveTo(.12,.075,0,.075);scoop.quadraticCurveTo(-.12,.075,-.13,0);scoop.closePath();const sg=new T.ExtrudeGeometry(scoop,{depth:.30,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:2});sg.rotateY(Math.PI/2);const scoopY=l.roof+.055*Math.sin(Math.PI*T.MathUtils.clamp((.05-l.rearRoof)/(l.frontRoof-l.rearRoof),0,1))+(refined?.026:0)+.004;mesh(shell,sg,paint,[-.10,scoopY,0],[0,0,0],'rally-roof-scoop');
 const wingShape=new T.Shape();wingShape.moveTo(-.18,0);wingShape.quadraticCurveTo(0,.075,.18,.025);wingShape.lineTo(.18,-.012);wingShape.quadraticCurveTo(0,.025,-.18,-.018);wingShape.closePath();const wing=new T.ExtrudeGeometry(wingShape,{depth:s.width*.87,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:2});wing.translate(0,0,-s.width*.435);mesh(shell,wing,carbon,[-s.length*.40,l.roof-.02,0],[0,0,0],'rally-rear-wing');
 for(const z of [-s.width*.31,s.width*.31])rod(shell,carbon,[-s.length*.39,l.belt+.12,z],[-s.length*.40,l.roof-.03,z],.025).name='rally-wing-stay';
 const interior=shell.getObjectByName('interior');if(interior){const cage=new T.Group();cage.name='rally-roll-cage';interior.add(cage);const metal=surface('#d7dfe0',.68,.30),a=l.frontSeat+.24,b=l.frontSeat-.70,y=l.floor+.08,top=l.roof-.07,z=s.width*.34;
  for(const x of [a,b])for(const [p,q] of [[[x,y,-z],[x,top,-z]],[[x,top,-z],[x,top,z]],[[x,top,z],[x,y,z]]] as [V3,V3][])rod(cage,metal,p,q,.021).name='rally-cage-tube';
  for(const side of [-1,1]){rod(cage,metal,[a,top,side*z],[b,top,side*z],.021).name='rally-cage-tube';rod(cage,metal,[a,y,side*z],[b,top*.77,side*z],.021).name='rally-door-bar';}rod(cage,metal,[b,y,-z],[b,top,z],.021).name='rally-cage-diagonal';
 }
 for(const side of [-1,1])for(const offset of [-.16,.10]){const pos:number[]=[],idx:number[]=[];for(let i=0;i<=10;i++)for(let j=0;j<2;j++){const t=i/10,y=l.belt-.42+t*.32,x=offset+t*.24+j*.12,z=side*(bodyHalfWidth(s,x,y)+.005),p=coachworkField(new T.Vector3(x,y,z),s);if(refined)coachbuiltField(p,s);pos.push(...p.toArray());}for(let i=0;i<10;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setIndex(side>0?idx:idx.flatMap((_,i)=>i%3?[]:[idx[i],idx[i+2],idx[i+1]]));geo.computeVertexNormals();mesh(shell,geo,red,[0,0,0],[0,0,0],'rally-livery-sash');}
 for(const mount of mounts){const roll=mount.getObjectByName('wheel-roll')!;roll.traverse(o=>{if(['alloy-spoke','split-spoke'].includes(o.name))o.visible=false;});
  const spokeShape=new T.Shape();spokeShape.moveTo(s.radius*.13,-.012);spokeShape.lineTo(s.radius*.70,-.009);spokeShape.lineTo(s.radius*.70,.009);spokeShape.lineTo(s.radius*.13,.012);spokeShape.closePath();const spokeGeo=new T.ExtrudeGeometry(spokeShape,{depth:.020,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:2});spokeGeo.translate(0,0,-.01);
  const wheelPaint=new T.MeshPhysicalMaterial({color:'#e7e9df',metalness:.35,roughness:.27,clearcoat:.6}),spokes=new T.InstancedMesh(spokeGeo,wheelPaint,24);spokes.name='rally-multi-spoke-wheel';const spokePose=new T.Object3D();for(let i=0;i<24;i++){const side=i<12?1:-1;spokePose.position.set(0,0,side*.116);spokePose.rotation.set(0,side<0?Math.PI:0,(i%12)/12*Math.PI*2);spokePose.updateMatrix();spokes.setMatrixAt(i,spokePose.matrix);}spokes.instanceMatrix.needsUpdate=true;roll.add(spokes);
  const treads=new T.InstancedMesh(new T.BoxGeometry(.035,.012,.072),carbon,48);treads.name='rally-tread';const dummy=new T.Object3D();for(let i=0;i<48;i++){const a=Math.floor(i/2)/24*Math.PI*2;dummy.position.set(Math.cos(a)*(s.radius-.005),Math.sin(a)*(s.radius-.005),i%2?.068:-.068);dummy.rotation.set(0,0,a-Math.PI/2);dummy.updateMatrix();treads.setMatrixAt(i,dummy.matrix);}treads.instanceMatrix.needsUpdate=true;roll.add(treads);}
 // Recess the real bonnet surface; every blade is below a thin paint surround.
 shell.updateMatrixWorld(true);
 for(const side of [-1,1]){
  const x=l.frontBase+.35,z=side*s.width*.19;
  const hit=new T.Raycaster(new T.Vector3(x,3,z),new T.Vector3(0,-1,0)).intersectObject(source)[0];
  if(hit){const y=hit.point.y;source.geometry=cutOpening(source.geometry,[x-.17,y-.035,z-.12],[x+.17,y+.08,z+.12]);
   box(shell,carbon,[.36,.025,.26],[x,y-.035,z],.014,'rally-bonnet-vent-well');
   for(let i=0;i<6;i++){const blade=box(shell,carbon,[.038,.012,.23],[x-.14+i*.056,y-.012,z],.003,'rally-bonnet-vent-blade');blade.rotation.z=-.24;}
   for(const edge of [-1,1])box(shell,paint,[.38,.014,.015],[x,y+.004,z+edge*.135],.005,'rally-vent-surround');
  }
 }
 // Formed aluminium sump protection turns up at the leading edge.
 const plate=new T.Shape();plate.moveTo(-.55,0);plate.lineTo(.46,0);plate.lineTo(.62,.13);plate.lineTo(.60,.15);plate.lineTo(.44,.024);plate.lineTo(-.55,.024);plate.closePath();
 const pg=new T.ExtrudeGeometry(plate,{depth:s.width*.56,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:2});pg.translate(0,0,-s.width*.28);
 const aluminium=surface('#9aa8ae',.8,.43);mesh(shell,pg,aluminium,[s.wheelbase*.32,.13,0],[0,0,0],'rally-sump-guard');
 for(const dx of [-.3,.3])for(const side of [-1,1])mesh(shell,new T.CylinderGeometry(.009,.009,.008,6),carbon,[s.wheelbase*.32+dx,.159,side*s.width*.23],[0,0,0],'sump-guard-fastener');
 const points=[new T.Vector3(s.wheelbase*.30,.43,.15),new T.Vector3(s.wheelbase*.20,.25,.20),new T.Vector3(-s.wheelbase*.25,.25,.20),new T.Vector3(-s.length*.43,.27,.29),new T.Vector3(-s.length*.49,.27,.29)];
 const pipe=mesh(shell,new T.TubeGeometry(new T.CatmullRomCurve3(points),64,.028,12,false),aluminium,[0,0,0],[0,0,0],'rally-exhaust-route');pipe.userData.endpoint=points.at(-1)!.toArray();
 const tip=mesh(shell,new T.CylinderGeometry(.045,.038,.14,32,1,true),aluminium,points.at(-1)!.toArray(),[0,0,Math.PI/2],'rally-exhaust-tip');tip.userData.direction=[-1,0,0];
 box(shell,carbon,[.30,.10,.20],[-s.length*.36,.28,.29],.035,'rally-rear-silencer');
 shell.userData.rally=true;
}
