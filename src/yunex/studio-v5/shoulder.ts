import * as T from 'three';
import type {Road} from './road.ts';import {sampleRoad} from './road.ts';import {noise2} from './terrain.ts';
/** Three cross-section samples blend a sealed road edge into an irregular terrain verge. */
export function createShoulderGeometry(road:Road,side:number,height:(x:number,z:number)=>number,surface:'asphalt'|'gravel',segments=600){
 if(![-1,1].includes(side)||!Number.isInteger(segments)||segments<2||segments>10000)throw Error('Shoulder needs side ±1 and 2..10000 segments');
 const positions:number[]=[],uv:number[]=[],colors:number[]=[],indices:number[]=[];
 for(let i=0;i<=segments;i++){
  const d=road.length*i/segments,width=(surface==='gravel'?.65:.40)+noise2(d*.12,side*19)*.42;
  for(let j=0;j<3;j++){
   const fraction=j/2,s=sampleRoad(road,d,side*(road.width/2+width*fraction));
   s.position.y=T.MathUtils.lerp(s.position.y-.002,height(s.position.x,s.position.z)+.002,fraction*fraction);
   positions.push(...s.position.toArray());uv.push(d,width*fraction);
   const n=noise2(d*.6,j*.7+side*7),col=new T.Color(surface==='gravel'?'#a3977d':j===0?'#777a75':'#a8a18b');col.multiplyScalar(.78+n*.27);colors.push(col.r,col.g,col.b);
  }
 }
 for(let i=0;i<segments;i++)for(let j=0;j<2;j++){const a=i*3+j,b=a+3;if(side>0)indices.push(a,a+1,b,a+1,b+1,b);else indices.push(a,b,a+1,a+1,b,b+1);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();return geo;
}
export function createShoulderMaterial(){
 const data=new Uint8Array(128*128*4);for(let i=0;i<128*128;i++){const v=120+noise2((i%128)*1.79,Math.floor(i/128)*2.63)*130;data[i*4]=data[i*4+1]=data[i*4+2]=v;data[i*4+3]=255;}
 const texture=new T.DataTexture(data,128,128);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(2,2);texture.generateMipmaps=true;texture.minFilter=T.LinearMipmapLinearFilter;texture.needsUpdate=true;
 return new T.MeshStandardMaterial({map:texture,bumpMap:texture,bumpScale:.012,vertexColors:true,roughness:1,side:T.DoubleSide});
}
