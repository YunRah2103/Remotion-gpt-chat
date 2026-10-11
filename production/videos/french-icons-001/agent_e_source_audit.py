#!/usr/bin/env python3
"""Independent QA of actual French Legends 42-video GitHub Actions archive."""
import hashlib
import json
import shutil
import subprocess
import tempfile
import zipfile
from pathlib import Path
from collections import Counter

ZIP=Path("out/e-source/YUNEX_FRENCH_LEGENDS_AGENT_A_AND_B_ALL_42_CLIPS.zip")
EXPECTED="46073d50fb4efe246b3e7ee1adee1601eec025a3aa2a07df45f038731218c533"
OUT=Path("production/videos/french-icons-001/agent-e")
OUT.mkdir(parents=True,exist_ok=True)
FRAME=OUT/"frames"
FRAME.mkdir(exist_ok=True)
def sha(f):
    with open(f,"rb") as x: return hashlib.file_digest(x,"sha256").hexdigest()
def command(cmd,limit=180):
    x=subprocess.run(cmd,text=True,capture_output=True,timeout=limit)
    if x.returncode: raise RuntimeError(x.stderr[-750:])
    return x.stdout
def memberhash(z,n):
    h=hashlib.sha256()
    with z.open(n) as f:
        for block in iter(lambda:f.read(2**20),b""):h.update(block)
    return h.hexdigest()
