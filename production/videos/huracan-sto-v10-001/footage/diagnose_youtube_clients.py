#!/usr/bin/env python3
"""Safe same-run GitHub YouTube player-client diagnostics.

Uses the existing temporary cookie file if configured; makes format-list probes
for an STO YouTube video without recording cookies, tokens, signed stream URLs,
headers, or unredacted command output. This is diagnostic, not downloader QA.
"""
import json,os,pathlib,re,subprocess,time

ROOT=pathlib.Path("out/sto-youtube-client-diagnostics")
ROOT.mkdir(parents=True,exist_ok=True)
URL="https://www.youtube.com/watch?v=egjLBe6lMXU"
cookie_path=os.environ.get("YOUTUBE_COOKIES_FILE","")
cookie_ready=bool(cookie_path and pathlib.Path(cookie_path).is_file())
CLIENTS=["default","web_embedded","tv","web_safari","android_vr","mweb"]
RESULT=[]
for client in CLIENTS:
    params=["yt-dlp","--no-config","--js-runtimes","deno","--list-formats","--no-playlist",
            "--no-progress","--no-color","--socket-timeout","12","--retries","0",
            "--extractor-args","youtube:player_client="+client]
    if cookie_ready:
        params.extend(["--cookies",cookie_path])
    params.append(URL)
    started=time.monotonic()
    try:
        p=subprocess.run(params,text=True,capture_output=True,timeout=55)
        out=(p.stdout or "")
        err=(p.stderr or "")
        blob=(out+"\n"+err).lower()
        if "sign in to confirm" in blob or "not a bot" in blob:
            code="BOT_GATE"
        elif "login_required" in blob or "login required" in blob:
            code="LOGIN_REQUIRED"
        elif "http error 403" in blob or "403 forbidden" in blob:
            code="HTTP_403"
        elif "too many requests" in blob or "http error 429" in blob:
            code="HTTP_429"
        elif "video unavailable" in blob or "this video is unavailable" in blob:
            code="VIDEO_UNAVAILABLE"
        elif "requested format is not available" in blob or "no video formats found" in blob:
            code="NO_FORMATS"
        elif p.returncode:
            code="OTHER_EXTRACTION_ERROR"
        else:
            code="FORMAT_LIST_ACQUIRED_NOT_YET_DOWNLOADED"
        fmt_lines=[line for line in out.splitlines() if re.match(r"^\s*\S+\s+\S+\s+\d{3,4}x\d{3,4}",line)]
        # Streaming URLs and account-sensitive diagnostics are never written to artifacts.
        # A clean formatted proof requires genuinely listable 1080p+ variants.
        highres=sum(1 for line in fmt_lines if any(q in line for q in ("1920x1080","2560x1440","3840x2160","4096x2160")))
        output={"client":client,"cookie_secret_seen":cookie_ready,"status":code,
                "elapsed_seconds":round(time.monotonic()-started,1),
                "return_code":p.returncode,"format_entries":len(fmt_lines),
                "native_1080p_plus_format_entries":highres,
                "likely_drm_or_sabr_limitation":any(term in blob for term in ("drm","sabr"))}
    except subprocess.TimeoutExpired:
        output={"client":client,"cookie_secret_seen":cookie_ready,"status":"TIMEOUT_AFTER_55_SECONDS"}
    RESULT.append(output)
    print("SAFE_DIAGNOSTIC",json.dumps(output),flush=True)
    (ROOT/"manifest.json").write_text(json.dumps({"target_video_id":"egjLBe6lMXU",
            "mode":"metadata_only_no_media_download","cookies_configured":cookie_ready,
            "results":RESULT,"warning":"FORMAT_LIST_ACQUIRED does not prove a playable HD file"},indent=2))
    # Keep requests conservative. This is not a high-volume scraper.
    time.sleep(4)
