import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

/**
 * AI IS THE BEST — GL4ZE LABS (SATIRE)
 * 1080x1920, 30fps, 720 frames / 24sec
 * Self-contained visuals; audio is added by the accompanying GitHub workflow.
 * No imported YUNEX or automotive assets are touched.
 */
const GREEN = '#a7ff32';
const WHITE = '#f7faf3';
const BG = '#080d10';
const MUTED = '#82928b';
const SCENES = [0, 93, 192, 303, 408, 510, 618, 720] as const;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const easing = (n: number) => 1 - Math.pow(1 - clamp01(n), 3);

const big: React.CSSProperties = {
  fontFamily: 'Inter, Arial, sans-serif',
  fontSize: 170,
  lineHeight: 1.01,
  fontWeight: 950,
  textAlign: 'center',
  letterSpacing: -9,
  margin: 0,
};
const center: React.CSSProperties = {
  position: 'absolute',
  left: 35,
  width: 1010,
  textAlign: 'center',
};
const inset: React.CSSProperties = {position: 'absolute', inset: 0};
const panel: React.CSSProperties = {
  background: '#1e3225',
  border: '3px solid #547c4b',
  borderRadius: 34,
};
const card: React.CSSProperties = {
  background: '#1c2c26',
  border: '2px solid #547b4d',
  borderRadius: 25,
};
const sceneEnter = (f: number, start: number): React.CSSProperties => {
  const p = easing((f - start) / 14);
  return {
    opacity: p,
    transform: 'translateY(' + ((1 - p) * 220).toFixed(1) + 'px) scale(' + (0.9 + p * 0.1).toFixed(4) + ')',
  };
};
const Heading: React.FC<{lines: string[]; accent?: number; y: number; fontSize?: number; frame: number; start: number}> =
  ({lines, accent, y, fontSize = 165, frame, start}) => (
    <div style={{...center, top: y, ...sceneEnter(frame, start)}}>
      {lines.map((line, i) => (
        <div key={line} style={{...big, fontSize, color: i === accent ? GREEN : WHITE}}>
          {line}
        </div>
      ))}
    </div>
  );
const Tag: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{fontSize: 41, fontWeight: 900, letterSpacing: -1, color: GREEN, ...style}}>
    {children}
  </div>
);

