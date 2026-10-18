import * as T from 'three';import {box,mesh,rod,surface} from './geometry.ts';import type {V3} from './geometry.ts';import type {VehicleSpec,VehicleOptions} from './catalog.ts';
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
 const seat=(x:number,z:number,name:string)=>{const seat=new T.Group();seat.name=name;seat.position.set(Math.max(x,l.minimumSeat),l.floor,z);g.add(seat);box(seat,fabric,[.53,.15*l.k,s.width*.245],[0,.19*l.k,0],.045,'seat-cushion');const back=box(seat,fabric,[.14,.48*l.k,s.width*.245],[-.23,.47*l.k,0],.045,'seat-back');back.rotation.z=-.09;box(seat,fabric,[.12,.17*l.k,s.width*.16],[-.26,.78*l.k,0],.035,'headrest');for(const sign of [-1,1])box(seat,trim,[.06,.27*l.k,.035],[-.20,.4*l.k,sign*s.width*.125],.008,'seat-bolster');};
 for(const sign of [-1,1])seat(l.frontSeat,sign*s.width*.235,sign>0?'front-seat-left':'front-seat-right');
 const rearX=l.frontSeat-.88;
 const capacity=s.seats??(l.sports||l.pickup?2:5);
 if(capacity>2&&rearX>l.rearBase+.3){for(const sign of [-1,1])seat(rearX,sign*s.width*(capacity>=5?.27:.235),sign>0?'rear-seat-left':'rear-seat-right');if(capacity>=5)seat(rearX,0,'rear-seat-centre');}
 if(s.seats===7)for(const sign of [-1,1])seat(Math.max(l.rearBase+.4,rearX-.82),sign*s.width*.235,sign>0?'third-seat-left':'third-seat-right');
 const dashX=l.frontBase-.28,dashY=Math.min(l.belt-.05,l.floor+.67*l.k);
 box(g,trim,[.38,.18*l.k,l.innerWidth],[dashX,dashY,0],.045,'dashboard');
 box(g,bright,[.05,.04,l.innerWidth*.90],[dashX-.205,dashY+.01,0],.008,'dashboard-trim');
 box(g,screen,[.024,.15*l.k,.26],[dashX-.21,dashY+.05,0],.008,'centre-screen');
 for(const sign of [-1,1]){const z=sign*s.width*.34;box(g,bright,[.03,.065,.17],[dashX-.21,dashY,z],.008,'air-vent');}
 const driverZ=(o.steeringSide==='left'?1:-1)*s.width*.235,steerX=Math.min(dashX-.25,l.frontSeat+.37),steerY=l.floor+.64*l.k;
 const controls=new T.Group();controls.name='steering-wheel';controls.userData.cabinSteering=true;controls.position.set(steerX,steerY,driverZ);g.add(controls);
 mesh(controls,new T.TorusGeometry(.17*l.k,.025*l.k,8,32),trim,[0,0,0],[0,Math.PI/2,0]);rod(controls,bright,[0,0,0],[0,.14*l.k,0],.014);for(const sign of [-1,1])rod(controls,bright,[0,0,0],[0,-.08*l.k,sign*.13*l.k],.014);mesh(controls,new T.SphereGeometry(.055*l.k,12,8),trim);
 rod(g,trim,[steerX,steerY,driverZ],[dashX-.04,dashY,driverZ],.035);
 box(g,screen,[.025,.12,.30],[dashX-.215,dashY+.09,driverZ],.01,'instrument-cluster');
 const pedals=new T.Group();pedals.name='pedals';g.add(pedals);for(const z of [-.07,.07])box(pedals,bright,[.12,.045,.075],[dashX-.13,l.floor+.07,driverZ+z],.008,'pedal');
 box(g,trim,[.70,.20*l.k,.20],[l.frontSeat+.10,l.floor+.20*l.k,0],.035,'console');rod(g,bright,[l.frontSeat+.23,l.floor+.30*l.k,0],[l.frontSeat+.23,l.floor+.42*l.k,0],.018);mesh(g,new T.SphereGeometry(.035,12,8),trim,[l.frontSeat+.23,l.floor+.43*l.k,0]);
 for(const sign of [-1,1]){const h=Math.max(.12,l.belt-l.floor-.05),x=(l.frontBase+l.rearBase)/2,z=sign*(l.innerWidth/2+.015);box(g,fabric,[span-.10,h,.045],[x,l.floor+h/2,z],.015,sign>0?'door-panel-left':'door-panel-right');box(g,trim,[.40,.07,.07],[l.frontSeat+.05,l.floor+h*.63,sign*(l.innerWidth/2-.025)],.015,'armrest');box(g,bright,[.12,.025,.022],[l.frontSeat+.30,l.floor+h*.84,sign*(l.innerWidth/2-.05)],.005,'inner-handle');}
 box(g,trim,[.08,Math.max(.1,l.belt-l.floor),l.innerWidth],[l.rearBase+.04,(l.floor+l.belt)/2,0],.01,'rear-bulkhead');
 if(s.id==='panel-van'||s.id==='camper-van'){box(g,trim,[.06,l.roof-l.floor-.1,l.innerWidth],[l.frontSeat-.5,(l.roof+l.floor)/2,0],.02,'cab-divider');if(s.id==='camper-van'){box(g,fabric,[1.7,.24,1.25],[l.rearBase+1.05,l.floor+.35,0],.04,'camper-bed');box(g,trim,[1.0,.9,.42],[l.frontSeat-1.4,l.floor+.45,-s.width*.30],.03,'camper-cabinet');}}
 if(s.roof!=='open'&&s.bodyStyle!=='targa')box(g,trim,[Math.max(.2,l.frontRoof-l.rearRoof),.025,s.width*.71],[(l.frontRoof+l.rearRoof)/2,l.roof-.03,0],.005,'roof-liner');
 return g;
}
