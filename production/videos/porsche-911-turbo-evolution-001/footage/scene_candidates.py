#!/usr/bin/env python3
"""Find candidate source scene changes. Suggestions ONLY, never identity or uniqueness QA."""
import argparse,json,re,subprocess
from pathlib import Path

def run(*args,timeout=300):
    return subprocess.run(args,capture_output=True,text=True,timeout=timeout,check=True)

def find_cuts(video, threshold):
    p=run("ffmpeg","-hide_banner","-nostats","-i",str(video),"-an","-vf",
        f"scale=384:-2,select='gt(scene,{threshold})',showinfo","-f","null","-",timeout=600)
    times=[]
    for s in re.finditer(r"pts_time:([0-9.]+)",p.stderr):
        v=float(s.group(1))
        if (not times or v-times[-1]>.28):times.append(round(v,3))
    return times

def get_video_length(path):
    return float(run("ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",str(path)).stdout.strip())

def candidates(cuts,length):
    marks=[0.0]+[x for x in cuts if 0<x<length]+[length]
    shots=[]
    for i,(a,b) in enumerate(zip(marks,marks[1:]),1):
        if b-a<.50:continue
        center=(a+b)/2
        shots.append({"candidateId":f"scene-{i:03d}","startSeconds":round(a,3),
                      "endSeconds":round(b,3),"durationSeconds":round(b-a,3),
                      "previewSeconds":round(center,3),
                      "eligibleForSingleBeatLength":b-a>=.65,
                      "motionVerified":False,"TurboGenerationIdentified":None,
                      "uniqueCameraSetupVerified":False})
    return shots

def make_sheet(source,shots,out):
    from PIL import Image,ImageDraw
    page_size=48
    for offset in range(0,len(shots),page_size):
        subset=shots[offset:offset+page_size]
        canvas=Image.new("RGB",(480*6,298*8),"#101010");draw=ImageDraw.Draw(canvas)
        for i,shot in enumerate(subset):
            x=(i%6)*480;y=(i//6)*298
            p=run("ffmpeg","-hide_banner","-loglevel","error","-ss",str(shot["previewSeconds"]),
                "-i",str(source),"-frames:v","1","-vf",
                "scale=480:270:force_original_aspect_ratio=decrease,pad=480:270:(ow-iw)/2:(oh-ih)/2",
                "-f","image2pipe","-c:v","mjpeg","-",timeout=90)
            # subprocess text=True is unsuitable for binary; use dedicated capture below
            _ = p
        canvas.save(out/f"scene-contact-page-{offset//page_size+1:02d}.jpg",quality=93,subsampling=0)

def render_sheet(source,shots,out):
    from io import BytesIO
    from PIL import Image,ImageDraw
    out.mkdir(parents=True,exist_ok=True)
    for offset in range(0,len(shots),48):
        subset=shots[offset:offset+48]
        canvas=Image.new("RGB",(480*6,298*8),"#101010");draw=ImageDraw.Draw(canvas)
        for i,shot in enumerate(subset):
            x=(i%6)*480;y=(i//6)*298
            cmd=["ffmpeg","-hide_banner","-loglevel","error","-ss",str(shot["previewSeconds"]),
                "-i",str(source),"-frames:v","1","-vf",
                "scale=480:270:force_original_aspect_ratio=decrease,pad=480:270:(ow-iw)/2:(oh-ih)/2",
                "-f","image2pipe","-c:v","mjpeg","-"]
            data=subprocess.run(cmd,capture_output=True,timeout=90,check=True).stdout
            with Image.open(BytesIO(data)) as img:
                canvas.paste(img.convert("RGB"),(x,y))
            draw.text((x+8,y+276),f"{shot['candidateId']}  {shot['startSeconds']:.2f}s - {shot['endSeconds']:.2f}s",fill="white")
        canvas.save(out/f"scene-contact-page-{offset//48+1:02d}.jpg",quality=92,subsampling=0)

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--input",type=Path,required=True)
    p.add_argument("--out",type=Path,required=True)
    p.add_argument("--threshold",type=float,default=.23)
    a=p.parse_args()
    if not 0.05<=a.threshold<=0.95:p.error("threshold must be 0.05..0.95")
    length=get_video_length(a.input);cuts=find_cuts(a.input,a.threshold)
    shots=candidates(cuts,length);a.out.mkdir(parents=True,exist_ok=True)
    render_sheet(a.input,shots,a.out)
    report={"schemaVersion":1,"status":"AUTOMATED_CANDIDATES_NOT_VERIFIED","source":a.input.name,
        "durationSeconds":length,"threshold":a.threshold,"rawSceneCuts":len(cuts),
        "candidateScenesLongEnoughForPreview":len(shots),
        "eligibleBeatIntervals":sum(s["eligibleForSingleBeatLength"] for s in shots),
        "identityVerified":False,"distinctCameraSetupsVerified":False,
        "note":"Pixel-scene-score cuts are not moving-Porsche proof or genuine distinct angle; contact sheets require human visual review and specification/chassis confirmation.",
        "scenes":shots}
    (a.out/"candidate-scenes.json").write_text(json.dumps(report,indent=2)+"\n")
    print(json.dumps({k:report[k] for k in ("status","rawSceneCuts","candidateScenesLongEnoughForPreview","eligibleBeatIntervals")},indent=2))
if __name__=="__main__":main()
