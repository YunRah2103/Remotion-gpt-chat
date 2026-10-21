import * as T from 'three';
import {box,mesh,rod,surface} from '../world-kit/geometry.ts';
import {interiorLayout} from '../world-kit/interiors.ts';
import type {VehicleSpec} from '../world-kit/catalog.ts';
/** Shared family configuration, expressed in vehicle coordinates in metres. */
export function mechanicalLayout(s:VehicleSpec){
 const rear=s.family==='formula'||s.id==='supercar'||s.id==='roadster'||s.id==='track-coupe',ev=s.bodyStyle==='ev',heavy=s.id==='box-truck'||s.id==='tractor-truck';
 const rearDrive=rear||s.family==='truck';
 return {rearDrive,family:ev?'electric-transaxle':heavy?'heavy-diesel':s.family==='truck'?'front-longitudinal':rear?'rear-transaxle':'front-transaxle',engineX:rear?-s.wheelbase*.34:s.wheelbase*.33,driveX:(rearDrive?-1:1)*s.wheelbase/2,chassisY:Math.max(.17,s.radius*.65),rear,ev,heavy};
}
export function createMechanicalSystems(s:VehicleSpec,mounts:T.Group[]){
 const g=new T.Group();g.name='mechanical-systems';const l=mechanicalLayout(s);g.userData.sharedAssembly=l.family;
 const steel=surface('#596b74',.82,.32),alloy=surface('#adb8bc',.8,.27),black=surface('#1b2931',.2,.56),orange=surface('#dc7538',.25,.4);
 const y=l.chassisY,w=s.width*.27;
 for(const side of [-1,1])box(g,steel,[s.wheelbase+.15,.085,.075],[0,y,side*w],.012,'chassis-rail');
 for(const x of [-s.wheelbase/2,0,s.wheelbase/2])box(g,steel,[.10,.07,w*2],[x,y,0],.012,'chassis-crossmember');
 const gearbox=box(g,alloy,[.30,.20,.32],[l.engineX+(l.rear?-.26:.26),y+.12,0],.04,'transmission');
 gearbox.userData.sharedAssembly=l.family;
 box(g,black,[.18,.16,.34],[l.driveX,y+.12,0],.035,'differential');
 const radX=l.rear?s.wheelbase*.17:s.wheelbase/2+.22,radZ=l.rear?s.width*.28:0;
 box(g,alloy,[.06,.27,l.rear?.25:s.width*.48],[radX,y+.22,radZ],.008,'cooling-radiator');
 for(let i=0;i<11;i++)box(g,black,[.065,.008,l.rear?.23:s.width*.46],[radX,y+.10+i*.022,radZ],.001,'radiator-fin');
 const hose=rod(g,black,[radX,y+.25,radZ],[l.engineX,y+.28,.19],.019);hose.name='coolant-hose';
 const rack=rod(g,alloy,[s.wheelbase/2,y+.17,-s.width*.30],[s.wheelbase/2,y+.17,s.width*.30],.027);rack.name='steering-rack';
 if(l.ev){box(g,black,[s.wheelbase*.70,.09,s.width*.62],[0,interiorLayout(s).floor-.115,0],.028,'traction-battery');mesh(g,new T.CylinderGeometry(.105,.105,.37,20),alloy,[l.driveX,y+.19,0],[Math.PI/2,0,0],'traction-motor');rod(g,orange,[0,y+.15,0],[l.driveX,y+.19,0],.014).name='high-voltage-cable';}
 if(l.rearDrive&&!l.rear){const shaft=rod(g,steel,[gearbox.position.x,y+.12,0],[l.driveX,y+.12,0],.035);shaft.name='prop-shaft';}
 const driven=mounts.filter(m=>l.rearDrive?m.position.x<0:m.position.x>0);
 for(const axleX of new Set(driven.map(m=>m.position.x)))if(Math.abs(axleX-l.driveX)>.01){box(g,black,[.18,.16,.34],[axleX,y+.12,0],.035,'auxiliary-differential');rod(g,steel,[l.driveX,y+.12,0],[axleX,y+.12,0],.032).name='inter-axle-shaft';}
 for(const mount of driven){const shaft=mesh(g,new T.CylinderGeometry(.022,.022,1,12),steel,[0,0,0],[0,0,0],'drive-shaft');shaft.userData.wheelEndpoint=mount.name;shaft.userData.inboard=[mount.position.x,y+.12,Math.sign(mount.position.z)*.15];}
 // Springs and wishbones already live on the cinematic rig. This adds their shared frame.
 return g;
}
export function animateMechanicalSystems(g:T.Group,root:T.Group,bodyY:number){
 g.position.y=bodyY;
 g.children.forEach(o=>{if(!o.userData.wheelEndpoint)return;const mount=root.getObjectByName(o.userData.wheelEndpoint)!;
 const a=new T.Vector3(...o.userData.inboard),b=mount.position.clone();b.y-=bodyY;const d=b.clone().sub(a);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize());o.scale.y=d.length();});
}
