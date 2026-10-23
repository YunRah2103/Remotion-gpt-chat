#!/usr/bin/env python3
"""Choose actual Remotion compositions affected by files changed in a pull request."""
import argparse,json,re
from pathlib import Path

def registry(root):
    source=(Path(root)/"src/Root.tsx").read_text()
    found={}
    for tag in re.findall(r'<Composition\b[^>]+/>',source,re.S):
        name=re.search(r'\bid="([^"]+)"',tag)
        frames=re.search(r'\bdurationInFrames=\{(\d+)\}',tag)
        if name and frames:found[name.group(1)]=int(frames.group(1))
    return found

def plan(base,candidate,changed):
    a=registry(base);b=registry(candidate);paths=set(changed);selected=set()
    # A modelling-kit integration changes only separate studio implementations and opt-in
    # root registrations. Rendering unrelated legacy films may require private media not
    # distributed with the repository; the dedicated kit workflow renders the V4 car.
    kit_source=("src/yunex/modelling-kit/","src/yunex/world-kit/","src/yunex/parts-kit/","src/yunex/studio-projects/")
    kit_other=("scripts/modelling-kit/","scripts/world-kit/","scripts/parts-kit/",
               "tests/modelling-kit/","tests/world-kit/","tests/parts-kit/",
               "docs/modelling-kit/","docs/world-kit/","docs/parts-kit/",
               "docs/YUNEX_V3_","docs/YUNEX_V4_")
    kit_files={"src/Root.tsx","package.json","tsconfig.json",
               "production/tools/visual_plan.py",
               "docs/YUNEX_AGENT_STUDIO.md","docs/YUNEX_MAIN_STUDIO_QUICKSTART.md"}
    kit_workflows={".github/workflows/"+n for n in (
        "yunex-modelling-kit-v2.yml","yunex-parts-kit.yml","yunex-studio-overhaul.yml",
        "yunex-studio-v3.yml","yunex-v4-studio.yml","yunex-vehicle-quality.yml",
        "yunex-world-kit.yml","yunex-kit-main-integration.yml")}
    def studio_path(p):
        return p in kit_files or p in kit_workflows or p.startswith(kit_source+kit_other)
    studio_only=(bool(paths) and a==b and "StudioMaterialProof" in b
                 and any(p.startswith(kit_source) for p in paths)
                 and all(studio_path(p) for p in paths))
    def add(name):
        if name in b:selected.add(name)
    if any(p.startswith("src/GpuDriveFilm") for p in paths):add("GpuDriveFilm")
    if any(p.startswith(("src/TurboDocumentary","src/turbo/")) for p in paths):add("TurboDocumentary")
    if "src/ProductionCaptions.tsx" in paths:
        selected.update(k for k in b if k.endswith("Captioned"))
    if studio_only:add("StudioMaterialProof")
    if not studio_only and any(p in {"src/Root.tsx","package.json","package-lock.json"} or p.startswith("src/mechanics/") for p in paths):
        selected.update(b.keys())
    for p in paths:
        m=re.fullmatch(r"production/videos/([^/]+)/.*",p)
        if m:
            brief=Path(candidate)/"production/videos"/m.group(1)/"brief.json"
            if brief.is_file():
                name=json.loads(brief.read_text()).get("sourceCompositionId")
                if name in b:add(name)
    if not selected:add("GpuDriveFilm") # generic code changes still get a native smoke comparison
    if not selected:raise ValueError("No registered Remotion compositions")
    output=[]
    for comp in sorted(selected):
        n=b[comp]
        if n<1:raise ValueError("Invalid composition duration")
        frames=sorted(set(min(n-1,round(n*f)) for f in (0,.25,.5,.85)))
        middle=min(n-1,round(n*.4))
        output.append({"composition":comp,"duration":n,"frames":frames,
                       "baselineExists":comp in a and a[comp]==n,
                       "movieStart":middle,"movieEnd":min(n-1,middle+7)})
    return {"selection":"source-aware","targets":output,"changedFiles":sorted(paths),
            "warning":"Rendered pixels and motion are evidence, not a quality verdict."}

if __name__=="__main__":
    p=argparse.ArgumentParser()
    for k in ("baseline","candidate","changed","out"):p.add_argument("--"+k,required=True)
    x=p.parse_args()
    result=plan(x.baseline,x.candidate,Path(x.changed).read_text().splitlines())
    out=Path(x.out);out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(result,indent=2)+"\n")
    print(json.dumps([r["composition"] for r in result["targets"]]))
