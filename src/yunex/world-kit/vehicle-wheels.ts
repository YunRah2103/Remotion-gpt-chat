import * as T from 'three';
import {box,mesh,surface} from './geometry.ts';
export type VehicleMaterials={body:T.Material;trim:T.Material;glass:T.Material;metal:T.Material;rubber:T.Material;accent:T.Material;white:T.Material;red:T.Material};

/** Axle → steering pivot → rolling wheel. Calipers deliberately stay on the pivot. */
export function wheel(parent:T.Group,m:VehicleMaterials,x:number,z:number,r:number,w:number,steers:boolean,spokes=5){
 const pivot=new T.Group();pivot.name=`steer-${x}-${z}`;pivot.position.set(x,r,z);pivot.userData.steering=steers;parent.add(pivot);
 const roll=new T.Group();roll.name='wheel-roll';roll.userData={wheel:true,radius:r};pivot.add(roll);
 const profile=[[.69,-.5],[.84,-.5],[.94,-.43],[.985,-.32],[1,-.22],[1,.22],[.985,.32],[.94,.43],[.84,.5],[.69,.5],[.69,-.5]];
 const tyre=new T.LatheGeometry(profile.map(([a,b])=>new T.Vector2(a*r,b*w)),48);tyre.rotateX(Math.PI/2);
 mesh(roll,tyre,m.rubber,[0,0,0],[0,0,0],'tyre');
 const groove=surface('#0a1013',0,.95),rotorMat=surface('#859095',.78,.38),recess=surface('#253039',.65,.38);
 for(const offset of [-.18,0,.18])mesh(roll,new T.TorusGeometry(r-.001,.0018,4,48),groove,[0,0,offset*w],[0,0,0],'tyre-groove');
 mesh(roll,new T.CylinderGeometry(r*.71,r*.71,w*.82,48,1,true),recess,[0,0,0],[Math.PI/2,0,0],'rim-barrel');
 const disc=new T.Shape();disc.absarc(0,0,r*.59,0,Math.PI*2,false);const centre=new T.Path();centre.absarc(0,0,r*.17,0,Math.PI*2,true);disc.holes.push(centre);
 for(let i=0;i<16;i++){const a=i*Math.PI/8,hole=new T.Path();hole.absarc(Math.cos(a)*r*.49,Math.sin(a)*r*.49,r*.023,0,Math.PI*2,true);disc.holes.push(hole);}
 const discGeo=new T.ExtrudeGeometry(disc,{depth:.014,bevelEnabled:false,curveSegments:4});discGeo.translate(0,0,-.007);
 for(const side of [-1,1]){
  mesh(roll,discGeo,rotorMat,[0,0,side*w*.34],[0,0,0],'brake-rotor');
  mesh(roll,new T.TorusGeometry(r*.71,r*.022,8,48),m.metal,[0,0,side*w*.48],[0,0,0],'rim-lip');
  mesh(roll,new T.TorusGeometry(r*.84,.003,4,48),groove,[0,0,side*w*.505],[0,0,0],'sidewall-bead');
  for(let i=0;i<spokes;i++){
   const a=i*Math.PI*2/spokes;
   // Tapered spokes retain open space around the drilled rotor.
   const shape=new T.Shape();shape.moveTo(r*.12,-r*.052);shape.lineTo(r*.71,-r*.031);shape.lineTo(r*.70,r*.045);shape.lineTo(r*.12,r*.075);shape.closePath();
   const geo=new T.ExtrudeGeometry(shape,{depth:.027,bevelEnabled:true,bevelThickness:.003,bevelSize:.003,bevelSegments:1,steps:1});geo.translate(0,0,-.0135);
   const spoke=mesh(roll,geo,m.metal,[0,0,side*w*.465],[0,0,a],'alloy-spoke');spoke.rotation.y=side<0?Math.PI:0;
  }
  mesh(roll,new T.CylinderGeometry(r*.16,r*.16,.038,24),m.metal,[0,0,side*w*.49],[Math.PI/2,0,0],'wheel-hub');
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;mesh(roll,new T.CylinderGeometry(r*.023,r*.023,.014,6),recess,[Math.cos(a)*r*.112,Math.sin(a)*r*.112,side*(w*.49+.026)],[Math.PI/2,0,0],'wheel-bolt');}
  box(pivot,m.accent,[r*.20,r*.48,w*.20],[r*.43,.025,side*w*.34],.015,'brake-caliper');
 }
 return pivot;
}
