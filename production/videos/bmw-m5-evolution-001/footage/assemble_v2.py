#!/usr/bin/env python3
"""Assemble 42 real BMW M5 candidate video clips from exact GitHub Actions media artifacts.
No interpolation, fake upscale, synthetic cars, or fake manual identity signoff.
"""
import hashlib,io,json,subprocess,shutil,os
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw,ImageChops,ImageStat

GENS=("E28","E34","E39","E60","F10","F90","G90")
NATIVE={"E28":(1920,1080),"E34":(720,576),"E39":(720,576),"E60":(720,576),"F10":(1920,1080),"F90":(1920,1080),"G90":(3840,2160)}
OUT=Path("out/m5-agent-a-v2")
CLIPS=OUT/"clips"
CLIPS.mkdir(parents=True,exist_ok=True)
ROOT=Path("production/videos/bmw-m5-evolution-001/footage")
V1=json.loads((ROOT/"provisional-cuts.json").read_text())["shots"]
SOURCES={
 "E28":"staging/baseline/clips",
 "E34":"staging/e34",
 "E39":"staging/legacy",
 "E60":"staging/legacy",
 "F10":"staging/f10",
 "F90":"staging/baseline/clips",
 "G90":"staging/baseline/clips"
}
E34_TIMES=[211.9,243.7,263.4,340.4,378.7,423.0]
def run(args,timeout=85):
 return subprocess.run(args,check=True,capture_output=True,timeout=timeout).stdout
def sha(p):
 h=hashlib.sha256()
 with open(p,"rb") as f:
  for b in iter(lambda:f.read(1<<20),b""):h.update(b)
 return h.hexdigest()
def probe(p):
 j=json.loads(run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(p)]))
 s=next(v for v in j["streams"] if v.get("codec_type")=="video")
 return {"width":int(s["width"]),"height":int(s["height"]),"fps":s.get("avg_frame_rate"),
   "codec":s.get("codec_name"),"durationSeconds":float(j["format"]["duration"])}
def frame(p,t,width=300):
 data=run(["ffmpeg","-nostdin","-v","error","-ss",str(t),"-i",str(p),"-frames:v","1",
   "-vf",f"scale={width}:-2","-vcodec","mjpeg","-f","image2pipe","-"],timeout=80)
 return Image.open(io.BytesIO(data)).convert("RGB")
