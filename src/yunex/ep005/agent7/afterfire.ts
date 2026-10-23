import * as T from 'three';
import type {ExhaustSide, WorldExhaustPort} from './ports';

/** Author pulse times in seconds at throttle lift, NOT at every idle frame. */
export interface AfterfirePulse {at: number; duration: number; strength: number; side?: ExhaustSide}
/**
 * Absolute film clock for Agent 8's authentic 767f / 30fps Cedar master.
 * Visible flash at frame ZERO; uniquely animated 22.5–25.56s crescendo.
 * These are ignition requests; the true moving port/source gate is elsewhere.
 */
export const EP005_25S_AFTERFIRE_BEATS: readonly AfterfirePulse[] = [
  {at:-.065,duration:.50,strength:1,side:'left'},
  {at:-.045,duration:.55,strength:.98,side:'right'},
  {at:.48,duration:.37,strength:.78,side:'left'},
  {at:.53,duration:.33,strength:.74,side:'right'},
  {at:22.44,duration:.49,strength:.90,side:'left'},
  {at:22.49,duration:.46,strength:.94,side:'right'},
  {at:23.13,duration:.43,strength:.96,side:'right'},
  {at:23.16,duration:.43,strength:.94,side:'left'},
  {at:23.78,duration:.43,strength:1,side:'left'},
  {at:23.83,duration:.43,strength:.98,side:'right'},
  {at:24.57,duration:.52,strength:1,side:'left'},
  {at:24.60,duration:.51,strength:1,side:'right'},
  {at:25.18,duration:.33,strength:.88,side:'left'},
  {at:25.22,duration:.31,strength:.93,side:'right'},
];
export interface AfterfireRig {
  root: T.Group;
  jets: Record<ExhaustSide,{root:T.Group; sheets:T.Mesh[]; spill:T.PointLight}>;
}
const vertex = /* glsl */ `
  uniform float uTime, uLength, uWidth, uLayer, uSeed, uWind;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    float x=uv.x;
    float taper=pow(max(.005,1.-x),.70);
    float curl=sin(x*17.-uTime*25.+uSeed)*.16*x
              +sin(x*43.+uTime*31.+uSeed*1.7)*.045*x;
    vec3 p=vec3(x*uLength,
       position.y * uWidth * taper + curl*uWidth + uWind*x*x,
       .06*uWidth*x*sin(x*25.-uTime*18.+uSeed));
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
  }
`;
const fragment = /* glsl */ `
  uniform float uTime, uLayer, uSeed, uPower;
  varying vec2 vUv;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){
    vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),
               mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
  }
  void main(){
    vec2 uv=vUv;
    float x=uv.x, r=abs(uv.y-.5)*2.;
    float flow=uTime*5.6;
    float n = .56*noise(vec2(x*13.-flow+uSeed,uv.y*8.))
             +.30*noise(vec2(x*34.-flow*2.1,uv.y*19.+uSeed))
             +.14*noise(vec2(x*72.-flow*4.,uv.y*31.));
    float finger=1.-smoothstep(.53,.92,x + (.5-n)*.43);
    float edge=1.-smoothstep(.20+.43*n,.82,r + (1.-n)*.22);
    float body=edge*finger*smoothstep(0.,.033,x+.016);
    body*=mix(1.,.62, smoothstep(.2,.93,x));
    float hot=exp(-pow(r/(.13+.35*x),2.));
    float base=1.-smoothstep(.035,.23,x);
    vec3 blue=vec3(.20,.64,1.0);
    vec3 white=vec3(.95,.90,.75);
    vec3 gold=vec3(1.,.43,.075);
    vec3 red=vec3(.90,.105,.016);
    vec3 col=mix(blue,white,smoothstep(.035,.18,x));
    col=mix(col,gold,smoothstep(.15,.50,x+.10*r));
    col=mix(col,red,smoothstep(.38,.97,x+.13*r));
    col=mix(col,vec3(.67,.82,1.),base*.34);
    float layerWeight=uLayer<.5 ? .42 : (uLayer<1.5 ? .18 : .095);
    float alpha=body*layerWeight*(.32+.68*hot)*uPower;
    alpha*=.80+.20*noise(vec2(x*49.+flow,uv.y*41.));
    if(alpha<.008)discard;
    gl_FragColor=vec4(col*(1.02+.27*base),min(.38,alpha));
  }
`;
function ribbon():T.BufferGeometry {
  const xyz:number[]=[],uv:number[]=[],idx:number[]=[];
  const n=68;
  for(let i=0;i<=n;i++){
    const x=i/n;
    for(let s=0;s<2;s++){xyz.push(x,s===0?-1:1,0);uv.push(x,s);}
    if(i<n){const j=i*2;idx.push(j,j+1,j+2,j+1,j+3,j+2);}
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));
  g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  g.setIndex(idx);g.computeVertexNormals();return g;
}
const geometry=ribbon();
export function createAfterfireRig():AfterfireRig{
  const root=new T.Group();root.name='ep005-agent7-afterfire-world';
  const jets={} as AfterfireRig['jets'];
  for(const side of ['left','right'] as const){
    const group=new T.Group();group.name='afterfire-from-'+side;root.add(group);
    const sheets:T.Mesh[]=[];
    for(let layer=0;layer<3;layer++)for(let k=0;k<6;k++){
      const uniforms={
        uTime:{value:0},uLength:{value:.1},uWidth:{value:.05},
        uLayer:{value:layer},uPower:{value:0},
        uSeed:{value:k*.91+(side==='left'?0:7.71)+layer*.72},
        uWind:{value:0},
      };
      const mat=new T.ShaderMaterial({
        uniforms,vertexShader:vertex,fragmentShader:fragment,
        transparent:true,depthWrite:false,depthTest:true,
        blending:T.AdditiveBlending,side:T.DoubleSide,
        toneMapped:false,
      });
      const sheet=new T.Mesh(geometry,mat);
      sheet.name='luminous-turbulent-tongue';
      sheet.rotation.x=k*Math.PI/6+layer*.11;
      sheet.frustumCulled=false;group.add(sheet);sheets.push(sheet);
    }
    const spill=new T.PointLight('#ff9963',0,.95,2);
    spill.position.x=.08;group.add(spill);
    jets[side]={root:group,sheets,spill};
  }
  return {root,jets};
}
export function pulseEnvelope(t:number,p:AfterfirePulse):number{
  const x=(t-p.at)/p.duration;
  if(!(p.duration>.06)||p.duration>1.5||p.strength<0||p.strength>1||x<0||x>=1)return 0;
  const attack=Math.min(1,(t-p.at)/.045);
  const brokenDecay=Math.pow(1-x,.9)*(1-.10*Math.sin(x*19.)**2);
  return Math.max(0,attack*brokenDecay*p.strength);
}
/**
 * Update with absolute time/port transforms for deterministic, reverse-safe renders.
 * +X of each jet points OUT of Agent 6's mouth. No hand-positioned offsets.
 */
