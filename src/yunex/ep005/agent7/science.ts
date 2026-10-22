import * as T from 'three';

/**
 * Illustrative longitudinal V8 cutaway, not manufacturer CAD or an emissions model.
 * Connected headers and exhaust route are real continuous Three.js tube geometry.
 * Conventional engines burn the charge IN the cylinder; fuel that survives can
 * ignite downstream only if mixture, temperature and oxygen permit.
 */
type MovingPiston={head:T.Mesh;rod:T.Mesh;bank:T.Group;phase:number};
type GasMark={mesh:T.Mesh;curve:T.CatmullRomCurve3;phase:number};
export interface ScienceAssembly {
  root:T.Group; crank:T.Group; pistons:MovingPiston[];
  gas:GasMark[]; flameRoot:T.Group; flame:T.Mesh[]; ignitions:T.Mesh[];
}
const aluminium=new T.MeshPhysicalMaterial({color:'#a0a9b3',metalness:.83,roughness:.23,clearcoat:.24});
const machined=new T.MeshStandardMaterial({color:'#535e68',metalness:.92,roughness:.27});
const steel=new T.MeshStandardMaterial({color:'#88949f',metalness:.89,roughness:.24});
const titanium=new T.MeshStandardMaterial({color:'#9c7b67',metalness:.78,roughness:.29});
const shadow=new T.MeshStandardMaterial({color:'#202c36',metalness:.7,roughness:.32});
const combustion=new T.MeshBasicMaterial({color:'#ffb448',transparent:true,opacity:.7,depthWrite:false,blending:T.AdditiveBlending});
const gasMaterial=new T.MeshBasicMaterial({color:'#ffb26c',transparent:true,opacity:.83,depthWrite:false});
function cylinder(parent:T.Object3D,name:string,r:number,h:number,mat:T.Material,p:T.Vector3,segments=32):T.Mesh{
  const m=new T.Mesh(new T.CylinderGeometry(r,r,h,segments),mat);
  m.name=name;m.position.copy(p);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function box(parent:T.Object3D,name:string,size:[number,number,number],mat:T.Material,pos:[number,number,number]):T.Mesh{
  const m=new T.Mesh(new T.BoxGeometry(...size),mat);m.name=name;m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function pipe(root:T.Group,points:T.Vector3[],radius:number,material:T.Material,name:string):T.CatmullRomCurve3{
  const curve=new T.CatmullRomCurve3(points,false,'centripetal',.4);
  const mesh=new T.Mesh(new T.TubeGeometry(curve,96,radius,12,false),material);
  mesh.name=name;mesh.castShadow=true;root.add(mesh);return curve;
}
function connectRod(rod:T.Mesh,from:T.Vector3,to:T.Vector3){
  const d=to.clone().sub(from);
  rod.position.copy(from).addScaledVector(d,.5);
  rod.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize());
  rod.scale.y=d.length();
}
export function buildScienceEngine():ScienceAssembly {
  const root=new T.Group();root.name='EP005 V8 cutaway / illustrative anatomy';
  // Five genuine visual layers: sump/crankcase, angled cylinder banks,
  // moving pistons/rods, overhead valve covers, joined manifolds/exhaust.
  box(root,'cast crankcase',[2.12,.35,.58],machined,[.25,.12,0]);
  box(root,'finned oil sump',[1.8,.19,.52],shadow,[.24,-.15,0]);
  for(let i=0;i<9;i++)box(root,'sump rib',[.028,.17,.57],aluminium,[-.64+i*.21,-.24,0]);
  const crank=new T.Group();crank.position.set(.24,.04,0);root.add(crank);
  const crankshaft=cylinder(crank,'crankshaft',.068,1.96,steel,new T.Vector3());
  crankshaft.rotation.z=Math.PI/2;
  for(let i=0;i<5;i++){
    const w=cylinder(crank,'crank web',.165,.063,machined,new T.Vector3(-.8+i*.4,0,0));
    w.rotation.z=Math.PI/2;
    const pin=cylinder(crank,'offset crankpin',.035,.13,aluminium,new T.Vector3(-.8+i*.4,.1,0));
    pin.rotation.z=Math.PI/2;
  }
  const pistons:MovingPiston[]=[];
  const gas:GasMark[]=[];
  const ignitions:T.Mesh[]=[];
  const routes:T.CatmullRomCurve3[]=[];
  for(const side of [-1,1]){
    const bank=new T.Group();bank.position.set(0,.31,side*.25);
    bank.rotation.x=side*.48;bank.name=side===1?'left bank':'right bank';root.add(bank);
    for(let i=0;i<4;i++){
      const x=-.64+i*.48;
      cylinder(bank,'cylinder barrel',.182,.49,aluminium,new T.Vector3(x,.30,0));
      const sleeve=cylinder(bank,'open combustion sleeve',.153,.50,
        new T.MeshPhysicalMaterial({color:'#48535d',metalness:.76,roughness:.23,
          transparent:true,opacity:.44,depthWrite:false}),new T.Vector3(x,.302,0));
      sleeve.renderOrder=2;
      const piston=cylinder(bank,'reciprocating forged piston',.139,.12,steel,new T.Vector3(x,.25,0));
      for(let ring=0;ring<3;ring++)cylinder(piston,'piston compression ring',.14,.007,machined,new T.Vector3(0,.036-ring*.016,0));
      const rod=cylinder(bank,'forged connecting rod',.036,1,aluminium,new T.Vector3());
      pistons.push({head:piston,rod,bank,phase:(i%2)*Math.PI+(side===1?Math.PI/2:0)+i*.31});
      cylinder(bank,'spark plug',.028,.10,aluminium,new T.Vector3(x,.602,0));
      const nose=cylinder(bank,'ignition electrode',.018,.035,combustion,new T.Vector3(x,.548,0));
      nose.visible=false;
      const ignition=cylinder(bank,'combustion flash inside cylinder',.122,.020,
        new T.MeshBasicMaterial({color:'#ffc975',transparent:true,opacity:0,
          depthWrite:false,blending:T.AdditiveBlending}),new T.Vector3(x,.504,0));
      ignition.castShadow=false;ignitions.push(ignition);
      const valve=cylinder(bank,'exhaust valve cap',.055,.07,titanium,new T.Vector3(x,.585,.12));
      valve.rotation.x=.3;
      if(i===0||i===3)box(bank,'cast rocker support',[.07,.13,.26],machined,[x,.66,0]);
    }
    box(bank,'continuous valve cover',[1.93,.13,.39],shadow,[.09,.71,0]);
    box(bank,'brushed alloy cam rail',[1.76,.035,.09],aluminium,[.09,.796,.04]);
    for(let i=0;i<8;i++)cylinder(bank,'cover bolt',.015,.027,aluminium,new T.Vector3(-.71+i*.23,.80,-.14),12);
    bank.updateWorldMatrix(true,true);
    const ends:T.Vector3[]=[];
    for(let i=0;i<4;i++){
      const x=-.64+i*.48;
      const start=bank.localToWorld(new T.Vector3(x,.58,side*.16));
      const end=new T.Vector3(-1.05,.10,side*.77);
      const path=pipe(root,[start,new T.Vector3(x-.17,.48,side*.57),
        new T.Vector3(x-.40,.26,side*.79),end],.027,titanium,'individual tubular exhaust runner');
      ends.push(end);routes.push(path);
      for(let n=0;n<3;n++){
        const segment=new T.Mesh(new T.CylinderGeometry(.014,.014,.055,8),gasMaterial.clone());
        segment.name='flow inside individual exhaust header';root.add(segment);
        gas.push({mesh:segment,curve:path,phase:n/3+i*.11});
      }
    }
    const trunk=pipe(root,[new T.Vector3(-1.05,.10,side*.77),
      new T.Vector3(-1.5,.02,side*.67),new T.Vector3(-1.95,-.02,side*.64),
      new T.Vector3(-2.5,-.06,side*.71)],.051,titanium,'collector to rear exhaust');
    routes.push(trunk);
    // Real collector/terminal tube, NOT fake oversized decorative pipes.
    const tip=cylinder(root,'illustrative downstream exhaust outlet',.059,.105,machined,
      new T.Vector3(-2.50,-.06,side*.71));
    tip.rotation.z=Math.PI/2;
    const inner=cylinder(root,'open exhaust bore',.044,.108,shadow,
      new T.Vector3(-2.555,-.06,side*.71));
    inner.rotation.z=Math.PI/2;
    for(let j=0;j<14;j++){
      const segment=new T.Mesh(new T.CylinderGeometry(.017,.017,.073,7),gasMaterial.clone());
      segment.name='hot exhaust packet inside connected tube';
      root.add(segment);gas.push({mesh:segment,curve:trunk,phase:j/14+(side===1?.13:0)});
    }
  }
  const intake=new T.Group();intake.name='plenum and intake runners';root.add(intake);
  box(intake,'cast alloy intake plenum',[1.42,.27,.51],aluminium,[.25,1.04,0]);
  for(const side of [-1,1])for(let i=0;i<4;i++){
    const x=-.58+i*.45;
    pipe(root,[new T.Vector3(x,.95,side*.13),new T.Vector3(x,.81,side*.33),
      new T.Vector3(x,.73,side*.42)],.041,shadow,'cast intake runner');
  }
  box(root,'timing case',[.17,.59,.64],machined,[1.34,.30,0]);
  for(let j=0;j<4;j++){
    const z=(j-1.5)*.12;
    cylinder(root,'front accessory pulley',.105,.045,steel,new T.Vector3(1.455,.31+z,0)).rotation.z=Math.PI/2;
  }
  const flameRoot=new T.Group();flameRoot.name='external-afterfire-explainer-only';
  flameRoot.position.set(-2.56,-.06,0);root.add(flameRoot);
  const flame:T.Mesh[]=[];
  for(const side of [-1,1]){
    const tongue=new T.Mesh(new T.ConeGeometry(.08,.30,18,12,true),
       new T.MeshBasicMaterial({color:'#ff8029',transparent:true,opacity:0,
          side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending}));
    tongue.position.set(-.17,0,side*.71);tongue.rotation.z=-Math.PI/2;
    flameRoot.add(tongue);flame.push(tongue);
  }
  return {root,crank,pistons,gas,flameRoot,flame,ignitions};
}
/**
 * phase 0: combustion in cylinders; 1: unburned mixture reaches hot exhaust;
 * phase 2: only a BRIEF conditional ignition at the outlet.
 * The illustration is NOT a calibrated combustion/gas simulation.
 */
export function animateScienceEngine(a:ScienceAssembly,t:number,phase:0|1|2):void {
  a.crank.rotation.set(t*11,0,0);
  for(const item of a.pistons){
    const s=Math.sin(t*11+item.phase);
    item.head.position.y=.27+.086*s;
    connectRod(item.rod,
      new T.Vector3(item.head.position.x,item.head.position.y-.045,0),
      new T.Vector3(item.head.position.x,.055,.06*Math.cos(t*11+item.phase)));
  }
  a.ignitions.forEach((m,i)=>{
    const mat=m.material as T.MeshBasicMaterial;
    mat.opacity=phase===0 ? .18+.63*Math.pow(Math.max(0,Math.sin(t*11+i*1.31)),8) : .035;
  });
  a.gas.forEach(g=>{
    const progress=(t*.38+g.phase)%1;
    const p=g.curve.getPoint(progress),tan=g.curve.getTangent(progress);
    g.mesh.position.copy(p);
    g.mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),tan);
    g.mesh.visible=phase>=1;
    const mat=g.mesh.material as T.MeshBasicMaterial;
    mat.opacity=phase===2?.62:.32;
  });
  a.flame.forEach((f,i)=>{
    const mat=f.material as T.MeshBasicMaterial;
    const s=phase===2?Math.max(0,Math.sin(t*18+i*.8))**4:0;
    mat.opacity=s*.85;f.scale.set(1, .5+s*1.9,1);
  });
}
