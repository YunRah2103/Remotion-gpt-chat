import * as T from 'three';
import {random} from './scenery.ts';
/** Self-contained procedural microstructure; no browser canvas or external textures. */
function grain(seed:number,ground=false){
 const n=128,rng=random(seed),data=new Uint8Array(n*n*4);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const fine=rng(),wave=(Math.sin(x*.19)+Math.sin(y*.11+x*.05))*.025,v=Math.round(ground?210+fine*40+wave*40:220+fine*32+wave*30),i=(y*n+x)*4;data[i]=data[i+1]=data[i+2]=Math.min(255,v);data[i+3]=255;}
 const map=new T.DataTexture(data,n,n,T.RGBAFormat);map.wrapS=map.wrapT=T.RepeatWrapping;map.colorSpace=T.SRGBColorSpace;map.magFilter=T.LinearFilter;map.minFilter=T.LinearMipmapLinearFilter;map.generateMipmaps=true;map.anisotropy=4;map.needsUpdate=true;return map;
}
function waterTexture(){
 const n=128,data=new Uint8Array(n*n*4);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const wave=Math.sin(x*.32+y*.18+Math.sin(y*.12)*2)+.4*Math.sin(y*.53-x*.11),v=Math.round(232+wave*13),i=(y*n+x)*4;data[i]=data[i+1]=data[i+2]=v;data[i+3]=255;}
 const t=new T.DataTexture(data,n,n,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;
}
export function refineSurfaces(g:T.Group,seed:number){
 const asphalt=grain(seed+71),ground=grain(seed+93,true),concrete=grain(seed+112),bump=asphalt.clone();bump.colorSpace=T.NoColorSpace;bump.needsUpdate=true;
 const water=waterTexture();
 const replaced=new Set<T.Material>();
 const roads=['road','boulevard','circuit-asphalt','runway','parking-asphalt'],land=['terrain','terrain-relief','coastal-land','dock-land'],concretes=['sidewalk','display-floor','forecourt','bridge-deck'];
 g.traverse(o=>{if(!(o instanceof T.Mesh)||o instanceof T.InstancedMesh)return;
  const sea=['sea','harbour-water'].includes(o.name)||rootKind(g)==='bridge'&&o.name==='terrain';
  if(!sea&&!roads.includes(o.name)&&!land.includes(o.name)&&!concretes.includes(o.name))return;
  const old=o.material as T.MeshStandardMaterial,mat=old.clone();replaced.add(old);mat.map=sea?water:roads.includes(o.name)?asphalt:land.includes(o.name)?ground:concrete;mat.roughness=roads.includes(o.name)?.88:mat.roughness;
  if(roads.includes(o.name)){mat.bumpMap=bump;mat.bumpScale=.008;}if(sea){mat.bumpMap=water;mat.bumpScale=.12;mat.roughness=.24;mat.metalness=.32;}
  o.material=mat;const p=o.geometry.attributes.position,uv:number[]=[],scale=sea?14:land.includes(o.name)?12:4;for(let i=0;i<p.count;i++)uv.push(p.getX(i)/scale,p.getZ(i)/scale);o.geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
 });
 // A location may not use every surface family; release maps never attached to a material.
 const active=new Set<T.Material>();const used=new Set<T.Texture>();g.traverse(o=>{if(o instanceof T.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material]){active.add(m);for(const value of Object.values(m))if(value instanceof T.Texture)used.add(value);}});replaced.forEach(m=>{if(!active.has(m))m.dispose();});for(const t of [asphalt,ground,concrete,bump,water])if(!used.has(t))t.dispose();
}

function rootKind(g:T.Group){return g.userData.kind as string;}
