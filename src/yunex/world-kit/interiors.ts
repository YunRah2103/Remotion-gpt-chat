import {toCreasedNormals} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as T from 'three';import {box,mesh,rod,surface,roundedGeometry} from './geometry.ts';import type {V3} from './geometry.ts';import type {VehicleSpec,VehicleOptions} from './catalog.ts';
export function interiorLayout(s:VehicleSpec){
 const heavy=s.id==='box-truck'||s.id==='tractor-truck',van=s.family==='van',pickup=s.id.includes('pickup'),sports=s.family==='sports';
 const belt=heavy?1.55:van?s.height*.55:s.family==='suv'?s.height*.59:pickup?1.08:sports?.79:.94;
 const frontBase=heavy?s.wheelbase/2+.80:s.length*(van?.41:s.id==='supercar'?.17:.22);
 const frontRoof=heavy?s.wheelbase/2+.55:s.length*(van?.31:s.id==='supercar'?.03:s.bodyStyle==='muscle'?.01:.075);
 const rearRoof=heavy?s.wheelbase/2-.73:-s.length*(s.id==='single-cab-pickup'?-.015:s.id==='crew-pickup'?.15:pickup?.065:van?.40:s.roof==='estate'?.35:s.roof==='hatch'?.29:s.id==='grand-tourer'?.21:.20);
 const rearBase=heavy?s.wheelbase/2-.85:-s.length*(s.id==='single-cab-pickup'?.045:s.id==='crew-pickup'?.23:pickup?.13:van?.45:s.roof==='estate'?.43:s.roof==='hatch'?.42:.34);
 const floor=heavy?1.02:van?.55:s.radius*.7+.07,roof=heavy?2.29:s.height-.035,k=Math.min(1.15,(roof-floor)/1.05),minimumSeat=rearBase+(rearRoof-rearBase)*T.MathUtils.clamp((floor+.865*k+.013-belt)/(roof-belt),0,1)+.38,frontSeat=Math.max(minimumSeat,heavy?s.wheelbase/2-.30:frontRoof-.28);
 return {heavy,van,pickup,sports,belt,frontBase,frontRoof,rearRoof,rearBase,floor,roof,k,frontSeat,minimumSeat,innerWidth:s.width*.79};
}
export function interiorCamera(s:VehicleSpec,side:'left'|'right'='right'):{position:V3;target:V3;fov:number}{const l=interiorLayout(s),z=(side==='right'?-1:1)*s.width*.235;return {position:[l.frontSeat-.10,Math.min(l.roof-.12,Math.max(l.belt+.15,l.floor+.88*l.k)),z],target:[l.frontBase+2,Math.min(l.roof-.12,Math.max(l.belt+.15,l.floor+.88*l.k)),z],fov:72};}
export function createInterior(s:VehicleSpec,o:Partial<VehicleOptions>={}):T.Group{
 const l=interiorLayout(s),g=new T.Group();g.name='interior';g.userData={sharedTemplate:'YUNEX-passenger-interior',layout:l.heavy?'truck':l.van?'van':l.sports?'sports':'passenger'};
 const fabric=surface(o.interiorColor??'#454c50',.02,.92),trim=surface('#202c33',.10,.70),bright=surface('#a4b3b7',.65,.37),carpet=surface('#303a40',0,1),screen=new T.MeshStandardMaterial({color:'#517b86',emissive:'#294f5a',emissiveIntensity:.35});for(const m of [fabric,trim,bright,carpet])m.side=T.DoubleSide;
 const span=l.frontBase-l.rearBase;
 box(g,carpet,[span-.08,.045,l.innerWidth],[ (l.frontBase+l.rearBase)/2,l.floor-.025,0],.012,'interior-floor');
 const seat=(x:number,z:number,name:string)=>{const seat=new T.Group();seat.name=name;seat.position.set(Math.max(x,l.minimumSeat),l.floor,z);g.add(seat);box(seat,fabric,[.51,.12*l.k,s.width*.19],[0,.19*l.k,0],.04,'seat-cushion');const shell=box(seat,trim,[.16,.50*l.k,s.width*.245],[-.255,.47*l.k,0],.055,'seat-shell');shell.rotation.z=-.09;const back=box(seat,fabric,[.14,.46*l.k,s.width*.185],[-.23,.47*l.k,0],.045,'seat-back');back.rotation.z=-.09;
 // Upholstery seams sit on the seat surface and follow the reclined backrest.
 const stitching=surface('#8d999a',0,.95);
 for(const sign of [-1,1]){
  rod(back,stitching,[.075,-.16*l.k,sign*s.width*.087],[.075,.16*l.k,sign*s.width*.087],.0025).name='seat-stitching';
  rod(seat,stitching,[-.16,.252*l.k,sign*s.width*.088],[.19,.252*l.k,sign*s.width*.088],.0025).name='cushion-stitching';
  rod(seat,bright,[-.26,.69*l.k,sign*s.width*.045],[-.26,.73*l.k,sign*s.width*.045],.008).name='headrest-post';
 }
 box(seat,trim,[.08,.06,.04],[.10,.25*l.k,-Math.sign(z||1)*s.width*.14],.01,'belt-buckle');
 box(seat,surface('#a13738',0,.6),[.045,.008,.027],[.10,.284*l.k,-Math.sign(z||1)*s.width*.14],.002,'belt-release');
 box(seat,fabric,[.12,.17*l.k,s.width*.16],[-.26,.78*l.k,0],.035,'headrest');
 for(const sign of [-1,1]){
  const backBolster=mesh(seat,new T.CapsuleGeometry(.034,.28*l.k,6,12),fabric,[-.17,.46*l.k,sign*s.width*.106],[0,0,-.09],'seat-bolster');backBolster.scale.set(1.35,1,1.30);
  const cushionBolster=mesh(seat,new T.CapsuleGeometry(.036,.32,6,12),fabric,[.005,.214*l.k,sign*s.width*.106],[0,0,Math.PI/2],'cushion-bolster');cushionBolster.scale.z=1.20;
 }
 };
 for(const sign of [-1,1])seat(l.frontSeat,sign*s.width*.235,sign>0?'front-seat-left':'front-seat-right');
 const rearX=l.frontSeat-.88;
 const capacity=s.seats??(l.sports||l.pickup?2:5);
 if(capacity>2&&rearX>l.rearBase+.3){for(const sign of [-1,1])seat(rearX,sign*s.width*(capacity>=5?.27:.235),sign>0?'rear-seat-left':'rear-seat-right');if(capacity>=5)seat(rearX,0,'rear-seat-centre');}
 if(s.seats===7)for(const sign of [-1,1])seat(Math.max(l.rearBase+.4,rearX-.82),sign*s.width*.235,sign>0?'third-seat-left':'third-seat-right');
 const dashX=l.frontBase-.28,dashY=Math.min(l.belt-.05,l.floor+.67*l.k);
 const dashGeo=roundedGeometry(.38,.18*l.k,l.innerWidth,.045),dp=dashGeo.attributes.position;
 for(let i=0;i<dp.count;i++)if(dp.getY(i)>0)dp.setY(i,dp.getY(i)+.035*Math.sin(Math.PI*(dp.getZ(i)/l.innerWidth+.5)));
 dashGeo.computeVertexNormals();mesh(g,dashGeo,trim,[dashX,dashY,0],[0,0,0],'dashboard');
 box(g,bright,[.05,.04,l.innerWidth*.90],[dashX-.205,dashY+.01,0],.008,'dashboard-trim');
 box(g,screen,[.024,.15*l.k,.26],[dashX-.21,dashY+.05,0],.008,'centre-screen');
 for(const sign of [-1,1]){const z=sign*s.width*.34;box(g,bright,[.03,.065,.17],[dashX-.21,dashY,z],.008,'air-vent');}
 const driverZ=(o.steeringSide==='left'?1:-1)*s.width*.235,steerX=Math.min(dashX-.25,l.frontSeat+.37),steerY=l.floor+.64*l.k;
 const controls=new T.Group();controls.name='steering-wheel';controls.userData.cabinSteering=true;controls.position.set(steerX,steerY,driverZ);g.add(controls);
 mesh(controls,new T.TorusGeometry(.17*l.k,.025*l.k,8,32),trim,[0,0,0],[0,Math.PI/2,0]);rod(controls,bright,[0,0,0],[0,.14*l.k,0],.014);for(const sign of [-1,1])rod(controls,bright,[0,0,0],[0,-.08*l.k,sign*.13*l.k],.014);mesh(controls,new T.SphereGeometry(.055*l.k,12,8),trim);
 rod(g,trim,[steerX,steerY,driverZ],[dashX-.04,dashY,driverZ],.035);
 box(g,screen,[.025,.12,.30],[dashX-.215,dashY+.09,driverZ],.01,'instrument-cluster');
 box(g,trim,[.17,.045,.36],[dashX-.16,dashY+.173*l.k,driverZ],.018,'instrument-hood');
 for(const z of [-.07,.07])mesh(g,new T.CylinderGeometry(.022,.022,.018,16),bright,[dashX-.226,dashY-.052,z],[0,0,Math.PI/2],'climate-knob');
 // Centre-stack face connects the screen to the console below it.
 box(g,trim,[.11,.23*l.k,.24],[dashX-.125,dashY-.15*l.k,0],.025,'centre-stack');
 mesh(controls,new T.SphereGeometry(.068*l.k,16,12),trim,[0,0,0],[0,0,0],'steering-airbag').scale.set(.55,1,1.25);
 for(const sign of [-1,1]){
  const grip=mesh(controls,new T.TorusGeometry(.17*l.k,.029*l.k,8,24,.75),fabric,[0,0,0],[0,Math.PI/2,sign>0?-.38:Math.PI-.38],'steering-grip');grip.userData.trim=true;
 }

 // Modelled dial faces, needles and small display marks remain readable in driver shots.
 for(const dz of [-.075,.075]){
  mesh(g,new T.CylinderGeometry(.046,.046,.008,24),trim,[dashX-.234,dashY+.09,driverZ+dz],[0,0,Math.PI/2],'gauge-face');
  mesh(g,new T.TorusGeometry(.046,.003,6,24),bright,[dashX-.240,dashY+.09,driverZ+dz],[0,Math.PI/2,0],'gauge-bezel');
  rod(g,bright,[dashX-.245,dashY+.09,driverZ+dz],[dashX-.245,dashY+.117,driverZ+dz+.018],.002).name='gauge-needle';
 }
 for(let i=0;i<4;i++)box(g,bright,[.004,.005,.12-i*.018],[dashX-.225,dashY+.08-i*.025,0],.001,'screen-mark');
 for(const sign of [-1,1])for(let i=0;i<4;i++)box(g,trim,[.006,.003,.14],[dashX-.23,dashY-.021+i*.014,sign*s.width*.34],.001,'vent-louvre');
 for(const dx of [-.04,.10])mesh(g,new T.TorusGeometry(.037,.007,6,24),trim,[l.frontSeat+dx,l.floor+.307*l.k,0],[Math.PI/2,0,0],'cup-holder');
 const pedals=new T.Group();pedals.name='pedals';g.add(pedals);for(const z of [-.07,.07])box(pedals,bright,[.12,.045,.075],[dashX-.13,l.floor+.07,driverZ+z],.008,'pedal');
 box(g,trim,[.70,.20*l.k,.20],[l.frontSeat+.10,l.floor+.20*l.k,0],.035,'console');rod(g,bright,[l.frontSeat+.23,l.floor+.30*l.k,0],[l.frontSeat+.23,l.floor+.42*l.k,0],.018);mesh(g,new T.SphereGeometry(.035,12,8),trim,[l.frontSeat+.23,l.floor+.43*l.k,0]);
 for(const sign of [-1,1]){const h=Math.max(.12,l.belt-l.floor-.05),x=(l.frontBase+l.rearBase)/2,z=sign*(l.innerWidth/2+.015);box(g,fabric,[span-.10,h,.045],[x,l.floor+h/2,z],.015,sign>0?'door-panel-left':'door-panel-right');box(g,trim,[.40,.07,.07],[l.frontSeat+.05,l.floor+h*.63,sign*(l.innerWidth/2-.025)],.015,'armrest');box(g,bright,[.12,.025,.022],[l.frontSeat+.30,l.floor+h*.84,sign*(l.innerWidth/2-.05)],.005,'inner-handle');}
 box(g,trim,[.08,Math.max(.1,l.belt-l.floor),l.innerWidth],[l.rearBase+.04,(l.floor+l.belt)/2,0],.01,'rear-bulkhead');
 if(s.id==='panel-van'||s.id==='camper-van'){box(g,trim,[.06,l.roof-l.floor-.1,l.innerWidth],[l.frontSeat-.5,(l.roof+l.floor)/2,0],.02,'cab-divider');if(s.id==='camper-van'){box(g,fabric,[1.7,.24,1.25],[l.rearBase+1.05,l.floor+.35,0],.04,'camper-bed');box(g,trim,[1.0,.9,.42],[l.frontSeat-1.4,l.floor+.45,-s.width*.30],.03,'camper-cabinet');}}
 if(s.roof!=='open'&&s.bodyStyle!=='targa')box(g,trim,[Math.max(.2,l.frontRoof-l.rearRoof),.025,s.width*.71],[(l.frontRoof+l.rearRoof)/2,l.roof-.03,0],.005,'roof-liner');
 const smoothed=new Map<T.BufferGeometry,T.BufferGeometry>();g.traverse(o=>{if(o instanceof T.Mesh&&o.geometry.type==='ExtrudeGeometry'){const old=o.geometry;let next=smoothed.get(old);if(!next){next=toCreasedNormals(old,Math.PI/3);smoothed.set(old,next);}o.geometry=next;}});smoothed.forEach((_,geo)=>geo.dispose());
 return g;
}
