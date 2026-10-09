#!/usr/bin/env python3
"""Generate a truthful, read-only production dashboard for GitHub Pages.

Statuses are a deploy-time GitHub snapshot, never invented live job claims.
No GitHub API keys, artifacts, or private footage are published in the HTML.
"""
import argparse
import datetime as dt
import html
import json
import os
import re
import shutil
import urllib.request
from pathlib import Path

OWNER_REPO="YunRah2103/Remotion-gpt-chat"
API="https://api.github.com/repos/"+OWNER_REPO
GH="https://github.com/"+OWNER_REPO

def fetch(path,token=None):
    if not path.startswith("/") or "//" in path:
        raise ValueError("Invalid GitHub API subpath")
    headers={"Accept":"application/vnd.github+json","User-Agent":"AutoEngineeringStudioDashboard/1.0"}
    if token:headers["Authorization"]="Bearer "+token
    request=urllib.request.Request(API+path,headers=headers)
    with urllib.request.urlopen(request,timeout=12) as response:
        return json.load(response)

def projects(repo):
    root=Path(repo)
    registry=(root/"src/Root.tsx").read_text()
    output=[]
    for path in sorted((root/"production/videos").glob("*/brief.json")):
        p=json.loads(path.read_text())
        slug=p.get("slug")
        if not re.fullmatch(r"[a-z0-9-]{2,65}",str(slug)):
            continue
        comp=p.get("sourceCompositionId")
        registered=bool(comp and re.search(r'<Composition\b[^>]*\bid="'+re.escape(comp)+r'"',registry))
        output.append({"slug":slug,"title":p.get("title",slug),
            "status":p.get("status","unknown"),
            "registered":registered,"composition":comp if registered else None,
            "frames":int(p.get("durationInFrames") or 0)})
    return output

def snapshot(token=None):
    data={}
    endpoints={"runs":"/actions/runs?per_page=30",
               "prs":"/pulls?state=open&per_page=30",
               "issues":"/issues?state=open&per_page=50"}
    for key,path in endpoints.items():
        try:
            raw=fetch(path,token)
            if key=="runs":rows=raw.get("workflow_runs",[])
            else:rows=raw
            if not isinstance(rows,list):raise ValueError("Unexpected API response")
            data[key]=rows
        except Exception as e:
            data[key]=[]
            data[key+"_error"]=type(e).__name__+": "+str(e)[:100]
    return data

def safe_link(url,label):
    if not isinstance(url,str) or not url.startswith(GH+"/"):
        return html.escape(str(label))
    return '<a target="_blank" rel="noopener noreferrer" href="'+html.escape(url,quote=True)+'">'+html.escape(str(label))+'</a>'

def build(repo,site,data=None):
    root=Path(repo);target=Path(site)
    target.mkdir(parents=True,exist_ok=True)
    shutil.copytree(root/"production/portal/viewer",target/"viewer",dirs_exist_ok=True)
    model=projects(root)
    data=data if data is not None else snapshot(os.environ.get("GITHUB_TOKEN"))
    generated=dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    escape=lambda s:html.escape(str(s))
    cards=[]
    for p in model:
        status="Registered composition" if p["registered"] else "No registered composition"
        cards.append('<article><h3>'+escape(p["title"])+'</h3><p><strong>'+escape(p["slug"])+
            '</strong> · '+escape(p["status"])+'</p><p>'+status+'</p>'+
            '<p>'+safe_link(GH+"/tree/main/production/videos/"+p["slug"],"View project brief")+'</p></article>')
    runs=[]
    for r in data.get("runs",[])[:18]:
        label=r.get("name","Workflow")+" — "+(r.get("conclusion") or r.get("status","unknown"))
        runs.append('<li>'+safe_link(r.get("html_url"),label)+'</li>')
    prs=[]
    for p in data.get("prs",[])[:12]:
        prs.append('<li>'+safe_link(p.get("html_url"),"#"+str(p.get("number","?"))+" "+p.get("title","PR"))+'</li>')
    tasks=[]
    for issue in data.get("issues",[]):
        if "pull_request" in issue:continue
        labels=[x.get("name","").lower() for x in issue.get("labels",[])]
        if not any("agent" in tag or "production" in tag or "video" in tag for tag in labels):
            continue
        tasks.append('<li>'+safe_link(issue.get("html_url"),"#"+str(issue.get("number"))+" "+issue.get("title","Task"))+'</li>')
    notice=[]
    for key in ("runs","prs","issues"):
        if key+"_error" in data:
            notice.append(escape(key)+" API unavailable; no status claims made")
    section=lambda title,items,empty:'<section><h2>'+title+'</h2>'+('<ul>'+"".join(items)+'</ul>' if items else '<p>'+escape(empty)+'</p>')+'</section>'
    content=''.join(cards) or "<p>No registered project briefs found.</p>"
    page='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>Automotive Engineering · Production Control</title><style>
