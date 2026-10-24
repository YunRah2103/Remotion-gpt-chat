/** Editable, class-specific fascia geometry. +X points toward the nose. */
import * as T from 'three';
import type {VehicleSpec} from '../world-kit/catalog.ts';
import {mesh,box} from '../world-kit/geometry.ts';
import {cutOpening} from '../world-kit/cavity.ts';
import {fleetProfile} from './fleet-profiles.ts';
import {fleetCurve} from './fleet-surfaces.ts';
type Materials={paint:T.Material;trim:T.Material;metal:T.Material;white:T.Material;red:T.Material};
/** A painted surround with a genuinely open tapered aperture, extruded in X. */
function surround(parent:T.Group,material:T.Material,x:number,y:number,z:number,w:number,h:number,depth:number,sign:number,taper:number,name:string){
 const shape=new T.Shape();shape.moveTo(-w/2,-h/2);shape.lineTo(w/2,-h/2);shape.lineTo(w/2,h/2);shape.lineTo(-w/2,h/2);shape.closePath();
 const hole=new T.Path();hole.moveTo(-w*.43,-h*.34);hole.lineTo(-w*.43*taper,h*.34);hole.lineTo(w*.43*taper,h*.34);hole.lineTo(w*.43,-h*.34);hole.closePath();shape.holes.push(hole);
 const geometry=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.004,bevelThickness:.004,curveSegments:4});
 return mesh(parent,geometry,material,[x-sign*depth,y,z],[0,sign*Math.PI/2,0],name);
}
function opening(body:T.Mesh,x:number,y:number,z:number,w:number,h:number){const old=body.geometry;body.geometry=cutOpening(old,[x-.21,y-h/2,z-w/2],[x+.21,y+h/2,z+w/2]);old.dispose();}
export function installRefinedFascia(parent:T.Group,body:T.Mesh,s:VehicleSpec,m:Materials){
 const c=fleetProfile(s),half=s.length/2,sport=c.sports,muscle=c.kind==='muscle';
 const lens=new T.MeshPhysicalMaterial({color:'#b2c8d1',roughness:.08,metalness:.05,transparent:true,opacity:.18,depthWrite:false,side:T.FrontSide});
 const projectorGlass=new T.MeshPhysicalMaterial({color:'#8daabe',roughness:.08,metalness:.5,clearcoat:1});
 for(const front of [true,false]){
  const sign=front?1:-1,x=sign*half,y=c.belt-(front?.25:.20);
  const lampW=s.width*(c.utility?.18:c.van?.17:.21),lampH=front?(c.utility?.15:muscle?.12:.10):.075;
  for(const side of [-1,1]){
   const z=side*s.width*.30;opening(body,x,y,z,lampW,lampH);
   surround(parent,m.paint,x+.012*sign,y,z,lampW,lampH,.09,sign,sport?.63:.92,front?'shaped-headlamp-surround':'shaped-tail-surround');
   box(parent,m.trim,[.045,lampH*.88,lampW*.92],[x-sign*.075,y,z],.012,front?'headlamp-housing':'tail-lamp-housing');
   if(front){
    for(const offset of [-.22,.22]){
     const r=muscle?.039:c.utility?.036:.028,zz=z+offset*lampW;
     mesh(parent,new T.SphereGeometry(1,24,16).scale(.027,r,r),m.metal,[x-sign*.035,y,zz],[0,0,0],'headlamp-reflector');
     mesh(parent,new T.TorusGeometry(r,.004,8,32),m.metal,[x-sign*.007,y,zz],[0,Math.PI/2,0],'headlamp-bezel');
     mesh(parent,new T.SphereGeometry(1,24,16).scale(.018,r*.76,r*.76),projectorGlass,[x+sign*.005,y,zz],[0,0,0],'headlamp-projector');
    }
    fleetCurve(parent,m.white,[-.38,-.20,.18,.38].map(t=>new T.Vector3(x+sign*.018,y+lampH*(.27-.12*Math.abs(t)),z+t*lampW)),.0045,'led-signature');
   }else{
    // Separate optical ribs remain visible with the lights switched off.
    for(const level of [-1,1])fleetCurve(parent,m.red,[-.39,0,.39].map(t=>new T.Vector3(x-sign*.016,y+level*.016+Math.abs(t)*.01,z+t*lampW)),.005,'rear-light-guide');
    for(let i=-3;i<=3;i++)box(parent,m.red,[.015,.025,.009],[x+sign*.008,y,z+i*lampW*.105],.003,'tail-optical-rib');
   }
   box(parent,lens,[.008,lampH*.68,lampW*.85],[x+sign*.022,y,z],.006,'lamp-cover');
  }
  const y0=c.sill+.105,h=front?(c.utility?.26:c.rally?.205:c.van?.20:.15):.13;
  const w=s.width*(front?(c.utility?.25:c.rally?.255:muscle?.255:s.bodyStyle==='ev'?.22:.24):.34);
  opening(body,x,y0+h/2,0,w*2,h);
  surround(parent,m.paint,x+.006*sign,y0+h/2,0,w*2,h,.12,sign,c.rally?1.12:sport?.76:.95,front?'sculpted-intake-surround':'sculpted-rear-valance');
  const recess=box(parent,m.trim,[.035,h*.95,w*1.94],[x-sign*.13,y0+h/2,0],.012,front?'radiator-recess':'rear-valance');recess.userData.fasciaFamily=c.kind;
  if(front){
   // Open hexagonal cells, rather than an opaque black grille decal.
   const r=.026,spacing=r*1.85,cols=Math.floor(w*1.7/spacing),rows=Math.max(1,Math.floor(h*.62/(r*1.5)));
   const cell=new T.TorusGeometry(r,.0023,4,6);
   for(let row=0;row<rows;row++)for(let col=0;col<cols;col++)mesh(parent,cell.clone(),m.trim,[x-sign*.035,y0+h/2+(row-(rows-1)/2)*r*1.5,(col-(cols-1)/2)*spacing+(row%2?r*.44:0)],[0,Math.PI/2,Math.PI/6],'grille-open-cell');
   cell.dispose();
   if(!c.van)for(const side of [-1,1]){
    const z=side*s.width*.345,vw=s.width*(c.utility?.105:.115),vh=h*.72,vy=y0+h*.50;
    opening(body,x,vy,z,vw,vh);
    surround(parent,m.paint,x+.005,vy,z,vw,vh,.11,1,.65,'side-intake-surround');
    box(parent,m.trim,[.025,vh*.90,vw*.9],[x-.13,vy,z],.008,'side-intake-recess');
    for(const level of [-1,0,1])box(parent,m.trim,[.075,.009,vw*.70],[x-.055,vy+level*vh*.20,z],.003,'intake-louvre');
   }
  }else if(sport||c.rally){
   for(let i=-3;i<=3;i++)box(parent,m.trim,[.30,.095,.014],[x+.12,c.sill+.04,i*s.width*.09],.004,'rear-diffuser-fin');
  }
  fleetCurve(parent,m.trim,Array.from({length:33},(_,i)=>new T.Vector3(x-sign*.035*(2*i/32-1)**2,c.sill+.025,(-.44+.88*i/32)*s.width)),sport?.022:.027,front?'front-lip':'rear-lip');
 }
}