def audit():
    assert ZIP.is_file(),"combined inner media ZIP missing"
    digest=sha(ZIP)
    assert digest==EXPECTED,("ZIP hash mismatch",digest)
    with zipfile.ZipFile(ZIP) as z:
        assert z.testzip() is None,"ZIP CRC error"
        m=json.loads(z.read("combined_manifest.json"))
        entries=m["clips"]
        assert len(entries)==42
        assert m["classic_clips"]==20 and m["modern_clips"]==22
        assert len(set(e["file"] for e in entries))==42
        assert all(e["file"] in z.namelist() for e in entries)
        rows=[]
        with tempfile.TemporaryDirectory() as temp:
            for idx,e in enumerate(entries,1):
                name=e["file"]
                r={"number":idx,"file":name,"model":e.get("model"),"id":e.get("clip_id"),
                   "agent":e["agent"],"expected_sha":e["sha256"],
                   "sha_ok":False,"decode_ok":False,"samples":0,"warnings":[]}
                try:
                    r["sha_ok"]=memberhash(z,name)==e["sha256"]
                    if not r["sha_ok"]:raise RuntimeError("video SHA mismatch")
                    p=Path(temp)/("clip-%02d.mp4"%idx)
                    with z.open(name) as f,open(p,"wb") as o:shutil.copyfileobj(f,o,2**20)
                    data=json.loads(command(["ffprobe","-v","error","-of","json",
                      "-show_entries","format=duration,bit_rate:stream=codec_type,codec_name,width,height,avg_frame_rate",
                      str(p)]))
                    vids=[v for v in data["streams"] if v.get("codec_type")=="video"]
                    assert vids,"no video stream"
                    v=vids[0]
                    w,h=v["width"],v["height"]
                    dur=float(data["format"]["duration"])
                    r.update({"width":w,"height":h,"duration_seconds":dur,
                              "codec":v["codec_name"],"fps":v["avg_frame_rate"],
                              "bitrate":data["format"].get("bit_rate")})
                    if w<1920 and h<1920:r["warnings"].append("sub-HD encode")
                    if dur<1:r["warnings"].append("subsecond shot: accent only")
                    if "peugeot-205" in name.lower() and h>w:
                        r["warnings"].append("205 scaled portrait crop from landscape source")
                    command(["ffmpeg","-nostdin","-hide_banner","-loglevel","error",
                             "-i",str(p),"-map","0:v:0","-f","null","-"],180)
                    r["decode_ok"]=True
                    for j,t in enumerate((0.18,0.5,0.82)):
                        target=FRAME/("%02d-%s.jpg"%(idx,j))
                        command(["ffmpeg","-nostdin","-hide_banner","-loglevel","error",
                                 "-ss","%.3f"%(dur*t),"-i",str(p),"-frames:v","1",
                                 "-vf","scale=360:-2","-q:v","5","-y",str(target)],90)
                        assert target.stat().st_size>500
                        r["samples"]+=1
                    p.unlink()
                except Exception as exc:r["error"]=str(exc)
                rows.append(r)
                print("AUDIT",idx,"/",len(entries),"PASS" if r["decode_ok"] else "FAIL",
                      name,flush=True)
    from PIL import Image,ImageDraw
    montages=[]
    for start in range(0,42,8):
        current=rows[start:start+8]
        pic=Image.new("RGB",(1200,len(current)*150+40),"#171a20")
        draw=ImageDraw.Draw(pic)
        draw.text((8,8),"YUNEX | AGENT E | DECODED FRAMES %02d-%02d"%(start+1,start+len(current)),fill="white")
        for k,r in enumerate(current):
            y=40+k*150
            draw.text((8,y+8),("%02d %s"%(r["number"],str(r["id"])[:35])),fill="white")
            draw.text((8,y+26),(str(r["model"])[:36]),fill="#aabbcc")
            for j in range(3):
                src=FRAME/("%02d-%s.jpg"%(r["number"],j))
                if src.exists():
                    with Image.open(src) as im:
                        thumb=im.convert("RGB");thumb.thumbnail((288,140))
                        pic.paste(thumb,(310+294*j,y+3))
        target=OUT/("decoded-contact-%02d.jpg"%(start//8+1))
        pic.save(target,quality=86,optimize=True)
        montages.append(str(target))
    s=Counter(r["agent"] for r in rows)
    ok=sum(r["sha_ok"] for r in rows)
    dec=sum(r["decode_ok"] for r in rows)
    samples=sum(r["samples"] for r in rows)
    gate="PASS" if ok==dec==42 and samples==126 else "FAIL"
    summary={"technical_gate":gate,"creative_gate":"PENDING INDEPENDENT HUMAN VIDEO EDIT REVIEW",
             "rights_gate":"UNCLEARED","source_artifact":11713925779,
             "source_run":38169392715,"archive_sha256":digest,"archive_bytes":ZIP.stat().st_size,
             "zip_crc":"PASS","sha_pass":ok,"decoded_pass":dec,"decoded_samples":samples,
             "agent_counts":dict(s),"montage_paths":montages,"clips":rows}
    (OUT/"SOURCE_GATE_INDEPENDENT_QA.json").write_text(json.dumps(summary,indent=2))
    md=["# Agent E — independent French Legends 42-source review","",
        "This gate actually opened the combined 672MB media ZIP and decoded the 42 selected source MP4s.",
        "- Technical gate: "+gate+".",
        "- ZIP SHA256: "+digest,
        "- Valid video SHA checks: "+str(ok)+"/42; full video decodes: "+str(dec)+"/42.",
        "- Frame sample proofs: "+str(samples)+"/126; contact montages: "+str(len(montages))+".",
        "- Clips by agent: "+str(dict(s))+".",
        "- Creative/identity gate: NOT automatic PASS. Visually inspect contact sheets and edited output.",
        "- Known A creative flags: 2CV shots 02/03/04, Alpine village 13, Peugeot 205 crops 18/19.",
        "- Four classic DS clips last about 0.7-0.8s. Use as accents, not held hero shots.",
        "- Publisher/archive video distribution permissions remain UNCLEARED.","",
        "| # | Actual MP4 | Model label | Resolution | s | SHA | Decode | Notes |",
        "|---|---|---|---|---|---|---|---|"]
    for r in rows:
        notes="; ".join(r["warnings"]+([r["error"]] if r.get("error") else []))
        md.append("| %s | %s | %s | %sx%s | %.2f | %s | %s | %s |"%(
            r["number"],Path(r["file"]).name,r["model"],r.get("width","?"),
            r.get("height","?"),r.get("duration_seconds",0),
            "PASS" if r["sha_ok"] else "FAIL","PASS" if r["decode_ok"] else "FAIL",notes))
    (OUT/"SOURCE_GATE_INDEPENDENT_QA.md").write_text("\n".join(md)+"\n")
    print(json.dumps({k:v for k,v in summary.items() if k!="clips"},indent=2))
    return 0 if gate=="PASS" else 2

if __name__=="__main__":raise SystemExit(audit())
