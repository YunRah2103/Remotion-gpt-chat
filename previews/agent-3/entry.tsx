/** Independent registration, does not modify root compositions owned by Agent 6. */
import React from 'react';
import {registerRoot,Composition} from 'remotion';
import {CameraPreviewFilm} from '../../production/yunex/tyre_blowout_ep003/cinema/PreviewFilm.tsx';
const PreviewRoot:React.FC=()=> <>
 <Composition id="EP003CameraOpening" component={CameraPreviewFilm}
  width={1080} height={1920} fps={30} durationInFrames={150}
  defaultProps={{mode:'opening' as const}}/>
 <Composition id="EP003CameraMontage" component={CameraPreviewFilm}
  width={1080} height={1920} fps={30} durationInFrames={264}
  defaultProps={{mode:'montage' as const}}/>
</>;
registerRoot(PreviewRoot);
