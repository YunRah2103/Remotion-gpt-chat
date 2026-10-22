import * as T from 'three';

/**
 * Purpose-built PORTRAIT mechanical hero stage.
 * The production cutaway stays in exhaust-rig.ts (V3 createAssembly), while this
 * review stage makes the mechanism visible and legible on an actual 9:16 frame.
 * Position is authored in metres, not extrapolated from arbitrary car dimensions.
 * All markers illustrate possible gas flow, NEVER measured CFD.
 */
const metal=(color:string,emissive='#000000')=>new T.MeshStandardMaterial({
 color,metalness:.76,roughness:.27,emissive,emissiveIntensity:emissive==='#000000'?0:.36
});
const steel=metal('#9baab7'),dark=metal('#293844'),copper=metal('#c7804e','#2c1005'),hot=metal('#ffae5e','#ff5c1c');
const tube=(a:T.Vector3,b:T.Vector3,r:number,material:T.Material,name:string)=>{
 const d=b.clone().sub(a),o=new T.Mesh(new T.CylinderGeometry(r,r,d.length(),24,1,false),material);
 o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize());
 o.position.copy(a).addScaledVector(d,.5);o.name=name;return o;
};
const v=(x:number,y=0,z=0)=>new T.Vector3(x,y,z);
function flange(root:T.Group,x:number,r:number,name:string){
 const rim=new T.Mesh(new T.TorusGeometry(r,.018,9,36),steel);rim.rotation.y=Math.PI/2;rim.position.x=x;rim.name=name;root.add(rim);
}
/** Continuous, physically connected line from modelled engine header to real nozzle. */
export function createAfterfireMechanicalStage():T.Group{
 const root=new T.Group();root.name='ep005-portrait-mechanical-stage';
 // Show a real mechanical object; not a tiny side-on generic vehicle far off-screen.
 const engine=new T.Group();engine.name='stage-v8-engine';engine.position.set(1.76,.05,0);
 const block=new T.Mesh(new T.BoxGeometry(.85,.48,.68),dark);block.name='stage-v8-crankcase';engine.add(block);
 for(const sign of [-1,1]){
  const bank=new T.Mesh(new T.BoxGeometry(.83,.21,.31),steel);
  bank.name=sign<0?'stage-left-cylinder-bank':'stage-right-cylinder-bank';
  bank.position.set(0,.27,sign*.22);bank.rotation.x=sign*.39;engine.add(bank);
  for(let i=0;i<4;i++){
   const rib=new T.Mesh(new T.BoxGeometry(.085,.035,.34),copper);
   rib.position.set(-.305+i*.202,.394,sign*.205);rib.rotation.x=sign*.39;
   rib.name=`stage-v8-bank-${sign}-rib-${i}`;engine.add(rib);
  }
 }
 for(let i=0;i<2;i++){
  const header=tube(v(-.49,-.10,i?-.21:.21),v(-1.0,-.04,0),.052,copper,'stage-manifold-header-'+i);
  engine.add(header);
 }
 root.add(engine);
 // Metal collector, catalyst with visible honeycomb, baffled muffler, real rolled tailpipe.
 const manifold=new T.Group();manifold.name='stage-manifold';manifold.position.x=.66;
 manifold.add(tube(v(.36,0,0),v(-.35,0,0),.105,copper,'stage-collector-housing'));flange(manifold,-.35,.12,'stage-collector-ring');root.add(manifold);
 const cat=new T.Group();cat.name='stage-catalyst';cat.position.x=-.28;
 const shield=new T.Mesh(new T.CylinderGeometry(.235,.235,.68,36,1,true),new T.MeshPhysicalMaterial({
  color:'#8e9da9',metalness:.75,roughness:.34,transparent:true,opacity:.42,side:T.DoubleSide
 }));shield.rotation.z=Math.PI/2;shield.name='stage-catalyst-cutaway-shield';cat.add(shield);
 for(let y=-2;y<=2;y++)for(let z=-2;z<=2;z++)if(y*y+z*z<=6){
  cat.add(tube(v(.29,y*.064,z*.064),v(-.29,y*.064,z*.064),.011,
   y*y+z*z<=2?hot:steel,'stage-catalyst-cell-'+y+'-'+z));
 }
 flange(cat,.34,.23,'stage-catalyst-inlet-ring');flange(cat,-.34,.23,'stage-catalyst-outlet-ring');root.add(cat);
 const muffler=new T.Group();muffler.name='stage-muffler';muffler.position.x=-1.27;
 const caseMesh=new T.Mesh(new T.CylinderGeometry(.285,.285,.88,36,1,true),new T.MeshPhysicalMaterial({
  color:'#6d8193',metalness:.81,roughness:.32,transparent:true,opacity:.38,side:T.DoubleSide
 }));caseMesh.rotation.z=Math.PI/2;caseMesh.name='stage-muffler-cutaway-housing';muffler.add(caseMesh);
 muffler.add(tube(v(.42,0,0),v(-.42,0,0),.070,copper,'stage-muffler-internal-core'));
 for(let i=0;i<3;i++){
  const baffle=new T.Mesh(new T.CylinderGeometry(.27,.27,.022,24),steel);
  baffle.rotation.z=Math.PI/2;baffle.position.x=-.23+i*.23;
  baffle.name='stage-muffler-baffle-'+i;muffler.add(baffle);
 }
 flange(muffler,.44,.285,'stage-muffler-front-flange');flange(muffler,-.44,.285,'stage-muffler-rear-flange');root.add(muffler);
 const tip=new T.Group();tip.name='stage-tailpipe';tip.position.x=-2.32;
 tip.add(tube(v(.33,0,0),v(-.33,0,0),.094,steel,'stage-tailpipe-steel'));
 flange(tip,-.34,.096,'stage-tailpipe-rolled-lip');root.add(tip);
 const centres=[v(1.28,-.03,0),v(1.03,0,0),v(.30,0,0),v(-.69,0,0),v(-1.73,0,0),v(-1.99,0,0)];
 for(let i=0;i<centres.length-1;i++)root.add(tube(centres[i],centres[i+1],.064,copper,'stage-connected-gas-pipe-'+i));
 const guide=new T.Mesh(new T.BoxGeometry(5.55,.025,.95),metal('#0e2431'));guide.position.y=-.66;guide.name='stage-presentation-base';root.add(guide);
 // Each marker is a genuinely 3D bead following the assembly and repeating
 // deterministically from absolute frame time. It does not pretend to be CFD.
 const tracerMat=new T.MeshBasicMaterial({color:'#ffc178'});
 const tracerPath=[v(1.38,0,0),v(.88,0,0),v(.29,0,0),v(-.3,0,0),v(-1.22,0,0),v(-1.94,0,0),v(-2.64,0,0)];
 const spline=new T.CatmullRomCurve3(tracerPath);
 root.userData.tracerPath=spline;
 for(let i=0;i<14;i++){
  const bead=new T.Mesh(new T.SphereGeometry(.038,10,8),tracerMat);
  bead.name='stage-illustrative-gas-marker-'+i;bead.userData.markerIndex=i;root.add(bead);
 }
 root.userData.explanation='Unburnt fuel may ignite downstream under some hot-exhaust operating conditions; not all cars or every lift-off.';
 root.updateMatrixWorld(true);return root;
}
export function animateAfterfireMechanicalStage(stage:T.Group,frame:number,fps:number){
 if(!Number.isInteger(frame)||!Number.isFinite(fps)||fps<=0)throw Error('Invalid portrait mechanism frame/fps');
 const path=stage.userData.tracerPath as T.CatmullRomCurve3;
 const t=frame/fps;
 for(const child of stage.children){
  if(typeof child.userData.markerIndex==='number'){
   const n=child.userData.markerIndex as number;
   const phase=(t*.34+n/14)%1;
   child.position.copy(path.getPointAt(phase));
   const pulse=.62+.38*Math.sin(phase*Math.PI*2);
   child.scale.setScalar(pulse);
  }
 }
 stage.updateMatrixWorld(true);
}
