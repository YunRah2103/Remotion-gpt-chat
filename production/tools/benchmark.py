#!/usr/bin/env python3
"""Measure bounded software-WebGL Remotion renders, frame integrity and process peak RSS."""
import argparse,json,re,statistics,subprocess,time
from pathlib import Path

def job_plan(comp,frames,scale,levels,rounds):
    if not re.fullmatch(r'[A-Za-z][A-Za-z0-9_-]{0,80}',comp):raise ValueError("Invalid composition")
    if not 2<=frames<=90 or not .1<=scale<=.6 or not 1<=rounds<=2:raise ValueError("Benchmark bounds exceeded")
    values=[int(v) for v in levels.split(",")]
    if not values or len(values)!=len(set(values)) or any(v not in (1,2,3) for v in values):
        raise ValueError("Concurrency choices must be unique values in 1,2,3")
    return [{"concurrency":c,"trial":i+1,"frames":frames,"scale":scale,"composition":comp}
            for c in values for i in range(rounds)]

def measure(comp,frames,scale,levels,rounds,destination,dry_run=False):
    out=Path(destination);out.mkdir(parents=True,exist_ok=True)
    plan=job_plan(comp,frames,scale,levels,rounds)
    if dry_run:
        result={"dryRun":True,"plan":plan,"warning":"This is only the benchmark plan, no performance measured"}
    else:
        actual=[]
        for job in plan:
            target=out/("c%d-t%d.mp4"%(job["concurrency"],job["trial"]))
            timing=out/("c%d-t%d.time"%(job["concurrency"],job["trial"]))
            cmd=["/usr/bin/time","-f","%M","-o",str(timing),
                 "npx","--no-install","remotion","render","src/index.ts",comp,str(target),
                 "--frames=0-%d"%(frames-1),"--scale="+str(scale),"--gl=swangle",
                 "--codec=h264","--pixel-format=yuv420p","--concurrency="+str(job["concurrency"])]
            start=time.perf_counter()
            subprocess.run(cmd,check=True,timeout=900)
            elapsed=time.perf_counter()-start
            info=json.loads(subprocess.run(["ffprobe","-v","error","-select_streams","v:0",
                  "-show_entries","stream=nb_frames,width,height","-of","json",str(target)],
                  check=True,capture_output=True,text=True).stdout)["streams"][0]
            if int(info["nb_frames"])!=frames:raise ValueError("Rendered frame count mismatch")
            subprocess.run(["ffmpeg","-v","error","-xerror","-i",str(target),"-f","null","-"],
                            check=True,capture_output=True,timeout=90)
            actual.append({**job,"wallSeconds":round(elapsed,3),
                           "peakRssKilobytes":int(timing.read_text().strip()),
                           "resolution":[int(info["width"]),int(info["height"])]})
        summary=[{"concurrency":c,
                  "medianWallSeconds":round(statistics.median(row["wallSeconds"] for row in actual if row["concurrency"]==c),3),
                  "peakRssKilobytes":max(row["peakRssKilobytes"] for row in actual if row["concurrency"]==c)}
                 for c in sorted(set(x["concurrency"] for x in actual))]
        result={"dryRun":False,"composition":comp,"frames":frames,
                "runs":actual,"comparison":summary,
                "warning":"Benchmark is machine/scene-specific and does not provision a GPU."}
    (out/"benchmark.json").write_text(json.dumps(result,indent=2)+"\n")
    return result

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--composition",default="GpuDriveFilm")
    p.add_argument("--frames",type=int,default=12)
    p.add_argument("--scale",type=float,default=.25)
    p.add_argument("--levels",default="1,2,3")
    p.add_argument("--rounds",type=int,default=1)
    p.add_argument("--output",default="out/benchmark")
    p.add_argument("--dry-run",action="store_true")
    x=p.parse_args()
    print(json.dumps(measure(x.composition,x.frames,x.scale,x.levels,x.rounds,x.output,x.dry_run),indent=2))
