import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {contactCaption} from '../../story/scene-captions.ts';
import {sampleDynamics} from '../../physics/dynamics.ts';
import {sampleContactDrivenSparks} from '../../physics/sparks.ts';
import {getSkidDescriptors} from '../../mechanics/skids.ts';

const descriptors=getSkidDescriptors();
function real(t,startDistanceM,shot='contact-macro'){
 const m=sampleDynamics(t,{startDistanceM,speedMps:62,aeroLoad01:1});
 const {contacts,particles}=sampleContactDrivenSparks(t,m,descriptors,{startDistanceM,speedMps:62,aeroLoad01:1});
 return {shot,tSec:t,shotLocalSec:t,shotDurationSec:11,motion:m,contacts,particles};
}
test('spark captions come from REAL particles, never a 9–11s fixed fiction',()=>{
 const origin=138-62*8.82;
 const event=real(8.82,origin,'contact-macro');
 assert.ok(event.contacts.some(c=>c.active&&c.signedGapM<=0),'genuine contact at designated shared road hump');
 assert.ok(event.particles.some(p=>p.luminance01>.08),'genuine source-driven particles at hump');
 assert.match(contactCaption(event)??'',/METAL SCRAPES/);
 const dry=real(10.8,origin,'racing-payoff');
 assert.equal(dry.particles.length,0,'no ghost fireworks at dry ending');
 assert.equal(contactCaption(dry),'METAL. NOT THE ENGINE.');
 const previous=real(7.1,origin,'contact-macro');
 assert.ok(!contactCaption(previous)?.includes('SPARKS') || previous.particles.some(p=>p.luminance01>.08));
});
test('opening labels are withheld until genuine physics particles exist',()=>{
 const event=real(.04,72,'spark-hook');
 const sparks=event.particles.some(p=>p.luminance01>.08);
 assert.equal(contactCaption(event),sparks?'ACTUAL METAL SPARKS':'WHY DO F1 CARS SPARK?');
});
test('underfloor uses actual named mesh geometry; never recreates replacement skid',()=>{
 const f=readFileSync('production/yunex/f1_sparks_ep004/story/StoryMechanicalCutaway.tsx','utf8');
 assert.ok(f.includes('buildF1HeroVehicle()'));
 assert.ok(f.includes("o.visible=cutawayIsActualPart(o.name)"));
 assert.ok(f.includes("o.userData.metalSkid===true"));
});
