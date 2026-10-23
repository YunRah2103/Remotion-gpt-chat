import * as T from 'three';
import {mesh,surface} from './geometry.ts';
import {scenicOffset,isScenic} from './world-catalog.ts';
import type {EnvironmentKind,TimeOfDay} from './catalog.ts';

export function sky(g:T.Group,time:TimeOfDay){
 const geo=new T.SphereGeometry(285,48,24),p=geo.attributes.position,colors:number[]=[],top=new T.Color(time==='night'?'#101c30':time==='dusk'?'#6c7395':'#7299b7'),horizon=new T.Color(time==='night'?'#34485c':time==='dusk'?'#ddbd9d':'#b7ced8');
 for(let i=0;i<p.count;i++){const t=T.MathUtils.clamp(p.getY(i)/240,0,1),c=horizon.clone().lerp(top,Math.pow(t,.65));colors.push(c.r,c.g,c.b);}
 geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));const o=mesh(g,geo,new T.MeshBasicMaterial({vertexColors:true,side:T.BackSide,depthWrite:false,fog:false}),[0,0,0],[0,0,0],'gradient-sky');o.castShadow=false;o.receiveShadow=false;o.renderOrder=-10;
}
function wave(x:number,z:number,seed:number){return .52+.20*Math.sin(x*.031+seed)+.14*Math.sin(z*.049+x*.018)+.10*Math.sin(x*.091-z*.073)+.04*Math.sin(x*.23+z*.19);}
export function relief(g:T.Group,kind:EnvironmentKind,seed:number){
 if(['garage','showroom','tunnel','city','industrial','parking','airfield','suburb','service-station','harbour','bridge'].includes(kind))return;
 const alpine=kind==='mountain'||kind==='snow',canyon=kind==='canyon',desert=kind==='desert',coast=kind==='coast';
 for(const sign of [-1,1]){
  if(coast&&sign<0)continue;
  const pos:number[]=[],idx:number[]=[],colors:number[]=[],nx=100,nz=40;
  for(let i=0;i<=nx;i++)for(let j=0;j<=nz;j++){
   const x=-270+i*540/nx,offset=18+j*220/nz,z=(isScenic(kind)?scenicOffset(x,kind):0)+sign*offset;
   let h:number;
   if(kind==='track'){const r=Math.sqrt((x/1.15)**2+z*z);h=T.MathUtils.smoothstep(r,100,160)*wave(x,z,seed)*14;}
   else{const lift=T.MathUtils.smoothstep(offset,canyon?20:alpine?58:coast?35:22,canyon?36:alpine?140:110);const ridge=.38+.62*Math.pow(Math.sin((offset-20)/(alpine?34:45)+Math.sin(x*.027)*.65),2);h=lift*wave(x,z,seed)*ridge*(alpine?70:canyon?52:desert?24:coast?18:kind==='forest'?17:9);}
   if(canyon)h+=Math.floor(h/3)*.16;
   const y=h-.15;pos.push(x,y,z);
   const base=new T.Color(canyon?'#a8866c':desert?'#c9aa80':alpine?'#7b8990':coast?'#7b916e':'#6f855f'),tone=.86+.16*wave(x*2,z*2,seed)+.07*Math.sin(y*2.3);base.multiplyScalar(tone);
   if(alpine&&h>25)base.lerp(new T.Color('#e0e5e3'),T.MathUtils.smoothstep(h,25,43));colors.push(base.r,base.g,base.b);
  }
  for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const a=i*(nz+1)+j;if(sign>0)idx.push(a,a+1,a+nz+1,a+1,a+nz+2,a+nz+1);else idx.push(a,a+nz+1,a+1,a+1,a+nz+1,a+nz+2);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(idx);geo.computeVertexNormals();const mat=surface('#ffffff',.01,.94);mat.vertexColors=true;mesh(g,geo,mat,[0,0,0],[0,0,0],'terrain-relief');
 }
}
