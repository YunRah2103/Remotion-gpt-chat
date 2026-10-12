#!/usr/bin/env python3
"""Create REAL-CAMERA French two-model editor package from verified GitHub Actions ZIPs."""
from pathlib import Path
import hashlib,json,zipfile,subprocess

ROOT=Path("out")
R5=ROOT/"incoming_r5"/"CYBER-FUTURE-001-C-FRANCE-EDITOR-SELECTS.zip"
OLI=ROOT/"incoming_oli"/"CYBER-C-CITROEN-OLI-QA.zip"
WORK=ROOT/"cyber_c_two_models"
OUT=ROOT/"CYBER-FUTURE-001-C-TWO-REAL-MODELS.zip"
SHA_R5="edf970e4b3b6d407b4e84e85cc130ddf3c8b16aee8166da90735a57c6299f6f5"
SHA_OLI="c72787a882b239b6967db7d6ec2f1596cffffd103a8a2ce71205c7db1dd68627"
# Manually inspected scenes of the real Oli driving/being used outdoors; avoid CGI/infographic elsewhere in ad.
PICKS=[
 ("O01","forest exterior side",55.15,56.05,"support","stationary"),
 ("O02","rear bed outdoor family",60.90,61.48,"support","stationary"),
 ("O03","underground garage real car in motion",61.65,62.42,"support","moving"),
 ("O04","real charge port",150.53,151.47,"detail","stationary"),
 ("O06","city corner rear rolling",156.31,157.27,"hero","moving"),
 ("O07","close street side pass",158.28,159.02,"hero","moving"),
 ("O08","street three-quarter rear following",159.06,159.91,"hero","moving"),
 ("O09","overhead crossing car in motion",160.00,160.81,"hero","moving"),
]
def sha(b):return hashlib.sha256(b).hexdigest()
def store(name,blob):
    out=WORK/name;out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(blob)
    return out
def execute(args,timeout=90):
    p=subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=timeout)
    if p.returncode:raise RuntimeError(" ".join(args[:4])+": "+p.stderr[-320:])
    return p.stdout
def metadata(path):
    j=json.loads(execute(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(path)],30))
    v=next(x for x in j["streams"] if x["codec_type"]=="video")
    return int(v["width"]),int(v["height"]),v.get("avg_frame_rate"),float(j["format"]["duration"])
def decode(path,seconds=85):
    execute(["ffmpeg","-nostdin","-v","error","-xerror","-i",str(path),"-map","0:v:0","-f","null","-"],seconds)
