#!/usr/bin/env python3
"""Deterministic screenshot differences; flags changes, never assigns aesthetic scores."""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageChops, ImageStat
from quality import compare

def check(baseline,candidate,out,max_mean=None,change_threshold=18):
    baseline=Path(baseline);candidate=Path(candidate);out=Path(out);out.mkdir(parents=True,exist_ok=True)
    # Artifacts may store proof images under nested 'stills/' subdirectories.
    before={str(p.relative_to(baseline)):p for p in baseline.rglob("*.png")}
    after={str(p.relative_to(candidate)):p for p in candidate.rglob("*.png")}
    names=sorted(set(before) & set(after))
    if not names: raise ValueError("No matching relative .png paths across folders")
    scores=[]
    for name in names:
        short=name.replace("/", "__").replace("\\\\","__")
        with Image.open(before[name]) as a, Image.open(after[name]) as b:
            if a.size!=b.size:raise ValueError(f"Different image sizes: {name}")
            aa=a.convert("RGB");bb=b.convert("RGB")
            diff=ImageChops.difference(aa,bb)
            mean=sum(ImageStat.Stat(diff).mean)/3
            binary=diff.convert("L").point(lambda n: 255 if n>change_threshold else 0)
            changed=binary.histogram()[255]/(a.width*a.height)
            heat=diff.point(lambda x: min(255,x*4))
            heat.save(out/("diff-"+short))
        compare(before[name],after[name],out/("compare-"+short))
        scores.append({"frame":name,"meanAbsolutePixelChange":round(mean,3),
                       "fractionNoticeablyChanged":round(changed,5),
                       "passesNumericThreshold":max_mean is None or mean<=max_mean})
    summary={"tested":len(scores),"threshold":max_mean,"passes":all(x["passesNumericThreshold"] for x in scores),
             "results":scores,
             "warning":"Numeric pixel change is NOT a creative quality score. Intentional new shots require human review."}
    (out/"visual-report.json").write_text(json.dumps(summary,indent=2)+"\n")
    if not summary["passes"]:raise ValueError("Visual regression threshold failed; inspect diff and compare PNGs")
    return summary

if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("baseline");p.add_argument("candidate");p.add_argument("output")
    p.add_argument("--max-mean",type=float);p.add_argument("--change-threshold",type=int,default=18)
    args=p.parse_args()
    print(json.dumps(check(args.baseline,args.candidate,args.output,args.max_mean,args.change_threshold),indent=2))
