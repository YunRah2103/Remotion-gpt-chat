import * as T from 'three';import type {Road} from './road.ts';import {sampleRoad,sampleCameraRoad} from './road.ts';
export type StudioShot={side?:'left'|'right';distance?:number;height?:number;angle?:number;lookHeight?:number;orbit?:number};
export function resolveShot(input:StudioShot={}){
 const limits={distance:[8,40],height:[1,12],angle:[.2,1.4],lookHeight:[.3,2.5],orbit:[0,.3]};
 for(const key of Object.keys(input))if(key!=='side'&&!(key in limits))throw Error('Unknown camera shot option '+key);
 const shot={side:'right' as 'left'|'right',distance:13.8,height:2.5,angle:.78,lookHeight:1,orbit:.12,...input};
 if(!['left','right'].includes(shot.side))throw Error('Camera shot side must be left or right');
 for(const [key,[min,max]]of Object.entries(limits)){const value=shot[key as keyof typeof limits];if(!Number.isFinite(value)||value<min||value>max)throw Error(`Camera shot ${key} must be ${min}..${max}`);}
 return shot;
}
/** Route-local tracking camera, evaluated directly from absolute frame; no mutable camera history. */
export function sampleStudioShot(road:Road,distance:number,frame:number,fps:number,input:StudioShot={}){
 if(!Number.isFinite(frame)||!Number.isFinite(fps)||fps<=0)throw Error('Camera shot needs finite frame and positive fps');
 const shot=resolveShot(input),t=frame/fps,pose=sampleRoad(road,distance),cameraFrame=sampleCameraRoad(road,distance),a=shot.angle+shot.orbit*Math.sin(t*.32);
 const position=new T.Vector3(Math.cos(a)*shot.distance,shot.height+Math.sin(t*.35)*.18,(shot.side==='left'?1:-1)*Math.sin(a)*shot.distance).applyQuaternion(cameraFrame.quaternion).add(pose.position);
 const target=new T.Vector3(0,shot.lookHeight,0).applyQuaternion(pose.quaternion).add(pose.position);
 return {position:position.toArray() as [number,number,number],target:target.toArray() as [number,number,number],fov:40};
}
