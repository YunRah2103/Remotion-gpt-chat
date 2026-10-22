/**
 * EP004 Agent 6 — frame-accurate picture/VO edit planning.
 * No narration timestamps or shot lengths are invented here. Every interior
 * cut is keyed to a timestamp from the real recorded voice transcript.
 */
import type {ShotId} from '../../shared/contract.ts';

export const SHOT_ORDER = [
  'spark-hook',
  'rear-mystery',
  'underfloor-reveal',
  'aero-load',
  'contact-macro',
  'racing-payoff',
] as const satisfies readonly ShotId[];

export const EP004_FPS = 30;
export const CAPTION_SAFE_BOTTOM_PX = 326;
export const CAPTION_MAX_WIDTH_PX = 890;

export type TimedWord = Readonly<{
  text: string;
  startSec: number;
  endSec: number;
}>;

export type WordLinkedCut = Readonly<{
  shot: ShotId;
  // The word whose START marks this shot's entry, except shot 1 which
  // always starts at frame zero to preserve the very-first-frame hook.
  wordIndex: number;
  // Optional approved PHYSICS source-time offset. Enables a genuine spark-contact
  // flash-forward at frame zero; original voice and edit time never change.
  sourceStartSec?: number;
}>;

export type Cut = Readonly<{
  shot: ShotId;
  sourceWordIndex: number;
  sourceStartSec?: number;
  startFrame: number;
  endFrameExclusive: number;
  durationFrames: number;
}>;

export type CaptionGroup = Readonly<{
  text: string;
  wordIndices: readonly number[];
  startFrame: number;
  endFrameExclusive: number;
}>;

export type PicturePlan = Readonly<{
  fps: typeof EP004_FPS;
  width: 1080;
  height: 1920;
  totalFrames: number;
  audioDurationSec: number;
  audioSrc: string;
  words: readonly TimedWord[];
  cuts: readonly Cut[];
  captions: readonly CaptionGroup[];
}>;

export type PlanInput = Readonly<{
  audioSrc: string;
  audioDurationSec: number;
  words: readonly TimedWord[];
  cuts: readonly WordLinkedCut[];
}>;

export type ReadinessInput = Readonly<{
  approvedAgents: readonly number[];
  integrationCommitSha: string | null;
  allSixMovingScenesIntegrated: boolean;
  originalRecordedNarrationPresent: boolean;
  wordTimestampsVerifiedAgainstRecording: boolean;
}>;

const requireValid = (valid: boolean, problem: string): void => {
  if (!valid) throw new Error('EP004 editor: ' + problem);
};

const roundFrame = (sec: number): number => Math.round(sec * EP004_FPS);

export function missingPicturePrerequisites(input: ReadinessInput): string[] {
  const missing: string[] = [];
  for (const agent of [1, 2, 3, 4, 5]) {
    if (!input.approvedAgents.includes(agent)) missing.push('Agent ' + agent + ' visual approval');
  }
  if (!input.integrationCommitSha || !/^[a-f0-9]{40}$/i.test(input.integrationCommitSha)) {
    missing.push('verified 40-character integrated EP004 commit SHA');
  }
  if (!input.allSixMovingScenesIntegrated) missing.push('all six real moving visual scenes integrated');
  if (!input.originalRecordedNarrationPresent) missing.push('original EP004 recorded narration');
  if (!input.wordTimestampsVerifiedAgainstRecording) missing.push('word timing verified against original recording');
  return missing;
}

/** Stable phrase groups: max three spoken words, max 24 characters. */
export function captionGroups(words: readonly TimedWord[], totalFrames: number): CaptionGroup[] {
  const draft: {text: string; wordIndices: number[]; startFrame: number; lastEndFrame: number}[] = [];
  let group: (typeof draft)[number] | null = null;
  const flush = () => {
    if (group !== null) draft.push(group);
    group = null;
  };
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const last = group && words[group.wordIndices[group.wordIndices.length - 1]];
    const hasPause = last !== null && last !== undefined && word.startSec - last.endSec > 0.34;
    const previousEndsSentence = last !== null && last !== undefined && /[.!?]$/.test(last.text.trim());
    const tooLong = group !== null && (group.wordIndices.length >= 3 || group.text.length + 1 + word.text.length > 24);
    if (hasPause || previousEndsSentence || tooLong) flush();
    if (group === null) {
      group = {text: word.text, wordIndices: [i], startFrame: roundFrame(word.startSec), lastEndFrame: Math.ceil(word.endSec * EP004_FPS)};
    } else {
      group.text += ' ' + word.text;
      group.wordIndices.push(i);
      group.lastEndFrame = Math.ceil(word.endSec * EP004_FPS);
    }
  }
  flush();
  return draft.map((g, i) => {
    const nextStart = draft[i + 1]?.startFrame ?? totalFrames;
    const end = Math.min(totalFrames, nextStart, g.lastEndFrame + Math.round(EP004_FPS * 0.25));
    return {
      text: g.text,
      wordIndices: g.wordIndices,
      startFrame: g.startFrame,
      endFrameExclusive: Math.max(g.startFrame + 1, end),
    };
  });
}