def main():
    assert R5.exists() and OLI.exists(), "input GitHub artifact zip missing"
    WORK.mkdir(parents=True,exist_ok=True)
    rows=[]
    with zipfile.ZipFile(R5) as first,zipfile.ZipFile(OLI) as second:
        assert first.testzip() is None and second.testzip() is None
        r5_source=first.read("originals/renault_r5_turbo_3e_2025_corsica_original.mp4")
        assert sha(r5_source)==SHA_R5
        store("originals/Renault_R5_Turbo_3E_Corsica_2025_original.mp4",r5_source)
        for src in json.loads(first.read("manifest.json")):
            original_name=src["file"]
            data=first.read(original_name)
            assert sha(data)==src.get("clip_sha256",src.get("sha256")),original_name
            name="clips/Renault_2025/"+Path(original_name).name
            f=store(name,data)
            assert metadata(f)[:2]==(1920,1080)
            decode(f,35)
            contact=[]
            for pic in src.get("frames",src.get("contact_frames",[])):
                store(pic,first.read(pic));contact.append(pic)
            rows.append({
                "file":name,"vehicle":"Renault 5 Turbo 3E (2025)","resolution":[1920,1080],
                "source_url":"https://www.auto-medienportal.net/video/load/original/3469/",
                "original_sha256":SHA_R5,"sha256":sha(data),"original_in":src["source_in"],
                "original_out":src["source_out"],"camera":"genuine photographed physical 2025 prototype on Corsica roads",
                "tier":src.get("editor_tier","support"),"contacts":contact,"embedded_promotional_text":False,
                "publishing_rights":"NOT VERIFIED"})
        oli_data=second.read("CITROEN_OLI_PERFORMANCE_SOURCE_ORIGINAL.mp4")
        assert sha(oli_data)==SHA_OLI
        oli_file=store("originals/Citroen_Oli_2022_complete_original_ad.mp4",oli_data)
        assert metadata(oli_file)[:2]==(1920,1080)
        decode(oli_file,180)
        for ident,label,t0,t1,tier,motion in PICKS:
            name=f"clips/Citroen_Oli_2022/{ident}.mp4"
            target=WORK/name;target.parent.mkdir(parents=True,exist_ok=True)
            execute(["ffmpeg","-nostdin","-v","error","-ss",str(t0),"-i",str(oli_file),
                "-t",str(t1-t0),"-map","0:v:0","-an","-c:v","libx264","-preset","veryfast",
                "-crf","18","-pix_fmt","yuv420p","-movflags","+faststart","-y",str(target)],80)
            assert metadata(target)[:2]==(1920,1080)
            decode(target,35)
            contact=[]
            for n,part in enumerate((.1,.5,.9),1):
                pic=f"contact_frames/Citroen_Oli_2022/{ident}_frame{n}.jpg"
                f=WORK/pic;f.parent.mkdir(parents=True,exist_ok=True)
                execute(["ffmpeg","-nostdin","-v","error","-ss",str((t1-t0)*part),
                    "-i",str(target),"-frames:v","1","-vf","scale=640:-2","-y",str(f)],30)
                contact.append(pic)
            rows.append({
                "file":name,"vehicle":"Citroen Oli all-e (2022)","resolution":[1920,1080],
                "source_url":"https://video.wixstatic.com/video/3d5fff_d419211a2f0e45398d5375cdfa5c571b/1080p/mp4/file.mp4",
                "original_sha256":SHA_OLI,"sha256":sha(target.read_bytes()),"original_in":t0,
                "original_out":t1,"camera":"real photographed physical Oli outdoors/garage, not 3D animation",
                "tier":tier,"motion":motion,"description":label,"contacts":contact,
                "embedded_promotional_text":True,"publishing_rights":"NOT VERIFIED"})
    quality={
      "status":"TWO_PHYSICAL_VEHICLE_CAMERA_FOOTAGE_MILESTONE_MET; publication rights remain NOT CLEARED",
      "camera_shots":len(rows),"renault_camera_shots":len(rows)-len(PICKS),"citroen_camera_shots":len(PICKS),
      "source_models":["Renault 5 Turbo 3E 2025","Citroen Oli 2022"],"original_source_videos":2,
      "clips_native_resolution":"1920x1080, verified FFprobe and full FFmpeg decoding, no upscaling",
      "important":"Citroen Oli original contains commercial burned-in typography; selected real camera shots retain this text. This is a visual quality limitation, not CGI. None of the pure CGI/graphics scenes selected.",
      "rights":"Public videos are not necessarily licensed for social-media remixing; obtain legal usage permission."
    }
    store("manifest.json",json.dumps(rows,indent=2).encode())
    store("QA_REPORT.json",json.dumps(quality,indent=2).encode())
    store("README_START_HERE.md",(
      "# YUNEX CYBER//FUTURE — Agent C French Camera Footage\n\n"
      +f"{len(rows)} verified camera clips across TWO real French prototype/concept models. "
      +"Both original film masters, every selected MP4, contact JPEGs, timestamps, exact SHA-256, and FFmpeg QA included.\n\n"
      +"**CITROËN LIMITATION:** These are real street/garage shots from an ad, with baked-on promotional text. "
      +"They are not clean B-roll; don't confuse them with the CGI/infographics excluded from this collection.\n\n"
      +"**RIGHTS:** Media hosting/press distribution does not automatically grant edited publication rights. "
      +"Get permission before publishing derivatives.\n"
      ).encode())
    with zipfile.ZipFile(OUT,"w",zipfile.ZIP_STORED,allowZip64=True) as z:
        for f in sorted(WORK.rglob("*")):
            if f.is_file():z.write(f,f.relative_to(WORK))
    with zipfile.ZipFile(OUT) as z:assert z.testzip() is None
    print("DELIVERY",json.dumps(quality),flush=True)
    print("ZIP",OUT,OUT.stat().st_size,"SHA256",sha(OUT.read_bytes()),flush=True)
if __name__=="__main__":main()
