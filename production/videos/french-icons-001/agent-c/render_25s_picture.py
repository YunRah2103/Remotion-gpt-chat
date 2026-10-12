#!/usr/bin/env python3
"""Build the verified 25-second YUNEX French Legends PICTURE cut.

Input is the actual muted 60-second Agent C V5 picture (artifact 11720519374).
Audio is intentionally absent: Agent D owns the exact-original user song.
Nothing from the original 2CV / DS opening is in this 25-second edit.
"""
from __future__ import annotations
import hashlib, json, subprocess, sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

SHOTS = json.loads(Path(__file__).with_name("25S_CUT_SHOTMAP.json").read_text())
assert SHOTS["frameCount"] == 750 and SHOTS["frameRate"] == 30
SOURCE = Path(sys.argv[1]).resolve()
OUT_DIR = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("out/fr-legends-25")
OUT_DIR.mkdir(parents=True, exist_ok=True)
PARTS = OUT_DIR / "pieces"
PARTS.mkdir(exist_ok=True)
MASTER = OUT_DIR / SHOTS["output"]

def call(*args):
    return subprocess.run(list(map(str,args)), check=True, capture_output=True, text=True).stdout

def probe(path):
    return json.loads(call("ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", path))

def sha(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024*1024), b""):
            h.update(block)
    return h.hexdigest()

def one(shot):
    n = shot["frames"]
    dest = PARTS / ("shot_%02d.mp4" % shot["index"])
    call("ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y",
         "-ss",f"{shot['sourceStartSeconds']:.6f}","-i",SOURCE,
         "-map","0:v:0","-an","-vf",f"fps=30,trim=end_frame={n},setpts=PTS-STARTPTS,format=yuv420p",
         "-frames:v",n,"-c:v","libx264","-preset","fast","-crf","17",
         "-pix_fmt","yuv420p","-r","30","-g","60","-video_track_timescale","15360",dest)
    info=next(x for x in probe(dest)["streams"] if x["codec_type"]=="video")
    assert int(info.get("nb_frames",0)) == n, (shot["index"],info.get("nb_frames"),n)
    return dest

def main():
    source_data=probe(SOURCE)
    source_video=next(x for x in source_data["streams"] if x["codec_type"]=="video")
    assert source_video["width"]==1920 and source_video["height"]==1080
    assert float(source_data["format"]["duration"]) >= 59.99
    shots=SHOTS["shots"]
    assert sum(s["frames"] for s in shots)==750
    assert shots[0]["sourceStartSeconds"]>=5.4, "Do not reintroduce the 2CV or DS start"
    assert shots[-1]["masterEndFrame"]==750
    with ThreadPoolExecutor(max_workers=2) as pool:
        futures=[pool.submit(one,s) for s in shots]
        for future in as_completed(futures):
            future.result()
    playlist=OUT_DIR/"concat.txt"
    playlist.write_text("\n".join("file '"+str((PARTS/("shot_%02d.mp4"%s["index"])).resolve())+"'" for s in shots)+"\n")
    call("ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y",
         "-f","concat","-safe","0","-i",playlist,
         "-map","0:v:0","-an","-c:v","copy","-movflags","+faststart",MASTER)
    meta=probe(MASTER)
    v=next(x for x in meta["streams"] if x["codec_type"]=="video")
    assert (v["width"],v["height"],v["r_frame_rate"],int(v.get("nb_frames",0)))==(1920,1080,"30/1",750)
    assert abs(float(meta["format"]["duration"])-25.0)<0.04
    assert not any(x["codec_type"]=="audio" for x in meta["streams"])
    call("ffmpeg","-v","error","-xerror","-i",MASTER,"-f","null","-")
    call("ffmpeg","-nostdin","-hide_banner","-loglevel","error","-y","-i",MASTER,
         "-vf","fps=1/1.25,scale=384:216,tile=5x4","-frames:v","1",OUT_DIR/"real_decoded_contact_sheet.jpg")
    report={"source":str(SOURCE),"type":"MUTED AGENT-C 25S PICTURE EDIT — D ADDS ORIGINAL MUSIC",
            "render":str(MASTER),"sha256":sha(MASTER),"frames":750,"duration":25.0,
            "resolution":"1920x1080","fps":30,"selected_shots":len(shots),
            "first_2CV_clip_included":False,"audio_source_segment_seconds":[35,60],
            "decode":"PASS","rights":"Uncleared for some source films"}
    (OUT_DIR/"qa_report.json").write_text(json.dumps(report,indent=2)+"\n")
    print(json.dumps(report,indent=2))

if __name__ == "__main__":
    main()
