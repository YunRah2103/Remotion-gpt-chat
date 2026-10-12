#!/usr/bin/env python3
"""Verified *Turbo* film transition-match selections from decoded source media."""
import json,hashlib,subprocess,time
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageChops, ImageStat
SRC=Path("out/agent-a-sources/raw")
OUT=Path("out/agent-a-selected")
VIDEOS=OUT/"clips"; SHEETS=OUT/"qa"
for p in (OUT,VIDEOS,SHEETS):p.mkdir(parents=True,exist_ok=True)
SELECTIONS=[
  ("A01_blue_lane_low_follow","broken_shell",8.65,3.05,"Rear three-quarter low-view of IndyCar next to wall, Turbo's blue lane; match rear-facing real low track-level view", "rear-follow / low", "check left-right direction from contact"),
  ("A02_indycar_pack_corner","broken_shell",77.46,1.47,"Animated open-wheel pack in speedway corner; real banked wide-side pack match", "wide side / pack", "match track curvature and direction"),
  ("A03_hero_glow_car_passing","pit_stop_pep_talk",93.52,2.6,"Turbo moving alongside IndyCar tire and blue glow; match underwheel real camera", "track-level / tire", "match open wheel passage"),
  ("A04_lap_108_blue_streak","pit_stop_pep_talk",126.88,1.65,"Turbo's clean lateral blue glowing speed trail on Indianapolis oval; match side-panning IndyCar", "side tracking / blue trail", "match motion direction"),
  ("A05_glow_low_car_rear","pit_stop_pep_talk",166.7,4.0,"Ultra-low car-side Turbo glow and speed-blur past tire; match real tire-level Indy", "low follow / blue", "match color and speed"),
  ("A06_blue_orbit_launch","your_driver_is_snail",75.02,2.75,"Turbo launch at Indy Speedway with dramatic blue trail and track/horizon; potential blue-streak transition", "track-level / rapid pullaway", "likely rapid travelling shot")]
def call(cmd,timeout=90):
    p=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=timeout)
    if p.returncode:raise RuntimeError("command failed: "+p.stderr[-700:])
    return p.stdout
def info(p):
    d=json.loads(call(["ffprobe","-v","error","-show_entries","format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate","-of","json",str(p)],20))
    return d,next(x for x in d["streams"] if x.get("codec_type")=="video")
def digest(p):
    h=hashlib.sha256()
    with p.open("rb") as f:
        for c in iter(lambda:f.read(1048576),b""):h.update(c)
    return h.hexdigest()
manifest={"project":"YUNEX Turbo -> IndyCar 001","agent":"A (film footage ONLY)","status":"VERIFYING","film":"Turbo (2013) / DreamWorks","rights":"Restricted copyrighted film excerpts. Source accessibility is not reuse licence; publishing requires appropriate permission and platform policy assessment.","source_run":38270483310,"source_artifact":11756901264,"selections":[],"started_utc":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime())}
allframes=[]
for id_,source,start,duration,reason,angle,match in SELECTIONS:
    src=SRC/(source+".mp4")
    assert src.is_file(),str(src)
    si,sv=info(src)
    assert float(si["format"]["duration"])>=start+duration,(source,start)
    dst=VIDEOS/(id_+".mp4")
    call(["ffmpeg","-hide_banner","-loglevel","error","-ss",str(start),"-i",str(src),"-t",str(duration),"-map","0:v:0","-an","-c:v","libx264","-preset","faster","-crf","17","-pix_fmt","yuv420p","-movflags","+faststart","-y",str(dst)],150)
    di,dv=info(dst)
    frame_images=[]
    for i in range(9):
        t=round(.15+(float(di["format"]["duration"])-.3)*i/8,3)
        f=SHEETS/(id_+"_f"+str(i).zfill(2)+".jpg")
        call(["ffmpeg","-hide_banner","-loglevel","error","-ss",str(t),"-i",str(dst),"-frames:v","1","-vf","scale=320:-2","-q:v","3","-y",str(f)],25)
        frame_images.append((f,t))
    thumbs=[]
    for fp,t in frame_images:
        im=Image.open(fp).convert("RGB")
        thumb=Image.new("RGB",(320,218),"#111111")
        im.thumbnail((320,190))
        thumb.paste(im,((320-im.width)//2,6))
        label=ImageDraw.Draw(thumb)
        label.text((8,193),f"clip {t:.2f}s   source {start+t:.2f}s",fill="white")
        thumbs.append(thumb)
    canvas=Image.new("RGB",(960,654),"#111111")
    for k,im in enumerate(thumbs):canvas.paste(im,((k%3)*320,(k//3)*218))
    sheet=SHEETS/(id_+"_contact.jpg")
    canvas.save(sheet,quality=83)
    left=Image.open(frame_images[0][0]).convert("RGB").resize((160,90))
    right=Image.open(frame_images[-1][0]).convert("RGB").resize((160,90))
    motion=round(sum(ImageStat.Stat(ImageChops.difference(left,right)).mean)/3,2)
    assert motion>1,"This may be near-static: "+id_
    assert dv["width"]==sv["width"] and dv["height"]==sv["height"],"Source geometry changed"
    item={"id":id_,"file":str(dst.relative_to(OUT)),"source_id":source,"source_url":{"broken_shell":"https://www.rottentomatoes.com/m/turbo_2013/videos/eimOrKrYvaNw","pit_stop_pep_talk":"https://www.rottentomatoes.com/m/turbo_2013/videos/bOZEc_WT1ZEW","your_driver_is_snail":"https://www.rottentomatoes.com/m/turbo_2013/videos/o7k_jrJyj4lw"}[source],"source_timecode_in":start,"source_timecode_out":round(start+duration,3),"duration":round(float(di["format"]["duration"]),3),"width":dv["width"],"height":dv["height"],"codec":dv["codec_name"],"fps":dv["r_frame_rate"],"sha256":digest(dst),"size_bytes":dst.stat().st_size,"contact_sheet":str(sheet.relative_to(OUT)),"mean_frame_difference_metric":motion,"visual_justification":reason,"camera":angle,"matching_note":match,"rights_warning":"Clip is copyrighted 2013 film footage; editorial rights not cleared.","source_native_full_hd_geometry":bool(sv["width"]>=1920 and sv["height"]>=1080),"visual_final_approval":"needs per-shot frame sequence review"}
    manifest["selections"].append(item)
    print("VERIFIED_CLIP "+json.dumps(item),flush=True)
manifest["status"]="SIX_REAL_PLAYABLE_CLIPS_QA_CONTACTS_GENERATED"
manifest["summary"]={"clip_count":len(manifest["selections"]),"full_hd_geometry_clips":sum(x["source_native_full_hd_geometry"] for x in manifest["selections"]),"remaining_720p_clips":sum(not x["source_native_full_hd_geometry"] for x in manifest["selections"])}
(OUT/"manifest.json").write_text(json.dumps(manifest,indent=2))
(OUT/"README.md").write_text("# YUNEX Turbo Agent A - Six focused moving clips\n\nSix original-film extracts, selected after viewing 9 decoded frames per candidate and surgically trimmed to exclude commentator and pit crew cutaways. Not frame loops or mockups. FFprobe, frame-difference verification, exact source timecodes and SHA256 in manifest.json. Nine decoded frames per cut, with per-clip contact JPEG. 1080p geometry is preserved only for A01/A02, while other clips remain native-source 720p. These are selected match candidates, still require final per-shot motion direction alignment to Agent B footage. Copyright remains restricted; not a reuse licence.\n")
print("FINAL_SUMMARY "+json.dumps(manifest["summary"]),flush=True)
