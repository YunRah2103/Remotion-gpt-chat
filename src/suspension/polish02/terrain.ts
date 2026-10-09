/** POLISH 02: rugged 3D elevation field shared identically by mesh, tyre solver and mechanical tests.
 * Units metres, wheel paths at x≈±1.2, vehicle forward -Z. Original geometry only.
 */
export const FPS=30, FRAMES=600, SPEED=2.12, RADIUS=.51, HALF_AXLE=1.76;
export const CORNERS=['FL','FR','RL','RR'] as const;
export type Corner=typeof CORNERS[number];
export const clamp=(x:number,a:number,b:number)=>Math.min(b,Math.max(a,x));
const bump=(x:number,s:number)=>Math.exp(-Math.pow(x/s,4)*1.15);
export const BOULDERS=[
  {x:-1.20,z:-7.9,rx:.76,rz:1.28,h:.74},
  {x: 1.18,z:-18.6,rx:.81,rz:1.26,h:.68},
  {x:-1.16,z:-20.8,rx:.72,rz:1.00,h:.48},
  {x: 1.17,z:-29.5,rx:.79,rz:1.18,h:.58},
  {x:-1.14,z:-34.2,rx:.64,rz:1.01,h:.42},
] as const;
export const RUTS=[
 {x:1.18,z:-7.9,rx:.67,rz:1.85,h:-.31},
 {x:-1.18,z:-18.6,rx:.70,rz:2.04,h:-.33},
 {x:1.20,z:-21.1,rx:.68,rz:1.30,h:-.18},
 {x:-1.19,z:-29.4,rx:.75,rz:1.60,h:-.27},
] as const;
const rock=(x:number,z:number,c:{x:number;z:number;rx:number;rz:number;h:number})=>{
 const dx=(x-c.x)/c.rx,dz=(z-c.z)/c.rz,r=dx*dx+dz*dz;
 if(r>=1)return 0;
 const facets=1+.065*Math.sin(11*dx+4*dz)*Math.cos(8*dz-2*dx);
 return c.h*Math.pow(1-r,.58)*facets;
};
export function heightAt(x:number,z:number):number{
 const uplift=.025*x+.025*Math.sin(.19*z+1.6*x);
 const fracture=.056*Math.sin(2.47*z+.69*x)+.033*Math.sin(4.6*z-2.7*x)+
  .022*Math.sin(8.2*z+2.12*x)+.022*Math.cos(9.4*x-1.4*z);
 const rockySlope=.10*Math.sin(.30*z+.26*x)*Math.cos(.37*x-.17*z);
 const ridge=.085*bump(x-2.1,.75)*Math.sin(1.33*z);
 const tracks=-.055*(bump(x-1.20,.56)+bump(x+1.20,.56));
 let h=uplift+fracture+rockySlope+ridge+tracks;
 for(const c of BOULDERS)h+=rock(x,z,c);
 for(const c of RUTS)h+=c.h*bump(x-c.x,c.rx)*bump(z-c.z,c.rz);
 return h;
}
export function zAt(frame:number){return 8-SPEED*frame/FPS;}
export const wheelZ=(corner:Corner)=>corner[0]==='F'?-HALF_AXLE:HALF_AXLE;
export const wheelSide=(corner:Corner)=>corner[1]==='L'?-1:1;
export function triangleHeightSample(x:number,z:number,spacing=.10){
 return Math.max(heightAt(x,z),.45*heightAt(x,z-spacing)+.55*heightAt(x,z+spacing)-.016);
}
