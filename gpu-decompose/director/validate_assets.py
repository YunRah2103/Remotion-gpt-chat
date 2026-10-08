#!/usr/bin/env python3
"""Fail-closed native preflight for the locked XFX Swift triple-fan production."""
import argparse
import hashlib
import json
import pathlib
import struct
import sys

REQUIRED = (
    "GPU_ROOT FAN_ASSEMBLY FAN_LEFT FAN_CENTER FAN_RIGHT FRONT_SHROUD "
    "HEATSINK HEATSINK_FINS HEATPIPE_BUNDLE COLD_PLATE PCB_ASSEMBLY "
    "PCB GPU_DIE VRAM_CHIPS VRM_COMPONENTS PCIE_FINGERS POWER_8PIN "
    "IO_BRACKET BACKPLATE"
).split()
MOVING = (
    "FAN_LEFT FAN_CENTER FAN_RIGHT FRONT_SHROUD HEATSINK "
    "GPU_DIE VRAM_CHIPS PCB_ASSEMBLY BACKPLATE"
).split()
EXPECTED_INTERVALS = {
    "FAN_LEFT": (90, 166), "FAN_CENTER": (90, 166), "FAN_RIGHT": (90, 166),
    "FRONT_SHROUD": (125, 179), "HEATSINK": (184, 250),
    "GPU_DIE": (216, 282), "VRAM_CHIPS": (236, 298),
    "PCB_ASSEMBLY": (260, 322), "BACKPLATE": (284, 329),
}


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            digest.update(b)
    return digest.hexdigest()


def parse_glb(path):
    data = path.read_bytes()
    assert data[:4] == b"glTF" and len(data) >= 20, "not a binary glTF GLB"
    version, length = struct.unpack_from("<II", data, 4)
    assert version == 2 and length == len(data), "bad GLB version/file length"
    chunk_length, chunk_type = struct.unpack_from("<I4s", data, 12)
    assert chunk_type == b"JSON", "GLB must begin with JSON chunk"
    doc = json.loads(data[20:20 + chunk_length])
    assert doc["asset"]["version"].startswith("2."), "GLB requires glTF2"
    return doc


def validate(asset_dir, lock_file=None):
    glb = asset_dir / "xfx_swift_rx9060xt_triple16.glb"
    anim_file = asset_dir / "decomposition.json"
    for path in (glb, anim_file):
        assert path.is_file() and path.stat().st_size > 64, f"missing or empty: {path}"
    graph = parse_glb(glb)
    names = [n.get("name", "") for n in graph["nodes"]]
    counts = {name: names.count(name) for name in REQUIRED}
    assert all(count == 1 for count in counts.values()), f"GLB node count mismatches: {counts}"
    assert len(graph.get("meshes", [])) >= 15, "Not enough genuine GLB 3D mesh structures"
    materials = graph.get("materials", [])
    assert len(materials) >= 3, "Missing physically distinct materials"
    anim = json.loads(anim_file.read_text())
    assert (anim.get("schemaVersion"), anim.get("fps"), anim.get("durationInFrames")) == (1, 30, 450)
    moves = anim.get("nodes", {})
    for name in MOVING:
        m = moves[name]
        lo, hi = EXPECTED_INTERVALS[name]
        assert lo - 12 <= m["startFrame"] <= lo + 12 and hi - 12 <= m["endFrame"] <= hi + 12, (name, m)
        assert m["easing"] == "smoothstep" and m["startFrame"] < m["endFrame"]
        for stage in ("from", "to"):
            transform = m[stage]
            for vector in ("position", "rotation"):
                v = transform[vector]
                assert isinstance(v, list) and len(v) == 3 and all(isinstance(x, (float, int)) and abs(x) < 10 for x in v), (name, stage)
        assert all(abs(v) < 1e-6 for v in m["from"]["position"] + m["from"]["rotation"]), name
    if lock_file:
        lock = json.loads(lock_file.read_text())
        assert isinstance(lock.get("agentASha"), str) and len(lock["agentASha"]) == 40
        if "glbSha256" in lock:
            assert sha(glb) == lock["glbSha256"], "GLB SHA does not match approved handoff lock"
        if "animationSha256" in lock:
            assert sha(anim_file) == lock["animationSha256"], "JSON SHA does not match handoff lock"
    result = {
        "pass": True, "glbSha256": sha(glb), "animationSha256": sha(anim_file),
        "glbSizeBytes": glb.stat().st_size, "meshCount": len(graph["meshes"]),
        "materialCount": len(materials), "nodes": counts,
        "frames": 450, "fps": 30, "format": "XFX Swift RX 9060 XT Triple Fan 16GB",
    }
    print(json.dumps(result, indent=2))
    return result


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("asset_dir", type=pathlib.Path)
    p.add_argument("--lock", type=pathlib.Path)
    args = p.parse_args()
    try:
        validate(args.asset_dir, args.lock)
    except (AssertionError, KeyError, ValueError, IndexError, json.JSONDecodeError) as ex:
        sys.exit("ASSET VALIDATION FAILED: " + str(ex))