*{box-sizing:border-box}body{margin:0;background:#0c141e;color:#eff5f7;font:15px/1.55 system-ui}main{max-width:1130px;margin:auto;padding:40px 23px}h1{font-size:clamp(27px,5vw,49px);margin:0}h2{font-size:23px}h3{font-size:18px}p{color:#b8cad5}a{color:#b2e4fd;text-decoration:none}a:hover{text-decoration:underline}.hero{background:linear-gradient(135deg,#173445,#192331);padding:36px;border-radius:17px}.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:15px;margin:26px 0}.stat,article,section{border:1px solid #2e485c;background:#182635;border-radius:12px;padding:17px}.stat strong{display:block;font-size:30px}.projects{display:grid;grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:13px}section{margin:24px 0}li{padding:5px 0}nav{display:flex;gap:20px;flex-wrap:wrap;margin-top:17px}.warning{color:#f1cb89}
</style></head><body><main><header class="hero"><div>GITHUB • ORIGINAL 3D ENGINEERING FILMS</div><h1>Production Control</h1><p>Snapshot generated '''+escape(generated)+'''. This page is not live monitoring; open each Actions run for the current result.</p><nav><a href="../">Video catalogue</a><a href="../viewer/">Interactive 3D Model Lab</a><a href="'''+GH+'''/actions">Live GitHub Actions ↗</a></nav></header>'''
    page+='<div class="stats"><div class="stat"><strong>'+str(len(model))+'</strong>Project briefs</div><div class="stat"><strong>'+str(sum(p["registered"] for p in model))+'</strong>Registered films</div><div class="stat"><strong>'+str(len(data.get("prs",[])))+'</strong>Open PRs (snapshot)</div></div>'
    if notice:page+='<p class="warning">'+ "; ".join(notice)+'</p>'
    page+='<section><h2>Projects</h2><div class="projects">'+content+'</div></section>'
    page+=section("Recent Actions",runs,"No workflow run snapshot available.")
    page+=section("Active agent / production issues",tasks,"No labelled agent or production issues in the snapshot.")
    page+=section("Open pull requests",prs,"No open pull requests in the snapshot.")
    page+='<p>Artifacts may expire. Model validation, peer review and approved audio must still be independently verified. Nothing here creates AI agents.</p></main></body></html>'
    folder=target/"dashboard";folder.mkdir(exist_ok=True)
    (folder/"index.html").write_text(page)
    (folder/"snapshot.json").write_text(json.dumps({
        "generatedAt":generated,"repo":OWNER_REPO,"projects":model,
        "runs":[{"name":r.get("name"),"state":r.get("conclusion") or r.get("status"),"html_url":r.get("html_url")} for r in data.get("runs",[])[:18]],
        "openPullRequests":len(data.get("prs",[])),"agentIssues":len(tasks),
        "apiWarnings":notice},indent=2)+"\n")
    return {"projects":len(model),"registered":sum(p["registered"] for p in model),
            "snapshots":len(data.get("runs",[])),"output":str(folder/"index.html")}

if __name__=="__main__":
    a=argparse.ArgumentParser()
    a.add_argument("--repo",default=".")
    a.add_argument("--site",default="out/production/site")
    a.add_argument("--offline",action="store_true",help="Do not query GitHub APIs")
    x=a.parse_args()
    print(json.dumps(build(x.repo,x.site,{"runs":[],"prs":[],"issues":[]} if x.offline else None),indent=2))
