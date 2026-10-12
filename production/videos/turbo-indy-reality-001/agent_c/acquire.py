#!/usr/bin/env python3
"""Agent C: acquire genuine racing bytes; no media is committed to Git.
Evidence-driven QA: ffprobe, FFmpeg decoded frames, motion, SHA256, contact sheets.
"""
import hashlib, json, os, re, shutil, subprocess, sys, time, urllib.parse, urllib.request, zipfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops, ImageStat

ROOT=Path("out/yunex-indy-c")
RAW=ROOT/"raw"
CLIPS=ROOT/"clips"
SHEETS=ROOT/"contact_sheets"
for d in (ROOT, RAW, CLIPS, SHEETS): d.mkdir(parents=True,exist_ok=True)
USER_AGENT="YUNEX-Footage-QA/1.0 (public media only; no access-control bypass)"
SOURCES=[
  dict(id="indy500_2026_finish",kind="yt",url="https://www.dailymotion.com/video/xab5b6s",
       title="2026 Indianapolis 500 final-lap Rosenqvist/Malukas close race", uploader="Dailymotion video uploader",
       rights="Third-party racing broadcast; no reuse licence confirmed. INTERNAL REVIEW ONLY until licensed.",
       role="race action; last lap duel", priority=1),
  dict(id="indy500_2026_official",kind="yt",url="https://www.indycar.com/videos/2026/05/05-24-race-highlights-2026-indianapolis-500",
       title="Race Highlights: 2026 Indianapolis 500", uploader="INDYCAR",
       rights="INDYCAR copyright; reproduction/reuse rights NOT granted by public availability; review only.", 
       role="overtakes/packs/high-angle/speedway", priority=1),
  dict(id="indy500_2025_official",kind="yt",url="https://www.indycar.com/videos/2025/05/05-25-nics-indy500highlights-vid",
       title="Race Highlights: 2025 Indianapolis 500", uploader="INDYCAR",
       rights="INDYCAR copyright; reuse requires clearance. Review only.", 
       role="overtakes/packs/oval", priority=2),
  dict(id="indy500_2024_formation",kind="wikimedia",filename="2024 Indianapolis 500 - Sarah Stierch 01.webm",
       url="https://commons.wikimedia.org/wiki/File:2024_Indianapolis_500_-_Sarah_Stierch_01.webm",
       title="2024 Indianapolis 500 pace lap",uploader="Sarah Stierch",
       rights="CC BY 4.0 — attribution to Sarah Stierch; pace lap, NOT active race overtake.",
       role="formation-lap fallback only", priority=3),
]
def run(args,timeout=150,check=False):
    r=subprocess.run(args, text=True, stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=timeout)
    if check and r.returncode: raise RuntimeError((r.stderr or r.stdout)[-1800:])
    return r
def sha(path):
    h=hashlib.sha256()
    with open(path,"rb") as f:
        for b in iter(lambda:f.read(1024*1024),b""):h.update(b)
    return h.hexdigest()
def probe(path):
    r=run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(path)],timeout=45,check=True)
    d=json.loads(r.stdout)
    v=next((x for x in d.get("streams",[]) if x["codec_type"]=="video"),None)
    if not v:raise RuntimeError("no video stream")
    w,h=int(v["width"]),int(v["height"])
    fps=v.get("avg_frame_rate","0/1").split("/")
    rate=round(float(fps[0])/max(1,float(fps[1])),3)
    return dict(width=w,height=h,fps=rate,codec=v.get("codec_name"),duration=float(d["format"].get("duration",0)),video_bitrate=v.get("bit_rate"),format=d["format"].get("format_name"),nb_frames=v.get("nb_frames"))
def acquire(s):
    prefix=RAW/s["id"]
    if s["kind"]=="wikimedia":
        url="https://commons.wikimedia.org/wiki/Special:Redirect/file/"+urllib.parse.quote(s["filename"])
        dest=prefix.with_suffix(".webm")
        req=urllib.request.Request(url,headers={"User-Agent":USER_AGENT})
        with urllib.request.urlopen(req,timeout=35) as rsp, open(dest,"wb") as f:
            if int(rsp.headers.get("content-length","0"))>350_000_000:raise RuntimeError("too large")
            total=0
            while True:
                b=rsp.read(1024*1024)
                if not b:break
                total+=len(b)
                if total>350_000_000:raise RuntimeError("size limit")
                f.write(b)
        return dest, {"download_method":"Wikimedia public original via Special:Redirect/file","resolved_url":url}
    # Independent public-page extraction without logins, cookies or DRM bypass.
    cmd=["yt-dlp","--no-playlist","--no-check-certificates","--no-overwrites",
         "--no-warnings","--socket-timeout","18","--retries","1",
         "--fragment-retries","1","--max-filesize","350M",
         "--match-filter","duration < 1800",
         "--format","bv*[height>=1080]+ba/b[height>=1080]/bv*+ba/b",
         "--merge-output-format","mp4",
         "--output",str(prefix)+".%(ext)s",s["url"]]
    r=run(cmd,timeout=160)
    candidates=list(RAW.glob(s["id"]+".*"))
    if r.returncode!=0 or not candidates:raise RuntimeError("yt-dlp: "+(r.stderr or r.stdout)[-700:])
    candidates.sort(key=lambda p:p.stat().st_size,reverse=True)
    return candidates[0], {"download_method":"yt-dlp public video extraction", "extract_log_tail":(r.stdout or "")[-400:]}
