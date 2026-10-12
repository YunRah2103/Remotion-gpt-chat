#!/usr/bin/env python3
"""Agent B source acquisition: genuine Indy 500 originals, not synthetic footage."""
import base64, hashlib, json, os, pathlib, subprocess, time, urllib.request, zipfile

OUT = pathlib.Path("out/agent-b-indy-matches")
CLIPS = OUT/"clips"; QA=OUT/"qa"; ORIGINALS=OUT/"originals"
for p in [CLIPS,QA,ORIGINALS]: p.mkdir(parents=True, exist_ok=True)
UA="YUNEX-Agent-B/1.0 (filmmaking source provenance; attribution recorded)"
SOURCES = [
 {"id":"B01","name":"2025 Indianapolis 500 actual race start","url":"https://upload.wikimedia.org/wikipedia/commons/e/e4/Indy5002025start.webm","page":"https://commons.wikimedia.org/wiki/File:Indy5002025start.webm","licence":"Uploader PD-self claim, video has Wikimedia LICENSE REVIEW NEEDED flag; hold for rights validation","author":"Waluigithewalrus","rank":"racing-speed priority","cuts":[[0.8,3.5],[9.0,3.5]]},
 {"id":"B02","name":"2024 Indianapolis 500 pace lap","url":"https://upload.wikimedia.org/wikipedia/commons/3/3b/2024_Indianapolis_500_-_Sarah_Stierch_01.webm","page":"https://commons.wikimedia.org/wiki/File:2024_Indianapolis_500_-_Sarah_Stierch_01.webm","licence":"CC BY 4.0 attribution Sarah Stierch","author":"Sarah Stierch (Missvain)","rank":"banking / angle fallback ONLY: pace lap slower than race","cuts":[[2.5,3.5],[9.2,3.5]]},
 {"id":"B03","name":"2022 Indianapolis 500 formation lap in genuine 4K","url":"https://upload.wikimedia.org/wikipedia/commons/4/45/2022_Indianapolis_500_-_Sarah_Stierch_08.webm","page":"https://commons.wikimedia.org/wiki/File:2022_Indianapolis_500_-_Sarah_Stierch_08.webm","licence":"CC BY 4.0 attribution Sarah Stierch","author":"Sarah Stierch (Missvain)","rank":"alternative track geometry / 4K fallback only","cuts":[[2.0,3.5],[7.5,3.5]]}
]

def run(*cmd, check=True):
    p=subprocess.run(list(map(str,cmd)),capture_output=True,text=True)
    if check and p.returncode: raise RuntimeError(f"{cmd[0]} failed {p.returncode}: {p.stderr[-1800:]}")
    return p.stdout

def pull(url,dest):
    errors=[]
    for attempt in range(3):
        try:
            req=urllib.request.Request(url,headers={"User-Agent":UA,"Accept":"video/webm,*/*"})
            with urllib.request.urlopen(req,timeout=65) as resp, dest.open("wb") as f:
                while True:
                    buf=resp.read(1024*1024)
                    if not buf: break
                    f.write(buf)
                    if f.tell()>140*1024*1024: raise RuntimeError("source too large for this agent")
            if dest.stat().st_size<200_000: raise RuntimeError("suspect short video")
            return
        except Exception as e:
            errors.append(repr(e))
            if dest.exists(): dest.unlink()
            time.sleep(1+attempt)
    raise RuntimeError("; ".join(errors))

def probe(p):
    return json.loads(run("ffprobe","-v","error","-show_format","-show_streams","-of","json",p))

def sha256(p):
    h=hashlib.sha256()
    with open(p,"rb") as f:
        for b in iter(lambda:f.read(1024*1024),b""): h.update(b)
    return h.hexdigest()

