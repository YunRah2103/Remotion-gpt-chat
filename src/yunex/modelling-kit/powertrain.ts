import type {VehicleSpec} from '../world-kit/catalog.ts';
import type {PartVariant} from '../parts-kit/catalog.ts';
import {mechanicalLayout} from './systems.ts';
/** Generic illustrative family choices, not claims about a named manufacturer's engine. */
export function engineConfiguration(s:VehicleSpec):{variant:PartVariant;scale:number;position:[number,number,number]}|undefined{
 if(s.bodyStyle==='ev'||s.family==='bike')return undefined;
 const l=mechanicalLayout(s);
 const variant:PartVariant=l.heavy?'inline-6':s.family==='formula'?'v6':s.family==='truck'?'v8':s.family==='suv'?'v6':s.family==='sports'?'v8':s.id==='compact'?'inline-3':'inline-4';
 // Parts geometry is roughly .6 m long at unit scale. Heavy sixes use a larger
 // package below the raised cab; all placements retain the shared output axis.
 return {variant,scale:l.heavy?1.55:s.family==='suv'||s.family==='truck'?1.3:1.15,position:[l.engineX,l.heavy?.16:.26,0]};
}
