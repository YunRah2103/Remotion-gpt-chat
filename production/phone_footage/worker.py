#!/usr/bin/env python3
"""YUNEX Termux worker: process agent-created licensed YouTube test jobs.
Only explicitly approved CC BY sources in approved_sources.json may be queued.
The phone performs the download, verifies the MP4, and uploads a release asset.
"""
import argparse
import fcntl
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
MARKER_V2 = "YUNEX_PHONE_JOB_V2"
TEST_VIDEO = "https://www.youtube.com/watch?v=YE7VzlLtp-4"
CAR_VIDEO = "https://www.youtube.com/watch?v=DqiKOr1aS9w"
def load_approved_sources(path=None):
    """Only reviewed registry entries, never issue-body claims, confer source approval."""
    registry = path or Path(__file__).with_name("approved_sources.json")
    records = json.loads(Path(registry).read_text(encoding="utf-8"))
    if not isinstance(records, dict) or not records:
        raise RuntimeError("Empty or invalid approved source registry")
    for url, item in records.items():
        parsed = urllib.parse.urlsplit(url)
        if (parsed.scheme != "https" or parsed.hostname not in
                {"www.youtube.com", "youtube.com"} or parsed.path != "/watch"
                or not urllib.parse.parse_qs(parsed.query).get("v")):
            raise RuntimeError("Source registry contains noncanonical YouTube URL")
        if (not isinstance(item, dict) or item.get("license") != "CC-BY-3.0"
                or item.get("max_height") not in (720, 1080)
                or not all(item.get(k) for k in ("title", "author", "source",
                                                "license_reference"))
                or item["source"] != url):
            raise RuntimeError("Source registry is missing verified approval metadata")
    return records


LICENSED_PROOFS = load_approved_sources()

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
    marker = body.partition("\n")[0]
    if marker not in (MARKER, MARKER_V2) or "\n" not in body:
        return None
    try:
        job = json.loads(body.split("\n",1)[1].strip())
    except (ValueError,TypeError):
        return None
    if not isinstance(job, dict):
        return None
    approved = LICENSED_PROOFS.get(job.get("url"))
    height = job.get("height", 720)
    if (not approved or job.get("seconds") != 6 or
            job.get("license") != approved["license"] or
            type(height) is not int or height not in (720, 1080) or
            height > approved["max_height"] or
            (height == 1080 and marker != MARKER_V2)):
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
    height = job.get("height", 720) if job else 720
    command = [sys.executable,"-m","yt_dlp","--ignore-config","--no-playlist",
               "--no-progress","--js-runtimes","node","--socket-timeout","20",
               "--retries","1","--fragment-retries","1","--download-sections","*0-6",
               "--merge-output-format","mp4",
               "-f",f"bv*[height<={height}]+ba/b[height<={height}]/b",
               "--max-filesize","30M","-o",str(folder/"download.%(ext)s"),url]
    checked(command,165)
    candidates = sorted((f for f in folder.iterdir() if f.is_file() and
                         f.suffix.lower() in {".mp4",".mkv",".webm",".mov"}),
                        key=lambda f:f.stat().st_size,reverse=True)
    if not candidates:
        raise RuntimeError("yt-dlp did not create a movie file")
    # Probe the actual downloaded stream before transcoding. A 720p source
    # must never masquerade as a successful 1080p phone acquisition.
    downloaded_probe=json.loads(checked(["ffprobe","-v","error","-show_streams",
                                          "-of","json",str(candidates[0])],15))
    input_video=next((s for s in downloaded_probe.get("streams",[])
                      if s.get("codec_type")=="video"),None)
    if not input_video or (height == 1080 and input_video.get("height",0) < 1080):
        raise RuntimeError("Downloaded source does not contain true 1080p frames")
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
    if (not video or video.get("width",0)<320
            or video.get("height",0)>height or
            (height == 1080 and video.get("height",0)<1080)
            or not 2<=duration<=12):
        raise RuntimeError("Video codec/size/duration validation failed")
    # Check the entire rendered video, not just its first four seconds.
    checked(["ffmpeg","-v","error","-xerror","-i",str(result),
             "-map","0:v:0","-f","null","-"],90)
    return result,{
        "bytes":result.stat().st_size,"width":video["width"],
        "height":video["height"],"duration":round(duration,2),
        "codec":video.get("codec_name"),
        "sha256":hashlib.sha256(result.read_bytes()).hexdigest(),
        "requested_height":height,
        "input_width":input_video["width"],"input_height":input_video["height"],
        "full_decode":"PASS"}


def upload_release(token, number, file, job=None):
    tag=f"yunex-phone-proof-{number}"
    source = (job or {}).get("url", TEST_VIDEO)
    attribution = LICENSED_PROOFS[source]
    height = (job or {}).get("height", 720)
    credit = (f"Six-second up-to-{height}p extraction test. "
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


def previous_release_asset(token, number):
    """Do not re-upload a GitHub Release if an earlier phone run succeeded."""
    tag = f"yunex-phone-proof-{number}"
    try:
        release = api("GET", f"/repos/{REPO}/releases/tags/{tag}", token)
    except RuntimeError as exc:
        if "GitHub HTTP 404 on GET" in str(exc):
            return None
        raise
    assets = release.get("assets") or []
    if not assets:
        raise RuntimeError("Existing release has no asset; manual review needed")
    return assets[0].get("browser_download_url")


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
            existing_asset = previous_release_asset(token, number)
            if existing_asset:
                issue_comment(token,number,DONE+
                              "\n\nExisting release found; skipped duplicate upload. "
                              "This pass did not re-verify the old asset.\n"+existing_asset)
                print(f"SKIPPED #{number}: previously uploaded release",flush=True)
                return True
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
    # Avoid two Termux shells both uploading the same issue at once.
    lock_path=Path.home()/".cache/yunex-phone-worker.lock"
    lock_path.parent.mkdir(parents=True,exist_ok=True)
    lock_handle=open(lock_path,"a+")
    try:
        fcntl.flock(lock_handle,fcntl.LOCK_EX|fcntl.LOCK_NB)
    except BlockingIOError:
        print("Another YUNEX worker is already running on this phone",flush=True)
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
