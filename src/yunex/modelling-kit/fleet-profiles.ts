/** Original V5 coachwork design profiles. Dimensions in metres, +X forward. */
import type {VehicleSpec} from '../world-kit/catalog.ts';
import {interiorLayout} from '../world-kit/interiors.ts';
export type FleetArchitecture='mid-engine'|'gt'|'muscle'|'classic'|'sedan'|'fastback'|'hatch'|'rally'|'estate'|'suv'|'pickup'|'van'|'formula'|'motorcycle'|'commercial';
export function fleetArchitecture(s:VehicleSpec):FleetArchitecture {
 if(s.family==='formula')return 'formula';if(s.family==='bike')return 'motorcycle';
 if(['box-truck','tractor-truck'].includes(s.id))return 'commercial';
 if(s.family==='van')return 'van';if(s.family==='truck')return 'pickup';
 if(s.id==='supercar')return 'mid-engine';if(s.bodyStyle==='rally')return 'rally';
 if(s.bodyStyle==='retro')return 'classic';if(s.bodyStyle==='muscle')return 'muscle';
 if(s.family==='sports')return 'gt';if(s.family==='suv')return 'suv';
 if(s.id==='fastback')return 'fastback';if(s.roof==='estate')return 'estate';
 return s.roof==='hatch'?'hatch':'sedan';
}
export function fleetProfile(s:VehicleSpec){
 const kind=fleetArchitecture(s),l=interiorLayout(s),sports=s.family==='sports',rally=kind==='rally',utility=kind==='pickup'||kind==='suv',van=kind==='van';
 const roof=s.id==='supercar'?1.39:sports?Math.max(s.height,1.32):s.height-.025;
 const belt=van?s.height*.57:utility?s.height*.58:sports?.82:Math.max(.88,s.height*.625);
 const fr=s.length*(van?.29:s.bodyStyle==='muscle'?.015:sports?.045:.085);
 const rr=l.rearRoof,fb=l.frontBase,rb=l.rearBase;
 return {kind,roof,belt,frontRoof:fr,rearRoof:rr,frontBase:fb,rearBase:rb,
  baseWidth:s.width*(utility||van?.452:.435),roofWidth:s.width*(van?.414:utility?.386:sports?.335:.365),
  sill:Math.max(.22,s.radius*.69),arch:s.radius*(rally?1.18:utility?1.14:1.105),
  crown:sports?.065:van?.025:.044,waist:sports?.082:utility?.026:.045,
  shoulder:rally?.085:sports?.065:utility?.035:.043,
  open:s.roof==='open',targa:s.bodyStyle==='targa',sports,rally,utility,van};
}
