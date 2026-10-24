#!/usr/bin/env python3
"""YUNEX external 96-car private-review acquisition and geometry auditing.

Checks byte identity AND GLB 2.0 structure before accepting a downloaded car.
Mesh density is an inspection signal, NEVER a photorealism or licence score.
"""
import argparse
import hashlib
import json
import pathlib
import struct
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[2]
CAT = ROOT / "production/asset-library/external-car-catalogue.json"


def gitsha(data):
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\x00" + data).hexdigest()


def inspect_glb(data):
    """Return structural GLB metrics without any external decoder dependency."""
    if len(data) < 20:
        raise ValueError("GLB truncated header")
    magic, version, declared_size = struct.unpack_from("<4sII", data)
    if magic != b"glTF" or version != 2 or declared_size != len(data):
        raise ValueError("Invalid GLB 2.0 signature, version or length")
    json_length, chunk_type = struct.unpack_from("<II", data, 12)
    if chunk_type != 0x4E4F534A or json_length < 16 or 20 + json_length > len(data):
        raise ValueError("Invalid GLB JSON chunk")
    try:
        gltf = json.loads(data[20:20 + json_length])
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ValueError("Invalid glTF JSON payload") from exc
    if gltf.get("asset", {}).get("version") != "2.0":
        raise ValueError("Not a glTF 2.0 asset")
    meshes, accessors = gltf.get("meshes", []), gltf.get("accessors", [])
    if not isinstance(meshes, list) or not meshes or not isinstance(accessors, list):
        raise ValueError("GLB has no mesh/accessor data")
    primitive_count = vertex_count = triangle_count = 0
    for mesh in meshes:
        for primitive in mesh.get("primitives", []):
            position_index = primitive.get("attributes", {}).get("POSITION")
            if not isinstance(position_index, int) or not 0 <= position_index < len(accessors):
                raise ValueError("GLB has invalid POSITION accessor")
            vertices = accessors[position_index].get("count", 0)
            if not isinstance(vertices, int) or vertices <= 0:
                raise ValueError("GLB has empty POSITION accessor")
            vertex_count += vertices
            index_id = primitive.get("indices")
            if index_id is not None:
                if not isinstance(index_id, int) or not 0 <= index_id < len(accessors):
                    raise ValueError("GLB has invalid index accessor")
                count = accessors[index_id].get("count", 0)
            else:
                count = vertices
            if not isinstance(count, int) or count <= 0:
                raise ValueError("GLB has empty primitive indices")
            mode = primitive.get("mode", 4)
            triangle_count += (count // 3 if mode == 4 else max(0, count - 2) if mode in (5, 6) else 0)
            primitive_count += 1
    if triangle_count == 0:
        raise ValueError("GLB lacks triangle geometry")
    return {
        "meshes": len(meshes),
        "primitives": primitive_count,
        "vertices": vertex_count,
        "estimatedTriangles": triangle_count,
        "materials": len(gltf.get("materials", [])),
        "textures": len(gltf.get("textures", [])),
        "images": len(gltf.get("images", [])),
        "nodes": len(gltf.get("nodes", [])),
        "meshDensityHint": (
            "dense" if triangle_count >= 200_000
            else "moderate" if triangle_count >= 50_000 else "light"
        ),
    }


def verify(data, item):
    if len(data) != item["sizeBytes"] or gitsha(data) != item["gitBlobSha"]:
        raise ValueError("Pinned source integrity mismatch: " + item["id"])
    return {
        "id": item["id"],
        "bytes": len(data),
        "gitBlobSha": item["gitBlobSha"],
        "sha256": hashlib.sha256(data).hexdigest(),
        "rights": "PRIVATE REVIEW ONLY - source/creator rights unverified",
        **inspect_glb(data),
    }


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--list", action="store_true")
    p.add_argument("--all", action="store_true")
    p.add_argument("--id", action="append", default=[])
    p.add_argument("--allow-unverified", action="store_true",
                   help="Download for private model evaluation only; never public or commercial publication")
    p.add_argument("--dest", default="public/yunex-external-cars")
    a = p.parse_args()
    data = json.loads(CAT.read_text())
    assets = data["assets"]
    if a.list:
        for item in assets:
            print(item["id"], item["category"], item["sizeBytes"], item["licenseStatus"])
        return
    chosen = assets if a.all else [x for x in assets if x["id"] in a.id]
    if not chosen:
        p.error("Choose --id <model-id> or --all; use --list to inspect IDs")
    missing = set(a.id) - {x["id"] for x in chosen}
    if missing:
        p.error("Unknown IDs: " + ", ".join(sorted(missing)))
    if any(not x["commercialUseApproved"] for x in chosen) and not a.allow_unverified:
        p.error("Models have unverified licences. For PRIVATE review only, explicitly add --allow-unverified")
    dest = ROOT / a.dest
    reports = []
    for item in chosen:
        url = ("https://raw.githubusercontent.com/" + data["sourceRepository"] + "/"
               + data["sourceCommit"] + "/" + urllib.parse.quote(item["path"], safe="/"))
        out = dest / (item["id"] + ".glb")
        out.parent.mkdir(parents=True, exist_ok=True)
        if out.exists():
            try:
                report = verify(out.read_bytes(), item)
                reports.append(report)
                print("CACHED VERIFIED", item["id"], report["estimatedTriangles"], "triangles")
                continue
            except ValueError:
                print("INVALID CACHE, replacing", item["id"], flush=True)
        print("DOWNLOADING", item["id"], flush=True)
        with urllib.request.urlopen(url, timeout=180) as response:
            payload = response.read()
        report = verify(payload, item)
        tmp = out.with_suffix(".glb.tmp")
        tmp.write_bytes(payload)
        tmp.replace(out)
        reports.append(report)
        print("VERIFIED", out, len(payload), report["estimatedTriangles"], "triangles")
    report_path = ROOT / "out/imported-cars/external-mesh-audit.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps({
        "policy": "Private review only; geometry density is not a licence or realism score",
        "records": reports,
    }, indent=2) + "\n")
    print("AUDIT", report_path, len(reports), "source-verified GLBs")


if __name__ == "__main__":
    main()
