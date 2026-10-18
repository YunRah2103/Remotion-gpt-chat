import * as T from 'three';
export type V3=[number,number,number];
export const paint=(color:string)=>new T.MeshPhysicalMaterial({color,metalness:.38,roughness:.29,clearcoat:.65,clearcoatRoughness:.23});
export const surface=(color:string,metalness=0,roughness=.7)=>new T.MeshStandardMaterial({color,metalness,roughness});
export function mesh(parent:T.Object3D,geometry:T.BufferGeometry,material:T.Material,position:V3=[0,0,0],rotation:V3=[0,0,0],name=''):T.Mesh{
 const m=new T.Mesh(geometry,material);m.position.set(...position);m.rotation.set(...rotation);m.castShadow=true;m.receiveShadow=true;m.name=name;parent.add(m);return m;
}
export function roundedGeometry(x:number,y:number,z:number,r=.05){
 const radius=Math.min(r,x/3,y/3,z/3),s=new T.Shape();
 const a=-x/2,b=-y/2;
 s.moveTo(a+radius,b);s.lineTo(a+x-radius,b);s.quadraticCurveTo(a+x,b,a+x,b+radius);s.lineTo(a+x,b+y-radius);s.quadraticCurveTo(a+x,b+y,a+x-radius,b+y);s.lineTo(a+radius,b+y);s.quadraticCurveTo(a,b+y,a,b+y-radius);s.lineTo(a,b+radius);s.quadraticCurveTo(a,b,a+radius,b);
 const g=new T.ExtrudeGeometry(s,{depth:Math.max(.001,z-2*radius),bevelEnabled:true,bevelThickness:radius,bevelSize:radius*.35,bevelSegments:2,curveSegments:5,steps:1});g.translate(0,0,-(z-2*radius)/2);return g;
}
export const box=(p:T.Object3D,mat:T.Material,size:V3,pos:V3,r=.04,name='')=>mesh(p,roundedGeometry(...size,r),mat,pos,[0,0,0],name);
export function panel(p:T.Object3D,mat:T.Material,points:V3[],name=''){
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));const idx=[];for(let i=1;i<points.length-1;i++)idx.push(0,i,i+1);g.setIndex(idx);g.computeVertexNormals();return mesh(p,g,mat,[0,0,0],[0,0,0],name);
}
export function rod(p:T.Object3D,mat:T.Material,a:V3,b:V3,r=.025){
 const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av);const m=mesh(p,new T.CylinderGeometry(r,r,d.length(),10),mat,av.clone().add(bv).multiplyScalar(.5).toArray() as V3);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;
}
export function disposeObject(root:T.Object3D){const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();root.traverse(o=>{if(o instanceof T.InstancedMesh)o.dispose();if(o instanceof T.Mesh){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});geometries.forEach(g=>g.dispose());const textures=new Set<T.Texture>();materials.forEach(m=>{for(const value of Object.values(m))if(value instanceof T.Texture)textures.add(value);m.dispose();});textures.forEach(t=>t.dispose());}
