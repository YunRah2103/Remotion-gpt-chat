import * as T from 'three';import {box,mesh,rod,panel,surface,paint} from './geometry.ts';
export const PROP_KINDS=['cone','barrier','streetlight','traffic-light','road-sign','bollard','bench','tyre-stack','fuel-pump','charging-point','crate','palm-tree','workbench','tool-cabinet'] as const;
export type PropKind=typeof PROP_KINDS[number];
export type PropOptions={kind:PropKind;color?:string;lit?:boolean};
export function createProp({kind,color,lit=false}:PropOptions):T.Group{
 if(!PROP_KINDS.includes(kind))throw new Error(`Unknown prop: ${kind}`);
 const root=new T.Group(),g=new T.Group();root.name=`YUNEX-prop-${kind}`;root.userData={kind,units:'metres'};root.add(g);
 const dark=surface('#26353d',.15,.55),metal=surface('#89979d',.6,.4),white=surface('#e8e5d6'),accent=paint(color??'#cf8342');
 const lamp=new T.MeshStandardMaterial({color:'#f3e6be',emissive:'#ffe2a4',emissiveIntensity:lit?2:.2});
 switch(kind){
  case 'cone':box(g,dark,[.43,.05,.43],[0,.025,0],.01);mesh(g,new T.CylinderGeometry(.035,.17,.60,12),accent,[0,.35,0]);mesh(g,new T.CylinderGeometry(.09,.115,.10,12),white,[0,.37,0]);break;
  case 'barrier':box(g,white,[2.2,.65,.42],[0,.325,0],.05);for(const x of [-.78,-.26,.26,.78]){const stripe=box(g,accent,[.28,.43,.02],[x,.40,.222],.005);stripe.rotation.z=-.28;}break;
  case 'streetlight':box(g,dark,[.17,6.2,.17],[0,3.1,0],.015);box(g,dark,[.15,.15,2],[0,6.2,-.90],.015);box(g,lamp,[.75,.10,.40],[0,6.10,-1.65],.02);break;
  case 'traffic-light':rod(g,metal,[0,0,0],[0,3,0],.055);box(g,dark,[.25,.73,.18],[0,2.72,0],.03);for(let i=0;i<3;i++)mesh(g,new T.CylinderGeometry(.075,.075,.025,16),new T.MeshStandardMaterial({color:['#bf4846','#ceaa41','#56a780'][i],emissive:lit&&i===2?'#56a780':'#000000',emissiveIntensity:1}),[0,2.95-i*.23,.105],[Math.PI/2,0,0]);break;
  case 'road-sign':rod(g,metal,[0,0,0],[0,2.6,0],.045);box(g,white,[1.5,.85,.07],[0,2.35,0],.03);box(g,surface(color??'#3b786c'),[1.37,.72,.025],[0,2.35,.05],.02);for(const x of [-.4,.05])box(g,white,[.3,.045,.015],[x,2.36,.07],.005);break;
  case 'bollard':mesh(g,new T.CylinderGeometry(.085,.10,.90,12),dark,[0,.45,0]);mesh(g,new T.CylinderGeometry(.087,.087,.10,12),accent,[0,.72,0]);break;
  case 'bench':for(const z of [-.22,-.07,.08,.23])box(g,surface('#977351'),[1.8,.07,.12],[0,.46,z],.01);for(const x of [-.65,.65])for(const z of [-.20,.20])box(g,dark,[.07,.44,.07],[x,.22,z],.01);box(g,surface('#977351'),[1.8,.32,.06],[0,.78,-.24],.02);break;
  case 'tyre-stack':for(let i=0;i<4;i++)mesh(g,new T.TorusGeometry(.31,.12,8,24),surface('#24292b',.02,.93),[0,.12+i*.23,0],[Math.PI/2,0,0]);break;
  case 'fuel-pump':box(g,white,[.75,1.5,.55],[0,.75,0],.05);box(g,dark,[.51,.29,.025],[0,1.10,.295],.02);box(g,accent,[.73,.12,.57],[0,.32,0],.02);rod(g,dark,[.40,1.28,0],[.54,.50,0],.024);rod(g,dark,[.54,.50,0],[.57,1.02,.08],.024);break;
  case 'charging-point':box(g,dark,[.50,1.7,.35],[0,.85,0],.05);box(g,paint(color??'#5aa58d'),[.37,.60,.04],[0,1.24,.195],.025);box(g,lamp,[.12,.055,.02],[0,1.45,.225],.01);rod(g,dark,[.28,1.45,0],[.52,.32,0],.018);rod(g,dark,[.52,.32,0],[.36,.90,.18],.018);break;
  case 'crate':box(g,surface(color??'#9d835f'),[1.2,1.0,1.0],[0,.5,0],.015);for(const x of [-.50,.50])for(const z of [-.51,.51])box(g,surface('#6d5c49'),[.12,1.02,.04],[x,.51,z],.005);break;
  case 'palm-tree':rod(g,surface('#8a7156'),[0,0,0],[.32,5.5,0],.16);for(let i=0;i<7;i++){const a=i*Math.PI*2/7;const u=new T.Vector3(Math.cos(a),0,Math.sin(a)),v=new T.Vector3(-Math.sin(a),0,Math.cos(a));const pts=[[.32,5.5,0],u.clone().multiplyScalar(1.6).add(v.clone().multiplyScalar(.36)).add(new T.Vector3(.32,5.7,0)).toArray(),u.clone().multiplyScalar(3.1).add(new T.Vector3(.32,4.6,0)).toArray(),u.clone().multiplyScalar(1.6).add(v.clone().multiplyScalar(-.36)).add(new T.Vector3(.32,5.7,0)).toArray()] as [number,number,number][];const mat=surface('#527454');mat.side=T.DoubleSide;panel(g,mat,pts,'palm-frond');}break;
  case 'workbench':box(g,surface('#9b8a70'),[2.6,.13,.85],[0,.95,0],.02);for(const x of [-1.08,1.08])for(const z of [-.31,.31])box(g,dark,[.09,.90,.09],[x,.45,z],.01);box(g,dark,[.55,.24,.30],[.78,1.13,0],.02);break;
  case 'tool-cabinet':box(g,accent,[.82,1.2,.50],[0,.60,0],.035);for(let i=0;i<5;i++)box(g,metal,[.53,.025,.025],[0,.22+i*.19,.273],.005);box(g,dark,[.86,.06,.54],[0,1.22,0],.01);break;
 }
 g.updateMatrixWorld(true);const b=new T.Box3().setFromObject(g,true);g.position.y-=b.min.y;return root;
}
