#!/usr/bin/env python3
"""BMW M5 private-review source ingest and frame/motion QA; no invented asset claims."""
import argparse, hashlib, io, json, math, subprocess, sys, urllib.parse, urllib.request
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CATALOG = ROOT / "source-catalog.json"
BOARD = ROOT / "shot-board.json"
MEDIA = ROOT / "local-originals"
PROOFS = ROOT / "local-proofs"
GENS = ("E28", "E34", "E39", "E60", "F10", "F90", "G90")

def load(p):
    return json.loads(Path(p).read_text(encoding="utf-8"))

def run(cmd, timeout=120):
    return subprocess.run(cmd, check=True, text=True, capture_output=True, timeout=timeout).stdout

def validate_board():
    d=load(BOARD); cats=load(CATALOG)
    assert d["schemaVersion"]==1 and len(d["slots"])==42 and d["totalFrames"]==552
    assert cats["schemaVersion"]==1 and len({x["id"] for x in cats["sources"]})==len(cats["sources"])
    assert len(cats["sources"]) >= 7
    seen_ids={x["id"] for x in cats["sources"]}
    last=-1
    for i,s in enumerate(d["slots"]):
        assert s["slot"]==i+1 and s["generation"]==GENS[i//6]
        assert s["startFrame"]==last+1 and s["endFrame"]>=s["startFrame"]
        assert s["durationFrames"]==s["endFrame"]-s["startFrame"]+1
        assert s["status"]=="MISSING_VERIFIED_CLIP" or s["status"]=="VERIFIED"
        assert set(s["candidateIds"])<=seen_ids
        last=s["endFrame"]
    assert last==551
    counts=Counter(x["generation"] for x in d["slots"])
    assert all(counts[g]==6 for g in GENS)
    print(json.dumps({"result":"PASS","catalogEntries":len(cats["sources"]),
          "plannedSlots":42,"frames":552,"actualVerifiedClips":sum(x["status"]=="VERIFIED" for x in d["slots"]),
          "warning":"PLAN ONLY; this is not a real-footage readiness assertion"}))

def sha256(path):
    digest=hashlib.sha256()
    with open(path,"rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""):
            digest.update(chunk)
    return digest.hexdigest()

def ffprobe(path):
    data=json.loads(run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(path)],timeout=120))
    v=[s for s in data.get("streams",[]) if s.get("codec_type")=="video"]
    if len(v)!=1: raise ValueError("Not exactly one video stream: "+str(path))
    s=v[0]
    num,den=map(int,s.get("avg_frame_rate","0/1").split("/"))
    fps=num/den if den else 0
    duration=float(data.get("format",{}).get("duration") or s.get("duration") or 0)
    if fps<=0 or duration<=0 or int(s["width"])<320 or int(s["height"])<240:
        raise ValueError("Invalid moving-video candidate: "+str(path))
    return {"codec":s["codec_name"],"width":int(s["width"]),"height":int(s["height"]),
            "fps":round(fps,4),"durationSeconds":round(duration,3),
            "bytes":Path(path).stat().st_size,"sha256":sha256(path)}

def safe_download_url(url):
    parsed=urllib.parse.urlparse(url)
    if parsed.scheme!="https" or parsed.hostname!="mediapool.bmwgroup.com" or parsed.username or parsed.password:
        raise ValueError("Only direct verified official BMW PressClub media links supported. Other sources: acquire with creator permission manually.")
    if parsed.path!="/download/edown/tvFootageDownload":raise ValueError("Not a known PressClub media path")
    q=urllib.parse.parse_qs(parsed.query)
    if q.get("actEvent")!=["tvFootageSceneHD"] or not q.get("filmSceneFileId"):
        raise ValueError("Missing verified high-res link selector")