export function buildPicturePlan(input: PlanInput): PicturePlan {
  requireValid(typeof input.audioSrc === 'string' && input.audioSrc.trim().length > 0, 'original audio source required');
  requireValid(!/ep003/i.test(input.audioSrc), 'EP003 media is forbidden in EP004');
  requireValid(Number.isFinite(input.audioDurationSec) && input.audioDurationSec > 0, 'real audio duration required');
  requireValid(input.words.length >= 6, 'verified original word timings required; at least six words');
  let previousStart = -1;
  let previousEnd = -1;
  for (const [i, word] of input.words.entries()) {
    requireValid(word.text.trim().length > 0, 'blank transcript word ' + i);
    requireValid(Number.isFinite(word.startSec) && Number.isFinite(word.endSec), 'nonfinite word timing ' + i);
    requireValid(word.startSec >= 0 && word.endSec > word.startSec, 'invalid word timing ' + i);
    requireValid(word.startSec >= previousStart, 'word starts are out of order ' + i);
    requireValid(word.startSec >= previousEnd - 0.08, 'word overlaps exceed 80 milliseconds ' + i);
    requireValid(word.endSec <= input.audioDurationSec + 0.04, 'word extends beyond original audio ' + i);
    previousStart = word.startSec;
    previousEnd = word.endSec;
  }
  requireValid(input.cuts.length === SHOT_ORDER.length, 'exactly six canonical scene cuts required');
  const totalFrames = Math.ceil(input.audioDurationSec * EP004_FPS);
  const starts = input.cuts.map((anchor, i) => {
    requireValid(anchor.shot === SHOT_ORDER[i], 'wrong shot ordering at ' + i);
    requireValid(Number.isInteger(anchor.wordIndex) && anchor.wordIndex >= 0 && anchor.wordIndex < input.words.length, 'invalid cut word index ' + i);
    if (anchor.sourceStartSec !== undefined) requireValid(Number.isFinite(anchor.sourceStartSec) && anchor.sourceStartSec >= 0, 'invalid real physics source time ' + i);
    if (i === 0) {
      requireValid(anchor.wordIndex === 0, 'opening hook must begin at first transcript word');
      return 0;
    }
    requireValid(anchor.wordIndex > input.cuts[i - 1].wordIndex, 'cut word indices must increase');
    const frame = roundFrame(input.words[anchor.wordIndex].startSec);
    requireValid(frame > 0 && frame < totalFrames, 'scene entry outside original recording');
    return frame;
  });
  const cuts: Cut[] = input.cuts.map((cut, i) => {
    const startFrame = starts[i];
    const endFrameExclusive = starts[i + 1] ?? totalFrames;
    requireValid(endFrameExclusive > startFrame, 'zero-length or reversed scene at ' + i);
    return {
      shot: cut.shot,
      sourceWordIndex: cut.wordIndex,
      ...(cut.sourceStartSec === undefined ? {} : {sourceStartSec:cut.sourceStartSec}),
      startFrame,
      endFrameExclusive,
      durationFrames: endFrameExclusive - startFrame,
    };
  });
  return {
    fps: EP004_FPS,
    width: 1080,
    height: 1920,
    totalFrames,
    audioDurationSec: input.audioDurationSec,
    audioSrc: input.audioSrc.trim(),
    words: input.words.map(w => ({...w})),
    cuts,
    captions: captionGroups(input.words, totalFrames),
  };
}

export function shotAtFrame(frame: number, cuts: readonly Cut[]): Cut {
  const cut = cuts.find(c => frame >= c.startFrame && frame < c.endFrameExclusive);
  if (!cut) throw new Error('EP004 editor: frame outside locked picture edit ' + frame);
  return cut;
}

export function captionAtFrame(frame: number, captions: readonly CaptionGroup[]): CaptionGroup | null {
  return captions.find(c => frame >= c.startFrame && frame < c.endFrameExclusive) ?? null;
}

/** The spoken-word movie frame and actual world/physics source time are distinct.
 * Allows a frame-zero flash-forward to a TRUE metal-contact event without
 * inventing particles, changing VO, or moving unrelated original events.
 */
export function sourceTimeAtFrame(frame: number, cuts: readonly Cut[]): number {
  const cut = shotAtFrame(frame,cuts);
  const movieTime = frame / EP004_FPS;
  return cut.sourceStartSec === undefined ? movieTime : cut.sourceStartSec + (frame-cut.startFrame)/EP004_FPS;
}
