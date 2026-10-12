#!/usr/bin/env python3
"""Internal visual match audit: inspect real IndyCar footage already delivered by B/C/D.
No source redistribution or editing; downloads existing internal Actions artifacts for QA.
"""
import os,json,zipfile,subprocess,hashlib,base64,time,urllib.request
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path("out/turbo-indy-match-audit")
ROOT.mkdir(parents=True,exist_ok=True)
origins={"B":Path("out/thirdparty/B"),"C":Path("out/thirdparty/C"),"D":Path("out/thirdparty/D")}
report={"project":"YUNEX Turbo IndyCar 001","type":"A-side cross-agent preliminary visual perspective audit","sources":[],"audit_time":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime()),"not_approval":"This is comparison QA, not a licensed or visually approved final transition."}
def run(cmd,timeout=75):
    p=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=timeout)
    if p.returncode:raise ValueError(p.stderr[-500:])
    return p.stdout
def expand(root):
    done=set()
    for _ in range(4):
        zs=[z for z in root.rglob("*.zip") if z not in done]
        if not zs:break
        for z in zs:
            done.add(z)
            dest=z.parent/(z.stem+"_extracted")
            dest.mkdir(exist_ok=True)
            with zipfile.ZipFile(z) as f:
                if f.testzip() is not None:raise ValueError("Invalid zip CRC: "+str(z))
                for item in f.infolist():
                    # protect against archive path traversal
                    loc=(dest/item.filename).resolve()
                    if not loc.is_relative_to(dest.resolve()):raise ValueError("Unsafe archived path")
                f.extractall(dest)
            print("EXTRACTED_ZIP "+str(z)+" -> "+str(dest),flush=True)
def probe(file):
    txt=run(["ffprobe","-v","error","-show_entries","format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate","-of","json",str(file)],25)
    j=json.loads(txt); stream=next(x for x in j["streams"] if x.get("codec_type")=="video")
    return j,stream
def sha(file):
    h=hashlib.sha256()
    with file.open("rb") as f:
        for part in iter(lambda:f.read(1048576),b""):h.update(part)
    return h.hexdigest()
def frames(file,key,duration):
    pieces=[]
    for i,t in enumerate([min(.20,duration*.15),duration*.5,max(.3,duration-.3)]):
        frame=ROOT/(key+"_"+str(i)+".jpg")
        run(["ffmpeg","-hide_banner","-loglevel","error","-ss",str(round(t,3)),"-i",str(file),"-frames:v","1","-vf","scale=640:-2","-y",str(frame)],35)
        thumb=Image.open(frame).convert("RGB")
        thumb.thumbnail((620,354))
        tile=Image.new("RGB",(640,392),"#171717")
        tile.paste(thumb,((640-thumb.width)//2,10))
        ImageDraw.Draw(tile).text((16,370),f"{key}  t={t:.2f}s",fill="#ffffff")
        pieces.append(tile)
    canvas=Image.new("RGB",(640*3,392),"#171717")
    for j,p in enumerate(pieces):canvas.paste(p,(j*640,0))
    out=ROOT/(key+"_contact.jpg")
    canvas.save(out,quality=80)
    small=canvas.copy();small.thumbnail((1180,550))
    pix=ROOT/(key+"_contact_small.jpg");small.save(pix,quality=66)
    return out,pix
def utf8blob(img):
    token=os.environ.get("GITHUB_TOKEN")
    repo=os.environ.get("GITHUB_REPOSITORY")
    if not token or not repo:return None
    payload=json.dumps({"content":base64.b64encode(img.read_bytes()).decode("ascii"),"encoding":"utf-8"}).encode()
    req=urllib.request.Request("https://api.github.com/repos/"+repo+"/git/blobs",data=payload,headers={
        "Authorization":"Bearer "+token,"Accept":"application/vnd.github+json",
        "X-GitHub-Api-Version":"2022-11-28","Content-Type":"application/json"},method="POST")
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req,timeout=30) as r:return json.load(r)["sha"]
        except Exception as e:
            if attempt>=3:
                print("IMAGE_BLOB_FAILED "+str(e),flush=True)
                return None
            time.sleep(1.4*(attempt+1))
for role,root in origins.items():
    if not root.exists():
        print("ABSENT_DOWNLOAD "+role);continue
    expand(root)
    videos=[v for v in sorted(root.rglob("*")) if v.is_file() and v.suffix.lower() in [".mp4",".mov",".mkv",".webm"]]
    print("FOUND_VIDEOS "+role+" "+str(len(videos)),flush=True)
    for i,v in enumerate(videos):
        if i>=10:
            print("SKIP_REMAINDER",role,len(videos)-10);break
        key=role+"_"+str(i+1).zfill(2)+"_"+v.stem[:45]
        try:
            j,s=probe(v)
            dur=float(j["format"]["duration"])
            if dur<.55:raise ValueError("Too short for comparison")
            contact,small=frames(v,key,dur)
            blob=utf8blob(small)
            ent={"role":role,"file":str(v.relative_to(root)),"id":key,
                "width":s["width"],"height":s["height"],"codec":s["codec_name"],
                "fps":s.get("r_frame_rate"),"duration":dur,"sha256":sha(v),
                "contact":str(contact.relative_to(ROOT)),"inspection_blob":blob,
                "note":"Frame sequence only; human review required; rights provenance from original B/C/D reports"}
            report["sources"].append(ent)
            print("INSPECTABLE_CONTACT "+json.dumps(ent),flush=True)
        except Exception as e:
            print("INSPECTION_ERROR "+key+" "+str(e),flush=True)
report["video_contact_count"]=len(report["sources"])
(ROOT/"manifest.json").write_text(json.dumps(report,indent=2))
print("AUDIT_FINISHED "+str(len(report["sources"])),flush=True)
if len(report["sources"])<3:raise SystemExit("No usable source video from B/C/D")
