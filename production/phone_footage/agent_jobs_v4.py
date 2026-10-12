#!/usr/bin/env python3
"""Agent-facing V4 job producer and completed MP4 manifest reader.

This CLI does not download footage or modify GitHub. Agents create issues through
their GitHub connector using the exact generated issue body.
"""
import argparse
import importlib.util
import json
from pathlib import Path
import sys
import urllib.request

HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("yunex_v4_worker", HERE / "v4_worker.py")
worker = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(worker)


def prepare(url, start, duration, height, max_mb, orientation="landscape"):
    job = {"url": url, "start": start, "duration": duration,
           "height": height, "max_mb": max_mb, "orientation": orientation}
    body = worker.MARKER + "\n" + json.dumps(job, separators=(",", ":"))
    if worker.parse_job({"body": body}) is None:
        raise ValueError("Source unapproved or job exceeds V3 safety/quality limits")
    return body


def fetch_result(issue):
    """Public issue comments contain a machine-readable completion payload."""
    found = None
    for page in range(1, 4):
        url = (f"https://api.github.com/repos/{worker.REPO}/issues/{issue}/comments"
               f"?per_page=100&page={page}")
        req = urllib.request.Request(url, headers={"User-Agent": "yunex-agent-v4",
                                                   "Accept": "application/vnd.github+json"})
        with urllib.request.urlopen(req, timeout=30) as response:
            comments = json.load(response)
        for item in comments:
            if item.get("user", {}).get("login", "").casefold() != worker.OWNER.casefold():
                continue
            text = item.get("body") or ""
            if text.startswith(worker.DONE + "\n\n~~~json\n"):
                payload = text.split("~~~json\n", 1)[1].split("\n~~~", 1)[0]
                data = json.loads(payload)
                if data.get("schema") == "YUNEX_PHONE_RESULT_V4":
                    found = data
        if len(comments) < 100:
            break
    return found


def main():
    parser = argparse.ArgumentParser(description="YUNEX V4 GitHub agent job handoff")
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("list", help="List reviewed source URLs and rights.")
    prepare_parser = sub.add_parser("prepare", help="Print exact Issue body for agent to create.")
    prepare_parser.add_argument("--url", required=True)
    prepare_parser.add_argument("--start", type=float, default=0)
    prepare_parser.add_argument("--duration", type=float, default=6)
    prepare_parser.add_argument("--height", type=int, choices=(720, 1080), default=1080)
    prepare_parser.add_argument("--max-mb", type=int, default=45)
    prepare_parser.add_argument("--orientation", choices=("landscape", "portrait"), default="landscape")
    result_parser = sub.add_parser("result", help="Read confirmed GitHub Issue result.")
    result_parser.add_argument("--issue", required=True, type=int)
    args = parser.parse_args()
    if args.cmd == "list":
        rows = [{"url": url, "title": item["title"], "license": item["license"],
                 "max_height": item["max_height"],
                 "license_reference": item["license_reference"]}
                for url, item in worker.LICENSED_PROOFS.items()]
        print(json.dumps(rows, indent=2))
    elif args.cmd == "prepare":
        print(prepare(args.url, args.start, args.duration, args.height,
                      args.max_mb, args.orientation))
    else:
        record = fetch_result(args.issue)
        if record is None:
            print("No verified completed V3 asset for this issue", file=sys.stderr)
            sys.exit(2)
        print(json.dumps(record, indent=2))


if __name__ == "__main__":
    main()
