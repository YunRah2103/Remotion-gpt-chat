"""Offline GLB parser and hash regression tests; no unlicensed downloads."""
import importlib.util
import json
import pathlib
import struct
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("external_cars", ROOT / "production/asset-library/fetch_cars.py")
cars = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cars)


def fixture():
    meta = {
        "asset": {"version": "2.0"},
        "buffers": [{"byteLength": 36}],
        "bufferViews": [{"buffer": 0, "byteOffset": 0, "byteLength": 36}],
        "accessors": [{"bufferView": 0, "componentType": 5126, "count": 3, "type": "VEC3"}],
        "meshes": [{"primitives": [{"attributes": {"POSITION": 0}}]}],
        "materials": [{"name": "paint"}],
        "nodes": [{"mesh": 0}],
    }
    chunk = json.dumps(meta).encode()
    chunk += b" " * ((4 - len(chunk) % 4) % 4)
    data = b"\x00" * 36
    total = 12 + 8 + len(chunk) + 8 + len(data)
    return (struct.pack("<4sII", b"glTF", 2, total)
            + struct.pack("<II", len(chunk), 0x4E4F534A) + chunk
            + struct.pack("<II", len(data), 0x004E4942) + data)


class ExternalCarAuditTests(unittest.TestCase):
    def test_inspects_real_mesh_accessors_without_external_libs(self):
        glb = fixture()
        result = cars.inspect_glb(glb)
        self.assertEqual(result["meshes"], 1)
        self.assertEqual(result["primitives"], 1)
        self.assertEqual(result["vertices"], 3)
        self.assertEqual(result["estimatedTriangles"], 1)
        self.assertEqual(result["materials"], 1)
        self.assertEqual(result["meshDensityHint"], "light")

    def test_bad_headers_and_empty_geometry_are_rejected(self):
        data = fixture()
        for bad in (b"glTF", b"xxxx" + data[4:], data[:-4]):
            with self.assertRaises(ValueError):
                cars.inspect_glb(bad)
        # A valid-looking GLB container is not sufficient.
        empty = {"asset": {"version": "2.0"}, "meshes": []}
        chunk = json.dumps(empty).encode()
        chunk += b" " * ((4 - len(chunk) % 4) % 4)
        glb = (struct.pack("<4sII", b"glTF", 2, 20 + len(chunk))
               + struct.pack("<II", len(chunk), 0x4E4F534A) + chunk)
        with self.assertRaisesRegex(ValueError, "no mesh"):
            cars.inspect_glb(glb)

    def test_pinned_blob_hash_and_size_checked_before_acceptance(self):
        data = fixture()
        manifest = {"id": "fixture", "sizeBytes": len(data), "gitBlobSha": cars.gitsha(data)}
        report = cars.verify(data, manifest)
        self.assertEqual(report["estimatedTriangles"], 1)
        self.assertIn("PRIVATE REVIEW", report["rights"])
        with self.assertRaisesRegex(ValueError, "integrity mismatch"):
            cars.verify(data, {**manifest, "gitBlobSha": "0" * 40})


if __name__ == "__main__":
    unittest.main()
