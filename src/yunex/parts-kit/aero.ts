import * as T from 'three';
import { box, group, rod, mount } from './helpers.ts';
import type { Palette } from './helpers.ts';
export function aero(g: T.Group, id: string, m: Palette) {
    if (id === 'rear-wing') {
        const wing = group(g, 'wing-element', [0, .30, 0], [0, .20, 0]);
        wing.userData.motion = { kind: 'deployment', axis: 'z', range: .35 };
        const sh = new T.Shape();
        sh.moveTo(-.18, 0);
        sh.quadraticCurveTo(.02, .018, .17, -.012);
        sh.quadraticCurveTo(-.02, -.09, -.18, 0);
        const geo = new T.ExtrudeGeometry(sh, { depth: 1.45, bevelEnabled: false, curveSegments: 16 });
        geo.translate(0, 0, -.725);
        const mesh = new T.Mesh(geo, m.dark);
        mesh.name = 'inverted-airfoil';
        mesh.castShadow = true;
        wing.add(mesh);
        for (const z of [-.74, .74])
            box(wing, m.accent, [.36, .19, .018], [0, .015, z], .015, 'wing-endplate');
        for (const z of [-.42, .42]) {
            rod(g, m.metal, [-.04, 0, z], [.04, .29, z], .016).name = 'wing-upright';
            box(g, m.dark, [.16, .02, .09], [-.05, 0, z], .008, 'wing-foot');
        }
    }
    else if (id === 'front-splitter') {
        box(g, m.dark, [.40, .025, 1.72], [0, 0, 0], .04, 'splitter-plane');
        for (const z of [-.83, .83])
            box(g, m.accent, [.27, .10, .018], [-.035, .045, z], .006, 'splitter-fence');
        for (const z of [-.58, .58])
            rod(g, m.alloy, [.16, .015, z], [.04, .23, z], .006).name = 'splitter-stay';
    }
    else if (id === 'ducktail') {
        const lip = box(g, m.dark, [.16, .13, 1.32], [0, .05, 0], .025, 'ducktail-lip');
        lip.rotation.z = .28;
        box(g, m.metal, [.24, .018, 1.34], [0, -.015, 0], .015, 'ducktail-base');
    }
    else if (id === 'diffuser') {
        const tray = group(g, 'diffuser-ramp');
        tray.rotation.z = -.15;
        box(tray, m.dark, [.62, .025, 1.35], [0, 0, 0], .02, 'diffuser-floor');
        for (const z of [-.64, -.32, 0, .32, .64])
            box(tray, m.accent, [.59, .13, .013], [0, -.045, z], .006, 'diffuser-strake');
        box(g, m.metal, [.04, .04, 1.35], [.30, .02, 0], .006, 'diffuser-mount-rail');
    }
    else if (id === 'canards') {
        for (const sign of [-1, 1]) {
            const q = group(g, sign > 0 ? 'left-canard' : 'right-canard', [0, 0, sign * .39], [0, 0, sign * .12]);
            q.rotation.x = sign * .18;
            box(q, m.dark, [.28, .018, .18], [0, 0, 0], .025, 'canard-blade');
            box(q, m.accent, [.04, .06, .18], [-.12, .02, 0], .008, 'canard-fixing');
        }
    }
    else {
        box(g, m.dark, [1.8, .028, 1.25], [0, 0, 0], .035, 'underfloor-panel');
        for (const x of [-.7, 0, .7]) {
            box(g, m.metal, [.04, .025, 1.2], [x, .025, 0], .005, 'undertray-brace');
            for (const z of [-.55, .55])
                box(g, m.alloy, [.025, .008, .025], [x, .044, z], .002, 'panel-fastener');
        }
    }
    mount(g, 'body', [0, 0, 0], [0, -1, 0]);
}
