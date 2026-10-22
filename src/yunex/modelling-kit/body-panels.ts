/** Real replaceable, closed sheet-metal skins. Units metres; canonical wheel/cabin anchors stay fixed. */
import * as T from 'three';
import {toCreasedNormals} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {cutOpening} from '../world-kit/cavity.ts';
import {bodyHalfWidth} from '../world-kit/vehicle-body.ts';
import {interiorLayout} from '../world-kit/interiors.ts';
import type {VehicleSpec} from '../world-kit/catalog.ts';
import {mesh} from '../world-kit/geometry.ts';
type Region={x0:number;x1:number;y0:number;y1:number;label:string};
/** Front doors use existing seam/handle boundaries, rather than inventing a new cabin layout. */
export function doorRegions(s:VehicleSpec):Region[]{
 const l=interiorLayout(s),heavy=s.id==='box-truck'||s.id==='tractor-truck';
 if(heavy)return [{x0:s.wheelbase/2-.65,x1:s.wheelbase/2+.57,y0:1.03,y1:1.57,label:'front'}];
 const x0=Math.max(-s.wheelbase/2+s.radius*1.16,-s.length*.09),x1=Math.min(s.wheelbase/2-s.radius*1.16,l.frontBase-.10),y0=s.radius*.70+.15,y1=l.belt-.025;
 if(x1-x0<.30||y1-y0<.18)return [];
 return [{x0,x1,y0,y1,label:'front'}];
}
function panelGeometry(s:VehicleSpec,r:Region,side:number,heavy:boolean){
 const nx=24,ny=16,count=(nx+1)*(ny+1),positions:number[]=[],indices:number[]=[],gap=.003,thickness=.020;
 for(let layer=0;layer<2;layer++)for(let i=0;i<=nx;i++)for(let j=0;j<=ny;j++){
  const u=i/nx,v=j/ny,x=T.MathUtils.lerp(r.x0+gap,r.x1-gap,u),y=T.MathUtils.lerp(r.y0+gap,r.y1-gap,v);
  const crown=.014*Math.sin(Math.PI*u)*Math.sin(Math.PI*v),waist=.009*Math.sin(Math.PI*u)**2*Math.exp(-(((v-.35)/.18)**2));
  const width=(heavy?(s.width-.09)/2:bodyHalfWidth(s,x,y))+crown-waist;
  positions.push(x,y,side*(width-layer*thickness));
 }
 const face=(a:number,b:number,c:number)=>indices.push(...(side>0?[a,b,c]:[a,c,b]));
 for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){const a=i*(ny+1)+j,b=a+ny+1;face(a,b,a+1);face(a+1,b,b+1);face(a+count,a+1+count,b+count);face(a+1+count,b+1+count,b+count);}
 const ring:number[]=[];for(let i=0;i<=nx;i++)ring.push(i*(ny+1));for(let j=1;j<=ny;j++)ring.push(nx*(ny+1)+j);for(let i=nx-1;i>=0;i--)ring.push(i*(ny+1)+ny);for(let j=ny-1;j>0;j--)ring.push(j);
 for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length];face(a,a+count,b);face(b,a+count,b+count);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();const smooth=toCreasedNormals(g,Math.PI/4);g.dispose();return smooth;
}
export function coachbuiltPanels(shell:T.Group,s:VehicleSpec){
 const heavy=s.id==='box-truck'||s.id==='tractor-truck',source=shell.getObjectByName(heavy?'cab':'arched-body') as T.Mesh<T.BufferGeometry,T.Material>|undefined;
 if(!source||s.bodyStyle==='retro')return;
 shell.updateMatrixWorld(true);const inverse=source.matrixWorld.clone().invert();
 for(const r of doorRegions(s))for(const side of [-1,1]){
  // Cut only the outer side surface. The replacement retains an inward return and a genuine panel gap.
  const a=new T.Vector3(r.x0,r.y0,side>0?s.width*.35:-s.width).applyMatrix4(inverse),b=new T.Vector3(r.x1,r.y1,side>0?s.width:-s.width*.35).applyMatrix4(inverse);
  source.geometry=cutOpening(source.geometry,a.toArray(),b.toArray());
  const panel=mesh(shell,panelGeometry(s,r,side,heavy),source.material,[0,0,0],[0,0,0],`coachbuilt-door-${r.label}-${side>0?'left':'right'}`);
  panel.userData.editablePanel=true;panel.userData.thickness=.020;panel.userData.sourceSurface=source.name;panel.userData.region=r;
 }
 // The actual seam is now the opening between the real body and the replacement skin.
 shell.traverse(o=>{if(o.name==='door-seam'||heavy&&o.name==='cab-door-seam')o.visible=false;});
}