rows=[]; thumbs=[]; hashes=set()
for i,cut in enumerate(V1):
 gen=cut["generation"]; idx=i%6+1
 filename=f"{gen.lower()}-{idx:02d}.mp4"
 source=Path(SOURCES[gen])/filename
 if not source.exists():raise FileNotFoundError("Actual video source missing: "+str(source))
 dest=CLIPS/filename
 shutil.copy2(source,dest) # lossless byte-copy, never recompress the acquired footage
 run(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(dest),"-map","0:v:0","-f","null","-"],timeout=120)
 meta=probe(dest)
 if (meta["width"],meta["height"])!=NATIVE[gen]:raise ValueError(f"Unexpected native resolution of {filename}: {meta}")
 if meta["durationSeconds"]<.65 or meta["durationSeconds"]>1.3:raise ValueError("Bad segment length: "+filename)
 a,b=frame(dest,.10),frame(dest,.62)
 movement=ImageStat.Stat(ImageChops.difference(a,b).convert("L")).mean[0]
 if movement<=1.7:raise ValueError(f"No measurable motion: {filename}, {movement:.2f}")
 digest=sha(dest)
 if digest in hashes:raise ValueError("Identical video files detected: "+filename)
 hashes.add(digest)
 warning=("Mixed E28/E34/E39/E60 formation master. Other generations may appear in frame and "
  "wet-runway takes have partially similar camera angle; six solo E34 camera angles NOT certified."
  if gen=="E34" else
  "Vintage BMW original is 720x576. It must not be exaggerated as modern 4K or cropped heavily."
  if gen in ("E39","E60") else
  "Actual moving footage, distinct cinematography/precise sedan identity must still be reviewed manually.")
 row={
  "slot":i+1,"generation":gen,"sourceShot":filename,"generationYear":[1985,1988,1998,2005,2011,2017,2024][i//6],
  "clipFile":f"clips/{filename}","clipSha256":digest,"clipBytes":dest.stat().st_size,
  "videoCodec":meta["codec"],"nativeWidth":meta["width"],"nativeHeight":meta["height"],
  "nativeFps":meta["fps"],"clipDurationSeconds":meta["durationSeconds"],
  "sourceInSeconds":E34_TIMES[i-6] if gen=="E34" else cut.get("sourceInSeconds"),
  "sourceIdentity":("BMW 2005 original high-resolution 720x576 four-generation formation/rolling and wet slalom"
   if gen=="E34" else "Genuine BMW PressClub / BMW Group footage, original source referenced in previous acquisition manifests"),
  "noReencodeFromUpgradedClip":True,
  "ffmpegFullDecodePassed":True,"temporalFrameDifference":round(movement,2),
  "actualMovingVideo":True,"modelIdentityIndependentlyApproved":False,
  "distinctCameraAngleIndependentlyApproved":False,"publicRedistributionRights":"unverified",
  "editorialStatus":"BLOCKED_E34" if gen=="E34" else "REVIEW_PENDING",
  "warning":warning
 }
 rows.append(row)
 thumbs.append((filename,frame(dest,.34,320)))
 print("PASS",filename,"native",meta["width"],meta["height"],"motion",round(movement,2),flush=True)
if len(rows)!=42:raise RuntimeError("Exactly 42 shots required")
W,H,G,C=245,138,10,6
sheet=Image.new("RGB",(G+C*(W+G),G+7*(H+32+G)),"#141920")
draw=ImageDraw.Draw(sheet)
for i,(name,img) in enumerate(thumbs):
 x=G+(i%C)*(W+G);y=G+(i//C)*(H+32+G)
 sheet.paste(ImageOps.contain(img,(W,H)),(x,y))
 draw.text((x,y+H+5),name+f" {rows[i]['nativeWidth']}x{rows[i]['nativeHeight']}",fill="#ffffff")
sheet.save(OUT/"CONTACT-42-V2.jpg",quality=92)
final={"schemaVersion":2,"project":"BMW-M5-EVOLUTION-001",
 "status":"42_ACTUAL_VIDEO_FILES_QA_PASS_EDITORIAL_REVIEW_ONLY",
 "generationCount":7,"slotCount":42,"fullDecodePassed":42,"motionPassed":42,"binaryUniqueFileHashes":42,
 "sourceCommitSha":os.environ.get("GITHUB_SHA"),"masterAudioIncluded":False,
 "noPublicDistributionRightsEstablished":True,
 "creativeBlocker":"Six E34 clips are actual moving footage but group scenes include other generations; some angles related. Exact user requirement of 42 uniquely appropriate shots NOT independently fulfilled.",
 "nativeResolutions":NATIVE,
 "sourceArtifactIds":{"baseline":11668700332,"e34Focused":11668118626,"legacyHd":11668242116,"f10Hd":11667807177},
 "shots":rows}
(OUT/"MANIFEST.json").write_text(json.dumps(final,indent=2)+"\n")
(OUT/"README.md").write_text("# BMW M5 evolution 42-slot V2 — real private review sources\n\n42 native moving video snippets, byte-copied from actual media, each checked with FFmpeg full decode and two-frame temporal difference. Six cuts per E28/E34/E39/E60/F10/F90/G90. Correct generation, individual angles and rights not fully verified. E34 material contains other BMW M5 generations and is NOT certified. This is not a final approved edit or a public release. Check MANIFEST.json and CONTACT-42-V2.jpg before integrating.\n")
(OUT/"SHA256SUMS.txt").write_text("\n".join(sha(p)+"  "+p.relative_to(OUT).as_posix() for p in sorted(OUT.rglob("*")) if p.is_file() and p.name!="SHA256SUMS.txt")+"\n")
print("COMPLETED 42 REAL CLIPS; 42 DECODE PASS; 42 MOTION PASS; E34 REVIEW REQUIRED",flush=True)
