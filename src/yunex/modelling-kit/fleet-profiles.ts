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
/** Body-space controls: the values change the shell itself, not applied trim. */
const bodyForms={
 'mid-engine':{nose:.25,tail:.08,hood:.10,haunch:.21,shoulder:.135,inset:.14,rocker:.18,roofArc:.135,roofRoll:.085,roofTaper:.16,endWidth:.77},
 gt:{nose:.21,tail:.12,hood:.035,haunch:.13,shoulder:.14,inset:.115,rocker:.16,roofArc:.105,roofRoll:.080,roofTaper:.13,endWidth:.81},
 muscle:{nose:.10,tail:.07,hood:.055,haunch:.12,shoulder:.12,inset:.095,rocker:.13,roofArc:.065,roofRoll:.065,roofTaper:.09,endWidth:.87},
 classic:{nose:.13,tail:.13,hood:.04,haunch:.095,shoulder:.11,inset:.09,rocker:.14,roofArc:.090,roofRoll:.075,roofTaper:.12,endWidth:.84},
 sedan:{nose:.18,tail:.11,hood:.015,haunch:.075,shoulder:.085,inset:.095,rocker:.14,roofArc:.075,roofRoll:.065,roofTaper:.10,endWidth:.84},
 fastback:{nose:.20,tail:.16,hood:.02,haunch:.10,shoulder:.10,inset:.11,rocker:.15,roofArc:.11,roofRoll:.07,roofTaper:.14,endWidth:.82},
 hatch:{nose:.20,tail:.065,hood:.005,haunch:.08,shoulder:.09,inset:.10,rocker:.14,roofArc:.080,roofRoll:.065,roofTaper:.085,endWidth:.85},
 rally:{nose:.16,tail:.055,hood:.02,haunch:.13,shoulder:.15,inset:.14,rocker:.17,roofArc:.070,roofRoll:.065,roofTaper:.075,endWidth:.87},
 estate:{nose:.17,tail:.045,hood:.01,haunch:.06,shoulder:.085,inset:.09,rocker:.13,roofArc:.045,roofRoll:.060,roofTaper:.055,endWidth:.88},
 suv:{nose:.13,tail:.035,hood:.015,haunch:.06,shoulder:.08,inset:.08,rocker:.13,roofArc:.040,roofRoll:.065,roofTaper:.065,endWidth:.91},
 pickup:{nose:.10,tail:.025,hood:.035,haunch:.07,shoulder:.10,inset:.095,rocker:.14,roofArc:.045,roofRoll:.065,roofTaper:.055,endWidth:.92},
 van:{nose:.17,tail:.035,hood:.00,haunch:.035,shoulder:.065,inset:.07,rocker:.12,roofArc:.026,roofRoll:.055,roofTaper:.035,endWidth:.94},
};
export function fleetProfile(s:VehicleSpec){
 const kind=fleetArchitecture(s),l=interiorLayout(s),sports=s.family==='sports',rally=kind==='rally',utility=kind==='pickup'||kind==='suv',van=kind==='van';
 const form={...(bodyForms[kind as keyof typeof bodyForms]??bodyForms.sedan)};
 // Body-style derivatives retain their shared structure while changing the actual volumes.
 if(s.id==='boxy-suv'){form.roofArc=.025;form.endWidth=.95;form.nose=.065;}
 if(s.id==='fastback-suv'){form.roofArc=.095;form.roofTaper=.14;form.tail=.12;}
 if(s.id==='city-ev'){form.nose=.23;form.roofArc=.10;}
 if(s.id==='track-coupe'){form.nose=.25;form.shoulder=.17;form.inset=.14;}
 if(s.id==='minivan'){form.roofArc=.075;form.nose=.22;form.roofTaper=.075;}
 const roof=s.id==='supercar'?1.39:sports?Math.max(s.height,1.32):s.height-.025;
 const belt=van?s.height*.57:utility?s.height*.58:sports?.86:Math.max(.88,s.height*.625);
 let fr=s.length*(van?.29:s.bodyStyle==='muscle'?.015:sports?.035:.085),rr=l.rearRoof,fb=l.frontBase,rb=l.rearBase;
 if(kind==='mid-engine'){fr=s.length*.095;rr=-s.length*.145;fb=s.length*.245;rb=-s.length*.275;}
 if(kind==='fastback'||s.id==='fastback-suv'){rr=-s.length*.15;rb=-s.length*.405;}
 return {kind,form,roof,belt,frontRoof:fr,rearRoof:rr,frontBase:fb,rearBase:rb,
  baseWidth:s.width*(utility||van?.452:sports?.417:.435),roofWidth:s.width*(van?.414:utility?.386:sports?.326:.365),
  sill:Math.max(.22,s.radius*.69),arch:s.radius*(rally?1.18:utility?1.14:1.105),
  crown:sports?.023:van?.025:.034,waist:sports?.065:utility?.018:.035,
  shoulder:form.shoulder,
  open:s.roof==='open',targa:s.bodyStyle==='targa',sports,rally,utility,van};
}
