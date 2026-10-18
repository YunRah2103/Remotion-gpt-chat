import * as T from 'three';
import { box, cylinder, ring, rod, pipe, group, rotate, fan, mount, bolts } from './helpers.ts';
import type { Palette, V3 } from './helpers.ts';
export function cooling(g: T.Group, id: string, m: Palette) {
    const f = id === 'cooling-fan';
    if (f) {
        const shroud = group(g, 'fan-shroud');
        ring(shroud, m.dark, .21, .024, [0, 0, 0], 'z', 'fan-surround');
        for (const a of [0, Math.PI * 2 / 3, Math.PI * 4 / 3])
            rod(shroud, m.dark, [0, 0, -.04], [Math.cos(a) * .21, Math.sin(a) * .21, 0], .012).name = 'motor-support';
        const rotor = rotate(group(g, 'fan-rotor'), 'z');
        fan(rotor, m.rubber, .18, 7);
        cylinder(g, m.dark, .055, .08, [0, 0, -.04], 'z', 'fan-motor');
        mount(g, 'inlet', [0, 0, .1], [0, 0, -1]);
        mount(g, 'outlet', [0, 0, -.12], [0, 0, -1]);
        return;
    }
    const inter = id === 'intercooler', oil = id === 'oil-cooler', w = oil ? .32 : inter ? .63 : .62, h = oil ? .19 : inter ? .24 : .44, d = inter ? .11 : .055;
    const core = group(g, 'heat-exchanger-core');
    box(core, m.core, [w, h, d], [0, 0, 0], .008, 'core-block');
    for (let i = 0; i < 34; i++)
        box(core, m.alloy, [.004, h - .02, d + .004], [(i / 33 - .5) * (w - .025), 0, 0], .001, 'cooling-fin');
    for (const y of [-h / 2, h / 2])
        box(core, m.dark, [w + .03, .025, d + .025], [0, y, 0], .004, 'core-frame');
    for (const sign of [-1, 1]) {
        const tank = group(g, sign < 0 ? 'left-tank' : 'right-tank', [sign * (w / 2 + .03), 0, 0], [sign * .12, 0, 0]);
        box(tank, inter ? m.metal : m.dark, [.065, h, d + .018], [0, 0, 0], .02, 'end-tank');
        cylinder(tank, m.alloy, inter ? .03 : .018, .07, [sign * .055, sign * h * .22, 0], 'x', 'hose-neck');
        ring(tank, m.dark, inter ? .032 : .021, .003, [sign * .075, sign * h * .22, 0], 'x', 'hose-bead');
    }
    mount(g, 'inlet', [-w / 2 - .11, -h * .22, 0], [-1, 0, 0]);
    mount(g, 'outlet', [w / 2 + .11, h * .22, 0], [1, 0, 0]);
}
export function intake(g: T.Group, id: string, m: Palette) {
    if (id === 'airbox') {
        const body = group(g, 'airbox-body');
        box(body, m.rubber, [.34, .22, .28], [0, 0, 0], .035, 'airbox-case');
        body.userData.cover = true;
        const filter = group(g, 'panel-filter', [0, .03, 0], [0, .22, 0]);
        box(filter, m.accent, [.29, .025, .23], [0, 0, 0], .005, 'filter-frame');
        for (let i = 0; i < 20; i++)
            box(filter, m.alloy, [.009, .023, .20], [(i / 19 - .5) * .26, 0, 0], .001, 'paper-pleat');
        cylinder(g, m.dark, .045, .12, [.20, -.02, 0], 'x', 'intake-neck');
        cylinder(g, m.dark, .04, .08, [-.19, -.03, 0], 'x', 'air-feed');
        mount(g, 'inlet', [-.24, -.03, 0], [-1, 0, 0]);
        mount(g, 'outlet', [.26, -.02, 0]);
    }
    else if (id === 'cone-filter') {
        cylinder(g, m.accent, .065, .19, [0, 0, 0], 'x', 'pleated-filter', .11);
        for (let i = 0; i < 32; i++) {
            const a = i / 32 * Math.PI * 2;
            rod(g, m.alloy, [-.095, Math.cos(a) * .11, Math.sin(a) * .11], [.095, Math.cos(a) * .065, Math.sin(a) * .065], .003).name = 'filter-pleat';
        }
        cylinder(g, m.dark, .11, .015, [-.105, 0, 0], 'x', 'filter-base');
        cylinder(g, m.dark, .065, .016, [.105, 0, 0], 'x', 'filter-cap');
        cylinder(g, m.alloy, .04, .06, [-.14, 0, 0], 'x', 'filter-neck');
        mount(g, 'inlet', [.1, 0, 0]);
        mount(g, 'outlet', [-.17, 0, 0], [-1, 0, 0]);
    }
    else {
        ring(g, m.metal, .06, .018, [0, 0, 0], 'x', 'throttle-bore');
        for (const x of [-.035, .035])
            ring(g, m.alloy, .06, .008, [x, 0, 0], 'x', 'bore-lip');
        const butterfly = group(g, 'butterfly');
        butterfly.userData.motion = { kind: 'deployment', axis: 'y', range: Math.PI / 2 };
        cylinder(butterfly, m.hot, .049, .004, [0, 0, 0], 'x', 'throttle-plate');
        rod(butterfly, m.alloy, [0, -.065, 0], [0, .065, 0], .005).name = 'butterfly-shaft';
        box(g, m.dark, [.10, .12, .055], [0, -.02, -.09], .012, 'throttle-actuator');
        mount(g, 'inlet', [.05, 0, 0]);
        mount(g, 'outlet', [-.05, 0, 0], [-1, 0, 0]);
    }
}
export function exhaust(g: T.Group, id: string, m: Palette) {
    if (id === 'exhaust-header') {
        for (let i = 0; i < 4; i++) {
            const x = (i - 1.5) * .105;
            pipe(g, m.hot, [[x, .14, 0], [x, .10, .12], [x * .6, -.04, .20], [0, -.19, .26]], .022, 'header-primary');
            box(g, m.metal, [.075, .06, .015], [x, .14, -.014], .006, 'exhaust-flange');
        }
        cylinder(g, m.hot, .044, .11, [0, -.24, .26], 'y', 'collector');
        mount(g, 'inlet', [0, .14, 0], [0, 0, -1]);
        mount(g, 'outlet', [0, -.30, .26], [0, -1, 0]);
    }
    else {
        const cat = id === 'catalyst', l = cat ? .30 : .52;
        const shell = group(g, 'exhaust-shell', [0, 0, 0], [0, 0, -.22]);
        shell.userData.cover = true;
        cylinder(shell, m.metal, cat ? .09 : .13, l, [0, 0, 0], 'x', cat ? 'catalyst-can' : 'silencer-can', cat ? .075 : .13);
        if (!cat)
            shell.scale.y = .7;
        for (const x of [-l / 2, l / 2])
            cylinder(g, m.hot, .033, .14, [x + Math.sign(x) * .05, 0, 0], 'x', 'exhaust-pipe');
        if (cat) {
            const core = group(g, 'catalyst-substrate');
            cylinder(core, m.hot, .066, l * .88, [0, 0, 0], 'x', 'ceramic-core');
            for (let i = -3; i <= 3; i++)
                for (let j = -3; j <= 3; j++) {
                    if (i * i + j * j > 11)
                        continue;
                    cylinder(core, m.dark, .004, .003, [l * .45, i * .017, j * .017], 'x', 'substrate-channel');
                }
        }
        else {
            for (const x of [-.13, .13])
                cylinder(g, m.dark, .105, .008, [x, 0, 0], 'x', 'silencer-baffle');
            cylinder(g, m.hot, .022, l, [0, 0, 0], 'x', 'perforated-core');
            for (const x of [-.17, 0, .17])
                ring(g, m.dark, .026, .004, [x, 0, 0], 'x', 'core-ring');
        }
        mount(g, 'inlet', [-l / 2 - .12, 0, 0], [-1, 0, 0]);
        mount(g, 'outlet', [l / 2 + .12, 0, 0]);
    }
}
export function electrical(g: T.Group, id: string, m: Palette) {
    if (id === 'battery-12v') {
        box(g, m.rubber, [.27, .21, .18], [0, 0, 0], .017, 'battery-case');
        box(g, m.dark, [.28, .025, .19], [0, .115, 0], .008, 'battery-lid');
        for (const sign of [-1, 1]) {
            cylinder(g, sign < 0 ? m.accent : m.alloy, .015, .025, [sign * .09, .14, .045], 'y', sign < 0 ? 'positive-terminal' : 'negative-terminal');
        }
        box(g, m.metal, [.14, .013, .022], [0, .14, -.025], .004, 'carry-handle');
        for (let i = 0; i < 6; i++)
            cylinder(g, m.dark, .012, .008, [(i - 2.5) * .035, .135, -.06], 'y', 'cell-cap');
        mount(g, 'power', [-.09, .15, .045], [0, 1, 0]);
        mount(g, 'drive', [0, -.11, 0], [0, -1, 0]);
        return;
    }
    const ev = id === 'ev-drive', alt = id === 'alternator', r = ev ? .17 : alt ? .09 : .065, l = ev ? .36 : alt ? .14 : .20;
    const casing = group(g, 'motor-case', [0, 0, 0], [0, 0, -.24]);
    casing.userData.cover = true;
    cylinder(casing, m.metal, r, l, [0, 0, 0], 'x', 'motor-housing');
    for (let i = 0; i < 9; i++)
        ring(casing, m.dark, r + .002, .004, [(i / 8 - .5) * l * .86, 0, 0], 'x', 'cooling-rib');
    const shaft = rotate(group(g, 'rotor'), 'x', alt ? 2.4 : 1);
    cylinder(shaft, m.alloy, .018, l + .12, [0, 0, 0], 'x', 'motor-shaft');
    cylinder(shaft, m.hot, r * .62, l * .7, [0, 0, 0], 'x', 'rotor-core');
    for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2;
        cylinder(g, m.hot, r * .07, l * .65, [0, Math.cos(a) * r * .81, Math.sin(a) * r * .81], 'x', 'stator-winding');
    }
    if (alt) {
        const pulley = rotate(group(g, 'alternator-pulley', [l / 2 + .025, 0, 0]), 'x', 2.4);
        cylinder(pulley, m.dark, .055, .035, [0, 0, 0], 'x', 'belt-pulley');
    }
    else if (ev) {
        box(g, m.dark, [.28, .13, .27], [0, .20, 0], .018, 'inverter');
        pipe(g, m.accent, [[.1, .21, .12], [.18, .13, .13], [.15, .06, .12]], .012, 'high-voltage-cable');
        box(g, m.metal, [.17, .22, .23], [-.23, -.02, 0], .03, 'reduction-housing');
    }
    else {
        cylinder(g, m.dark, .032, .11, [0, .08, 0], 'x', 'starter-solenoid');
        cylinder(shaft, m.dark, .03, .035, [l / 2 + .055, 0, 0], 'x', 'starter-pinion');
    }
    mount(g, 'power', [0, r + .03, 0], [0, 1, 0]);
    mount(g, 'drive', [l / 2 + .07, 0, 0]);
}
export function fuel(g: T.Group, id: string, m: Palette) {
    if (id === 'fuel-tank') {
        box(g, m.rubber, [.85, .20, .58], [0, 0, 0], .06, 'tank-shell');
        for (const x of [-.28, .28])
            box(g, m.metal, [.035, .015, .60], [x, -.11, 0], .005, 'tank-strap');
        cylinder(g, m.dark, .08, .025, [.17, .11, 0], 'y', 'pump-access-cover');
        pipe(g, m.dark, [[-.42, .04, .10], [-.54, .16, .13], [-.55, .24, .13]], .03, 'filler-neck');
        mount(g, 'inlet', [-.55, .25, .13], [0, 1, 0]);
        mount(g, 'outlet', [.17, .13, 0], [0, 1, 0]);
    }
    else if (id === 'fuel-pump') {
        cylinder(g, m.alloy, .055, .18, [0, 0, 0], 'y', 'pump-can');
        cylinder(g, m.dark, .095, .018, [0, .12, 0], 'y', 'tank-flange');
        for (const x of [-.07, .07])
            rod(g, m.alloy, [x, -.12, 0], [x, .11, 0], .004).name = 'pump-support';
        box(g, m.accent, [.11, .035, .08], [0, -.13, 0], .015, 'pickup-strainer');
        cylinder(g, m.dark, .015, .045, [.025, .145, 0], 'y', 'fuel-outlet');
        box(g, m.rubber, [.04, .04, .03], [-.035, .145, 0], .004, 'pump-connector');
        mount(g, 'inlet', [0, -.15, 0], [0, -1, 0]);
        mount(g, 'outlet', [.025, .17, 0], [0, 1, 0]);
    }
    else {
        cylinder(g, m.alloy, .018, .44, [0, 0, 0], 'x', 'fuel-rail');
        for (let i = 0; i < 4; i++) {
            const x = (i - 1.5) * .105;
            cylinder(g, m.dark, .013, .10, [x, -.055, 0], 'y', 'injector-body');
            cylinder(g, m.alloy, .005, .045, [x, -.125, 0], 'y', 'injector-nozzle');
            box(g, m.rubber, [.035, .03, .03], [x, -.025, .021], .004, 'injector-connector');
            ring(g, m.accent, .013, .002, [x, -.09, 0], 'y', 'injector-seal');
        }
        mount(g, 'inlet', [-.23, 0, 0], [-1, 0, 0]);
        mount(g, 'outlet', [.23, 0, 0], [1, 0, 0]);
    }
}