def frame(video,t,size=(480,270)):
    r=subprocess.run(["ffmpeg","-nostdin","-hide_banner","-loglevel","error","-ss",str(max(.04,t)),
      "-i",str(video),"-frames:v","1","-vf",f"scale={size[0]}:{size[1]}:force_original_aspect_ratio=decrease:flags=lanczos,pad={size[0]}:{size[1]}:(ow-iw)/2:(oh-ih)/2:black",
      "-f","image2pipe","-vcodec","mjpeg","-"],stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=28)
    if r.returncode or not r.stdout:raise RuntimeError("frame decode error "+r.stderr.decode(errors="replace")[-300:])
    import io
    return Image.open(io.BytesIO(r.stdout)).convert("RGB")
def motion_measure(video,duration):
    t=[max(.05,duration*q) for q in (.2,.36,.6,.78)]
    frames=[frame(video,x,(320,180)) for x in t]
    means=[]
    for a,b in zip(frames,frames[1:]):
        diff=ImageChops.difference(a,b)
        means.append(round(sum(ImageStat.Stat(diff).mean)/3,2))
    return means
def scene_candidates(video,duration):
    # Decoded frames, 3 fps. Change detection only proposes candidates; visual review still needed.
    cut_filter="fps=3,scale=480:-2,select='gt(scene,0.26)',showinfo"
    r=run(["ffmpeg","-nostdin","-hide_banner","-i",str(video),"-an","-vf",cut_filter,
           "-f","null","-"],timeout=180)
    arr=[]
    for m in re.finditer(r"pts_time:([0-9.]+)",r.stderr):
        v=float(m.group(1))
        if 1.5<v<duration-2.0 and all(abs(v-x)>3.3 for x in arr):arr.append(round(v,2))
    return arr
def trim(video,out,start,duration):
    # Explicitly not upscaling. H264 converts unsupported VP8/VP9 into widely playable MP4.
    r=run(["ffmpeg","-y","-nostdin","-hide_banner","-loglevel","error","-ss",str(start),"-i",str(video),
            "-t",str(duration),"-map","0:v:0","-an","-c:v","libx264","-preset","veryfast",
            "-crf","18","-pix_fmt","yuv420p","-movflags","+faststart",str(out)],timeout=100)
    if r.returncode:raise RuntimeError(r.stderr[-800:])
