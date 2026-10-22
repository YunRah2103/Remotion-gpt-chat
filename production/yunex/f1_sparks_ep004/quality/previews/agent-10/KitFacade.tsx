/** Agent 10 preview-only V2 facade. Production-quality kit/physics adapter belongs
 * to Agent 8. This uses the REAL V2 rig rather than rebuilding a toy formula car.
 * Disable rig's generic sparks and replace generic metallic skid mesh with the
 * EXACT three EP004 physical skid locations, under the SAME moving V2 root.
 * Keep V2's existing composite/floor; never add a second road or floor.
 */
import React,{useEffect,useMemo} from 'react';
import * as T from 'three';
import {createCinematicVehicle,animateCinematicVehicle} from '../../../../../../src/yunex/modelling-kit/rig.ts';
import {disposeObject} from '../../../../../../src/yunex/world-kit/geometry.ts';
import {SKID_LAYOUT,SKID_BOTTOM_Y_M,SKID_THICKNESS_M,SKID_WIDTH_M} from '../../../mechanics/skids.ts';
import type {VehicleMotionState} from '../../../shared/contract.ts';

function buildFacade(){
 const car=createCinematicVehicle({
   variant:'formula-modern',quality:'hero',paintPreset:'lacquer',tyreType:'slick',
   color:'#0aafaa',accent:'#f0ad75',wheelColor:'#b3c6cf',lights:true,
   driver:true,interior:true,optimize:true,
 });
 car.name='EP004-A10-PREVIEW-REAL-KIT-V2';
 // This is only the stand-in visual facade while Agent 8's owned vehicle API is unavailable.
 const metal=new T.MeshPhysicalMaterial({color:'#e8eff4',metalness:.87,roughness:.23});
 const bridge=new T.MeshStandardMaterial({color:'#242b31',metalness:.64,roughness:.39});
 car.traverse(node=>{
   if(node.name==='metal-skid'||node.name==='contact-sparks')node.visible=false;
 });
 for(const skid of SKID_LAYOUT){
   const mount=new T.Group();mount.name='EP004-v2-adapter-'+skid.id;
   const plate=new T.Mesh(new T.BoxGeometry(skid.lengthM+.04,.028,SKID_WIDTH_M+.05),bridge);
   plate.name='EP004-mounted-plate-'+skid.id;
   plate.position.set(skid.xM,SKID_BOTTOM_Y_M+SKID_THICKNESS_M+.014,0);
   mount.add(plate);
   const insert=new T.Mesh(new T.BoxGeometry(skid.lengthM,SKID_THICKNESS_M,SKID_WIDTH_M),metal);
   insert.name='EP004-skid-'+skid.id;
   insert.position.set(skid.xM,SKID_BOTTOM_Y_M+SKID_THICKNESS_M/2,0);
   insert.userData.metalSkid=true;
   insert.castShadow=true;insert.receiveShadow=true;
   mount.add(insert);car.add(mount);
 }
 return car;
}
export const PreviewKitV2Hero:React.FC<{motion:VehicleMotionState;cutaway?:number}>=({motion,cutaway=0})=>{
 const model=useMemo(buildFacade,[]);
 useEffect(()=>()=>disposeObject(model),[model]);
 animateCinematicVehicle(model,{
   frame:motion.tSec*30,fps:30,distance:motion.routeDistanceM,
   compression:0,cutaway,highlight:cutaway>.6?'underfloor':undefined,
 });
 // V2 rig resets spark visibility each time it animates: disable AFTER animation.
 const genericSparks=model.getObjectByName('contact-sparks');
 if(genericSparks)genericSparks.visible=false;
 model.traverse(node=>{if(node.name==='metal-skid')node.visible=false;});
 model.position.set(...motion.worldPosition);
 model.rotation.order='YXZ';
 model.rotation.set(motion.rollRad,motion.yawRad,motion.pitchRad);
 return <primitive object={model}/>;
};
