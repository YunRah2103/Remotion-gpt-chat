/** Optional motorsport clothing over the unchanged articulated mannequin/contact rig. */
import * as T from 'three';
import {mesh,box,surface} from '../world-kit/geometry.ts';
export function racingHelmet(head:T.Object3D,k:number){
 const shell=new T.MeshPhysicalMaterial({color:'#f0f2ea',metalness:.18,roughness:.23,clearcoat:1});
 const visor=new T.MeshPhysicalMaterial({color:'#152b38',metalness:.55,roughness:.12,clearcoat:1});
 const trim=surface('#17222a',.1,.55);
 mesh(head,new T.SphereGeometry(.119*k,40,24,0,Math.PI*2,0,Math.PI*.67),shell,[0,0,0],[0,0,0],'racing-helmet-shell');
 mesh(head,new T.SphereGeometry(.121*k,32,12,Math.PI-.62,1.24,Math.PI*.35,Math.PI*.23),visor,[0,0,0],[0,0,0],'racing-helmet-visor');
 const chin=new T.TorusGeometry(.095*k,.018*k,10,36,Math.PI*1.30);chin.rotateX(Math.PI/2);chin.rotateY(-Math.PI*.15);
 mesh(head,chin,shell,[.012*k,-.057*k,0],[0,0,0],'racing-helmet-chin-guard');
 for(const sign of [-1,1])mesh(head,new T.CylinderGeometry(.015*k,.015*k,.007*k,16),trim,[0,0,sign*.119*k],[Math.PI/2,0,0],'racing-visor-pivot');
 box(head,trim,[.022*k,.012*k,.04*k],[.10*k,-.062*k,0],.003,'helmet-chin-vent');
}