def contact_sheet(path,name,dur):
    canvas=Image.new("RGB",(960,600),(18,20,26)); drawer=ImageDraw.Draw(canvas)
    for i,t in enumerate([.25,.7,1.15,1.75]):
        t=min(t,max(.07,dur-.12))
        im=frame(path,t,(460,258))
        x=10+(i%2)*480;y=35+(i//2)*280
        canvas.paste(im,(x,y))
        drawer.text((x+4,y+260),f"{name} | t={t:.2f}s",fill="white")
    canvas.save(SHEETS/(name+".jpg"),quality=91)
def main():
    manifest=dict(agent="C",project="YUNEX Turbo to IndyCar 001",
       branch="automotive-edits/turbo-indy-reality-001/c-indy-racing",
       generated_utc=time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime()),
       rule="Native 1080p minimum: DO NOT upscale; no unlicensed broadcast rights implied.",
       sources=[],clips=[],failed_sources=[],notes=[
          "Source stream resolution is recorded and measured; output MP4 is NEVER upscaled.",
          "Automated scene detection is NOT a substitute for reviewing actual contact sheets.",
          "Clips cut from the same source are NOT automatically distinct camera angles.",
          "Video published on the web is not necessarily licensed for use on social media.",
          "Agent C action focus; excluded agent D's onboard/pit-stop footage."])
    for src in SOURCES:
        item={k:v for k,v in src.items() if k!="filename"}
        try:
            video,info=acquire(src)
            prop=probe(video)
            item.update(info);item["bytes"]=video.stat().st_size;item["sha256"]=sha(video);item["ffprobe"]=prop
            if min(prop["width"],prop["height"])<1080:
                item["status"]="REJECTED_BELOW_NATIVE_1080"
                manifest["failed_sources"].append({"id":src["id"],"reason":"Below 1080 active height/width (no upscaling)", "probe":prop})
                manifest["sources"].append(item)
                continue
            if prop["duration"]<3:raise RuntimeError("too short")
            # Never classify formation laps as active overtakes.
            classification="formation_not_race" if "formation" in src["id"] else "race_candidate_needs_visual_review"
            times=scene_candidates(video,prop["duration"])
            # Preserve temporal variety; don't falsely count alternate excerpts as independent camera angles.
            if not times:
                times=[float(i) for i in range(3, min(int(prop["duration"])-2,25),5)]
            if src["id"]=="indy500_2024_formation":times=[3.0,8.0]
            # source 1 > source 2 > source 3; limit source size and redundant shots.
            cap=7 if src["priority"]==1 else 4
            accepted=0
            for t in times:
                if accepted>=cap or len(manifest["clips"])>=16:break
                start=max(0.,min(prop["duration"]-2.6,t-.45))
                name=f"C{len(manifest['clips'])+1:02d}_{src['id']}_{accepted+1:02d}"
                dest=CLIPS/(name+".mp4")
                try:
                    trim(video,dest,start,2.6)
                    outprop=probe(dest)
                    if outprop["width"]!=prop["width"] or outprop["height"]!=prop["height"]:
                        raise RuntimeError("unexpected scale")
                    if outprop["duration"]<2:raise RuntimeError("truncated encode")
                    movement=motion_measure(dest,outprop["duration"])
                    if max(movement)<2.8:
                        dest.unlink(missing_ok=True)
                        continue
                    contact_sheet(dest,name,outprop["duration"])
                    manifest["clips"].append({
                        "file":str(dest.relative_to(ROOT)),"name":name,"source_id":src["id"],
                        "source_url":src["url"],"source_title":src["title"],"source_uploader":src["uploader"],
                        "rights":src["rights"],"class":classification,
                        "source_seconds":[round(start,2),round(start+2.6,2)],
                        "stream":outprop,"sha256":sha(dest),"bytes":dest.stat().st_size,
                        "motion_frame_differences":movement,
                        "camera_angle":"unclassified: contact sheet/manual review required",
                        "direction_of_travel":"requires frame review",
                        "vertical_9x16":"review crop suitability on contact sheet"})
                    accepted+=1
                except Exception as err:
                    dest.unlink(missing_ok=True)
                    manifest["failed_sources"].append({"id":src["id"],"time":start,"reason":str(err)[:250]})
            item["status"]="ACQUIRED";item["clip_count"]=accepted
            manifest["sources"].append(item)
            # Full source might be large; clips have physical bytes in artifact; no need to duplicate originals.
            print("SOURCE",src["id"],"ACQUIRED clips",accepted,prop,flush=True)
        except Exception as err:
            item["status"]="FAILED";item["error"]=str(err)[:1100]
            manifest["sources"].append(item)
            manifest["failed_sources"].append({"id":src["id"],"reason":str(err)[:1100]})
            print("SOURCE",src["id"],"FAILED",str(err)[:400],flush=True)
    manifest["usable_action_candidate_count"]=sum(c["class"]=="race_candidate_needs_visual_review" for c in manifest["clips"])
    manifest["licensed_formation_count"]=sum(c["class"]=="formation_not_race" for c in manifest["clips"])
    manifest["status"]="RACE_CANDIDATES_ACQUIRED_REVIEW_REQUIRED" if manifest["usable_action_candidate_count"] else "BLOCKED_NO_RACING"
    (ROOT/"manifest.json").write_text(json.dumps(manifest,indent=2))
    (ROOT/"checksums.sha256").write_text("\n".join(f"{c['sha256']}  {c['file']}" for c in manifest["clips"])+"\n")
    sheets=list(SHEETS.glob("*.jpg"))
    if sheets:
        cols=3;w=360;h=240
        grid=Image.new("RGB",(w*cols,h*((len(sheets)+cols-1)//cols)),(14,15,22))
        for i,p in enumerate(sheets):
            img=Image.open(p);img.thumbnail((w-12,h-35))
            x=(i%cols)*w+6;y=(i//cols)*h+28
            grid.paste(img,(x,y))
            ImageDraw.Draw(grid).text((x,y-22),p.stem[:42],fill="white")
        grid.save(ROOT/"ALL_CONTACT_SHEETS.jpg",quality=88)
    report=["# Agent C — actual acquisition QA",f"Status: {manifest['status']}",
            f"Race action candidates: {manifest['usable_action_candidate_count']}",
            f"Formation/non-racing clips: {manifest['licensed_formation_count']}",
            "All thumbnails extracted from decoded video; byte checksums in checksums.sha256.",
            "Do not claim visual approval or permission to publish broadcast clips without review."]
    report += [f"- {s['id']}: {s['status']}; {s.get('clip_count',0)} clips; {s.get('error','')[:160]}" for s in manifest["sources"]]
    (ROOT/"REPORT.md").write_text("\n".join(report)+"\n")
    with zipfile.ZipFile(ROOT/"agent-c-indycar-footage.zip","w",compression=zipfile.ZIP_STORED) as z:
        for p in sorted(ROOT.rglob("*")):
            if p.is_file() and p.suffix.lower() in (".mp4",".jpg",".json",".sha256",".md"):
                z.write(p,p.relative_to(ROOT))
    print(json.dumps({"status":manifest["status"],"action_clips":manifest["usable_action_candidate_count"],
                      "formation_clips":manifest["licensed_formation_count"],
                      "zip_bytes":(ROOT/"agent-c-indycar-footage.zip").stat().st_size,
                      "sources":[(s["id"],s["status"]) for s in manifest["sources"]]},indent=2),flush=True)
    if manifest["usable_action_candidate_count"]<1:sys.exit(2)
if __name__=="__main__":main()