def fetch_one(source,max_gib=8):
    url=source.get("downloadUrl")
    if not url:raise ValueError("No verified direct master URL for "+source["id"])
    safe_download_url(url)
    MEDIA.mkdir(parents=True,exist_ok=True)
    dest=MEDIA/(source["id"]+".mov")
    if dest.exists():
        info=ffprobe(dest); print("ALREADY_PRESENT",source["id"],info); return info
    partial=dest.with_suffix(".partial")
    cap=int(max_gib*1024**3)
    request=urllib.request.Request(url,headers={"User-Agent":"BMW-M5-PrivateResearch/1.0"})
    current=0
    try:
        with urllib.request.urlopen(request,timeout=60) as response, open(partial,"wb") as out:
            if response.headers.get("Content-Type","").lower().startswith("text/"):
                raise ValueError("Not a media download")
            if int(response.headers.get("Content-Length","0"))>cap:raise ValueError("Source exceeds cap")
            while True:
                b=response.read(2**20)
                if not b:break
                current+=len(b)
                if current>cap:raise ValueError("Exceeded download cap")
                out.write(b)
        info=ffprobe(partial)
        partial.rename(dest)
    finally:
        if partial.exists():partial.unlink()
    print(json.dumps({"fetched":source["id"],"file":str(dest),"metadata":info}))
    return info

def jpeg_at(path,sec,size=480):
    return subprocess.run(["ffmpeg","-hide_banner","-v","error","-ss",str(sec),
          "-i",str(path),"-frames:v","1","-vf",f"scale={size}:-2",
          "-f","image2pipe","-c:v","mjpeg","-q:v","3","-"],
          check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=80).stdout

