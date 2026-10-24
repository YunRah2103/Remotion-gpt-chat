#!/usr/bin/env python3
"""YUNEX external car asset fetcher. Stdlib only; no unverified commercial rights."""
import argparse, hashlib, json, pathlib, urllib.parse, urllib.request, sys
ROOT=pathlib.Path(__file__).resolve().parents[2]
CAT=ROOT/"production/asset-library/external-car-catalogue.json"
def gitsha(data):
    return hashlib.sha1(b"blob "+str(len(data)).encode()+b"\x00"+data).hexdigest()
def main():
    p=argparse.ArgumentParser()
    p.add_argument("--list",action="store_true")
    p.add_argument("--all",action="store_true")
    p.add_argument("--id",action="append",default=[])
    p.add_argument("--allow-unverified",action="store_true",help="Download for private asset evaluation only; never commercial publication")
    p.add_argument("--dest",default="public/yunex-external-cars")
    a=p.parse_args()
    data=json.loads(CAT.read_text())
    assets=data["assets"]
    if a.list:
        for item in assets: print(item["id"],item["category"],item["sizeBytes"],item["licenseStatus"])
        return
    chosen=assets if a.all else [x for x in assets if x["id"] in a.id]
    if not chosen: p.error("Choose --id <model-id> or --all; use --list to inspect IDs")
    missing=set(a.id)-{x["id"] for x in chosen}
    if missing: p.error("Unknown IDs: "+", ".join(sorted(missing)))
    if any(not x["commercialUseApproved"] for x in chosen) and not a.allow_unverified:
        p.error("Models have unverified licences. For PRIVATE review only, explicitly add --allow-unverified")
    dest=ROOT/a.dest
    for item in chosen:
        url="https://raw.githubusercontent.com/"+data["sourceRepository"]+"/"+data["sourceCommit"]+"/"+urllib.parse.quote(item["path"],safe="/")
        out=dest/(item["id"]+".glb")
        out.parent.mkdir(parents=True,exist_ok=True)
        if out.exists() and len(out.read_bytes())==item["sizeBytes"] and gitsha(out.read_bytes())==item["gitBlobSha"]:
            print("CACHED",item["id"]);continue
        print("DOWNLOADING",item["id"],flush=True)
        with urllib.request.urlopen(url,timeout=180) as response:
            payload=response.read()
        if len(payload)!=item["sizeBytes"] or gitsha(payload)!=item["gitBlobSha"] or payload[:4]!=b"glTF":
            raise RuntimeError("Model integrity mismatch: "+item["id"])
        tmp=out.with_suffix(".glb.tmp")
        tmp.write_bytes(payload);tmp.replace(out)
        print("VERIFIED",out,len(payload))
if __name__=="__main__":main()
