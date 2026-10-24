/** Continuous oval coachwork loft. The section and the end domes share one evaluator. */
import * as T from 'three';
import type {VehicleSpec} from '../world-kit/catalog.ts';
import {fleetProfile} from './fleet-profiles.ts';
import {angleWeightedNormals} from './studio-normals.ts';
const blend=(t:number)=>{t=T.MathUtils.clamp(t,0,1);return t*t*(3-2*t);};
export function bodyCapDepth(s:VehicleSpec){const c=fleetProfile(s);return c.van?.13:c.utility?.16:c.sports?.23:.20;}
export function bodySection(s:VehicleSpec,x:number){
 const c=fleetProfile(s),half=s.length/2,d=bodyCapDepth(s),q=T.MathUtils.clamp(x,-half+d,half-d);
 const front=blend((q-c.frontBase)/(half-d-c.frontBase)),rear=blend((c.rearBase-q)/(half-d+c.rearBase));
 const frontAxle=Math.exp(-(((q-s.wheelbase/2)/(.19*s.length))**2)),rearAxle=Math.exp(-(((q+s.wheelbase/2)/(.19*s.length))**2));
 // A full bonnet and door volume, with gentle longitudinal crown instead of a wedge.
 const deck=c.belt+c.crown-.055*front-.035*rear+.018*frontAxle+.022*rearAxle;
 const width=s.width*.5*(1-.018*Math.cos(q/half*Math.PI/2)**2-.055*(front+rear));
 return {deck,width,centre:(deck+c.sill)/2,upper:(deck-c.sill)/2,lower:(deck-c.sill)/2,frontAxle,rearAxle,axle:Math.max(frontAxle,rearAxle)};
}
const power=.79;
function signedPower(x:number,p:number){return Math.sign(x)*Math.abs(x)**p;}
/** Clockwise from the crown, continuous tangents through shoulder, flank and rocker. */
export function bodyRing(s:VehicleSpec,x:number,theta:number){
 const a=bodySection(s,x),cy=Math.cos(theta),sz=Math.sin(theta);
 return new T.Vector3(x,a.centre+(cy>=0?a.upper:a.lower)*signedPower(cy,power),a.width*signedPower(sz,power));
}
export function bodyDeck(s:VehicleSpec,x:number,v:number){
 const a=bodySection(s,x),z=T.MathUtils.clamp(v,-1,1);
 return new T.Vector3(x,a.centre+a.upper*Math.max(0,1-Math.abs(z)**(2/power))**(power/2),a.width*z);
}
export function bodyFlank(s:VehicleSpec,x:number,y:number,side:number){
 const a=bodySection(s,x),v=T.MathUtils.clamp((y-a.centre)/(y>=a.centre?a.upper:a.lower),-1,1);
 return new T.Vector3(x,y,side*a.width*Math.max(0,1-Math.abs(v)**(2/power))**(power/2));
}
export function fleetEndFrame(s:VehicleSpec,front:boolean){const c=fleetProfile(s),capDepth=bodyCapDepth(s),a=bodySection(s,(front?1:-1)*(s.length/2-capDepth));return {deck:a.deck,sill:c.sill,width:a.width,centreY:a.centre,capDepth};}
/** A formed elliptical nose/tail, never a planar fan cap. Y/Z are physical coordinates. */
export function fleetEndSurface(s:VehicleSpec,front:boolean,y:number,z:number){
 const sign=front?1:-1,d=bodyCapDepth(s),base=sign*(s.length/2-d),a=bodySection(s,base),v=(y-a.centre)/(y>=a.centre?a.upper:a.lower);
 const r=(Math.abs(v)**(2/power)+Math.abs(z/a.width)**(2/power))**(power/2);
 return new T.Vector3(sign*(s.length/2-d+d*Math.sqrt(Math.max(0,1-r*r))),y,z);
}
export function roundedBodyGeometry(s:VehicleSpec){
 const c=fleetProfile(s),half=s.length/2,d=bodyCapDepth(s),p:number[]=[],indices:number[]=[],rows:number[][]=[];
 const addRow=(fn:(angle:number)=>T.Vector3)=>{const row:number[]=[];for(let j=0;j<96;j++){const q=fn(j/96*Math.PI*2);row.push(p.length/3);p.push(q.x,q.y,q.z);}rows.push(row);};
 // Elliptical cap rings meet the body with the same tangent and never share one flat X plane.
 for(let i=1;i<=20;i++){const phi=-Math.PI/2+i/20*Math.PI/2;addRow(t=>{const q=bodyRing(s,-half+d,t),a=bodySection(s,-half+d);return new T.Vector3(-half+d+d*Math.sin(phi),a.centre+(q.y-a.centre)*Math.cos(phi),q.z*Math.cos(phi));});}
 const xs:number[]=[];for(let i=1;i<160;i++)xs.push(-half+d+(s.length-2*d)*i/160);
 for(const ax of [-s.wheelbase/2,s.wheelbase/2])for(let i=0;i<=64;i++){const x=ax+c.arch*Math.cos(i/64*Math.PI);if(x>-half+d&&x<half-d)xs.push(x);}
 xs.sort((a,b)=>a-b);for(const x of xs.filter((x,i)=>!i||x-xs[i-1]>1e-6))addRow(t=>bodyRing(s,x,t));
 for(let i=0;i<20;i++){const phi=i/20*Math.PI/2;addRow(t=>{const q=bodyRing(s,half-d,t),a=bodySection(s,half-d);return new T.Vector3(half-d+d*Math.sin(phi),a.centre+(q.y-a.centre)*Math.cos(phi),q.z*Math.cos(phi));});}
 for(let i=0;i<rows.length-1;i++)for(let j=0;j<96;j++){const k=(j+1)%96,a=rows[i][j],b=rows[i][k],c1=rows[i+1][j],e=rows[i+1][k];indices.push(a,b,c1,b,e,c1);}
 for(const end of [0,rows.length-1]){const front=end!==0,a=bodySection(s,(front?1:-1)*(half-d)),tip=p.length/3;p.push((front?1:-1)*half,a.centre,0);for(let j=0;j<96;j++){const k=(j+1)%96;indices.push(...(front?[tip,rows[end][j],rows[end][k]]:[tip,rows[end][k],rows[end][j]]));}}
 // Clip the continuous skin to actual circular wheel apertures. Preserve its curvature;
 // flattening section vertices to arch height creates folded duplicate undersides.
 const positions:number[]=[],faces:number[]=[],lookup=new Map<string,number>();
 const clearance=(q:T.Vector3)=>{let low=c.sill-.001;for(const ax of [-s.wheelbase/2,s.wheelbase/2])if(Math.abs(q.x-ax)<c.arch)low=Math.max(low,s.radius+Math.sqrt(c.arch*c.arch-(q.x-ax)**2));return q.y-low;};
 const put=(q:T.Vector3)=>{const key=q.toArray().map(v=>Math.round(v*1e6)).join(',');let n=lookup.get(key);if(n===undefined){n=positions.length/3;lookup.set(key,n);positions.push(q.x,q.y,q.z);}return n;};
 for(let k=0;k<indices.length;k+=3){const tri=indices.slice(k,k+3).map(i=>new T.Vector3(p[i*3],p[i*3+1],p[i*3+2])),polygon:T.Vector3[]=[];
  for(let j=0;j<3;j++){const a=tri[j],b=tri[(j+1)%3],da=clearance(a),db=clearance(b);if(da>=0)polygon.push(a);if((da>=0)!==(db>=0))polygon.push(a.clone().lerp(b,da/(da-db)));}
  for(let j=1;j<polygon.length-1;j++){const [a,b,e]=[polygon[0],polygon[j],polygon[j+1]];if(b.clone().sub(a).cross(e.clone().sub(a)).lengthSq()>1e-17)faces.push(put(a),put(b),put(e));}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(faces);angleWeightedNormals(g);return g;
}
