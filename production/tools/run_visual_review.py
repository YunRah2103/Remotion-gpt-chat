#!/usr/bin/env python3
"""Run source-aware native stills and moving video previews for PR reviews."""
import argparse,json,os,subprocess,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from visual_regression import check
def run(plan_file):
    plan=json.loads(Path(plan_file).read_text())
    summaries=[]
    for item in plan["targets"]:
        comp=item["composition"]
        for revision in (["candidate","baseline"] if item["baselineExists"] else ["candidate"]):
            directory=Path("out")/revision/comp
            directory.mkdir(parents=True,exist_ok=True)
            for frame in item["frames"]:
                dest=Path("../out")/revision/comp/("frame-%04d.png"%frame)
                subprocess.run(["npx","--no-install","remotion","still","src/index.ts",
                                comp,str(dest),"--frame="+str(frame),"--scale=0.25",
                                "--gl=swangle"],cwd=revision,check=True,timeout=180)
            movie=Path("../out")/revision/comp/"moving.mp4"
            subprocess.run(["npx","--no-install","remotion","render","src/index.ts",
                            comp,str(movie),"--frames=%d-%d"%(item["movieStart"],item["movieEnd"]),
                            "--scale=0.25","--gl=swangle","--codec=h264",
                            "--pixel-format=yuv420p","--concurrency=1"],
                           cwd=revision,check=True,timeout=360)
            subprocess.run(["ffmpeg","-v","error","-xerror","-i",str(directory/"moving.mp4"),
                            "-f","null","-"],check=True,capture_output=True,timeout=120)
        if item["baselineExists"]:
            report=check(Path("out")/"baseline"/comp,Path("out")/"candidate"/comp,Path("out")/"review"/comp)
            summaries.append(comp+": "+str(report["tested"])+" matched stills and two short native clips")
        else:summaries.append(comp+": candidate-only stills and native moving clip")
    Path("out/review-summary.md").write_text("## Native composition visual evidence\n\n"+
                      "\n".join("- "+x for x in summaries)+
                      "\n\nTechnical render pass is not artistic or engineering approval.\n")
    if "GITHUB_STEP_SUMMARY" in os.environ:
        with open(os.environ["GITHUB_STEP_SUMMARY"],"a") as f:f.write(Path("out/review-summary.md").read_text())
    return summaries
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("plan");args=p.parse_args()
    print(json.dumps(run(args.plan),indent=2))
