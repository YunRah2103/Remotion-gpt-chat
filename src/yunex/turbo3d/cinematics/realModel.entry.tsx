import React from 'react';
import {registerRoot,Composition} from 'remotion';
import {RealModelPreview} from './RealModelPreview';
const Root:React.FC=()=><>
 <Composition id="YunexA4RealHook" component={()=><RealModelPreview variant="realHook"/>} width={1080} height={1920} fps={30} durationInFrames={90}/>
 <Composition id="YunexA4RealExhaust" component={()=><RealModelPreview variant="realExhaust"/>} width={1080} height={1920} fps={30} durationInFrames={90}/>
 <Composition id="YunexA4RealShaft" component={()=><RealModelPreview variant="realShaft"/>} width={1080} height={1920} fps={30} durationInFrames={120}/>
 <Composition id="YunexA4RealCharge" component={()=><RealModelPreview variant="realCharge"/>} width={1080} height={1920} fps={30} durationInFrames={120}/>
 <Composition id="YunexA4RealRoad" component={()=><RealModelPreview variant="realRoad"/>} width={1080} height={1920} fps={30} durationInFrames={120}/>
 </>;
registerRoot(Root);
