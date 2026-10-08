#!/usr/bin/env python3
"""GPU POLISH 03 manager preflight. Strictly fail-closed; stdlib only.

Usage:
  python gpu-decompose/polish3/manager/verify_polish3.py lock RELEASE_LOCK.json
  python gpu-decompose/polish3/manager/verify_polish3.py assets PUBLIC_ASSET_DIR RELEASE_LOCK.json
No release authorization is implied by a passing preflight.
"""
from __future__ import annotations

import hashlib
import json
import pathlib
import re
import struct
import sys
from collections import Counter

REQUIRED = (
    "GPU_ROOT FAN_ASSEMBLY FAN_LEFT FAN_CENTER FAN_RIGHT FRONT_SHROUD HEATSINK "
    "HEATSINK_FINS HEATPIPE_BUNDLE COLD_PLATE PCB_ASSEMBLY PCB GPU_DIE "
    "VRAM_CHIPS VRM_COMPONENTS PCIE_FINGERS POWER_8PIN IO_BRACKET BACKPLATE"
).split()
MOVING = ("FAN_LEFT FAN_CENTER FAN_RIGHT FRONT_SHROUD HEATSINK "
          "GPU_DIE VRAM_CHIPS PCB_ASSEMBLY BACKPLATE").split()
OLD_GLB_SHA256 = "e0b86390180ecb6724bcfe029bc77c9a116ff9b004e1ae14fa81b0bff8e0599e"
OLD_MOTION_SHA256 = "1790dfa60d0ea10641498901d2e9bf838eb024d9d8c6c4eb1e0aec7914e74510"
SHA40 = re.compile(r"^[0-9a-f]{40}$")
SHA64 = re.compile(r"^[0-9a-f]{64}$")


def sha256(p: pathlib.Path) -> str:
    h = hashlib.sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def lock_check(file: pathlib.Path) -> dict:
    assert file.is_file(), f"missing release lock: {file}"
    x = json.loads(file.read_text())
    for key in ("agentASha", "agentBSha"):
        assert isinstance(x.get(key), str) and SHA40.fullmatch(x[key]), f"bad {key}"
    for key in ("glbSha256", "animationSha256", "sceneSourceSha256"):
        assert isinstance(x.get(key), str) and SHA64.fullmatch(x[key]), f"bad {key}"
    for key in ("modelArtifactRunId", "modelArtifactId"):
        assert type(x.get(key)) is int and x[key] > 0, f"missing real {key}"
    assert x.get("modelArtifactName") and isinstance(x["modelArtifactName"], str)
    assert x["glbSha256"] != OLD_GLB_SHA256, "old GLB prohibited in POLISH 03"
    assert x["animationSha256"] != OLD_MOTION_SHA256, "old motion prohibited"
    assert x.get("contractVersion") == "POLISH03-v1", "wrong production contract version"
    assert x.get("status") in ("proofs", "release"), "status must be proofs or release"
    if x["status"] == "release":
        assert x.get("renderApproved") is True, "manager approval missing"
        for key in ("approvedProofRunId", "approvedProofArtifactId"):
            assert type(x.get(key)) is int and x[key] > 0, f"release missing {key}"
        assert x.get("independentVisualQa") == "PASS", "render not independently QA approved"
    print(json.dumps({
        "preflight": "LOCK_PASS", "status": x["status"],
        "sourceA": x["agentASha"], "sourceB": x["agentBSha"],
        "glbSha256": x["glbSha256"],
        "modelArtifactRunId": x["modelArtifactRunId"],
        "modelArtifactId": x["modelArtifactId"],
    }, indent=2))
    return x


def glb_json(file: pathlib.Path) -> dict:
    with file.open("rb") as f:
        hdr = f.read(20)
        assert len(hdr) == 20 and hdr[:4] == b"glTF", "invalid GLB header"
        ver, size = struct.unpack_from("<II", hdr, 4)
        assert ver == 2 and size == file.stat().st_size, "invalid GLB size/version"
        clen, ctype = struct.unpack_from("<I4s", hdr, 12)
        assert ctype == b"JSON", "missing glTF JSON chunk"
        doc = json.loads(f.read(clen))
    assert doc.get("asset", {}).get("version", "").startswith("2."), "not glTF 2"
    return doc


def descendants(graph: dict, idx: int, seen=None) -> set[int]:
    seen = set() if seen is None else seen
    assert idx not in seen, "invalid cyclic GLB hierarchy"
    seen.add(idx)
    for c in graph["nodes"][idx].get("children", []):
        descendants(graph, c, seen)
    return seen


