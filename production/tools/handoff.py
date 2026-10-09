#!/usr/bin/env python3
"""Require verifiable explicit cross-agent handoffs before integration."""
import argparse,json,re
from pathlib import Path
ROLES={"research","hardware","engineering","director","qa","release"}
STATES={"ready","blocked","review"}
def validate(data):
    if not isinstance(data,dict) or data.get("schemaVersion")!=1:raise ValueError("schemaVersion must be 1")
    for key in ("task","branch","sourceSha","owner","summary","status"):
        if not isinstance(data.get(key),str) or not data[key].strip():
            raise ValueError("Missing field "+key)
    if data["owner"] not in ROLES or data["status"] not in STATES:raise ValueError("Unknown role/status")
    if not re.fullmatch(r"[0-9a-f]{40}",data["sourceSha"]):raise ValueError("Full source commit SHA required")
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9/_-]{1,120}",data["branch"]) or ".." in data["branch"]:
        raise ValueError("Invalid branch")
    for key in ("files","evidence","blockers"):
        if not isinstance(data.get(key),list) or not all(isinstance(v,str) for v in data[key]):
            raise ValueError("Field must be string array: "+key)
    if data["status"]=="ready" and not data["evidence"]:
        raise ValueError("Ready handoff requires actual evidence")
    if data["status"]=="blocked" and not data["blockers"]:
        raise ValueError("A blocker explanation is required")
    if any(p.startswith("/") or ".." in Path(p).parts for p in data["files"]):
        raise ValueError("File must be safely repo-relative")
    return data
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("file");args=p.parse_args()
    d=validate(json.loads(Path(args.file).read_text()))
    print(json.dumps({"handoff":"PASS","task":d["task"],"owner":d["owner"],"status":d["status"]}))
