import * as T from 'three';
import {box,mesh,rod,surface} from '../world-kit/geometry.ts';
import type {V3} from '../world-kit/geometry.ts';
import type {VehicleSpec} from '../world-kit/catalog.ts';
import {interiorLayout} from '../world-kit/interiors.ts';
/** Bevelled, open intake rim: the centre remains an actual aperture. +X is outward. */
function intake(parent:T.Group,x:number,y:number,z:number,w:number,h:number,mat:T.Material,name:string){
 const shape=new T.Shape();shape.moveTo(-w/2,-h/2);shape.lineTo(w/2,-h/2);shape.lineTo(w*.45,h/2);shape.lineTo(-w*.45,h/2);shape.closePath();
 const hole=new T.Path();hole.moveTo(-w*.40,-h*.30);hole.lineTo(-w*.36,h*.30);hole.lineTo(w*.36,h*.30);hole.lineTo(w*.40,-h*.30);hole.closePath();shape.holes.push(hole);
 const geo=new T.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.009,bevelThickness:.009});
 // shape X spans vehicle Z; extrusion Z becomes vehicle X.
 geo.rotateY(Math.PI/2);return mesh(parent,geo,mat,[x,y,z],[0,0,0],name);
}
/** Extra geometry is inside the shell pivot, so cutaways and suspension preserve attachment. */
export function premiumExterior(shell:T.Group,s:VehicleSpec){
 const black=surface('#10191e',.22,.34),metal=surface('#6e808b',.82,.25);
 if(['normal','sports','suv'].includes(s.family)){
  const l=interiorLayout(s),front=s.length/2,back=-front,wide=s.width*.51,h=.15,y=l.belt-.34;
  if(s.family==='normal')shell.traverse(o=>{if(o.name==='side-intake')o.visible=false;});
  // Match the existing real grille aperture; replace its coarse straight slats.
  if(s.bodyStyle!=='ev'){
  shell.traverse(o=>{if(['grille','grille-slat'].includes(o.name))o.visible=false;});
  box(shell,black,[.010,.14,wide*.95],[front-.095,y,0],.002,'grille-backing');
  intake(shell,front-.025,y,0,wide,h,black,'sculpted-intake-surround');
  const cells:T.BufferGeometry[]=[];
  for(let row=0;row<3;row++)for(let col=0;col<17;col++){
   const z=(col-8)*wide/19+(row%2)*wide/38,cy=y+(row-1)*.033;
   const geo=new T.TorusGeometry(.020,.0032,4,6);geo.rotateY(Math.PI/2);geo.translate(front-.045,cy,z);cells.push(geo);
  }
  // One draw call for the complete metal grille, with open cells.
  const positions:number[]=[],normals:number[]=[];
  for(const geo of cells){const g=geo.toNonIndexed();positions.push(...g.attributes.position.array);normals.push(...g.attributes.normal.array);geo.dispose();g.dispose();}
  const grid=new T.BufferGeometry();grid.setAttribute('position',new T.Float32BufferAttribute(positions,3));grid.setAttribute('normal',new T.Float32BufferAttribute(normals,3));mesh(shell,grid,metal,[0,0,0],[0,0,0],'recessed-grille');
  }
  for(const side of [-1,1]){
   const z=side*s.width*.36;
   // Rear channels follow the bumper, clear of the tyre and central exhaust bore.
   for(let i=0;i<3;i++)box(shell,black,[.22,.09,.018],[back+.10,.30,z+side*i*.065],.004,'rear-diffuser-channel');
   if(s.id==='supercar'){
    const path=new T.CatmullRomCurve3([new T.Vector3(-.28,l.belt-.09,side*s.width*.49),new T.Vector3(-.55,l.belt-.20,side*s.width*.505),new T.Vector3(-.82,l.belt-.11,side*s.width*.49)]);
    mesh(shell,new T.TubeGeometry(path,28,.027,8,false),black,[0,0,0],[0,0,0],'side-intake-sculpture');
    for(let j=0;j<4;j++)box(shell,black,[.22,.012,.24],[-.69-j*.13,l.belt+.013,side*.43],.003,'engine-deck-louvre');
   }
  }
 }
 if(s.id==='formula-modern'){
  shell.traverse(o=>{if(o.name==='sidepod')o.visible=false;});
  const source=shell.getObjectByName('single-seater-body') as T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>;
  const paint=new T.MeshPhysicalMaterial({color:source.material.color,metalness:.42,roughness:.23,clearcoat:1,clearcoatRoughness:.12});
  // Continuous lofted shoulders and undercut sides rather than rectangular sidepods.
  for(const side of [-1,1]){
   const p:number[]=[],idx:number[]=[],nx=32,nr=24;
   for(let i=0;i<=nx;i++){
    const t=i/nx,x=.08-t*1.48,w=.19+.13*Math.sin(Math.PI*t)**.7,cy=.47-.10*t,h=.19*(1-.54*t);
    for(let j=0;j<=nr;j++){const a=j/nr*Math.PI*2;p.push(x,cy+Math.sin(a)*h,side*(.34+Math.cos(a)*w));}
   }
   for(let i=0;i<nx;i++)for(let j=0;j<nr;j++){const a=i*(nr+1)+j;idx.push(a,a+1,a+nr+1,a+1,a+nr+2,a+nr+1);}
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setIndex(idx);geo.computeVertexNormals();
   // Reflecting a surface flips winding; retain its intended outward normals.
   if(side<0){const a=geo.index!;for(let i=0;i<a.count;i+=3){const b=a.getX(i+1);a.setX(i+1,a.getX(i+2));a.setX(i+2,b);}geo.computeVertexNormals();}
   mesh(shell,geo,paint,[0,0,0],[0,0,0],'sculpted-sidepod');
   intake(shell,.085,.47,side*.34,.44,.27,black,'sidepod-inlet-lip');
   const points:V3[]=[[-1.67,.49,side*.19],[-1.94,.76,side*.19],[-2.13,1.01,side*.19],[-2.18,1.03,side*.19]];
   for(let i=1;i<points.length;i++)rod(shell,black,points[i-1],points[i],.024).name='swan-neck-support';
  }
 }
}
