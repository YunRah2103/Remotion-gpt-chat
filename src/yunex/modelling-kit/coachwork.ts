import * as T from 'three';
import type {VehicleSpec} from '../world-kit/catalog.ts';
import {bodyTop} from '../world-kit/vehicle-body.ts';
import {interiorLayout} from '../world-kit/interiors.ts';

/** A continuous coachbuilder's die: bonnet, fenders and attached seams use one field.
 * The axle envelope is locked below the shoulder; no extra skin seals a real opening.
 */
export function coachworkField(p:T.Vector3,s:VehicleSpec){
 const l=interiorLayout(s),half=s.length/2,x=p.x,y=p.y,z=p.z,side=Math.abs(z)/(s.width/2);
 const axleDistance=Math.min(Math.abs(x-s.wheelbase/2),Math.abs(x+s.wheelbase/2));
 const archLock=(1-T.MathUtils.smoothstep(axleDistance,s.radius*1.10,s.radius*1.50))*(1-T.MathUtils.smoothstep(y,s.radius*1.92,s.radius*2.42));
 const free=1-archLock,roof=T.MathUtils.smoothstep(y,l.belt+.08,s.height-.04);
 const nose=T.MathUtils.smoothstep(x,half*.55,half),tail=1-T.MathUtils.smoothstep(x,-half,-half*.68);
 p.x+=(-nose*.16+tail*.12)*Math.pow(side,3)*free;
 p.y-=nose*.065*free*(1-roof)*(.35+.65*Math.min(1,side*side));p.z*=1-(nose*.065+tail*.055)*free;
 // Compact hatch: crisp, high shoulder. Mid-engine body: wider rear haunch and
 // a lower, longer prow. Smooth Gaussian dies avoid clearcoat pinches at seams.
 const sports=s.family==='sports',top=bodyTop(s,x),skin=Math.exp(-(((y-top)/.16)**2));
 const bonnetU=T.MathUtils.clamp((x-l.frontBase)/(half-.08-l.frontBase),0,1);
 const bonnet=Math.sin(Math.PI*bonnetU)**1.5;
 const crown=Math.exp(-((z/(s.width*.33))**4));
 p.y+=free*skin*bonnet*crown*(sports?.052:.035);
 const shoulder=Math.exp(-(((y-(l.belt-.075))/.16)**2)),flank=Math.exp(-(((side-.93)/.17)**2));
 const rearHaunch=Math.exp(-(((x+s.wheelbase*.45)/.64)**2));
 p.y+=free*flank*shoulder*(sports?.030:.018);
 p.z+=Math.sign(z)*free*flank*(1-roof)*(sports?.024*rearHaunch:.008*rearHaunch);
 // A shallow lower-door tumblehome creates a broad, readable shoulder highlight.
 const waist=Math.exp(-(((y-(l.belt-.28))/.15)**2))*Math.exp(-((x/(s.wheelbase*.36))**4));
 p.z-=Math.sign(z)*free*flank*waist*(sports?.032:.018);
 return p;
}
