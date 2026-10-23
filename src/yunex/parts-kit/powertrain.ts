import * as T from 'three';
import { box, cylinder, ring, rod, pipe, group, bolts, rotate, gear, volute, fan, mount } from './helpers.ts';
import type { Palette, V3 } from './helpers.ts';
export function engine(g: T.Group, id: string, m: Palette) {
    const flat = id === 'flat-4', v = id === 'v6' || id === 'v8', count = id === 'inline-3' ? 3 : id === 'inline-6' || id === 'v6' ? 6 : id === 'v8' ? 8 : 4, banks = v || flat ? 2 : 1, per = count / banks, pitch = .105, len = per * pitch + .12;
    const block = group(g, 'block', [0, .27, 0], [0, 0, -.25]);
    box(block, m.metal, [len, .30, banks === 1 ? .25 : .43], [0, 0, 0], .025, 'engine-block');
    block.userData.cover = true;
    const sump = group(g, 'sump', [0, .045, 0], [0, -.22, 0]);
    box(sump, m.dark, [len * .94, .13, .25], [0, 0, 0], .025, 'oil-sump');
    const crank = rotate(group(g, 'crankshaft', [0, .15, 0]), 'x');
    cylinder(crank, m.alloy, .025, len + .12, [0, 0, 0], 'x', 'main-crankshaft');
    for (let j = 0; j < banks; j++) {
        const bank = group(g, `cylinder-bank-${j}`, [0, .15, 0]);
        bank.rotation.x = banks === 1 ? 0 : (j === 0 ? 1 : -1) * (flat ? Math.PI / 2 : Math.PI / 6);
        for (let i = 0; i < per; i++) {
            const x = (i - (per - 1) / 2) * pitch, phase = i * Math.PI * 2 / per + j * Math.PI;
            const liner = group(bank, `liner-${i}`, [x, .12, 0]);
            for (const y of [.01, .06, .11])
                ring(liner, m.dark, .043, .006, [0, y, 0], 'y', 'liner-rim');
            const piston = group(bank, `piston-${i}`, [x, .24, 0]);
            piston.userData.motion = { kind: 'piston', axis: 'y', radius: .035, length: .17, phase, base: 0 };
            cylinder(piston, m.alloy, .039, .055, [0, 0, 0], 'y', 'piston-crown');
            for (const y of [-.013, .0, .013])
                ring(piston, m.dark, .039, .002, [0, y, 0], 'y', 'piston-ring');
            const conrod = rod(bank, m.hot, [x, 0, 0], [x, .2, 0], .012);
            conrod.name = `connecting-rod-${i}`;
            conrod.userData.motion = { kind: 'conrod', x, phase, radius: .035, length: .17, originalLength: .2 };
            const throwPhase = phase + bank.rotation.x;
            cylinder(crank, m.alloy, .014, .05, [x, Math.cos(throwPhase) * .035, Math.sin(throwPhase) * .035], 'x', 'crankpin');
            for (const s of [-1, 1])
                cylinder(crank, m.dark, .053, .018, [x + s * .025, -Math.cos(throwPhase) * .02, -Math.sin(throwPhase) * .02], 'x', 'crank-counterweight');
        }
        const head = group(bank, `cylinder-head-${j}`, [0, .30, 0], [0, .18 * (j + 1), 0]);
        head.userData.cover = true;
        box(head, m.accent, [len + .025, .105, .16], [0, 0, 0], .02, 'cam-cover');
        for (let i = 0; i < per; i++) {
            box(head, m.dark, [.04, .025, .055], [(i - (per - 1) / 2) * pitch, .062, 0], .005, 'ignition-coil');
            for (const z of [-.063, .063])
                cylinder(head, m.alloy, .007, .012, [(i - (per - 1) / 2) * pitch, .06, z], 'y', 'cover-bolt');
        }
    }
    const pulley = rotate(group(g, 'crank-pulley', [len / 2 + .06, .15, 0], [.15, 0, 0]), 'x');
    cylinder(pulley, m.dark, .08, .035, [0, 0, 0], 'x', 'belt-pulley');
    ring(pulley, m.rubber, .075, .006, [.02, 0, 0], 'x', 'pulley-groove');
    const intake = group(g, 'intake-manifold', [0, .34, -.24], [0, .1, -.18]);
    box(intake, m.dark, [len, .09, .08], [0, 0, 0], .02, 'intake-plenum');
    for (let i = 0; i < per; i++)
        pipe(intake, m.metal, [[i * pitch - len * .35, 0, 0], [i * pitch - len * .35, -.04, .07], [i * pitch - len * .35, -.11, .13]], .018, 'intake-runner');
    const exhaust = group(g, 'exhaust-manifold', [0, .24, .24], [0, 0, .20]);
    for (let i = 0; i < per; i++)
        pipe(exhaust, m.hot, [[i * pitch - len * .35, .04, -.10], [i * pitch - len * .35, -.02, .02], [0, -.12, .1]], .016, 'exhaust-primary');
    mount(g, 'output', [-len / 2 - .04, .15, 0], [-1, 0, 0]);
    mount(g, 'intake', [0, .34, -.28], [0, 0, -1]);
    mount(g, 'exhaust', [0, .12, .34], [0, 0, 1]);
}
function oneTurbo(g: T.Group, m: Palette, scale: number, twinScroll = false) {
    const unit = group(g, 'turbo-unit');
    unit.scale.setScalar(scale);
    const cold = group(unit, 'compressor-housing', [0, 0, .11], [0, 0, .20]);
    volute(cold, m.metal, .14);
    ring(cold, m.alloy, .08, .009, [0, 0, .027], 'z', 'inlet-lip');
    pipe(cold, m.metal, [[.14, -.05, 0], [.22, -.09, 0], [.26, -.14, 0]], .041, 'compressor-outlet');
    bolts(cold, m.alloy, .12, .045, 6);
    const hot = group(unit, 'turbine-housing', [0, 0, -.13], [0, 0, -.20]);
    volute(hot, m.hot, .13);
    pipe(hot, m.hot, [[.11, -.10, 0], [.19, -.15, 0], [.22, -.21, 0]], .04, 'exhaust-inlet');
    cylinder(hot, m.hot, .055, .06, [0, 0, -.055], 'z', 'exhaust-outlet');
    hot.userData.cover = true;
    const bearing = group(unit, 'bearing-cartridge');
    cylinder(bearing, m.dark, .044, .18, [0, 0, 0], 'z', 'centre-housing');
    rod(bearing, m.alloy, [0, .035, 0], [0, .1, 0], .009).name = 'oil-feed';
    const shaft = rotate(group(unit, 'rotating-shaft'), 'z');
    cylinder(shaft, m.alloy, .012, .34, [0, 0, 0], 'z', 'common-shaft');
    fan(shaft, m.alloy, .075, 10, .15);
    fan(shaft, m.hot, .084, 12, -.15);
    if (twinScroll) {
        box(hot, m.dark, [.075, .013, .095], [.19, -.15, 0], .002, 'twin-scroll-divider');
        for (const z of [-.027, .027])
            box(hot, m.hot, [.10, .065, .035], [.23, -.21, z], .004, 'divided-inlet');
    }
}
export function turbo(g: T.Group, id: string, m: Palette) { const scale = id === 'turbo-large' ? 1.3 : id === 'turbo-small' ? .85 : 1; if (id === 'turbo-twin') {
    for (const x of [-.26, .26]) {
        const u = group(g, x < 0 ? 'left-turbo' : 'right-turbo', [x, 0, 0], [Math.sign(x) * .12, 0, 0]);
        oneTurbo(u, m, .92);
    }
}
else
    oneTurbo(g, m, scale, id === 'turbo-twin-scroll'); const pair = id === 'turbo-twin', k = pair ? .92 : scale, x = pair ? -.26 : 0; mount(g, 'intake', [x, 0, .20 * k], [0, 0, 1]); mount(g, 'outlet', [x + .26 * k, -.14 * k, .11 * k], [1, 0, 0]); mount(g, 'exhaust-in', [x + .22 * k, -.21 * k, -.13 * k], [0, -1, 0]); mount(g, 'exhaust-out', [x, 0, -.22 * k], [0, 0, -1]); if (pair) {
    mount(g, 'right-intake', [.26, 0, .20 * k], [0, 0, 1]);
    mount(g, 'right-outlet', [.26 + .26 * k, -.14 * k, .11 * k], [1, 0, 0]);
    mount(g, 'right-exhaust-in', [.26 + .22 * k, -.21 * k, -.13 * k], [0, -1, 0]);
    mount(g, 'right-exhaust-out', [.26, 0, -.22 * k], [0, 0, -1]);
} }
export function gearbox(g: T.Group, id: string, m: Palette) {
    const auto = id === 'gearbox-auto', dct = id === 'gearbox-dct', len = auto ? .65 : dct ? .59 : .52;
    const shell = group(g, 'gearbox-housing', [0, 0, 0], [0, 0, -.30]);
    shell.userData.cover = true;
    cylinder(shell, m.metal, .17, len, [0, 0, 0], 'x', 'main-case', .14);
    cylinder(shell, m.metal, auto ? .25 : .22, .14, [len / 2, 0, 0], 'x', 'bellhousing', .15);
    for (let i = 0; i < 7; i++)
        ring(shell, m.alloy, .167, .006, [(i / 6 - .5) * len * .8, 0, 0], 'x', 'case-rib');
    const shafts = rotate(group(g, 'input-shaft'), 'x');
    cylinder(shafts, m.alloy, .018, len + .23, [0, 0, 0], 'x', 'input-shaft-core');
    if (auto) {
        const suns = group(shafts, 'sun-gears');
        suns.rotation.y = Math.PI / 2;
        for (let stage = 0; stage < 3; stage++) {
            const x = (stage - 1) * .13;
            gear(suns, m.alloy, .030, x, 12);
            const set = group(g, `planetary-stage-${stage}`, [x, 0, 0]);
            set.rotation.y = Math.PI / 2;
            ring(set, m.dark, .12, .015, [0, 0, 0], 'z', 'annulus');
            for (let i = 0; i < 36; i++) {
                const a = i / 36 * Math.PI * 2, b = new T.Mesh(new T.BoxGeometry(.016, .012, .045), m.dark);
                b.name = 'inward-ring-tooth';
                b.position.set(Math.cos(a) * .106, Math.sin(a) * .106, 0);
                b.rotation.z = a;
                set.add(b);
            }
            const carrier = rotate(group(set, 'planetary-carrier'), 'z', .28);
            for (let i = 0; i < 3; i++) {
                const a = i / 3 * Math.PI * 2, px = Math.cos(a) * .07, py = Math.sin(a) * .07;
                rod(carrier, m.hot, [0, 0, -.03], [px, py, -.03], .009).name = 'carrier-arm';
                const planet = rotate(group(carrier, `planet-${i}`, [px, py, 0]), 'z', -.85);
                gear(planet, m.alloy, .032, 0, 12);
            }
        }
    }
    else {
        const cluster = group(shafts, 'gear-cluster');
        cluster.rotation.y = Math.PI / 2;
        for (let i = 0; i < 6; i++)
            gear(cluster, m.alloy, .07 + (i % 3) * .015, (i - 2.5) * .055, 14 + i * 2);
        const layshaft = rotate(group(g, 'countershaft', [0, -.12, 0]), 'x', -.7);
        cylinder(layshaft, m.alloy, .016, len, [0, 0, 0], 'x', 'layshaft-core');
        for (let i = 0; i < 5; i++) {
            const q = group(layshaft, `paired-gear-${i}`, [i * .06 - .12, 0, 0]);
            q.rotation.y = Math.PI / 2;
            gear(q, m.dark, .065 + (4 - i) * .009, 0, 20 - i * 2);
        }
        if (dct) {
            const secondary = rotate(group(g, 'secondary-input'), 'x', .87);
            const sleeve = new T.Mesh(new T.CylinderGeometry(.028, .028, .25, 32, 1, true), m.hot);
            sleeve.name = 'hollow-input-sleeve';
            sleeve.rotation.z = Math.PI / 2;
            sleeve.position.x = .10;
            secondary.add(sleeve);
        }
    }
    const clutch = group(g, dct ? 'dual-clutch' : auto ? 'torque-converter' : 'single-clutch', [len / 2 - .04, 0, 0], [.24, 0, 0]);
    for (let i = 0; i < (dct ? 4 : auto ? 2 : 1); i++)
        cylinder(clutch, i % 2 ? m.dark : m.hot, .13 - i * .008, .015, [i * .022, 0, 0], 'x', 'clutch-plate');
    mount(g, 'input', [len / 2 + .14, 0, 0], [1, 0, 0]);
    mount(g, 'output', [-len / 2 - .10, 0, 0], [-1, 0, 0]);
}
export function drivetrain(g: T.Group, id: string, m: Palette) {
    if (id === 'propshaft' || id === 'cv-halfshaft') {
        const cv = id === 'cv-halfshaft', len = cv ? .72 : 1.5;
        const shaft = rotate(group(g, 'shaft'), 'x');
        cylinder(shaft, m.metal, cv ? .025 : .045, len, [0, 0, 0], 'x', 'shaft-tube');
        for (const x of [-len / 2, len / 2]) {
            const end = group(shaft, 'joint', [x, 0, 0], [Math.sign(x) * .1, 0, 0]);
            if (cv) {
                for (let i = 0; i < 7; i++)
                    ring(end, m.rubber, .045 + Math.sin(i / 6 * Math.PI) * .022, .009, [(i - 3) * .013, 0, 0], 'x', 'cv-boot-rib');
            }
            else {
                box(end, m.dark, [.08, .12, .06], [0, 0, 0], .008, 'universal-joint-yoke');
                cylinder(end, m.alloy, .018, .14, [0, 0, 0], 'y', 'joint-cross');
            }
            cylinder(end, m.alloy, .065, .02, [Math.sign(x) * .06, 0, 0], 'x', 'joint-flange');
        }
        mount(g, 'input', [len / 2 + .08, 0, 0]);
        mount(g, 'output', [-len / 2 - .08, 0, 0], [-1, 0, 0]);
    }
    else {
        const lsd = id === 'differential-lsd';
        const cover = group(g, 'differential-cover', [0, 0, 0], [0, 0, -.24]);
        cover.userData.cover = true;
        box(cover, m.metal, [.32, .28, .35], [0, 0, 0], .08, 'diff-case');
        for (const z of [-.24, .24])
            cylinder(g, m.dark, .055, .17, [0, 0, z], 'z', 'axle-neck');
        const carrier = rotate(group(g, 'differential-carrier'), 'z', .5);
        gear(carrier, m.alloy, .14, 0, 32);
        for (const x of [-.06, .06]) {
            const q = group(carrier, 'spider-gear', [x, 0, 0]);
            q.rotation.y = Math.PI / 2;
            gear(q, m.hot, .052, 0, 10);
        }
        if (lsd)
            for (const z of [-.10, .10]) {
                cylinder(carrier, m.dark, .09, .025, [0, 0, z], 'z', 'lsd-clutch-pack');
                ring(carrier, m.alloy, .085, .007, [0, 0, z + .015], 'z', 'clutch-ring');
            }
        const pinion = rotate(group(g, 'pinion', [.23, 0, 0]), 'x');
        cylinder(pinion, m.alloy, .035, .18, [0, 0, 0], 'x', 'pinion-shaft');
        mount(g, 'input', [.34, 0, 0]);
        mount(g, 'output', [0, 0, .32], [0, 0, 1]);
    }
}
