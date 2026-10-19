/** Independent preview root. The main picture editor (Agent 6) owns src/Root.tsx. */
import React from 'react';
import {registerRoot,Composition} from 'remotion';
import {ActionPreviewFilm} from '../../production/yunex/tyre_blowout_ep003/action/PreviewFilm.tsx';
const Root:React.FC=()=> <>
  <Composition id="EP003Agent10CrashAction" component={ActionPreviewFilm}
    width={1080} height={1920} fps={30} durationInFrames={180}
    defaultProps={{mode:'crash-action' as const}}/>
  <Composition id="EP003Agent10RecoveryAction" component={ActionPreviewFilm}
    width={1080} height={1920} fps={30} durationInFrames={210}
    defaultProps={{mode:'recovery' as const}}/>
</>;
registerRoot(Root);
