import * as T from 'three';
import { box, cylinder, ring, rod, group, bolts, rotate, spring, mount, pipe, movingLink } from './helpers.ts';
import type { Palette, V3 } from './helpers.ts';
export function brake(g: T.Group, id: string, m: Palette) {
    const drum = id === 'brake-drum', r = id === 'brake-drilled' ? .185 : id === 'brake-vented' ? .16 : drum ? .14 : .14;
    const rotor = rotate(group(g, drum ? 'drum' : 'disc', [0, 0, 0], [0, 0, .18]), 'z');
    const metal = m.alloy.clone();
    metal.userData.heat = true;
    if (drum) {
        cylinder(rotor, metal, r, .105, [0, 0, 0], 'z', 'drum-shell');
        rotor.userData.cover = true;
        const shoes = group(g, 'brake-shoes');
        for (const sign of [-1, 1]) {
            const shoe = ring(shoes, m.hot, .111, .019, [0, 0, 0], 'z', 'friction-shoe', Math.PI * .72);
            shoe.rotation.z = sign > 0 ? .36 : Math.PI + .36;
        }
        box(shoes, m.dark, [.09, .025, .05], [0, .09, 0], .005, 'wheel-cylinder');
        rod(shoes, m.accent, [-.08, -.02, 0], [.08, -.02, 0], .005).name = 'return-spring';
    }
    else {
        const vented = id !== 'brake-solid', z = vented ? .021 : 0;
        for (const sign of (vented ? [-1, 1] : [1])) {
            const plate = group(rotor, `friction-plate-${sign}`, [0, 0, sign * z]);
            const sh = new T.Shape();
            sh.absarc(0, 0, r, 0, Math.PI * 2, false);
            const centre = new T.Path();
            centre.absarc(0, 0, .045, 0, Math.PI * 2, true);
            sh.holes.push(centre);
            if (id === 'brake-drilled')
                for (let j = 0; j < 3; j++)
                    for (let i = 0; i < 12; i++) {
                        const a = (i + j * .33) / 12 * Math.PI * 2, rr = .085 + j * .032;
                        const h = new T.Path();
                        h.absarc(Math.cos(a) * rr, Math.sin(a) * rr, .005, 0, Math.PI * 2, true);
                        sh.holes.push(h);
                    }
            const geo = new T.ExtrudeGeometry(sh, { depth: .012, bevelEnabled: false, curveSegments: 24 });
            geo.translate(0, 0, -.006);
            const mesh = new T.Mesh(geo, metal);
            mesh.name = 'brake-friction-ring';
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            plate.add(mesh);
        }
        if (vented)
            for (let i = 0; i < 28; i++) {
                const a = i / 28 * Math.PI * 2;
                const vane = box(rotor, m.dark, [r * .56, .006, .03], [Math.cos(a) * r * .68, Math.sin(a) * r * .68, 0], .001, 'ventilation-vane');
                vane.rotation.z = a;
            }
        cylinder(rotor, m.dark, .062, .07, [0, 0, 0], 'z', 'disc-hat');
        bolts(rotor, m.alloy, .041, .04, 5);
        const caliper = group(g, 'caliper', [r * .82, 0, 0], [.16, 0, 0]);
        box(caliper, m.accent, [.085, r * .94, .105], [0, 0, 0], .016, 'caliper-bridge');
        for (const sign of [-1, 1]) {
            box(caliper, m.rubber, [.035, r * .70, .012], [-.024, 0, sign * .041], .003, 'friction-pad');
            for (const y of [-r * .22, r * .22])
                cylinder(caliper, m.dark, .017, .013, [-.005, y, sign * .055], 'z', 'caliper-piston');
        }
    }
    cylinder(g, m.metal, .036, .11, [0, 0, -.05], 'z', 'hub-bearing');
    mount(g, 'axle', [0, 0, -.1], [0, 0, 1]);
    mount(g, 'hydraulic', [r * .9, .05, -.06], [0, 0, -1]);
}
export function suspension(g: T.Group, id: string, m: Palette) {
    const leaf = id === 'leaf-spring';
    if (leaf) {
        const moving = group(g, 'axle', [0, .08, 0]);
        moving.userData.motion = { kind: 'translate', axis: 'y', travel: .1, control: 'compression' };
        cylinder(moving, m.dark, .05, .9, [0, 0, 0], 'z', 'axle-tube');
        for (let i = 0; i < 5; i++) {
            const len = .92 - i * .11, pts: V3[] = Array.from({ length: 21 }, (_, j) => { const t = j / 20; return [(t - .5) * len, .13 + Math.pow(t - .5, 2) * .16 - i * .009, 0]; });
            const q = pipe(moving, m.metal, pts, .012, 'leaf-stack');
            q.scale.z = 2.5;
            q.userData.motion = { kind: 'leaf', length: len, travel: .1, ringSize: 9, segments: q.geometry.attributes.position.count / 9 - 1, restVertices: Array.from(q.geometry.attributes.position.array) };
        }
        for (const x of [-.46, .46])
            ring(g, m.dark, .031, .012, [x, .25, 0], 'z', 'spring-eye');
        for (const z of [-.035, .035])
            pipe(moving, m.alloy, [[-.05, .04, z], [-.05, .20, z], [.05, .20, z], [.05, .04, z]], .007, 'u-bolt');
        mount(g, 'body', [.46, .25, 0]);
        mount(moving, 'hub', [0, 0, .45], [0, 0, 1]);
    }
    else {
        const wish = id !== 'strut', hubZ = wish ? .36 : 0;
        const top = group(g, 'top-mount', [0, .64, 0]);
        cylinder(top, m.dark, .085, .035, [0, 0, 0], 'y', 'top-bearing');
        bolts(top, m.alloy, .06, .024, 3, 'y');
        const coil = group(g, 'coil', [0, .18, 0]);
        coil.userData.motion = { kind: 'spring', travel: .12, span: .42 };
        spring(coil, m.accent, .42, .068, id === 'multi-link' ? 7 : 6);
        const hub = group(g, 'hub-carrier', [0, .12, hubZ]);
        hub.userData.motion = wish ? { kind: 'suspensionHub', span: hubZ, travel: .12 } : { kind: 'translate', axis: 'y', travel: .12, control: 'compression' };
        cylinder(hub, m.metal, .065, .09, [0, 0, 0], 'z', 'wheel-hub');
        box(hub, m.dark, [.08, wish ? .34 : .19, .07], [0, wish ? .15 : .03, -.045], .013, 'upright');
        cylinder(g, m.metal, .033, .31, [0, .34, 0], 'y', 'damper-body');
        movingLink(g, m.alloy, [0, .56, 0], [0, .12, 0], 'damper-rod');
        if (wish) {
            for (const y of [.12, .43]) {
                const arm = group(g, y < .2 ? 'lower-wishbone' : 'upper-wishbone', [0, y, 0]);
                arm.userData.motion = { kind: 'arm', travel: .12, span: hubZ };
                for (const x of [-.16, .16])
                    rod(arm, m.dark, [x, 0, 0], [0, 0, hubZ], .018).name = 'control-arm';
                for (const x of [-.16, .16])
                    cylinder(arm, m.rubber, .027, .05, [x, 0, 0], 'x', 'arm-bushing');
            }
            if (id === 'multi-link') {
                for (const x of [-.20, .20])
                    movingLink(g, m.alloy, [x, .27, -.06], [Math.sign(x) * .025, .20, .34], 'toe-link', hubZ);
                movingLink(g, m.hot, [-.28, .13, .05], [.025, .12, .34], 'trailing-link', hubZ);
            }
        }
        else {
            rod(hub, m.dark, [-.24, -.08, -.18], [0, -.04, -.03], .018).name = 'lower-control-arm';
        }
        mount(g, 'body', [0, .66, 0]);
        mount(hub, 'hub', [0, 0, .05], [0, 0, 1]);
    }
}
export function wheel(g: T.Group, id: string, m: Palette) {
    const off = id === 'wheel-offroad', sport = id === 'wheel-sport', r = off ? .41 : sport ? .35 : .32, w = off ? .26 : sport ? .24 : .20;
    const roll = rotate(group(g, 'wheel'), 'z');
    const tyre = ring(roll, m.rubber, r * .79, r * .21, [0, 0, 0], 'z', 'tyre');
    tyre.scale.z = w / (2 * r * .21);
    for (const z of [-1, 1]) {
        ring(roll, m.dark, r * .64, .015, [0, 0, z * w * .41], 'z', 'rim-barrel');
        ring(roll, m.alloy, r * .60, .014, [0, 0, z * w * .46], 'z', 'rim-lip');
    }
    cylinder(roll, m.dark, .055, w * .7, [0, 0, 0], 'z', 'hub');
    const n = sport ? 10 : off ? 6 : 5;
    for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2;
        const spoke = box(roll, m.metal, [r * .52, sport ? .022 : .035, .035], [Math.cos(a) * r * .35, Math.sin(a) * r * .35, w * .43], .006, 'rim-spoke');
        spoke.rotation.z = a;
    }
    bolts(roll, m.alloy, .037, w * .44, 5);
    if (off) {
        for (let i = 0; i < 32; i++) {
            const a = i / 32 * Math.PI * 2;
            for (const z of [-.065, .065]) {
                const tread = box(roll, m.rubber, [.055, .026, .085], [Math.cos(a) * (r - .006), Math.sin(a) * (r - .006), z], .001, 'tyre-tread');
                tread.rotation.z = a + Math.PI / 2;
            }
        }
    } else {
        for (const z of [-.065, .065]) {
            const surfaceRadius = r * .79 + r * .21 * Math.sqrt(1 - Math.pow(z / (w / 2), 2));
            ring(roll, m.dark, surfaceRadius, .0015, [0, 0, z], 'z', 'road-groove');
        }
    }
    mount(g, 'axle', [0, 0, -w * .35], [0, 0, 1]);
}
export function chassis(g: T.Group, id: string, m: Palette) {
    const ladder = id === 'ladder-frame';
    if (ladder) {
        for (const z of [-.47, .47])
            box(g, m.dark, [2.8, .12, .09], [0, 0, z], .015, 'frame-rail');
        for (const x of [-1.0, -.35, .4, 1.05])
            box(g, m.metal, [.08, .09, .97], [x, 0, 0], .008, 'crossmember');
        for (const x of [-1, 1])
            for (const z of [-.48, .48])
                cylinder(g, m.rubber, .045, .08, [x, .11, z], 'y', 'body-isolator');
    }
    else {
        for (const z of [-.32, .32])
            pipe(g, m.dark, [[-.38, 0, z], [-.2, -.06, z * 1.1], [.2, -.06, z * 1.1], [.38, 0, z]], .045, 'subframe-rail');
        for (const x of [-.27, .27])
            box(g, m.metal, [.075, .075, .72], [x, -.045, 0], .015, 'subframe-crossmember');
        for (const x of [-.35, .35])
            for (const z of [-.32, .32])
                cylinder(g, m.rubber, .05, .05, [x, .025, z], 'y', 'subframe-bush');
    }
    mount(g, 'body', [0, .1, 0]);
    mount(g, 'left', [0, 0, ladder ? .47 : .35], [0, 0, 1]);
    mount(g, 'right', [0, 0, ladder ? -.47 : -.35], [0, 0, -1]);
}
export function steering(g: T.Group, id: string, m: Palette) {
    if (id === 'steering-rack') {
        cylinder(g, m.metal, .035, .60, [0, 0, 0], 'z', 'rack-housing');
        const rack = group(g, 'rack');
        rack.userData.motion = { kind: 'translate', axis: 'z', travel: .055, control: 'steer' };
        cylinder(rack, m.alloy, .015, 1.0, [0, 0, 0], 'z', 'rack-bar');
        for (const sign of [-1, 1]) {
            for (let i = 0; i < 8; i++)
                ring(g, m.rubber, .038, .008, [0, 0, sign * (.30 + i * .012)], 'z', 'rack-boot');
            rod(rack, m.dark, [0, 0, sign * .45], [.09, 0, sign * .65], .014).name = 'tie-rod';
            cylinder(rack, m.metal, .024, .04, [.09, 0, sign * .65], 'y', 'track-rod-end');
        }
        const p = rotate(group(g, 'pinion', [.02, .06, .05]), 'y');
        p.userData.motion = { kind: 'steerRotate', axis: 'y', ratio: 1.8 };
        cylinder(p, m.dark, .027, .12, [0, 0, 0], 'y', 'pinion-input');
        mount(g, 'input', [.02, .14, .05], [0, 1, 0]);
        mount(rack, 'left', [.09, 0, .65], [0, 0, 1]);
        mount(rack, 'right', [.09, 0, -.65], [0, 0, -1]);
    }
    else {
        const shaft = rotate(group(g, 'column'), 'x');
        shaft.userData.motion = { kind: 'steerRotate', axis: 'x', ratio: 1 };
        cylinder(shaft, m.alloy, .017, .65, [0, 0, 0], 'x', 'column-shaft');
        cylinder(g, m.dark, .035, .28, [.1, 0, 0], 'x', 'collapsible-sleeve');
        for (const x of [-.3, .3]) {
            box(shaft, m.metal, [.075, .07, .035], [x, 0, 0], .006, 'universal-yoke');
            cylinder(shaft, m.alloy, .012, .09, [x, 0, 0], 'y', 'universal-cross');
        }
        mount(g, 'input', [.35, 0, 0]);
        mount(g, 'left', [-.35, 0, 0], [-1, 0, 0]);
        mount(g, 'right', [-.35, 0, 0], [-1, 0, 0]);
    }
}
