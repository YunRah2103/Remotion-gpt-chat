import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {TurboMechanismPreview} from './TurboPreviewHarness';

/**
 * Independent Agent 2 preview entry point; DOES NOT alter src/Root.tsx.
 * npx remotion render src/yunex/turbo3d/mechanism/preview.entry.tsx A2TurboCutaway \
 *   out/a2-cutaway-native.mp4 --gl=swangle --codec=h264 --scale=0.4166667
 */
const PreviewRoot:React.FC=()=> <React.Fragment>
  <Composition id="A2TurboCutaway" component={TurboMechanismPreview}
    width={1080} height={1920} fps={30} durationInFrames={96}
    defaultProps={{mode:'cutaway' as const}}/>
  <Composition id="A2TurboExploded" component={TurboMechanismPreview}
    width={1080} height={1920} fps={30} durationInFrames={96}
    defaultProps={{mode:'exploded' as const}}/>
  <Composition id="A2EnginePlumbing" component={TurboMechanismPreview}
    width={1080} height={1920} fps={30} durationInFrames={96}
    defaultProps={{mode:'full' as const}}/>
</React.Fragment>;
registerRoot(PreviewRoot);