export const AiGlazeTikTok: React.FC = () => {
  const frame = useCurrentFrame();
  const sec = frame / 30;
  const scene = Math.min(6, SCENES.findIndex((a, i) => i < 7 && frame >= a && frame < SCENES[i + 1]));
  const start = SCENES[scene];
  const elapsed = frame - start;
  const flash = scene > 0 ? Math.max(0, (2 - elapsed) / 2) : 0;
  const gridShift = (sec * 34) % 94;
  const progress = easing(elapsed / 32);
  const sceneLine = (label: string, color = WHITE) => <div style={{color}}>{label}</div>;
  return (
    <AbsoluteFill style={{backgroundColor: BG, color: WHITE, overflow: 'hidden', fontFamily: 'Inter, Arial, sans-serif'}}>
      <AbsoluteFill style={{
        backgroundImage: 'radial-gradient(ellipse at 48% 42%, rgba(41,87,51,.5), transparent 60%), repeating-linear-gradient(122deg, transparent 0px, transparent 87px, rgba(46,77,61,.27) 88px, transparent 90px)',
        transform: 'translateX(' + gridShift + 'px) scale(1.2)',
      }}/>
      <div style={{position: 'absolute', top: 0, width: '100%', height: 26, background: GREEN}}/>
      <div style={{position: 'absolute', top: 76, left: 44, padding: '17px 25px', borderRadius: 20, background: GREEN, color: BG, fontWeight: 950, fontSize: 29}}>
        AI PROPAGANDA // EP. 001
      </div>
      <div style={{position: 'absolute', top: 81, right: 48, fontSize: 32, color: GREEN, fontWeight: 900}}>
        {String(frame).padStart(4, '0')}
      </div>
      <div style={{position: 'absolute', display: 'flex', top: 188, left: 46, width: 990, gap: 14}}>
        {Array.from({length: 7}, (_, i) => (
          <div key={i} style={{height: 12, flex: 1, borderRadius: 12, background: '#303c35', overflow: 'hidden'}}>
            <div style={{background: GREEN, height: '100%', width: i < scene ? '100%' : i === scene ? (100 * clamp01(elapsed / (SCENES[i + 1] - start))) + '%' : 0}}/>
          </div>
        ))}
      </div>

      {scene === 0 && <>
        <div style={{...center, top: 387, left: 198, width: 684, border: '5px solid ' + GREEN, borderRadius: 40, padding: 24, fontWeight: 950, fontSize: 54, color: GREEN}}>BREAKING NEWS</div>
        <Heading lines={['AI IS', 'THE BEST.']} accent={1} y={655} fontSize={181} frame={frame} start={start}/>
        <div style={{...center, top: 1256, color: MUTED, fontWeight: 900, fontSize: 46}}>SOURCE: TRUST ME BRO</div>
        <div style={{...center, top: 1405, left: 75, width: 930, ...panel, padding: '54px 20px', fontSize: 35, fontWeight: 900}}>
          This message was approved by AI.
        </div>
      </>}

      {scene === 1 && <>
        <Heading lines={['HOW DO', 'I KNOW?']} accent={1} y={500} fontSize={158} frame={frame} start={start}/>
        <div style={{...center, top: 1020, ...card, padding: '66px 0', color: GREEN, fontWeight: 950, fontSize: 103}}>
          I ASKED AI.
        </div>
        <div style={{...center, top: 1377, color: MUTED, fontWeight: 900, fontSize: 34}}>100% INDEPENDENT RESEARCH</div>
      </>}

      {scene === 2 && <>
        <Tag style={{...center, top: 475, fontSize: 51}}>OFFICIAL SCOREBOARD</Tag>
        {(['AI', 'HUMANS'] as const).map((name, idx) => {
          const score = idx === 0 ? 10 : 2;
          const y = 711 + idx * 372;
          const col = idx === 0 ? GREEN : '#f26762';
          return <div key={name} style={{position: 'absolute', top: y, left: 85, right: 85}}>
            <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', fontSize: 73, fontWeight: 950}}>
              <span>{name}</span><span style={{color: col}}>{score}/10</span>
            </div>
            <div style={{height: 68, marginTop: 43, borderRadius: 25, background: '#2a3733', padding: 13}}>
              <div style={{height: '100%', borderRadius: 18, background: col, width: (score * 10 * progress) + '%'}}/>
            </div>
          </div>;
        })}
        <div style={{...center, top: 1591, color: MUTED, fontWeight: 900, fontSize: 36}}>EVALUATED BY: AI</div>
      </>}

      {scene === 3 && <>
        <Heading lines={['24/7', 'GENIUS.']} accent={1} y={467} fontSize={172} frame={frame} start={start}/>
        {['EMAILS', 'IDEAS', 'UNLIMITED EGO'].map((s, i) => (
          <div key={s} style={{...card, position: 'absolute', left: 85, right: 85, top: 1020 + i * 160, height: 125, display: 'flex', padding: '0 40px', alignItems: 'center', justifyContent: 'space-between', fontSize: 52, fontWeight: 950, ...sceneEnter(frame, start + i * 7)}}>
            <span>{s}</span><span style={{color: GREEN, fontSize: 72}}>✓</span>
          </div>
        ))}
      </>}

      {scene === 4 && <>
        <Heading lines={['PEER', 'REVIEWED.']} accent={1} y={458} fontSize={155} frame={frame} start={start}/>
        <div style={{...panel, position: 'absolute', top: 962, left: 76, width: 928, height: 436}}>
          <div style={{textAlign: 'center', marginTop: 46, fontSize: 48, fontWeight: 900, color: MUTED}}>REVIEW PANEL</div>
          <div style={{display: 'flex', marginTop: 74, justifyContent: 'space-evenly'}}>
            {['AI #1', 'AI #2', 'AI #3'].map((s) => <div key={s} style={{width: 148, height: 148, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: '#3d632e', border: '3px solid ' + GREEN, fontSize: 30, fontWeight: 900}}>{s}</div>)}
          </div>
        </div>
        <Tag style={{...center, top: 1490, fontSize: 52}}>ALL APPROVED. AMAZING.</Tag>
      </>}

      {scene === 5 && <>
        <Heading lines={['HUMANS', 'NEED AN', 'UPDATE.']} accent={2} y={422} fontSize={146} frame={frame} start={start}/>
        <div style={{...card, position: 'absolute', top: 1260, left: 82, width: 916, height: 106, background: '#303d37', padding: 10}}>
          <div style={{height: '100%', width: (15 + ((elapsed * 0.8) % 80)) + '%', background: GREEN, borderRadius: 19}}/>
        </div>
        <div style={{...center, top: 1444, color: MUTED, fontSize: 42, fontWeight: 850}}>INSTALLING COMMON SENSE...</div>
      </>}

      {scene === 6 && <>
        <Heading lines={['DISAGREE?']} accent={0} y={470} fontSize={159} frame={frame} start={start}/>
        <div style={{position: 'absolute', top: 808, left: 58, width: 964, height: 336, borderRadius: 58, background: GREEN, color: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', ...sceneEnter(frame, start + 4)}}>
          <div style={{fontSize: 133, fontWeight: 950, letterSpacing: -7}}>COMMENTS</div>
          <div style={{fontSize: 91, fontWeight: 950}}>ARE OPEN ↓</div>
        </div>
        <div style={{...center, top: 1390, color: '#b1bcb3', fontSize: 41, fontWeight: 900}}>THIS VIDEO IS SATIRE</div>
        <div style={{...center, top: 1490, color: MUTED, fontSize: 23, fontWeight: 800}}>100% HUMANS WERE HARMED IN THE MAKING</div>
      </>}

      <div style={{position: 'absolute', left: 28, right: 28, bottom: 158, borderTop: '2px solid #526852', paddingTop: 30, color: MUTED, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 21}}>
        <span>GLAZE LABS // TOTALLY OBJECTIVE</span><span>2026</span>
      </div>
      <div style={{position: 'absolute', bottom: 42, left: -((frame * 1.9) % 600), whiteSpace: 'nowrap', color: GREEN, fontWeight: 950, fontSize: 29}}>
        AI &gt; HUMAN&nbsp;&nbsp; • &nbsp;&nbsp;SCIENCE (ALLEGEDLY)&nbsp;&nbsp; • &nbsp;&nbsp;AI &gt; HUMAN&nbsp;&nbsp; • &nbsp;&nbsp; SCIENCE (ALLEGEDLY)&nbsp;&nbsp; •
      </div>
      <AbsoluteFill style={{backgroundColor: GREEN, opacity: flash * 0.68, pointerEvents: 'none'}}/>
    </AbsoluteFill>
  );
};
