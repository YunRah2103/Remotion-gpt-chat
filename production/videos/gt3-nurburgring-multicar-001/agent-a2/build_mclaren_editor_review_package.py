#!/usr/bin/env python3
"""Build real human-reviewed McLaren GTWC 2026 Nürburgring track clip from verified original.
Publisher source is 1916×1078 AV1 / 25fps, NOT native 1920×1080.
Output is 1920×1080 with 2px left/right and 1px top/bottom padding, never upscaled.
This is REVIEW-ONLY while producer's native landscape 1920×1080 gate is strict.
"""
import pathlib, subprocess, hashlib, json, zipfile
SRC=pathlib.Path("out/gt3-a2-mclaren-pad-source/mclaren_nurburgring_two_car_battle_7.mp4")
OUT=pathlib.Path("out/gt3-a2-mclaren-editor-review")
OUT.mkdir(parents=True,exist_ok=True)
DEST=OUT/"MC_720S_GT3_EVO_GTWCE_2026_NURBURGRING_01_CONTACT_1916_SOURCE_PADDED_1920_REVIEW.mp4"
EXPECTED="5e8790bd607971836b312ed43015d823b5e6ef072f8a6dc01587aec41"
def sha(p):
 h=hashlib.sha256()
 with p.open("rb") as f:
  for b in iter(lambda:f.read(1048576),b""):h.update(b)
 return h.hexdigest()
def run(cmd):
 r=subprocess.run(cmd,capture_output=True,text=True,timeout=95)
 if r.returncode:raise RuntimeError(r.stderr[-1000:])
 return r.stdout
assert SRC.is_file() and sha(SRC)==EXPECTED, "Must use actual previously verified public source original bytes"
d=json.loads(run(["ffprobe","-v","error","-of","json","-show_streams","-show_format",str(SRC)]))
v=next(s for s in d["streams"] if s["codec_type"]=="video")
assert (int(v["width"]),int(v["height"]))==(1916,1078), "Original cannot be passed as native 1920x1080"
run(["ffmpeg","-nostdin","-v","error","-y","-ss","2.25","-i",str(SRC),"-t","4.4","-an",
     "-vf","pad=1920:1080:2:1:black,format=yuv420p","-c:v","libx264","-preset","medium","-crf","17",
     "-movflags","+faststart",str(DEST)])
run(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(DEST),"-map","0:v:0","-f","null","-"])
p=json.loads(run(["ffprobe","-v","error","-of","json","-show_streams","-show_format",str(DEST)]))
pv=next(s for s in p["streams"] if s["codec_type"]=="video")
assert int(pv["width"])==1920 and int(pv["height"])==1080
(OUT/"ORIGINAL_SOURCE_NOT_PADDED.mp4").write_bytes(SRC.read_bytes())
manifest={
 "agent":"A2","review_status":"EDITOR_REVIEW_ONLY_STRICT_NATIVE_1920x1080_SOURCE_REQUIREMENT_NOT_MET",
 "model":"McLaren 720S GT3 EVO","series":"GT World Challenge Europe", "track":"Nürburgring GP circuit",
 "actual_camera_angles":1, "publisher_original_url":"https://www.facebook.com/GTWorldChallengeEurope/videos/a-dramatic-moment-at-the-n%C3%BCrburgring-as-two-mclarens-come-together-gtworld/1094931886398447/",
 "original_file":"ORIGINAL_SOURCE_NOT_PADDED.mp4",
 "original_pixels":[1916,1078],"original_codec":"AV1","original_fps":25,
 "original_sha256":EXPECTED,"original_bytes":SRC.stat().st_size,
 "edit_trim_range_original_seconds":[2.25,6.65],
 "review_video_file":DEST.name,"review_video_pixels":[1920,1080],
 "review_conversion":"Only 2-pixel black borders left/right, 1-pixel top/bottom; no scale or invented pixels",
 "review_video_sha256":sha(DEST),"review_video_bytes":DEST.stat().st_size,
 "review_fully_decoded":True,"camera_qa":"One genuine Nürburgring circuit broadcast angle showing two GT3 McLarens contact; 2.25-6.65s avoids large show-title and yellow caution broadcast overlays. Small timing graphics at top remain.",
 "qualifies_as_new_strict_native_1920x1080_make":False,
 "qualifies_as_multiple_cameras":False
}
(OUT/"SOURCE_AND_VISUAL_QA.json").write_text(json.dumps(manifest,indent=2)+"\n")
(OUT/"README.md").write_text("# YUNEX A2 McLaren Nürburgring REAL racing footage — review-only\n\n"+
 "Two real playable MP4s: unchanged original 1916×1078 AV1, and cleanest 4.4s H.264 collision battle segment padded to 1920×1080 WITHOUT upscaling.\n"+
 "The source is only 1916×1078 native. Do NOT mark it as native >=1920×1080 or count it toward six exact-size makes. "\
 "Producer can decide whether the harmless 2-pixel edge-padding exception is acceptable. "\
 "Only one independently filmed on-track camera view, and publisher mini leaderboard overlay remains. "\
 "GitHub issue #26 should document this evidence, not claim Gate A PASS.\n")
z=OUT/"GT3_A2_MCLAREN_2026_NURBURGRING_VERIFIED_CLIP_AND_ORIGINAL_REVIEW.zip"
with zipfile.ZipFile(z,"w",compression=zipfile.ZIP_STORED) as arc:
 for f in OUT.glob("*"):
  if f.is_file() and f!=z:arc.write(f,f.name)
with zipfile.ZipFile(z) as arc:
 assert arc.testzip() is None
 assert hashlib.sha256(arc.read(manifest["review_video_file"])).hexdigest()==manifest["review_video_sha256"]
 assert hashlib.sha256(arc.read(manifest["original_file"])).hexdigest()==manifest["original_sha256"]
print("MCLAREN_REVIEW_REAL_TWO_VIDEOS",DEST.stat().st_size,SRC.stat().st_size,
      "ZIP",z.stat().st_size,"SHA",sha(z),flush=True)
