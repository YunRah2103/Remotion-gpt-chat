/**
 * EP004 Agent 6: independent original narration audio validation.
 * Picture master must preserve the real supplied EP004 recording at t=0.
 * Compare time-local speech energy from that recording to the actual encoded
 * audio stream, not merely test for the presence of *some* audio track.
 * This is a sync-integrity check, not human proof of speaker identity.
 */
import {execFileSync} from 'node:child_process';

function decodeMonoPcm(file) {
  let buffer;
  try {
    buffer = execFileSync('ffmpeg', [
      '-hide_banner','-v','error','-xerror','-nostdin','-i',file,
      '-map','0:a:0','-vn','-ac','1','-ar','8000','-f','s16le','-'
    ], {encoding:'buffer',maxBuffer:32*1024*1024,stdio:['ignore','pipe','pipe']});
  } catch (err) {
    throw new Error('EP004 VO audit: decoding actual audio stream failed: ' + String(err.stderr || err.message).slice(-700));
  }
  if (buffer.length<8000) throw new Error('EP004 VO audit: no intelligible-length audio to compare');
  const count = Math.floor(buffer.length/2);
  const data = new Float32Array(count);
  for(let i=0;i<count;i++) data[i]=buffer.readInt16LE(i*2)/32768;
  return data;
}

export function energyEnvelope(samples, sampleRate=8000, binSec=0.08) {
  const bin = Math.round(sampleRate*binSec);
  if (!(samples?.length>=bin*3)) throw new Error('EP004 VO audit: audio too short for independent speech sync');
  const out=[];
  for(let i=0;i+bin<=samples.length;i+=bin) {
    let sq=0;
    for(let j=i;j<i+bin;j++) sq+=samples[j]*samples[j];
    out.push(Math.sqrt(sq/bin));
  }
  return out;
}

function correlation(a,b) {
  if(a.length!==b.length || a.length<8) return -1;
  const n=a.length;
  let sa=0,sb=0,sa2=0,sb2=0,sab=0;
  for(let i=0;i<n;i++) {sa+=a[i];sb+=b[i];sa2+=a[i]*a[i];sb2+=b[i]*b[i];sab+=a[i]*b[i];}
  const den=Math.sqrt(Math.max(0,n*sa2-sa*sa)*Math.max(0,n*sb2-sb*sb));
  return den>1e-10?(n*sab-sa*sb)/den:-1;
}

export function compareVoiceEnvelopes(original, picture, binSec=0.08) {
  if (!Array.isArray(original)||!Array.isArray(picture)||original.length<16)
    throw new Error('EP004 VO audit: missing sufficient speech energy samples');
  if(Math.abs(original.length-picture.length)>2)
    throw new Error('EP004 VO audit: original voice and encoded audio length differ by >2 bins');
  const n=Math.min(original.length,picture.length);
  const originalRms=Math.sqrt(original.slice(0,n).reduce((acc,x)=>acc+x*x,0)/n);
  const outputRms=Math.sqrt(picture.slice(0,n).reduce((acc,x)=>acc+x*x,0)/n);
  if (originalRms<0.001||outputRms<0.001) throw new Error('EP004 VO audit: voice is essentially silent');
  const gain=outputRms/originalRms;
  const pair=(shift)=> {
    const a=[],b=[];
    for(let i=0;i<n;i++) {
      const j=i+shift;
      if(j>=0 && j<n) {a.push(original[i]);b.push(picture[j]);}
    }
    return correlation(a,b);
  };
  const zeroLag=pair(0);
  const scans=Array.from({length:13},(_,i)=>({shiftBins:i-6,match:pair(i-6)}));
  const best=scans.reduce((a,b)=>b.match>a.match?b:a);
  if (zeroLag<0.82) throw new Error('EP004 VO audit: encoded speech does not match the original recording at time zero (correlation '+zeroLag.toFixed(3)+')');
  if (Math.abs(best.shiftBins)>1 && best.match>zeroLag+0.055)
    throw new Error('EP004 VO audit: original voice shifted by '+(best.shiftBins*binSec).toFixed(2)+' seconds');
  if (!(gain>=0.65 && gain<=1.40))
    throw new Error('EP004 VO audit: narration level changed significantly (relative RMS gain '+gain.toFixed(2)+')');
  return {zeroLagSpeechEnvelopeCorrelation:Math.round(zeroLag*1000)/1000, peakAlignmentOffsetSec:best.shiftBins*binSec, relativeVoiceRmsGain:Math.round(gain*1000)/1000, originalSpeechSamples:n, note:'Speech-envelope match only; visually inspect subtitles and listen to the encoded voice for identity and clarity'};
}

export function verifyOriginalNarration(originalAudioPath, encodedVideoPath) {
  const a=energyEnvelope(decodeMonoPcm(originalAudioPath));
  const b=energyEnvelope(decodeMonoPcm(encodedVideoPath));
  return compareVoiceEnvelopes(a,b);
}
