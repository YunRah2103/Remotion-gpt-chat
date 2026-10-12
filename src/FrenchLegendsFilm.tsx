import React from "react";
import {
  AbsoluteFill,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import shotmap from "../production/videos/french-icons-001/agent-c/shotmap.json";

type Shot = (typeof shotmap.shots)[number];
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

const eraFilter: Record<string,string> = {
  heritage: "contrast(1.045) saturate(0.92) sepia(0.065) brightness(1.015)",
  modern: "contrast(1.035) saturate(1.035) brightness(1.015)",
  hypercar: "contrast(1.05) saturate(1.015) brightness(1.012)",
};

const VideoShot: React.FC<{shot: Shot}> = ({shot}) => {
  const local = useCurrentFrame();
  const fadeIn = shot.enterDissolveFrames
    ? interpolate(local, [0, shot.enterDissolveFrames], [0, 1], clamp) : 1;
  const fadeOut = shot.exitDissolveFrames
    ? interpolate(local,
        [shot.durationFrames - shot.exitDissolveFrames, shot.durationFrames - 1],
        [1, 0], clamp)
    : 1;
  return <AbsoluteFill style={{opacity: Math.min(fadeIn, fadeOut),backgroundColor: "#08090a"}}>
    <OffthreadVideo
      src={staticFile("fr-legends/" + shot.sourcePath)}
      startFrom={Math.round(shot.sourceInSeconds * 30)}
      muted
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: shot.cinematicFocusXPercent + "% center",
        // Crop original letterbox pixels without stretching the real car.
        // Shot-specific values are audited in shotmap.json.
        transform: "scale(" + shot.cinematicCropScale + ")",
        transformOrigin: shot.cinematicFocusXPercent + "% center",
        filter: eraFilter[shot.era] ?? "none",
      }}
    />
    {/* Quiet optical finish only: no HUD, fake light flashes, or manufactured speed. */}
    <AbsoluteFill style={{
      pointerEvents:"none",
      background:"linear-gradient(180deg,rgba(8,12,15,.10) 0%,transparent 27%,transparent 66%,rgba(4,6,10,.22) 100%)",
    }}/>
  </AbsoluteFill>;
};

const ElegantTitles: React.FC = () => {
  const frame = useCurrentFrame();
  const opening = interpolate(frame, [0,22,76,108], [0,.95,.95,0], clamp);
  const closing = interpolate(frame, [1694,1730,1782,1799], [0,.86,.86,0], clamp);
  const base: React.CSSProperties = {
    position:"absolute",
    fontFamily:"Georgia, 'Times New Roman', serif",
    fontWeight:400,
    color:"#fff8eb",
    letterSpacing:"0.16em",
    textShadow:"0 2px 15px rgba(0,0,0,.65)",
    pointerEvents:"none",
  };
  return <>
    <div style={{...base,top:78,left:104,fontSize:48,opacity:opening}}>
      LÉGENDES FRANÇAISES
      <div style={{
        fontFamily:"Arial, sans-serif",fontSize:16,
        fontWeight:400,letterSpacing:".28em",marginTop:13,
      }}>UNE HISTOIRE D'AUTOMOBILE</div>
    </div>
    <div style={{...base,right:100,bottom:87,fontSize:30,opacity:closing}}>
      YUNEX <span style={{opacity:.58,fontSize:19,letterSpacing:".22em"}}> / FRANCE</span>
    </div>
  </>;
};

/**
 * Agent C's 60-second SILENT editorial master. All video is real file footage.
 * D must integrate the exact user-owned 60s French M4A, NOT choose a replacement.
 * Music phrase boundaries are intentionally null while original audio is unavailable.
 */
export const FrenchLegendsLandscape: React.FC = () => {
  return <AbsoluteFill style={{backgroundColor:"#08090a",overflow:"hidden"}}>
    {shotmap.shots.map((shot)=><Sequence
      key={shot.shot}
      from={shot.masterStartFrame}
      durationInFrames={shot.durationFrames}
      layout="none"
      name={String(shot.shot).padStart(2,"0")+" | "+shot.model}
    ><VideoShot shot={shot}/></Sequence>)}
    <ElegantTitles/>
  </AbsoluteFill>;
};
