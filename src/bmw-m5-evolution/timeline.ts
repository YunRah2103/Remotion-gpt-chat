import beatMap from '../../production/videos/bmw-m5-evolution-001/beat-map.json';

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const DURATION = 552;

export const GENERATIONS = ['E28', 'E34', 'E39', 'E60', 'F10', 'F90', 'G90'] as const;
export type Generation = (typeof GENERATIONS)[number];
export type FrameStrategy = 'auto' | 'fullBleed' | 'editorialPanel';
export type VisualKind = 'nose' | 'wheel' | 'profile' | 'rear' | 'rolling' | 'hero';

/**
 * Metadata from footage agent A. Each shotKey / visualFingerprint must
 * represent genuinely different, verified movement, NOT another crop
 * of the same source shot. file is a PUBLIC-DIR-RELATIVE local asset.
 * Do not stage restricted media in the public repository.
 */
export type M5Shot = {
  slot: number;
  generation: Generation;
  shotKey: string;
  sourceId: string;
  visualFingerprint: string;
  file: string;
  inSeconds: number;
  sourceWidth: number;
  sourceHeight: number;
  nativeFps: number;
  kind: VisualKind;
  strategy?: FrameStrategy;
  x?: number;
  y?: number;
  identityVerified: true;
  actualMotionVerified: true;
  sourceSha256: string;
  provenance?: string;
};

type RawBeat = {
  slot: number;
  generation: string;
  generationYear: number;
  startFrame: number;
  endFrame: number;
  durationFrames: number;
};

export type BeatSlot = RawBeat & {
  generation: Generation;
  chapterIndex: number;
  withinChapter: number;
};

const YEARS: Record<Generation, number> = {
  E28: 1985, E34: 1988, E39: 1998, E60: 2005,
  F10: 2011, F90: 2017, G90: 2024,
};

const raw = beatMap.cuts as RawBeat[];
export const BEATS: ReadonlyArray<BeatSlot> = raw.map((c, i) => {
  const chapterIndex = Math.floor(i / 6);
  return {...c, generation: GENERATIONS[chapterIndex], chapterIndex, withinChapter: i % 6};
});

export type TimelineShot = BeatSlot & {asset: M5Shot};

const fail = (message: string): never => {throw new Error('[M5Evolution] ' + message);};

/** Imported beat-map is the source of truth. Fail loudly on timing corruption. */
export const assertBeatMap = (): void => {
  if (beatMap.output.fps !== FPS || beatMap.output.frames !== DURATION ||
    beatMap.output.resolution[0] !== WIDTH || beatMap.output.resolution[1] !== HEIGHT) {
    fail('Unexpected export geometry or duration in beat-map');
  }
  if (raw.length !== 42) fail('Expected exactly 42 mapped beat slots');
  raw.forEach((c, i) => {
    const generation = GENERATIONS[Math.floor(i / 6)];
    if (c.slot !== i + 1 || c.generation !== generation ||
      c.generationYear !== YEARS[generation]) fail('Incorrect chronology at slot ' + (i + 1));
    if (c.startFrame !== (i === 0 ? 0 : raw[i - 1].endFrame + 1)) {
      fail('Frame gap/overlap at slot ' + (i + 1));
    }
    if (c.endFrame < c.startFrame || c.durationFrames !== c.endFrame - c.startFrame + 1) {
      fail('Bad duration for slot ' + (i + 1));
    }
  });
  if (raw[41].endFrame !== DURATION - 1) fail('Last frame is not 551');
};

/**
 * Production deliberately refuses accidental placeholder renders.
 * Provenance/source validation and per-shot visual identity are still
 * separate human QA requirements; strings alone cannot prove real motion.
 */
export const validateM5Shots = (shots: ReadonlyArray<M5Shot>): TimelineShot[] => {
  assertBeatMap();
  if (shots.length !== 42) fail('Need all 42 verified moving shots; got ' + shots.length);
  const bySlot = new Map(shots.map((s) => [s.slot, s]));
  if (bySlot.size !== 42) fail('Duplicate slot assignment');
  const keys = new Set<string>();
  const fingerprints = new Set<string>();
  const sourceSpans = new Map<string, Array<[number, number]>>();
  return BEATS.map((beat) => {
    const shot = bySlot.get(beat.slot);
    if (!shot) fail('Missing slot ' + beat.slot);
    if (shot.generation !== beat.generation || shot.identityVerified !== true ||
      shot.actualMotionVerified !== true) fail('Unverified/wrong generation at slot ' + beat.slot);
    if (!shot.shotKey || !shot.visualFingerprint || keys.has(shot.shotKey) ||
      fingerprints.has(shot.visualFingerprint)) {
      fail('Reused or unlabelled shot at slot ' + beat.slot);
    }
    keys.add(shot.shotKey); fingerprints.add(shot.visualFingerprint);
    if (!shot.sourceId || !/^[a-f0-9]{64}$/i.test(shot.sourceSha256) ||
      !shot.file || /^(?:\/|https?:|data:)/i.test(shot.file) ||
      shot.file.split('/').includes('..') || !/\.(mp4|mov|webm)$/i.test(shot.file)) {
      fail('Missing source provenance / unsafe local media path at slot ' + beat.slot);
    }
    if (!Number.isFinite(shot.inSeconds) || shot.inSeconds < 0 ||
      shot.sourceWidth < 480 || shot.sourceHeight < 360 ||
      !(shot.nativeFps >= 20 && shot.nativeFps <= 120)) {
      fail('Invalid source time/media dimensions at slot ' + beat.slot);
    }
    // Reject overlapping reuse of the same source segment. Unique shot
    // fingerprints are ALSO required, to catch repeated camera content.
    const duration = beat.durationFrames / FPS;
    const span: [number, number] = [shot.inSeconds, shot.inSeconds + duration];
    const history = sourceSpans.get(shot.sourceId) ?? [];
    if (history.some(([a, b]) => span[0] < b - .015 && a < span[1] - .015)) {
      fail('Overlapping source footage on slot ' + beat.slot);
    }
    history.push(span);
    sourceSpans.set(shot.sourceId, history);
    return {...beat, asset: shot};
  });
};

/** Native source framing safeguard. 1080p landscape should not be blind-cropped vertically. */
export const framingFor = (shot: M5Shot): Exclude<FrameStrategy, 'auto'> => {
  if (shot.strategy && shot.strategy !== 'auto') return shot.strategy;
  if (shot.sourceWidth / shot.sourceHeight > 1.3 && shot.sourceHeight < 1900) return 'editorialPanel';
  return 'fullBleed';
};

assertBeatMap();
