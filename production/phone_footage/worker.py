#!/usr/bin/env python3
"""YUNEX Termux worker: process agent-created licensed YouTube test jobs.
Only allowlisted CC BY test videos may be queued, including a short car shot.
The phone performs the download, verifies the MP4, and uploads a release asset.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

REPO = "YunRah2103/Remotion-gpt-chat"
OWNER = "YunRah2103"
TITLE_PREFIX = "[YUNEX PHONE JOB]"
MARKER = "YUNEX_PHONE_JOB_V1"
TEST_VIDEO = "https://www.youtube.com/watch?v=YE7VzlLtp-4"
CAR_VIDEO = "https://www.youtube.com/watch?v=DqiKOr1aS9w"
LICENSED_PROOFS = {
    TEST_VIDEO: {
        "title": "Big Buck Bunny",
        "author": "Blender Foundation",
        "license": "CC-BY-3.0",
        "source": TEST_VIDEO,
    },
    CAR_VIDEO: {
        "title": "Aerial views of a car driving in snow through a forest",
        "author": "Vladislav Sanikovich",
        "license": "CC-BY-3.0",
        "source": CAR_VIDEO,
        "license_reference": "https://commons.wikimedia.org/wiki/File:Aerial_views_of_a_car_driving_in_snow_through_a_forest.webm",
    },
}
DONE, FAILED = "YUNEX_PHONE_DONE_V1", "YUNEX_PHONE_FAILED_V1"
MAX_BYTES = 30 * 1024 * 1024


def api(method, path, token, payload=None, binary=None, content_type="application/json"):
    host = "https://uploads.github.com" if path.startswith("/UPLOAD/") else "https://api.github.com"
    if path.startswith("/UPLOAD/"):
        path = path[len("/UPLOAD"):]
    headers = {
        "Accept": "application/vnd.github+json", "Authorization": "Bearer " + token,
        "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "yunex-s25-proof",
    }
    data = None
    if binary is not None:
        data = binary
        headers["Content-Type"] = content_type
    elif payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(host + path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=80 if binary is not None else 25) as response:
            raw = response.read()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as err:
        raise RuntimeError(f"GitHub HTTP {err.code} on {method} {path.split('?')[0]}") from None


def issue_jobs(token):
    query = urllib.parse.urlencode({"state":"open", "sort":"created", "direction":"desc","per_page":"100"})
    items = api("GET", f"/repos/{REPO}/issues?{query}", token)
    return [i for i in items if i.get("title","").startswith(TITLE_PREFIX)
            and i.get("user",{}).get("login","").casefold() == OWNER.casefold()
            and "pull_request" not in i]


def parse_job(issue):
    body = issue.get("body") or ""
    if not body.startswith(MARKER + "\n"):
        return None
    try:
        job = json.loads(body.split("\n",1)[1].strip())
    except (ValueError,TypeError):
        return None
    if (not isinstance(job,dict) or job.get("url") not in LICENSED_PROOFS or
            job.get("seconds") != 6 or job.get("license") != "CC-BY-3.0"):
        return None
    return job


def already_reported(token, number):
    comments = api("GET",f"/repos/{REPO}/issues/{number}/comments?per_page=100",token)
    return any((c.get("body") or "").startswith((DONE,FAILED)) and
               c.get("user",{}).get("login","").casefold()==OWNER.casefold()
               for c in comments)


def issue_comment(token, number, message):
    api("POST",f"/repos/{REPO}/issues/{number}/comments",token,{"body":message})


def checked(cmd, timeout):
    try:
        p=subprocess.run(cmd,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=timeout)
    except subprocess.TimeoutExpired:
        raise RuntimeError("Command timed out") from None
    if p.returncode != 0:
        raise RuntimeError(f"{Path(cmd[0]).name} exit {p.returncode}; inspect local phone output")
    return p.stdout


def download_proof(folder, job=None):
    if not all(shutil.which(x) for x in ("node","ffmpeg","ffprobe")):
        raise RuntimeError("Termux requires nodejs and ffmpeg")
    url = job["url"] if job else TEST_VIDEO
    command = [sys.executable,"-m","yt_dlp","--ignore-config","--no-playlist",
               "--no-progress","--js-runtimes","node","--socket-timeout","20",
               "--retries","1","--fragment-retries","1","--download-sections","*0-6",
               "--merge-output-format","mp4",
               "-f","bv*[height<=720]+ba/b[height<=720]/b",
               "--max-filesize","30M","-o",str(folder/"download.%(ext)s"),url]
    checked(command,165)
    candidates = sorted((f for f in folder.iterdir() if f.is_file() and
                         f.suffix.lower() in {".mp4",".mkv",".webm",".mov"}),
                        key=lambda f:f.stat().st_size,reverse=True)
    if not candidates:
        raise RuntimeError("yt-dlp did not create a movie file")
    result=folder/"verified-phone-proof.mp4"
    checked(["ffmpeg","-y","-v","error","-i",str(candidates[0]),"-t","8",
             "-map","0:v:0","-map","0:a:0?","-c:v","libx264","-preset","veryfast",
             "-crf","23","-pix_fmt","yuv420p","-c:a","aac",
             "-movflags","+faststart",str(result)],140)
    if not result.exists() or not 4096 < result.stat().st_size <= MAX_BYTES:
        raise RuntimeError("MP4 absent or exceeds 30 MiB")
    probe=json.loads(checked(["ffprobe","-v","error","-show_format","-show_streams",
                              "-of","json",str(result)],15))
    video=next((s for s in probe.get("streams",[]) if s.get("codec_type")=="video"),None)
    duration=float(probe.get("format",{}).get("duration") or 0)
    if not video or video.get("width",0)<320 or video.get("height",0)>720 or not 2<=duration<=12:
        raise RuntimeError("Video codec/size/duration validation failed")
    checked(["ffmpeg","-v","error","-xerror","-i",str(result),
             "-t","4","-map","0:v:0","-f","null","-"],30)
    return result,{
        "bytes":result.stat().st_size,"width":video["width"],
        "height":video["height"],"duration":round(duration,2),
        "codec":video.get("codec_name"),
        "sha256":hashlib.sha256(result.read_bytes()).hexdigest(),
        "full_decode_first_4s":"PASS"}


def upload_release(token, number, file, job=None):
    tag=f"yunex-phone-proof-{number}"
    source = (job or {}).get("url", TEST_VIDEO)
    attribution = LICENSED_PROOFS[source]
    credit = ("Six-second 720p-or-lower extraction test. "
              + attribution["title"] + " by " + attribution["author"]
              + " (Creative Commons Attribution 3.0). Source: " + source
              + "\nLicense: https://creativecommons.org/licenses/by/3.0/"
              + "\nEdited: 6-second excerpt, H.264/AAC transcode.")
    if attribution.get("license_reference"):
        credit += "\nArchive license evidence: " + attribution["license_reference"]
    release=api("POST",f"/repos/{REPO}/releases",token,{
        "tag_name":tag,"target_commitish":"main",
        "name":f"S25 phone footage proof #{number}","draft":False,"prerelease":True,
        "body":credit})
    rid=release["id"]
    upload=f"/UPLOAD/repos/{REPO}/releases/{rid}/assets?name="+urllib.parse.quote(file.name)
    asset=api("POST",upload,token,binary=file.read_bytes(),content_type="video/mp4")
    return asset["browser_download_url"],release["html_url"]


def run_once(token,dry_run=False):
    for issue in issue_jobs(token):
        job = parse_job(issue)
        if job is None:
            continue
        number=issue["number"]
        if already_reported(token,number):
            continue
        print(f"Agent-requested licensed sample: issue #{number}",flush=True)
        if dry_run:
            print("DRY RUN: queue recognised; no download/upload performed")
            return True
        try:
            with tempfile.TemporaryDirectory(prefix="yunex-phone-") as temp:
                file,meta=download_proof(Path(temp),job)
                asset,release=upload_release(token,number,file,job)
            issue_comment(token,number,DONE+"\n\nVerified on phone.\n\n~~~json\n"+
                          json.dumps(meta,indent=2)+"\n~~~\n\n"+
                          f"[Playable MP4]({asset}) | [Release]({release})")
            print(f"PASS #{number} {meta['width']}x{meta['height']} {meta['bytes']} bytes",flush=True)
        except Exception as error:
            detail=str(error).replace("\n"," ")[:220]
            print(f"FAILED #{number}: {detail}",flush=True)
            issue_comment(token,number,FAILED+"\n\n"+detail)
        return True
    print("No pending authorised job",flush=True)
    return False


def read_token():
    token_file=Path(os.environ.get("YUNEX_GH_TOKEN_FILE",
                    str(Path.home()/".config/yunex/github-token")))
    if not token_file.is_file():
        raise RuntimeError("Create private token file ~/.config/yunex/github-token")
    return token_file.read_text().strip()


def main():
    p=argparse.ArgumentParser()
    group=p.add_mutually_exclusive_group(required=True)
    group.add_argument("--once",action="store_true")
    group.add_argument("--loop",action="store_true")
    group.add_argument("--doctor",action="store_true")
    p.add_argument("--dry-run",action="store_true")
    args=p.parse_args()
    if args.doctor:
        print(json.dumps({"node":shutil.which("node"),"ffmpeg":shutil.which("ffmpeg"),
                          "ffprobe":shutil.which("ffprobe"),
                          "token_file":(Path.home()/".config/yunex/github-token").is_file()},indent=2))
        return
    token=read_token()
    while True:
        try:
            run_once(token,args.dry_run)
        except Exception as err:
            print("Worker error:",str(err)[:200],flush=True)
            if args.once:
                raise
        if args.once:
            return
        time.sleep(60)


if __name__=="__main__":
    main()
