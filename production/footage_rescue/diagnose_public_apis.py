#!/usr/bin/env python3
"""Single authorized CC-BY test video via publicly documented Piped/Invidious read-only endpoints."""
import argparse, json, pathlib, subprocess, urllib.request, urllib.parse, socket

VIDEO_ID="YE7VzlLtp-4"

def fetch_json(url):
    req=urllib.request.Request(url,headers={"Accept":"application/json","User-Agent":"YUNEX-Footage-QA/1.0"})
    with urllib.request.urlopen(req,timeout=25) as r:
        if "json" not in r.headers.get("Content-Type",""):
            raise ValueError("Unexpected API response type")
        raw=r.read(700000)
        return json.loads(raw)

def execute(mode, host, out):
    out=pathlib.Path(out)
    out.mkdir(parents=True,exist_ok=True)
    report={"status":"FAILED","provider":mode,"instance":host,"videoId":VIDEO_ID}
    try:
        if mode=="piped":
            data=fetch_json("https://"+host+"/streams/"+VIDEO_ID)
            videos=[f for f in data.get("videoStreams",[]) if f.get("url") and f.get("height")]
            report["videoStreamCount"]=len(videos)
            if not videos:raise ValueError("Piped API did not return video stream candidates")
            # Request the lowest available video to minimise test bandwidth.
            videos.sort(key=lambda f:f["height"])
            u=videos[0]["url"]
            parsed=urllib.parse.urlsplit(u)
            # Only trust the proxy explicitly advertised by the API instance.
            proxy=urllib.parse.urlsplit(data.get("proxyUrl","")).hostname
            if parsed.scheme!="https" or parsed.hostname!=proxy or not proxy or parsed.username:
                raise ValueError("No same-instance HTTPS video proxy offered")
        else:
            api="https://"+host+"/api/v1/videos/"+VIDEO_ID
            data=fetch_json(api)
            formats=data.get("formatStreams") or []
            report["formatCount"]=len(formats)
            if not formats:raise ValueError("Invidious API returned no playable format")
            u="https://"+host+"/latest_version?id="+VIDEO_ID+"&itag=18&local=true"
        # FFmpeg only consumes a bounded opening segment. Nothing persists beyond the proof.
        attempt=subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y",
                                "-rw_timeout","12000000","-i",u,"-t","3","-an",
                                "-vf","scale=-2:180","-c:v","libx264","-preset","ultrafast",
                                "-crf","30",str(out/"proxy-proof.mp4")],
                               capture_output=True,text=True,timeout=65)
        report["ffmpegExitCode"]=attempt.returncode
        if attempt.returncode:
            raise RuntimeError("FFmpeg could not retrieve media: "+attempt.stderr[-500:])
        file=out/"proxy-proof.mp4"
        if file.stat().st_size<2000:raise RuntimeError("Video proof too small")
        q=subprocess.run(["ffprobe","-v","error","-show_entries",
                          "format=duration,size:stream=codec_name,width,height","-of","json",str(file)],
                         capture_output=True,text=True,timeout=20,check=True)
        report["probe"]=json.loads(q.stdout)
        report["status"]="PASS_REAL_VIDEO"
    except Exception as exc:
        report["failure"]=str(exc)[:700]
    (out/"result.json").write_text(json.dumps(report,indent=2)+"\n")
    print(json.dumps(report,indent=2))
    return 0 if report["status"]=="PASS_REAL_VIDEO" else 2

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--mode",choices=["piped","invidious"],required=True)
    p.add_argument("--host",choices=["pipedapi.kavin.rocks","pipedapi.leptons.xyz",
                                    "inv.nadeko.net","invidious.tiekoetter.com",
                                    "invidious.nerdvpn.de","yt.chocolatemoo53.com"],required=True)
    p.add_argument("--out",required=True)
    a=p.parse_args()
    exit(execute(a.mode,a.host,a.out))
