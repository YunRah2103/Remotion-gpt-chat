#!/usr/bin/env python3
"""Refuse to render until Master explicitly approves unchanged E film source."""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]
LOCK = HERE / "SOURCE_LOCK.json"
SOURCE_PATHS = (
    "src/brakes001", "src/Root.tsx", "src/index.ts", "public",
    "package.json", "package-lock.json",
    "production/videos/carbon-ceramic-001/brief.json",
    "production/videos/carbon-ceramic-001/hardware",
    "production/videos/carbon-ceramic-001/physics",
    "production/videos/carbon-ceramic-001/lookdev",
    "production/videos/carbon-ceramic-001/qa",
    "production/videos/carbon-ceramic-001/approved-words.json",
)

def git(*args):
    return subprocess.run(["git", *args], cwd=REPO,
                          capture_output=True, text=True, check=True).stdout.strip()

def inspect(lock_file=LOCK):
    lock = json.loads(Path(lock_file).read_text(encoding="utf-8"))
    errors = []
    sha = lock.get("integrationSourceSha")
    if not isinstance(sha, str) or not re.fullmatch(r"[a-f0-9]{40}", sha):
        errors.append("Missing valid approved integrationSourceSha")
    if lock.get("status") != "approved":
        errors.append("Master has not approved integration source")
    url = lock.get("masterApprovalUrl")
    if not isinstance(url, str) or not url.startswith("https://github.com/YunRah2103/Remotion-gpt-chat/"):
        errors.append("Missing real repository Master approval evidence URL")
    head = git("rev-parse", "HEAD")
    if isinstance(sha, str) and re.fullmatch(r"[a-f0-9]{40}", sha):
        ancestor = subprocess.run(["git", "merge-base", "--is-ancestor", sha, "HEAD"], cwd=REPO)
        if ancestor.returncode:
            errors.append("Approved SHA not in checkout ancestry")
        else:
            changes = git("diff", "--name-only", sha, "HEAD", "--", *SOURCE_PATHS)
            if changes:
                errors.append("Film source differs from approved SHA: " + changes.replace("\n", ", "))
    return {"ok": not errors, "headSha": head, "approvedIntegrationSha": sha,
            "masterApprovalUrl": url, "sourcePathsChecked": list(SOURCE_PATHS), "errors": errors}

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--lock", type=Path, default=LOCK)
    p.add_argument("--report", type=Path)
    p.add_argument("--require-approved", action="store_true")
    args = p.parse_args()
    data = inspect(args.lock)
    payload = json.dumps(data, indent=2) + "\n"
    print(payload, end="")
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(payload, encoding="utf-8")
    return 2 if args.require_approved and not data["ok"] else 0

if __name__ == "__main__":
    sys.exit(main())
