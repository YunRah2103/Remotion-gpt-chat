import * as T from 'three';
import type {VehicleSpec} from '../world-kit/catalog.ts';
/** Refine the real tyre carcass; pivots, calipers and rolling distance remain canonical. */
export function studioWheelFinish(roll:T.Object3D,s:VehicleSpec){
 const tyre=roll.getObjectByName('tyre') as T.Mesh,old=tyre.geometry,width=s.family==='sports'?.28:.235;
 const profile=[[.69,-.5],[.82,-.5],[.89,-.485],[.94,-.445],[.975,-.38],[.993,-.28],[1,-.15],[1,.15],[.993,.28],[.975,.38],[.94,.445],[.89,.485],[.82,.5],[.69,.5],[.69,-.5]];
 tyre.geometry=new T.LatheGeometry(profile.map(([radius,z])=>new T.Vector2(radius*s.radius,z*width)),128);tyre.geometry.rotateX(Math.PI/2);old.dispose();
 tyre.userData.restVertices=Array.from(tyre.geometry.attributes.position.array);
 const tread=roll.getObjectByName('hero-tread') as T.InstancedMesh|undefined;
 if(tread&&s.bodyStyle!=='rally'){const old=tread.geometry;tread.geometry=new T.BoxGeometry(.018,.002,width*.20);old.dispose();tread.castShadow=false;}
 tyre.userData.silhouetteTolerance=.0003;
}