export function animateAfterfire(
  rig:AfterfireRig,ports:readonly WorldExhaustPort[],time:number,
  pulses:readonly AfterfirePulse[],worldVelocity?:T.Vector3,
):void{
  if(ports.length!==2||new Set(ports.map(p=>p.id)).size!==2)
    throw Error('Two authoritative moving ports are required');
  for(const port of ports){
    const jet=rig.jets[port.id];
    const env=Math.min(1,pulses.reduce((sum,p)=>sum+(p.side&&p.side!==port.id?0:pulseEnvelope(time,p)),0));
    jet.root.position.copy(port.origin);
    jet.root.quaternion.setFromUnitVectors(new T.Vector3(1,0,0),port.outward);
    jet.root.visible=env>.012;
    const width=port.innerRadiusM*(3.0+1.35*env);
    const length=(.19+1.24*env)*(1+.17*Math.sin(time*37+ (port.id==='left'?0:2)));
    const wind=worldVelocity ? -worldVelocity.dot(new T.Vector3(0,1,0))*0.002 : 0;
    jet.sheets.forEach(mesh=>{
      const m=mesh.material as T.ShaderMaterial;
      m.uniforms.uTime.value=time;
      m.uniforms.uLength.value=length;
      m.uniforms.uWidth.value=width;
      m.uniforms.uWind.value=wind;
      m.uniforms.uPower.value=env;
    });
    jet.spill.intensity=Math.min(2,1.65*env);
  }
}
