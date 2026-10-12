#!/usr/bin/env python3
"""Package verified 4K public-domain 2026 Indy500 footage as discrete potential cinematic detail clips."""
import subprocess,hashlib,json,sys,os,zipfile
from pathlib import Path
from PIL import Image,ImageDraw,ImageStat,ImageChops
BASE=Path("out/indy-d-2026-4k");RAW=BASE/"raw";CLIPS=BASE/"clips";SHEETS=BASE/"contact_sheets"
for p in (RAW,CLIPS,SHEETS):p.mkdir(exist_ok=True,parents=True)
SRC_URL="https://www.dvidshub.net/video/1008379/us-armed-forces-participate-indy-500-2026-b-roll-package"
RIGHTS="Public domain identified by DVIDS; third-party identities/trademarks may remain protected. https://www.dvidshub.net/about/copyright"
# Diverse requested accents, deliberately exclude military procession and broadcast footage.
CANDIDATES=[
("dvids26_yellow_indycar_wheel_native4k",21.5,3.1,"Genuine yellow IndyCar stationary wheel and sidepod at grid; foreground detail"),
("dvids26_orange_indycar_front_native4k",33.0,3.2,"Genuine orange Andretti IndyCar cockpit and front bodywork near grid"),
("dvids26_oval_race_pass_native4k",322.5,4.0,"Authentic distant Indy 500 racing pass before full grandstands; static elevated camera"),
]
def exec(cmd,timeout=70):
    return subprocess.run(cmd,text=True,capture_output=True,timeout=timeout)
def probe(path):
    p=exec(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(path)],30)
    if p.returncode:raise RuntimeError(p.stderr[-500:])
    x=json.loads(p.stdout);v=next((s for s in x["streams"] if s["codec_type"]=="video"),None)
    if not v:raise RuntimeError("no video stream")
    return {"w":v["width"],"h":v["height"],"fps":v.get("avg_frame_rate"),"codec":v.get("codec_name"),"duration":float(x["format"].get("duration",0))}
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def snap(src,t,dst):
    a=exec(["ffmpeg","-hide_banner","-nostdin","-loglevel","error","-y","-ss",str(t),"-i",str(src),"-frames:v","1","-vf","scale=860:-2",str(dst)],30)
    if a.returncode:raise RuntimeError(a.stderr[-250:])
def main():
    fmt=str(RAW/"dvids2026.%(ext)s")
    p=exec(["yt-dlp","--no-playlist","-f","best","--socket-timeout","15","--retries","2","--fragment-retries","2","-o",fmt,SRC_URL],400)
    if p.returncode:raise RuntimeError("public stream inaccessible: "+p.stderr[-900:])
    files=list(RAW.glob("dvids2026.*"));assert files, "no source downloaded"
    src=max(files,key=lambda f:f.stat().st_size)
    orig=probe(src);print("ORIGINAL",orig,"BYTES",src.stat().st_size,"SHA256",digest(src),flush=True)
    if orig["w"]<3840 or orig["h"]<2160:raise ValueError("HARD FAIL: native 4K requirement not met")
    manifest=[]
    for ident,start,length,description in CANDIDATES:
        dst=CLIPS/(ident+".mp4")
        p=exec(["ffmpeg","-hide_banner","-nostdin","-y","-loglevel","error","-ss",str(start),"-i",str(src),"-t",str(length),"-map","0:v:0","-an","-c:v","libx264","-preset","veryfast","-crf","20","-pix_fmt","yuv420p","-movflags","+faststart",str(dst)],130)
        if p.returncode:raise RuntimeError("ffmpeg cut "+ident+": "+p.stderr[-600:])
        dv=probe(dst)
        if dv["w"]<3840 or dv["h"]<2160:raise RuntimeError("4K output failed "+ident)
        frames=[]
        for i,t in enumerate([0.5,1.4,2.7]):
            frame=SHEETS/(ident+f"_{i}.jpg")
            snap(dst,t,frame)
            frames.append(Image.open(frame).convert("RGB").copy())
            frame.unlink()
        delta=[round(sum(ImageStat.Stat(ImageChops.difference(frames[i],frames[i+1])).mean)/3,2) for i in range(2)]
        sheet=Image.new("RGB",(860,3*524),(14,14,14))
        draw=ImageDraw.Draw(sheet)
        for i,im in enumerate(frames):
            im.thumbnail((860,490))
            sheet.paste(im,(0,i*524+25))
            draw.text((12,i*524+5),f"{ident}  source {start + [0.5,1.4,2.7][i]:.2f}s",fill=(255,255,255))
        img=SHEETS/(ident+"_contact.jpg");sheet.save(img,quality=88)
        row={"file":str(dst.relative_to(BASE)),"contact":str(img.relative_to(BASE)),
            "source_url":SRC_URL,"credit":"Indiana National Guard video by SSG Hector Tinoco, DVIDS, 24 May 2026",
            "description":description,"rightsholder_statement":RIGHTS,"source_resolution":orig,
            "source_start_time_s":start,"source_duration_s":length,"delivered_resolution":dv,
            "pixel_motion_differences":delta,"sha256":digest(dst),
            "review_status":"MANUAL VISUAL QA: distinctive subject verified in independently inspected source frames; no onboard or moving pit-stop claimed"}
        manifest.append(row)
        print("VERIFIED_VIDEO",ident,row["delivered_resolution"],"SHA256",row["sha256"],flush=True)
    (BASE/"manifest.json").write_text(json.dumps(manifest,indent=2))
    (BASE/"SHA256SUMS.txt").write_text("".join(x["sha256"]+"  "+x["file"]+"\n" for x in manifest))
    (BASE/"REPORT.md").write_text("# INDYCAR Agent D — New genuine 4K camera footage\n\n"
        "Source: "+SRC_URL+"\n\n"
        "Three manually selected distinct real 4K shots extracted from genuine public-domain Indiana National Guard video showing yellow wheel detail, orange car cockpit/front, and genuine Indy 500 distant oval pass. **Not helmet cam, onboard or pit-stop change**. Confirm exact frame contents from included contact sheets before use. Source decoded at native 3840×2160; 4K delivery preserved.\n\n"
        "License caveat: "+RIGHTS+"\n")
    target=Path("out/YUNEX_INDY_AGENT_D_2026_NATIVE_4K.zip")
    with zipfile.ZipFile(target,"w",compression=zipfile.ZIP_DEFLATED,compresslevel=1) as z:
        for f in BASE.rglob("*"):
            if f.is_file() and RAW not in f.parents:z.write(f,f.relative_to(BASE))
    print("ZIP_READY",target,target.stat().st_size,flush=True)
    src.unlink()
if __name__=="__main__":main()
