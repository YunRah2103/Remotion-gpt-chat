import json
import struct
import tempfile
import unittest
from pathlib import Path
import sys

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"tools"))
from catalog import validate,build
from scaffold import create
from gltf_guard import summary,compare
from render import safe_id

def tiny_glb(nodes):
    j=json.dumps({"asset":{"version":"2.0"},"nodes":nodes}).encode()
    j+=b" " * ((-len(j))%4)
    return b"glTF"+struct.pack("<II",2,len(j)+20)+struct.pack("<II",len(j),0x4E4F534A)+j

class ProductionSuiteTests(unittest.TestCase):
    def test_empty_catalog_generates_valid_gallery(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d);(p/"catalog.json").write_text('{"schemaVersion":1,"videos":[]}')
            self.assertEqual(build(p/"catalog.json",p/"site"),0)
            self.assertIn("Production gallery ready",(p/"site/index.html").read_text())

    def test_catalog_rejects_duplicate_slug_and_unsafe_url(self):
        with self.assertRaises(ValueError):
            validate({"schemaVersion":1,"videos":[{"slug":"a","title":"A","url":"javascript:alert(1)"}]})
        with self.assertRaises(ValueError):
            validate({"schemaVersion":1,"videos":[{"slug":"x","title":"A"},{"slug":"x","title":"B"}]})

    def test_scaffold_not_overwritten(self):
        with tempfile.TemporaryDirectory() as d:
            p=create("abs-001","How ABS works",25,30,d)
            self.assertEqual(json.loads((p/"brief.json").read_text())["durationInFrames"],750)
            with self.assertRaises(FileExistsError):
                create("abs-001","Again",25,30,d)

    def test_comp_id_validation(self):
        self.assertEqual(safe_id("XfxSwiftDecomposition"),"XfxSwiftDecomposition")
        for bad in ["-x","x;touch /tmp/a","../other","x" * 90]:
            with self.assertRaises(ValueError):safe_id(bad)

    def test_glb_anchor_integrity(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/"a.glb";q=Path(d)/"b.glb"
            p.write_bytes(tiny_glb([{"name":"ROOT","children":[1]},{"name":"WHEEL"}]))
            q.write_bytes(tiny_glb([{"name":"ROOT","children":[1]},{"name":"WHEEL"}]))
            self.assertEqual(summary(p,["WHEEL"])["nodes"],2)
            self.assertEqual(compare(p,q,["WHEEL"])["requiredAnchorsVerified"],["WHEEL"])
            q.write_bytes(tiny_glb([{"name":"ROOT"},{"name":"WHEEL"}]))
            with self.assertRaises(ValueError):compare(p,q,["WHEEL"])

if __name__=="__main__":unittest.main()
