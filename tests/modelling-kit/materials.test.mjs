import {test} from 'node:test';import assert from 'node:assert/strict';
import {createCinematicVehicle,animateCinematicVehicle} from '../../src/yunex/modelling-kit/rig.ts';
import {disposeObject} from '../../src/yunex/world-kit/geometry.ts';
test('wheel opacity restoration does not undo body-shell trim cutaway',()=>{const g=createCinematicVehicle({variant:'supercar'});animateCinematicVehicle(g,{frame:0,fps:24,cutaway:1});const trim=g.getObjectByName('body-shell').getObjectByName('front-lip');assert.ok(trim.material.opacity<.1);const wheel=g.getObjectByName('mount-front-left').getObjectByName('tyre');assert.equal(wheel.material.opacity,1);disposeObject(g);});
