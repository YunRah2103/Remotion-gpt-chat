#!/usr/bin/env python3
"""Compare ACTUAL rendered Polish02/Polish03 Blender PNGs (never synthesize).
Conservative image statistics flag exposure/clipping; image aesthetic still
requires independent full-resolution human/vision inspection.
"""
import argparse,json
from pathlib import Path
from PIL import Image,ImageDraw,ImageStat
NAMES=("rotor-front","ventilation","exploded","pad-contact")

def numbers(p):
    with Image.open(p) as source:
        im=source.convert("RGB")
    assert im.size[0]>=900 and im.size[1]>=900, (p,im.size)
    pixels=list(im.getdata())
    n=len(pixels)
    bright=sum(max(px)>=245 for px in pixels)/n
    black=sum(max(px)<=12 for px in pixels)/n
    mid=sum(40<=max(px)<=210 for px in pixels)/n
    avg=sum((r+g+b)/3 for r,g,b in pixels)/n
    return dict(width=im.width,height=im.height,
                nearWhiteFraction=round(bright,5),
                nearBlackFraction=round(black,5),
                midtoneFraction=round(mid,5),
                meanLuma=round(avg,2))
def main():
    pa=argparse.ArgumentParser()
    pa.add_argument("--before",type=Path,required=True)
    pa.add_argument("--after",type=Path,required=True)
    pa.add_argument("--out",type=Path,required=True)
    a=pa.parse_args()
    a.out.mkdir(parents=True,exist_ok=True)
    result={"source":"Two sets of real Cycles PNGs; raw pixels unmodified",
            "before":{},"after":{},"comparison":{}}
    card=Image.new("RGB",(940,4*505+45),"#111821")
    paint=ImageDraw.Draw(card)
    paint.text((24,12),"POLISH 02  / OVEREXPOSED",fill="#c7d6e2")
    paint.text((490,12),"POLISH 03 / COLOR-CORRECTED",fill="#c7d6e2")
    for i,name in enumerate(NAMES):
        old=a.before/(name+".png");new=a.after/(name+".png")
        stats0=numbers(old);stats1=numbers(new)
        result["before"][name]=stats0;result["after"][name]=stats1
        result["comparison"][name]={
            "nearWhiteReduction":round(stats0["nearWhiteFraction"]-stats1["nearWhiteFraction"],5),
            "lumaReduction":round(stats0["meanLuma"]-stats1["meanLuma"],2)}
        for j,path in enumerate((old,new)):
            with Image.open(path) as im:
                thumb=im.convert("RGB").resize((450,450),Image.Resampling.LANCZOS)
            card.paste(thumb,(15+j*470,45+i*505))
        paint.text((15,495+i*505),name,fill="white")
        paint.text((485,495+i*505),"Polish 03 / Blender Cycles",fill="white")
    card.save(a.out/"polish02-vs-polish03-contact-sheet.png",optimize=True)
    (a.out/"lookdev-comparison.json").write_text(json.dumps(result,indent=2)+"\n")
    print("REAL_IMAGE_COMPARISON",json.dumps(result["comparison"],indent=2))
    # A signal for clipping correction, NOT a replacement for visual QA.
    for name in ("rotor-front","pad-contact"):
        before=result["before"][name]["nearWhiteFraction"]
        after=result["after"][name]["nearWhiteFraction"]
        if not after < before*0.50:
            raise AssertionError(f"{name}: overexposed highlights not reduced by >=50%: {before} vs {after}")
    print("EXPOSURE_IMAGE_METRICS_PASS -- human image inspection still required")
if __name__=="__main__":
    main()