def asset_check(base: pathlib.Path, lock: dict) -> None:
    glb = base / "xfx_swift_rx9060xt_triple16.glb"
    motion = base / "decomposition.json"
    assert glb.is_file() and glb.stat().st_size > 10000, "missing new real GLB in runtime staging"
    assert motion.is_file(), "missing new movement JSON in runtime staging"
    actual_glb = sha256(glb)
    actual_motion = sha256(motion)
    assert actual_glb == lock["glbSha256"], "runtime GLB differs from lock (or old artifact substituted)"
    assert actual_motion == lock["animationSha256"], "runtime motion differs from lock"
    src = pathlib.Path("src/GpuDecomposition.tsx")
    assert src.is_file() and sha256(src) == lock["sceneSourceSha256"], "scene source changed after preview approval"
    graph = glb_json(glb)
    names = [n.get("name", "") for n in graph["nodes"]]
    counts = Counter(names)
    assert all(counts[x] == 1 for x in REQUIRED), f"anchors absent or duplicated: { {x:counts[x] for x in REQUIRED if counts[x]!=1} }"
    assert len(graph.get("meshes", [])) >= 30, "GPU 3D geometry too sparse"
    assert len(graph.get("materials", [])) >= 4, "insufficient distinctive PBR material entries"
    idx = {n: names.index(n) for n in REQUIRED}
    parent_requirements = {
        "FAN_ASSEMBLY": ["FAN_LEFT", "FAN_CENTER", "FAN_RIGHT"],
        "HEATSINK": ["HEATSINK_FINS", "HEATPIPE_BUNDLE", "COLD_PLATE"],
        "PCB_ASSEMBLY": ["PCB", "GPU_DIE", "VRAM_CHIPS", "VRM_COMPONENTS", "PCIE_FINGERS", "POWER_8PIN", "IO_BRACKET"],
    }
    for parent, children in parent_requirements.items():
        members = descendants(graph, idx[parent])
        assert all(idx[c] in members for c in children), f"broken ancestor tree below {parent}"
    for fan in ["FAN_LEFT", "FAN_CENTER", "FAN_RIGHT"]:
        members = descendants(graph, idx[fan])
        assert sum("mesh" in graph["nodes"][j] for j in members) >= 6, f"{fan} not physically bladed"
    members = descendants(graph, idx["HEATSINK_FINS"])
    assert sum("mesh" in graph["nodes"][j] for j in members) >= 35, "heatsink lacks separate fins"
    animation = json.loads(motion.read_text())
    assert (animation.get("schemaVersion"), animation.get("fps"), animation.get("durationInFrames")) == (1, 30, 450)
    for name in MOVING:
        m = animation["nodes"][name]
        assert 90 <= m["startFrame"] < m["endFrame"] <= 329, f"bad motion bounds: {name}"
        assert m["easing"] == "smoothstep"
        for stage in ("from", "to"):
            for axis in ("position", "rotation"):
                values = m[stage][axis]
                assert isinstance(values, list) and len(values) == 3 and all(isinstance(v,(int,float)) and abs(v) < 12 for v in values), f"invalid {name}.{stage}.{axis}"
        assert all(abs(v) < 1e-7 for v in m["from"]["position"] + m["from"]["rotation"]), f"nonzero from delta: {name}"
    # This cannot replace visual proofs. It does prevent a repeat of the old,
    # mechanically contradictory front-shroud / trapped-fan endpoint.
    shroud_z = animation["nodes"]["FRONT_SHROUD"]["to"]["position"][2]
    fans = [animation["nodes"][n]["to"]["position"][2] for n in ("FAN_LEFT", "FAN_CENTER", "FAN_RIGHT")]
    assert min(fans) - shroud_z >= 0.32, f"fans move behind/inside front shroud: fans={fans}, shroud={shroud_z}"
    assert animation["nodes"]["FRONT_SHROUD"]["startFrame"] >= min(animation["nodes"][n]["startFrame"] for n in ("FAN_LEFT","FAN_CENTER","FAN_RIGHT")), "front shroud begins before fans release"
    print(json.dumps({
        "preflight": "ASSETS_PASS", "sha256": {"glb":actual_glb,"motion":actual_motion},
        "nodes":len(graph["nodes"]),"meshes":len(graph["meshes"]),
        "materials":len(graph["materials"]),"minFanToShroudFinalDeltaZ":round(min(fans)-shroud_z,4),
        "note":"Endpoint offset check only; true mesh and screen-space clearances require native moving visual proof"
    }, indent=2))


def main() -> None:
    assert len(sys.argv) in (3,4), "usage: verify_polish3.py lock LOCK or assets DIRECTORY LOCK"
    mode = sys.argv[1]
    if mode == "lock":
        assert len(sys.argv) == 3
        lock_check(pathlib.Path(sys.argv[2]))
    elif mode == "assets":
        assert len(sys.argv) == 4
        asset_check(pathlib.Path(sys.argv[2]), lock_check(pathlib.Path(sys.argv[3])))
    else:
        raise AssertionError(f"unknown mode {mode}")


if __name__ == "__main__":
    try:
        main()
    except (AssertionError, ValueError, KeyError, OSError, TypeError, IndexError) as err:
        sys.exit("POLISH 03 PREFLIGHT FAILED: " + str(err))
