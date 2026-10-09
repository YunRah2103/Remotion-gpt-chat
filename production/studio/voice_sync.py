#!/usr/bin/env python3
"""Optional CPU speech transcription and timestamped SRT/VTT captions.

Supply actual existing audio and opt into faster-whisper; offline mode accepts
a reviewable word timestamp JSON. No TTS, fake transcripts or fabricated timing.
"""
import argparse
import json
import math
from pathlib import Path

def seconds(t):
    if t<0 or not math.isfinite(t):raise ValueError("Invalid timestamp")
    n=round(t*1000)
    return n//3600000,(n//60000)%60,(n//1000)%60,n%1000

def stamp(t,separator=","):
    h,m,s,ms=seconds(t)
    return f"{h:02d}:{m:02d}:{s:02d}{separator}{ms:03d}"

def validate_words(words):
    if not isinstance(words,list) or not words:raise ValueError("Word timestamps required")
    previous=0
    clean=[]
    for w in words:
        start,end=float(w["start"]),float(w["end"])
        text=str(w["word"]).strip()
        if not text or start<previous-0.03 or end<=start or end-start>10:
            raise ValueError("Unreliable word timing")
        previous=end
        clean.append({"start":start,"end":end,"word":text})
    return clean

def subtitle_cues(words,max_words=5,max_seconds=2.4):
    cues=[]; current=[]
    for w in words:
        if current and (len(current)>=max_words or w["end"]-current[0]["start"]>max_seconds or w["start"]-current[-1]["end"]>.16):
            cues.append(current);current=[]
        current.append(w)
    if current:cues.append(current)
    return [{"start":line[0]["start"],"end":line[-1]["end"],
             "text":" ".join(p["word"] for p in line)} for line in cues]

def export(words,out,source):
    words=validate_words(words)
    path=Path(out);path.mkdir(parents=True,exist_ok=True)
    cues=subtitle_cues(words)
    (path/"captions.srt").write_text("\n".join(f"{i}\n{stamp(c['start'])} --> {stamp(c['end'])}\n{c['text']}\n" for i,c in enumerate(cues,1))+"\n")
    (path/"captions.vtt").write_text("WEBVTT\n\n"+"\n".join(f"{stamp(c['start'],'.')} --> {stamp(c['end'],'.')}\n{c['text']}\n" for c in cues))
    (path/"words.json").write_text(json.dumps({"source":source,"words":words,"captions":cues},indent=2)+"\n")
    return {"source":source,"words":len(words),"captions":len(cues),"duration":round(words[-1]["end"],3)}

def transcribe(audio,model):
    try:
        from faster_whisper import WhisperModel
    except ImportError as err:
        raise RuntimeError("Install production/studio/requirements-voice.txt for opt-in transcription") from err
    transcriber=WhisperModel(model,device="cpu",compute_type="int8",cpu_threads=2)
    segments,info=transcriber.transcribe(str(audio),word_timestamps=True,vad_filter=True)
    if getattr(info,"language",None) not in {"en"}:
        raise ValueError("English narration expected; inspect transcript manually")
    return [{"start":float(w.start),"end":float(w.end),"word":w.word.strip()}
            for s in segments for w in (s.words or []) if w.start is not None and w.end is not None]

def main():
    p=argparse.ArgumentParser()
    source=p.add_mutually_exclusive_group(required=True)
    source.add_argument("--audio",help="Existing audio supplied by user, not generated")
    source.add_argument("--words-json",help="Previously verified timestamped words JSON")
    p.add_argument("--model",default="tiny.en")
    p.add_argument("--output",required=True)
    x=p.parse_args()
    if x.audio:
        if not Path(x.audio).is_file():raise ValueError("Audio missing")
        result=transcribe(x.audio,x.model)
        source_name=Path(x.audio).name
    else:
        result=json.loads(Path(x.words_json).read_text())
        if isinstance(result,dict):result=result["words"]
        source_name=Path(x.words_json).name
    print(json.dumps(export(result,x.output,source_name),indent=2))

if __name__=="__main__":main()
