import { bundle } from '@remotion/bundler';
import { openBrowser, selectComposition, renderStill, renderMedia } from '@remotion/renderer';
import { mkdir, writeFile } from 'node:fs/promises';
import { PARTS } from '../../src/yunex/parts-kit/catalog.ts';
const out = 'out/parts-kit';
await mkdir(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: 'src/yunex/parts-kit/entry.tsx' }), browser = await openBrowser('chrome', { chromiumOptions: { gl: 'swangle' } });
const still = async (variant, cutaway = false, explode = 0, portrait = false, frame = 15) => { const inputProps = { variant, cutaway, explode, animate: true }, composition = await selectComposition({ serveUrl, id: portrait ? 'PartPreviewPortrait' : 'PartPreview', inputProps, browserInstance: browser }); const file = `${out}/${cutaway ? 'cutaway-' : portrait ? 'portrait-' : explode ? 'exploded-' : ''}${variant}.png`; await renderStill({ serveUrl, composition, inputProps, frame, output: file, scale: .5, browserInstance: browser, chromiumOptions: { gl: 'swangle' } }); console.log('STILL', file); };
try {
    if (!process.argv.includes('--reel-only')) {
        for (const s of PARTS)
            await still(s.id);
        for (const id of ['inline-4', 'v8', 'turbo-twin-scroll', 'brake-drum', 'gearbox-dct', 'differential-lsd', 'ev-drive'])
            await still(id, true, .35);
        for (const id of ['turbo-small', 'brake-vented', 'double-wishbone', 'rear-wing'])
            await still(id, false, 1);
        for (const id of ['inline-6', 'ladder-frame', 'radiator'])
            await still(id, false, 0, true);
    }
    if (!process.argv.includes('--stills-only')) {
        const selected = await selectComposition({ serveUrl, id: 'PartsFamilyReel', browserInstance: browser });
        const composition = { ...selected, fps: 12, durationInFrames: 360 };
        let last = -1;
        await renderMedia({ serveUrl, composition, outputLocation: `${out}/YUNEX_PARTS_KIT_BASELINE_PREVIEW.mp4`, codec: 'h264', pixelFormat: 'yuv420p', colorSpace: 'bt709', scale: .5, concurrency: 2, browserInstance: browser, chromiumOptions: { gl: 'swangle' }, crf: 19, onProgress: p => { const n = Math.floor(p.renderedFrames / 12); if (n !== last) {
                last = n;
                console.log('REEL seconds', n);
            } } });
    }
    await writeFile(`${out}/review.json`, JSON.stringify({ variants: 55, families: 15, sourceFPS: 30, reviewFPS: 12, reviewSeconds: 30 }, null, 2));
}
finally {
    await browser.close({});
}
