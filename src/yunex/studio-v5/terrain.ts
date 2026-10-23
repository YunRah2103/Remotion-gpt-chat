import * as T from 'three';
import {sampleRoad} from './road.ts';import type {Road} from './road.ts';
const fract=(x:number)=>x-Math.floor(x);
function hash(x:number,z:number){return fract(Math.sin(x*127.1+z*311.7)*43758.5453);}
export function noise2(x:number,z:number){const a=Math.floor(x),b=Math.floor(z),u=x-a,v=z-b,s=u*u*(3-2*u),t=v*v*(3-2*v);return T.MathUtils.lerp(T.MathUtils.lerp(hash(a,b),hash(a+1,b),s),T.MathUtils.lerp(hash(a,b+1),hash(a+1,b+1),s),t);}
export function terrainContext(road:Road,preset:string){
 const samples=Array.from({length:401},(_,i)=>sampleRoad(road,road.length*i/400));
 const bounds=new T.Box3().setFromPoints(samples.map(s=>s.position));
 function height(x:number,z:number){
 let nearest=samples[0],best=Infinity;for(const s of samples){const d=(x-s.position.x)**2+(z-s.position.z)**2;if(d<best){best=d;nearest=s;}}
 const delta=new T.Vector3(x-nearest.position.x,0,z-nearest.position.z),offset=delta.dot(nearest.left),dist=Math.sqrt(best),edge=Math.max(0,dist-road.width/2-1.0),blend=T.MathUtils.smoothstep(edge,0,preset==='mountain'?28:10);
 const n=(noise2(x*.018,z*.018)*.65+noise2(x*.05+12,z*.05)*.24+noise2(x*.14,z*.14)*.085+noise2(x*.36,z*.36)*.025);
 const roadY=nearest.position.y+offset*nearest.left.y;
 const relief=preset==='mountain'?(offset>0?Math.pow(edge,.7)*2.0*(.4+n): -Math.min(28,edge*.32)+Math.pow(Math.max(0,edge-150),.75)*1.8*(.4+n)+n*9):preset==='rally'?(n-.4)*6:(n-.4)*.5;
 return roadY+blend*relief-.05;
 }
 return {height,bounds};
}
export function createTerrain(road:Road,preset:string){
 const context=terrainContext(road,preset),{bounds}=context,margin=preset==='mountain'?280:100,nx=250,nz=170,pos:number[]=[],uv:number[]=[],colors:number[]=[],idx:number[]=[];
 const minX=bounds.min.x-margin,maxX=bounds.max.x+margin,minZ=bounds.min.z-margin,maxZ=bounds.max.z+margin;
 for(let i=0;i<=nx;i++)for(let j=0;j<=nz;j++){
 const x=T.MathUtils.lerp(minX,maxX,i/nx),z=T.MathUtils.lerp(minZ,maxZ,j/nz),y=context.height(x,z),n=noise2(x*.09,z*.09),rock=preset==='mountain'&&y>18;
 pos.push(x,y,z);uv.push(x*.15,z*.15);const col=new T.Color(rock?'#78766c':preset==='rally'?'#535842':'#73745a');col.multiplyScalar(.72+n*.45);colors.push(col.r,col.g,col.b);
 }
 for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const a=i*(nz+1)+j,b=a+nz+1;idx.push(a,a+1,b,a+1,b+1,b);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();
 const data=new Uint8Array(128*128*4);for(let i=0;i<128*128;i++){const v=150+hash(i%128,Math.floor(i/128))*90;data[i*4]=data[i*4+1]=data[i*4+2]=v;data[i*4+3]=255;}
 const tex=new T.DataTexture(data,128,128,T.RGBAFormat);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.colorSpace=T.SRGBColorSpace;tex.generateMipmaps=true;tex.minFilter=T.LinearMipmapLinearFilter;tex.magFilter=T.LinearFilter;tex.anisotropy=4;tex.needsUpdate=true;
 const mat=new T.MeshStandardMaterial({vertexColors:true,map:tex,bumpMap:tex,bumpScale:.07,roughness:1,side:T.DoubleSide});
 const mesh=new T.Mesh(geo,mat);mesh.name='v5-continuous-heightfield';mesh.receiveShadow=true;
 // Place scenery on the actual triangulated heightfield, not a higher-frequency analytic approximation.
 const vertex=geo.getAttribute('position');
 function visibleHeight(x:number,z:number){
  const fx=T.MathUtils.clamp((x-minX)/(maxX-minX)*nx,0,nx),fz=T.MathUtils.clamp((z-minZ)/(maxZ-minZ)*nz,0,nz),i=Math.min(nx-1,Math.floor(fx)),j=Math.min(nz-1,Math.floor(fz)),u=fx-i,v=fz-j,a=i*(nz+1)+j;
  const y00=vertex.getY(a),y01=vertex.getY(a+1),y10=vertex.getY(a+nz+1),y11=vertex.getY(a+nz+2);
  return u+v<=1?y00+(y10-y00)*u+(y01-y00)*v:y11+(y01-y11)*(1-u)+(y10-y11)*(1-v);
 }
 return {mesh,...context,height:visibleHeight};
}