def contact_one(source_id,step=8):
    from PIL import Image,ImageOps,ImageDraw,ImageChops,ImageStat
    path=MEDIA/(source_id+".mov")
    meta=ffprobe(path)
    secs=[round(x,2) for x in [0.1+i*step for i in range(math.ceil(meta["durationSeconds"]/step))] if x<meta["durationSeconds"]-.02]
    if len(secs)>110:secs=secs[:110]
    samples=[]; frames=[]
    for t in secs:
        a=Image.open(io.BytesIO(jpeg_at(path,t))).convert("RGB")
        samples.append((t,a)); frames.append({"second":t})
    if not samples:raise ValueError("No preview frames")
    w,h=260,174; gap=12; cols=5
    rows=math.ceil(len(samples)/cols)
    canvas=Image.new("RGB",(cols*(w+gap)+gap,rows*(h+38+gap)+gap),(11,15,20))
    d=ImageDraw.Draw(canvas)
    for i,(t,im) in enumerate(samples):
        x=gap+(i%cols)*(w+gap); y=gap+(i//cols)*(h+38+gap)
        canvas.paste(ImageOps.contain(im,(w,h)),(x,y));d.text((x,y+h+3),f"{source_id}  {t:.2f}s",fill="white")
    PROOFS.mkdir(parents=True,exist_ok=True)
    canvas.save(PROOFS/(source_id+"-contact.jpg"),quality=92)
    report={"id":source_id,"source":meta,"sampleTimes":secs,"warning":"Sampling contact sheets cannot prove a specific M5 generation or 42 individual shots"}
    (PROOFS/(source_id+"-inspection.json")).write_text(json.dumps(report,indent=2)+"\n")
    print(json.dumps({"source":source_id,"sampleCount":len(samples),"contactSheet":str(PROOFS/(source_id+"-contact.jpg"))}))

def check_approved(path):
    """Require actual source files, frame motion and reviewed identity. Never auto-assert visual identity."""
    from PIL import Image,ImageChops,ImageStat
    rows=load(path)["shots"]
    board=load(BOARD)["slots"]
    sources={x["id"]:x for x in load(CATALOG)["sources"]}
    if len(rows)!=42:raise ValueError("Exactly 42 real shots required")
    seen=set(); slices={}; sigs=[]
    out=[]
    for i,(s,b) in enumerate(zip(rows,board)):
        if s.get("slot")!=i+1 or s.get("generation")!=b["generation"]:
            raise ValueError(f"Wrong generation or slot at {i+1}")
        for fld in ("sourceId","inSeconds","outSeconds","reviewedModelEvidence","reviewedCameraDescription","reviewedBy"):
            if not s.get(fld) and s.get(fld)!=0:raise ValueError(f"Missing {fld} at slot {i+1}")
        if s.get("manualIdentityApproved") is not True or s.get("manualDistinctShotApproved") is not True:
            raise ValueError("Human/model visual review is required before labeling READY")
        src=s["sourceId"]
        if src not in sources or sources[src]["generation"]!=s["generation"]:
            raise ValueError(f"Unreliable model source in slot {i+1}")
        movie=MEDIA/(src+".mov")
        meta=ffprobe(movie)
        t0,t1=map(float,(s["inSeconds"],s["outSeconds"]))
        if t0<0 or t1-t0<(b["durationFrames"]/30)-.03 or t1>meta["durationSeconds"]+.001:
            raise ValueError(f"Invalid source time range slot {i+1}")
        for a,b2,j in slices.get(meta["sha256"],[]):
            if min(t1,b2)-max(t0,a)>.03:raise ValueError(f"Overlapping same source: {j},{i+1}")
        slices.setdefault(meta["sha256"],[]).append((t0,t1,i+1))
        first=Image.open(io.BytesIO(jpeg_at(movie,t0+.025,300))).convert("RGB")
        last=Image.open(io.BytesIO(jpeg_at(movie,min(t1-.025,t0+(t1-t0)*.80),300))).convert("RGB")
        delta=ImageStat.Stat(ImageChops.difference(first,last).convert("L")).mean[0]
        if delta<1.9:raise ValueError(f"No measurable temporal movement at slot {i+1}: {delta:.2f}")
        # Perceptual near-duplicate midpoint check: global hash is a warning;
        # camera changes are visually inspected instead of trusting an automated threshold.
        mid=Image.open(io.BytesIO(jpeg_at(movie,(t0+t1)/2,300))).convert("L").resize((9,8))
        px=list(mid.getdata()); signature=tuple(int(px[y*9+x]>px[y*9+x+1]) for y in range(8) for x in range(8))
        for prev,slot in sigs:
            hd=sum(x!=y for x,y in zip(signature,prev))
            if hd<=3:raise ValueError(f"Near-identical midpoint shots {slot},{i+1}; inspect duplication")
        sigs.append((signature,i+1))
        out.append({"slot":i+1,"generation":s["generation"],"sourceId":src,
           "sourceUrl":sources[src]["pageUrl"],"sourceSha256":meta["sha256"],
           "sourceWidth":meta["width"],"sourceHeight":meta["height"],
           "sourceFps":meta["fps"],"sourceDurationSeconds":meta["durationSeconds"],
           "inSeconds":t0,"outSeconds":t1,"reviewedCameraDescription":s["reviewedCameraDescription"],
           "modelEvidence":s["reviewedModelEvidence"],"actualMotionVerified":True,
           "shotVerified":True,"visualAngle":s["reviewedCameraDescription"],
           "creator":sources[src]["creator"],"rights":sources[src]["rights"],
           "motionDifference":round(delta,2),
           "contactSheetPath":str(PROOFS/(src+"-contact.jpg"))})
    dest=ROOT/"source-manifest.json"
    dest.write_text(json.dumps({"schemaVersion":1,"status":"VERIFIED_BY_REVIEWER_LOCAL_VIDEO",
       "shots":out,"notes":"Verifier requires human approval metadata and actual local video bytes; cross-source visual review still essential."},indent=2)+"\n")
    print(json.dumps({"result":"PASS","actualVerifiedSlots":42,"manifest":str(dest)}))

def main():
    parser=argparse.ArgumentParser()
    sub=parser.add_subparsers(dest="mode",required=True)
    sub.add_parser("check-board")
    f=sub.add_parser("fetch");f.add_argument("ids",nargs="+");f.add_argument("--max-gib",type=float,default=8)
    p=sub.add_parser("probe");p.add_argument("ids",nargs="+")
    c=sub.add_parser("contact");c.add_argument("ids",nargs="+");c.add_argument("--step",type=float,default=8)
    v=sub.add_parser("verify");v.add_argument("approvedCutsJson")
    args=parser.parse_args()
    if args.mode=="check-board":validate_board();return
    source={s["id"]:s for s in load(CATALOG)["sources"]}
    if args.mode=="verify":check_approved(args.approvedCutsJson);return
    for sid in args.ids:
        if sid not in source:raise ValueError("Unknown source ID: "+sid)
        if args.mode=="fetch":fetch_one(source[sid],args.max_gib)
        if args.mode=="probe":print(sid,json.dumps(ffprobe(MEDIA/(sid+".mov"))))
        if args.mode=="contact":contact_one(sid,args.step)
if __name__=="__main__":main()
