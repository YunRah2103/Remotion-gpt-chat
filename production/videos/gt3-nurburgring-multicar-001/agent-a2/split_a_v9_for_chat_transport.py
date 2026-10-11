#!/usr/bin/env python3
"""Transport V9 original EXACT bytes from another GH Actions run to this chat.

Download verified original Actions artifact with actions:read. Break *outer artifact
ZIP* byte-for-byte into <210MB chunks. Receiver reassembles then ZIP/CRC checks.
No media modifications, no quality claims beyond upstream QA.
"""
import os,hashlib,requests,pathlib,json,zipfile
ROOT=pathlib.Path("out/gt3-a-v9-chat-transport")
ROOT.mkdir(parents=True,exist_ok=True)
url="https://api.github.com/repos/YunRah2103/Remotion-gpt-chat/actions/artifacts/11711435862/zip"
token=os.environ["GITHUB_TOKEN"]
headers={"Authorization":f"Bearer {token}","Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"}
print("Downloading original upstream REAL V9 596755655-byte GitHub Actions archive",flush=True)
with requests.get(url,headers=headers,stream=True,timeout=(20,120),allow_redirects=True) as r:
 r.raise_for_status()
 orig=ROOT/"GT3_AGENT_A_V9_ORIGINAL_OUTER.zip"
 sha=hashlib.sha256()
 with orig.open("wb") as out:
  for blob in r.iter_content(chunk_size=2*1024*1024):
   if blob:
    out.write(blob);sha.update(blob)
print("V9_SOURCE_ACTUAL_BYTES",orig.stat().st_size,sha.hexdigest(),flush=True)
if orig.stat().st_size<580_000_000 or orig.stat().st_size>700_000_000:
 raise RuntimeError("V9 size outside expected range, refuse unverified split")
with zipfile.ZipFile(orig) as z:
 bad=z.testzip()
 assert bad is None, f"Original artifact ZIP invalid at {bad}"
 summary=[{"name":f.filename,"size":f.file_size} for f in z.infolist()]
 print("V9_SOURCE_ZIP_MEMBERS",json.dumps(summary)[:12000],flush=True)
CHUNK=205*1024*1024
parts=[]
with orig.open("rb") as stream:
 i=1
 while True:
  blob=stream.read(CHUNK)
  if not blob:break
  p=ROOT/f"GT3_AGENT_A_V9_PART_{i:02d}.bin"
  p.write_bytes(blob)
  parts.append({"index":i,"file":p.name,"size":p.stat().st_size,"sha256":hashlib.sha256(blob).hexdigest()})
  print("V9_SPLIT_PART",i,len(blob),parts[-1]["sha256"],flush=True)
  i+=1
assert len(parts)>=3
manifest={"description":"Transport of exact official verified GT3 A V9 Actions outer ZIP artifact, not a substitute/re-encode",
 "upstream_url":"https://github.com/YunRah2103/Remotion-gpt-chat/actions/runs/38163232775/artifacts/11711435862",
 "artifact_id":11711435862,"original_file_name":orig.name,
 "original_size":orig.stat().st_size,"original_sha256":sha.hexdigest(),"parts":parts,"members":summary}
(ROOT/"PARTS_SHA256.json").write_text(json.dumps(manifest,indent=2)+"\n")
orig.unlink()
print("V9_TRANSPORT_READY",len(parts),"upstream_full_sha",sha.hexdigest(),flush=True)
