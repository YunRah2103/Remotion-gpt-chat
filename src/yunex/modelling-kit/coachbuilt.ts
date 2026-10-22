/** Surface and optical refinement. Existing names, apertures, wheel pivots and interior targets stay canonical. */
import * as T from 'three';
import {TessellateModifier} from 'three/examples/jsm/modifiers/TessellateModifier.js';
import {mesh,box,surface} from '../world-kit/geometry.ts';
import type {V3} from '../world-kit/geometry.ts';
import type {VehicleSpec} from '../world-kit/catalog.ts';
import {interiorLayout} from '../world-kit/interiors.ts';
import {cutOpening} from '../world-kit/cavity.ts';
export function coachbuiltField(p:T.Vector3,s:VehicleSpec){
 const l=interiorLayout(s),half=s.length/2,side=Math.min(1.2,Math.abs(p.z)/(s.width/2)),x=p.x,y=p.y;
 const d=Math.min(Math.abs(x-s.wheelbase/2),Math.abs(x+s.wheelbase/2));
 const locked=(1-T.MathUtils.smoothstep(d,s.radius*1.10,s.radius*2.40))*(1-T.MathUtils.smoothstep(y,s.radius*1.92,s.radius*2.42)),free=1-locked;
 const roof=T.MathUtils.smoothstep(y,l.belt+.04,l.roof-.02),flank=T.MathUtils.smoothstep(side,.55,.9),sport=s.family==='sports';
 const nose=T.MathUtils.smoothstep(x,half*.55,half),tail=1-T.MathUtils.smoothstep(x,-half,-half*.63);
 const waist=Math.exp(-(((y-(l.belt-.27))/.19)**2))*Math.exp(-((x/(s.wheelbase*.41))**4));
 p.x+=(-nose*(sport?.13:.11)+tail*.095)*side**3*free*(1-roof*.65);
 p.z*=1-free*(flank*waist*(sport?.085:.075)+nose*.065*side**2+tail*.045*side**2)-roof*.045;
 p.z+=Math.sign(p.z)*free*flank*.026*Math.exp(-(((y-l.belt+.10)/.18)**2));
 p.y-=free*nose*.055*side**2*(1-roof);
 p.y+=roof*.026*(1-Math.min(1,side**2));
 return p;
}
function tube(g:T.Object3D,m:T.Material,points:V3[],radius:number,name:string){return mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),40,radius,10,false),m,[0,0,0],[0,0,0],name);}
function formulaFinish(shell:T.Group,s:VehicleSpec){
 const body=shell.getObjectByName('single-seater-body') as T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>;if(!body)return;
 const carbon=surface('#101c22',.45,.27),paint=new T.MeshPhysicalMaterial({color:body.material.color,metalness:.38,roughness:.19,clearcoat:1,clearcoatRoughness:.12});
 // A tapered engine spine with true compound curvature, rather than another extruded box.
 body.geometry=cutOpening(body.geometry,[-s.length/2-.1,.56,-s.width],[-.58,1.4,s.width]);
 const p:number[]=[],idx:number[]=[],nx=36,nr=24;
 for(let i=0;i<=nx;i++){const t=i/nx,x=-.57-t*1.55,width=.27*(1-t)+.085,height=.41*(1-.80*T.MathUtils.smoothstep(t,.58,1));for(let j=0;j<=nr;j++){const a=j/nr*Math.PI;p.push(x,.54+Math.sin(a)*height,Math.cos(a)*width);}}
 for(let i=0;i<nx;i++)for(let j=0;j<nr;j++){const a=i*(nr+1)+j;idx.push(a,a+nr+1,a+1,a+1,a+nr+1,a+nr+2);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setIndex(idx);geo.computeVertexNormals();paint.side=T.DoubleSide;mesh(shell,geo,paint,[0,0,0],[0,0,0],'coachbuilt-engine-cover');
 shell.traverse(o=>{if(o instanceof T.Mesh&&!o.name&&o.geometry instanceof T.CylinderGeometry&&o.geometry.parameters.radiusTop===.028&&o.position.y>.7)o.visible=false;});
 tube(shell,carbon,[[-.64,.81,-.28],[-.47,.94,-.30],[-.12,.96,-.21],[.15,.90,0],[-.12,.96,.21],[-.47,.94,.30],[-.64,.81,.28]],.028,'coachbuilt-halo');
 tube(shell,carbon,[[.15,.90,0],[.23,.79,0],[.30,.65,0]],.028,'coachbuilt-halo-pylon');
 for(const side of [-1,1])for(let i=0;i<7;i++){const gill=box(shell,carbon,[.018,.035,.15],[-.88-i*.11,.66-i*.018,side*(.24-i*.012)],.004,'coachbuilt-cooling-gill');gill.rotation.z=-.32;}
}
/** Kept additive and optional: bodyDetail:'legacy' reconstructs the previous hero for matching-camera comparisons. */
export function coachbuiltFinish(shell:T.Group,mounts:T.Group[],s:VehicleSpec){
 if(s.id==='formula-modern'){formulaFinish(shell,s);return;}
 if(!['normal','sports','suv'].includes(s.family)||s.bodyStyle==='retro'||s.id==='boxy-suv')return;
 const glassNames=new Set(['windshield','rear-glass','side-glass','window-frame','rear-window-frame','windshield-seal']);
 const optical=surface('#8b9ca4',.94,.16),lens=new T.MeshPhysicalMaterial({color:'#dcecf0',metalness:0,roughness:.07,clearcoat:1,transparent:true,opacity:.72,depthWrite:false});
 const mirrors:T.Mesh[]=[],projectors:T.Mesh[]=[];shell.traverse(o=>{if(o instanceof T.Mesh){if(o.name==='mirror')mirrors.push(o);if(o.name==='projector-light')projectors.push(o);}});
 for(const mirror of mirrors){mirror.geometry.dispose();mirror.geometry=new T.SphereGeometry(1,28,16).scale(.124,.060,.084);const p=mirror.geometry.attributes.position;for(let i=0;i<p.count;i++)if(p.getX(i)<-.080)p.setX(i,-.080);mirror.geometry.computeVertexNormals();}
 shell.traverse(o=>{if(o.name==='mirror-glass')o.position.x+=.029;});
 for(const projector of projectors){const r=(projector.geometry as T.CylinderGeometry).parameters.radiusTop;mesh(projector,new T.TorusGeometry(r*1.04,r*.12,8,28),optical,[0,-.008,0],[Math.PI/2,0,0],'projector-optical-bezel');mesh(projector,new T.SphereGeometry(1,20,12).scale(r*.88,.006,r*.88),lens,[0,-.013,0],[0,0,0],'projector-optical-lens');}
 shell.updateMatrixWorld(true);const e=.0001;
 shell.traverse(o=>{if(!(o instanceof T.Mesh))return;for(let a:T.Object3D|null=o;a&&a!==shell;a=a.parent)if(a.name==='interior')return;
  let next=o.geometry.clone();if(glassNames.has(o.name)){const dense=new TessellateModifier(.16,3).modify(next);next.dispose();next=dense;}
  const inverse=o.matrixWorld.clone().invert(),worldNormals=new T.Matrix3().getNormalMatrix(o.matrixWorld),localNormals=new T.Matrix3().getNormalMatrix(inverse),positions=next.attributes.position,normals=next.attributes.normal;
  for(let i=0;i<positions.count;i++){const p=new T.Vector3().fromBufferAttribute(positions,i).applyMatrix4(o.matrixWorld),mapped=coachbuiltField(p.clone(),s),q=mapped.clone().applyMatrix4(inverse);positions.setXYZ(i,q.x,q.y,q.z);
   if(normals){const dx=coachbuiltField(p.clone().add(new T.Vector3(e,0,0)),s).sub(mapped).divideScalar(e),dy=coachbuiltField(p.clone().add(new T.Vector3(0,e,0)),s).sub(mapped).divideScalar(e),dz=coachbuiltField(p.clone().add(new T.Vector3(0,0,e)),s).sub(mapped).divideScalar(e),jacobian=new T.Matrix3().set(dx.x,dy.x,dz.x,dx.y,dy.y,dz.y,dx.z,dy.z,dz.z).invert().transpose();const n=new T.Vector3().fromBufferAttribute(normals,i).applyMatrix3(worldNormals).applyMatrix3(jacobian).applyMatrix3(localNormals).normalize();normals.setXYZ(i,n.x,n.y,n.z);}
  }
  next.computeBoundingBox();next.computeBoundingSphere();o.geometry.dispose();o.geometry=next;
 });
 // Valve stems and machined hub centres live on rolling pivots, never on the brake caliper.
 for(const mount of mounts){const roll=mount.getObjectByName('wheel-roll')!;for(const side of [-1,1])mesh(roll,new T.CylinderGeometry(.006,.006,.025,8),optical,[s.radius*.47,s.radius*.47,side*.126],[Math.PI/2,0,0],'machined-valve-stem');}
 shell.userData.coachbuilt=true;
}
