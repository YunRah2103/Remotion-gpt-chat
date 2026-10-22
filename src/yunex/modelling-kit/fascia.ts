/** Modelled bumper architecture: genuine recessed corner apertures and a swept lower blade. */
import * as T from 'three';
import type {VehicleSpec} from '../world-kit/catalog.ts';
import {box,mesh,surface} from '../world-kit/geometry.ts';
import {interiorLayout} from '../world-kit/interiors.ts';
import {bodyTop,bodyHalfWidth} from '../world-kit/vehicle-body.ts';
import {cutOpening} from '../world-kit/cavity.ts';
export function sculptedFascia(shell:T.Group,s:VehicleSpec){
 if(!['normal','sports','suv'].includes(s.family)||s.bodyStyle==='retro'||s.id==='boxy-suv')return;
 const body=shell.getObjectByName('arched-body') as T.Mesh<T.BufferGeometry,T.Material>;if(!body)return;
 const front=s.length/2,l=interiorLayout(s),ev=s.bodyStyle==='ev',dark=surface('#09151b',.18,.36),metal=surface('#40525b',.78,.32);
 for(const side of [-1,1]){
  const w=s.width*(ev?.105:.16),h=ev?.25:s.family==='sports'?.20:.23,y=l.belt-.38,z=side*s.width*.36;
  body.geometry=cutOpening(body.geometry,[front-.20,y-h*.33,z-w*.37],[front+.15,y+h*.33,z+w*.37]);
  const sh=new T.Shape();sh.moveTo(-w*.5,-h*.5);sh.lineTo(w*.5,-h*.5);sh.lineTo(w*.43,h*.5);sh.lineTo(-w*.43,h*.5);sh.closePath();
  const hole=new T.Path();hole.moveTo(-w*.36,-h*.31);hole.lineTo(-w*.31,h*.31);hole.lineTo(w*.31,h*.31);hole.lineTo(w*.36,-h*.31);hole.closePath();sh.holes.push(hole);
  const g=new T.ExtrudeGeometry(sh,{depth:.022,bevelEnabled:true,bevelThickness:.004,bevelSize:.006,bevelSegments:3});g.rotateY(Math.PI/2);
  mesh(shell,g,body.material,[front+.003,y,z],[0,0,0],'coachbuilt-corner-duct-rim');
  box(shell,dark,[.018,h*.73,w*.80],[front-.105,y,z],.008,'coachbuilt-duct-recess');
  for(let i=-1;i<=1;i++)box(shell,metal,[.065,.009,w*.64],[front-.04,y+i*h*.15,z],.002,'coachbuilt-duct-vane');
 }
 const lip=shell.getObjectByName('front-lip') as T.Mesh|undefined;
 if(lip){const span=s.width*.475,sh=new T.Shape();sh.moveTo(-.18,-span);sh.lineTo(.015,-span);sh.quadraticCurveTo(.085,-span*.55,.09,0);sh.quadraticCurveTo(.085,span*.55,.015,span);sh.lineTo(-.18,span);sh.quadraticCurveTo(-.07,0,-.18,-span);sh.closePath();const geo=new T.ExtrudeGeometry(sh,{depth:.025,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:2});geo.rotateX(Math.PI/2);lip.geometry.dispose();lip.geometry=geo;}
 if(s.family==='sports'&&s.bodyStyle!=='muscle')for(const side of [-1,1])for(let i=0;i<5;i++){
  const x=l.frontBase+.28+i*.055,z=side*s.width*.22,top=bodyTop(s,x),half=bodyHalfWidth(s,x,top),y=top+.04*Math.sin(Math.PI*(.5+z/(2*half)))+.006;
  box(shell,dark,[.030,.010,.18],[x,y,z],.002,'coachbuilt-bonnet-louvre');
 }
}
