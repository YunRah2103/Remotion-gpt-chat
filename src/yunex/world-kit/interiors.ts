/** Modular stylised interior shared across generic YUNEX passenger cars and trucks.
 * Metres; +X points forward, +Y up, +Z left. An illustrative film asset, not CAD.
 * Factory is deterministic and has no independent animation clock.
 */
import * as T from 'three';
import type {VehicleSpec} from './catalog.ts';
import {box,mesh,rod,surface} from './geometry.ts';

export type InteriorOptions={color?:string;steeringSide?:'left'|'right'};
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
type Finishes={seat:T.Material;leather:T.Material;plastic:T.Material;metal:T.Material;screen:T.Material;accent:T.Material};
function finishes(o:InteriorOptions):Finishes{
 return {seat:surface(o.color??'#353c42',.04,.88),leather:surface('#252c32',.02,.84),
  plastic:surface('#17232a',.06,.69),metal:surface('#a6b1b2',.7,.3),
  screen:new T.MeshStandardMaterial({color:'#294452',emissive:'#173b4c',emissiveIntensity:.5,roughness:.24}),
  accent:surface('#8b9da5',.42,.38)};
}
function makeSeat(g:T.Group,m:Finishes,x:number,y:number,z:number,scale=1,sport=false,head=true){
 const w=(sport?.39:.44)*scale;
 box(g,m.seat,[.48*scale,.10*scale,w],[x,y,z],.055,'interior-seat-cushion');
 box(g,m.seat,[.12*scale,.44*scale,w],[x-.20*scale,y+.24*scale,z],.045,'interior-seat-back');
 box(g,m.leather,[.045*scale,.27*scale,w*.70],[x-.136*scale,y+.25*scale,z],.022,'interior-seat-insert');
 if(head)box(g,m.seat,[.115*scale,.15*scale,w*.66],[x-.22*scale,y+.52*scale,z],.03,'interior-headrest');
 if(sport)for(const side of [-1,1])box(g,m.seat,[.20*scale,.26*scale,.075*scale],[x-.15*scale,y+.27*scale,z+side*w*.43],.03,'interior-bolster');
}
function steering(g:T.Group,m:Finishes,x:number,y:number,z:number,r=.16){
 rod(g,m.metal,[x+.09,y-.02,z],[x-.22,y-.10,z],.024);
 mesh(g,new T.TorusGeometry(r,.019,8,32),m.leather,[x,y,z],[0,Math.PI/2,0],'interior-steering-wheel');
 for(const a of [0,2*Math.PI/3,4*Math.PI/3]){
  const dy=Math.cos(a)*r*.66,dz=Math.sin(a)*r*.66;
  rod(g,m.metal,[x,y,z],[x,y+dy,z+dz],.012);
 }
 mesh(g,new T.CylinderGeometry(.049,.049,.035,16),m.accent,[x,y,z],[0,0,Math.PI/2],'interior-steering-hub');
}
function instrumentPanel(g:T.Group,m:Finishes,x:number,y:number,width:number,driverZ:number){
 box(g,m.plastic,[.30,.16,width*.83],[x,y,0],.045,'interior-dashboard');
 box(g,m.screen,[.012,.135,.28],[x-.158,y+.018,driverZ],.012,'interior-gauges');
 box(g,m.screen,[.014,.17,.23],[x-.159,y+.10,0],.012,'interior-centre-display');
 for(const z of [-width*.31,width*.31])box(g,m.accent,[.016,.036,.13],[x-.16,y-.005,z],.009,'interior-air-vent');
}
export function createCarInterior(s:VehicleSpec,o:InteriorOptions={}):T.Group{
 const g=new T.Group();g.name='YUNEX-Shared-Car-Interior';
 const m=finishes(o),sports=s.family==='sports',suv=s.family==='suv';
 const belt=suv?s.height*.59:sports?.79:(s.id==='pickup'?1.08:.94);
 const roof=s.height-.035;
 const shoulder=clamp(roof-belt,.24,.87);
 const frontY=belt-.13;
 const frontX=s.length*.015;
 const seatScale=clamp(shoulder/.53,.66,1.08);
 const rowZ=s.width*.245,driverZ=(o.steeringSide==='right'?-1:1)*rowZ;
 box(g,m.leather,[s.wheelbase*.85,.045,s.width*.77],[-.14,frontY-.25,0],.018,'interior-floor');
 for(const z of [-rowZ,rowZ])makeSeat(g,m,frontX,frontY,z,seatScale,sports);
 if(!sports&&s.id!=='pickup'){
  const rearX=-s.length*.255;
  // Distinct rear row; MPV has an additional row for storytelling shots.
  for(const z of [-rowZ,rowZ])makeSeat(g,m,rearX,frontY-.02,z,seatScale*.90,false);
  if(s.id==='family-mpv'||s.id==='panel-van')for(const z of [-rowZ,rowZ])
   makeSeat(g,m,-s.length*.36,frontY-.02,z,seatScale*.75,false,false);
 }
 const dashX=s.length*.205, dashY=belt+.015;
 instrumentPanel(g,m,dashX,dashY,s.width,driverZ);
 steering(g,m,dashX-.27,dashY-.03,driverZ,.14);
 box(g,m.plastic,[.54,.12,.20],[(dashX+frontX)*.5,frontY-.02,0],.04,'interior-centre-console');
 box(g,m.metal,[.055,.15,.045],[frontX+.15,frontY+.10,0],.012,'interior-gear-selector');
 for(const z of [-rowZ,rowZ])box(g,m.leather,[.04,.29,.08],[frontX-.15,frontY-.08,z*1.68],.013,'interior-door-armrest');
 g.userData={layout:'shared-passenger-car',steeringSide:o.steeringSide??'left',interior:true};
 return g;
}
/** Same seat, wheel, panel and material system arranged around a tall truck cab. */
export function createTruckInterior(s:VehicleSpec,o:InteriorOptions={}):T.Group{
 const g=new T.Group();g.name='YUNEX-Shared-Truck-Interior';
 const m=finishes(o),cabX=s.wheelbase/2-.20,rowZ=s.width*.22;
 const driverZ=(o.steeringSide==='right'?-1:1)*rowZ;
 box(g,m.leather,[1.43,.045,s.width*.76],[cabX-.20,1.04,0],.02,'interior-floor');
 for(const z of [-rowZ,rowZ])makeSeat(g,m,cabX-.29,1.19,z,1.02,false);
 instrumentPanel(g,m,cabX+.54,1.67,s.width*.87,driverZ);
 steering(g,m,cabX+.28,1.68,driverZ,.19);
 box(g,m.plastic,[.48,.15,.21],[cabX+.02,1.23,0],.025,'interior-centre-console');
 g.userData={layout:'shared-truck-cab',steeringSide:o.steeringSide??'left',interior:true};
 return g;
}