results=[]; errors=[]
for src in SOURCES:
    item=dict(src)
    original=ORIGINALS/(src["id"]+".webm")
    try:
        pull(src["url"],original)
        info=probe(original)
        v=next(x for x in info["streams"] if x["codec_type"]=="video")
        w,h=v["width"],v["height"]
        duration=float(info["format"].get("duration") or 0)
        if w<1920 or h<1080 or duration<3: raise RuntimeError(f"reject dimensions {w}x{h} duration {duration}")
        # Force read/decoded-frame verification; merely fetching headers does not pass.
        run("ffmpeg","-nostdin","-v","error","-i",original,"-vf","fps=1,scale=320:-2","-f","null","-")
        # Motion evidence: compare actual output image checksums from separated time points.
        still_hashes=[]
        for t in [duration*.15,duration*.5,duration*.85]:
            frame=QA/f'{src["id"]}_frame_{int(t*1000):05d}.jpg'
            run("ffmpeg","-nostdin","-v","error","-ss",f"{t:.2f}","-i",original,"-frames:v","1","-q:v","3",frame)
            still_hashes.append(sha256(frame))
        if len(set(still_hashes))<2: raise RuntimeError("No visible motion between decoded frame samples")
        sheet=QA/(src["id"]+"_contact.jpg")
        run("ffmpeg","-nostdin","-v","error","-i",original,"-vf","fps=1/2,scale=480:270:force_original_aspect_ratio=decrease,pad=480:270:(ow-iw)/2:(oh-ih)/2,tile=4x2:padding=6:margin=3","-frames:v","1","-q:v","4",sheet)
        extracted=[]
        for i,(start,seconds) in enumerate(src["cuts"],1):
            if start+seconds>duration: continue
            # Output at 1080p from native source, NEVER upscale.
            clip=CLIPS/f'{src["id"]}_match_candidate_{i:02d}.mp4'
            run("ffmpeg","-nostdin","-y","-v","error","-ss",str(start),"-i",original,"-t",str(seconds),"-an","-vf","scale=1920:1080:flags=lanczos,setsar=1","-c:v","libx264","-crf","18","-preset","fast","-pix_fmt","yuv420p","-movflags","+faststart",clip)
            vcheck=probe(clip)
            ex_v=next(s for s in vcheck["streams"] if s["codec_type"]=="video")
            if ex_v["width"]!=1920 or ex_v["height"]!=1080: raise RuntimeError("candidate encode not 1080p")
            extracted.append({"path":str(clip.relative_to(OUT)),"source_start_s":start,"duration_target_s":seconds,"sha256":sha256(clip),"bytes":clip.stat().st_size})
        item.update(status="DOWNLOADED_DECODED",native_resolution=f"{w}x{h}",fps=v.get("avg_frame_rate"),codec=v.get("codec_name"),duration_s=duration,sha256=sha256(original),bytes=original.stat().st_size,source_file=str(original.relative_to(OUT)),motion_frames_distinct=len(set(still_hashes)),candidate_clips=extracted,contact_sheet=str(sheet.relative_to(OUT)),verified_source_url=src["url"],note="Scene angle, banking slope, travel direction and Turbo A/B pairing require human contact-sheet QA; cuts from same original source are NOT distinct angles.")
        results.append(item)
        print("PASS:",src["id"],f"{w}x{h}",f"{duration:.2f}s",len(extracted),"candidate cuts")
        # Inline one very compressed contact sheet for agent's visual inspection through runner logs
        tiny=QA/(src["id"]+"_inline.jpg")
        run("ffmpeg","-nostdin","-y","-v","error","-i",sheet,"-vf","scale=640:-2","-q:v","11","-frames:v","1",tiny)
        print("CONTACT_B64_"+src["id"]+"="+base64.b64encode(tiny.read_bytes()).decode())
    except Exception as exc:
        print("FAIL:",src["id"],str(exc)[:2000])
        item.update(status="FAILED",error=str(exc))
        errors.append(item)
        if original.exists(): original.unlink()
manifest={"agent":"B","project":"YUNEX Turbo to IndyCar 001","source_count":len(results),"candidate_cut_count":sum(len(x["candidate_clips"]) for x in results),"angle_count_claimed":"NOT VERIFIED BY HUMAN","sources":results,"failed_sources":errors,"transition_status":"NOT YET HUMAN MATCHED to Agent A Turbo footage","note":"All clips are actual filmed motorsport, not Blender/sim/AI. B01 licensing flagged: never silently assume legal reuse."}
(QA/"manifest.json").write_text(json.dumps(manifest,indent=2)+"\n")
readme=["# Agent B IndyCar match-footage run","",f"Downloaded and decoded sources: {len(results)} / {len(SOURCES)}",f"Candidate motion cuts (not separate angles): {manifest['candidate_cut_count']}","","MUST match Agent A frames before selecting a transition. Video provenance / rights in qa/manifest.json. B01 licence review flag is material.","","## Source audit"]
for x in results+errors: readme.append(f"- {x['id']}: {x['status']} — {x['page']} — {x['licence']} — {x.get('native_resolution','not verified')}")
(QA/"README.md").write_text("\n".join(readme)+"\n")
with zipfile.ZipFile("out/agent-b-indy-matches-real-footage.zip","w",compression=zipfile.ZIP_STORED) as z:
    for p in sorted(OUT.rglob("*")):
        if p.is_file(): z.write(p,p.relative_to(OUT))
print("RESULT_COUNTS",json.dumps({"sources":len(results),"cuts":manifest["candidate_cut_count"],"archive_bytes":pathlib.Path("out/agent-b-indy-matches-real-footage.zip").stat().st_size}))
if not results: raise SystemExit("No playable source. Archive is diagnostics only, NOT delivery.")
