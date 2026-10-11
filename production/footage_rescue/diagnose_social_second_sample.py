#!/usr/bin/env python3
"""Second independent sample for public social-video downloader regression."""
import argparse
from diagnose_social import SOURCES,main

SOURCES["instagram"] = "https://www.instagram.com/reel/DLY-pUiRU88/"
SOURCES["tiktok"] = "https://www.tiktok.com/@themrealeditsz/video/7669239993541463309"

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--site",choices=["instagram","tiktok"],required=True)
    p.add_argument("--method",choices=["yt-dlp","yt-dlp-chrome"],required=True)
    p.add_argument("--out",required=True)
    args=p.parse_args()
    raise SystemExit(main(args.site,args.method,args.out))
