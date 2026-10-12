#!/usr/bin/env python3
"""Fail-closed asset/timeline validation for French Legends Agent C."""
import json, subprocess
from pathlib import Path
P=Path("production/videos/french-icons-001/agent-c/shotmap.json")
M=Path("out/fr-legends-c/media")
J=json.loads(P.read_text())
assert J["durationFrames"]==1800 and J["fps"]==30 and J["width"]==1920 and J["height"]==1080
shots=J["shots"]
assert 16<=len(shots)<=42, "Expected artistically curated subset"
assert shots[0]["masterStartFrame"]==0 and shots[-1]["masterEndFrame"]==1800
assert len({s["sourcePath"] for s in shots})==len(shots),"Repeated file source path not allowed"
for i,s in enumerate(shots):
    p=M/s["sourcePath"]
    assert p.exists(),f"Missing real footage: {p}"
    v=json.loads(subprocess.check_output(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(p)],text=True))
    stream=next(vs for vs in v["streams"] if vs["codec_type"]=="video")
    assert stream["width"]>=1920 and stream["height"]>=1080, f"Non-native landscape: {p}"
    assert stream["width"]/stream["height"]>1.6, f"Wrong orientation in landscape master: {p}"
    fps=J["fps"]
    used=round(s["sourceInSeconds"]*fps)/fps + s["durationFrames"]/fps
    total=float(v["format"]["duration"])
    assert used<=total+0.015,(p,used,total)
    assert s["masterEndFrame"]-s["masterStartFrame"]==s["durationFrames"]
    if i:
        prev=shots[i-1]
        assert s["masterStartFrame"]==prev["masterEndFrame"]-prev["exitDissolveFrames"],f"Gap/overlap error at shot {i+1}"
        assert s["enterDissolveFrames"]==prev["exitDissolveFrames"],f"Crossfade mismatch at shot {i+1}"
    assert s["musicPhraseBoundarySeconds"] is None, "Never invent unheard French lyrics"
print(json.dumps({"timeline":"PASS","actual_sources":"PASS","shots":len(shots),"frames":1800,"portrait_clips_in_landscape":0,"audio":"PENDING exact original M4A"},indent=2))
