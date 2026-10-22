import {roughRallyRoad} from './rough-road.ts';
import {premiumWorldDetail} from './world-detail.ts';
import * as T from 'three';
import {createEnvironment} from '../world-kit/environments.ts';
import type {EnvironmentOptions} from '../world-kit/environments.ts';

/** A separate factory: existing 20 environment IDs and their route geometry remain unchanged. */
export function createCinematicEnvironment(options:EnvironmentOptions & {wetness?:number;roughness?:number;quality?:'lightweight'|'standard'|'hero'}){
 const wet=options.wetness??0;if(!Number.isFinite(wet)||wet<0||wet>1)throw new Error('wetness must be 0..1');
 const roughness=options.roughness??0;if(!Number.isFinite(roughness)||roughness<0||roughness>1||roughness>0&&options.kind!=='rally')throw Error('Roughness requires a rally world and 0..1');
 const quality=options.quality??'hero';if(!['lightweight','standard','hero'].includes(quality))throw new Error('Unknown environment quality');
 const g=createEnvironment(options),roads=new Set(['road','boulevard','circuit-asphalt','runway','parking-asphalt','bridge-deck','forecourt']);
 g.traverse(o=>{if(!(o instanceof T.Mesh)||!roads.has(o.name))return;const mat=o.material as T.MeshStandardMaterial;mat.roughness=.86-wet*.63;mat.metalness=.025+wet*.12;mat.envMapIntensity=1.1;if(mat.bumpMap)mat.bumpScale=.0025;});
 if(quality!=='lightweight')premiumWorldDetail(g,options,quality==='hero');
 if(roughness>0)roughRallyRoad(g,roughness);
 g.userData.surfaceUpgrade='V2 wetness; original world/route preserved';return g;
}
/** Small, repeatable aggregate/patch maps, suitable for software WebGL. */
export function asphaltMaps(){
 const n=128,color=new Uint8Array(n*n*4),rough=new Uint8Array(n*n*4);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const hash=((x*374761393+y*668265263)^(x*y*1274126177))>>>0,v=30+(hash%11),patch=Math.sin(x*.074+Math.sin(y*.06)*2)*Math.sin(y*.093),k=(y*n+x)*4;
  color[k]=v;color[k+1]=v+5;color[k+2]=v+9;color[k+3]=255;rough[k]=rough[k+1]=rough[k+2]=Math.round(210+patch*10);rough[k+3]=255;
 }
 const make=(data:Uint8Array,srgb:boolean)=>{const t=new T.DataTexture(data,n,n,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(48,48);t.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.anisotropy=4;t.needsUpdate=true;return t;};
 return {map:make(color,true),roughnessMap:make(rough,false)};
}
