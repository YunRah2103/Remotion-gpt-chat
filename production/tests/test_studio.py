import json
import shutil
import struct
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"studio"))
from studio import gallery, inspect_glb, audit_telemetry, register_model, detect_scenes
from voice_sync import export,validate_words,subtitle_cues

def tiny_glb():
    js=json.dumps({"asset":{"version":"2.0"},"nodes":[{"name":"ROOT","children":[1]},{"name":"BRAKE_DISC","mesh":0}],
                   "meshes":[{"name":"vented-rotor"}],"materials":[{"name":"steel"}]}).encode()
    js+=b" "*((-len(js))%4)
    return b"glTF"+struct.pack("<II",2,len(js)+20)+struct.pack("<II",len(js),0x4E4F534A)+js

class StudioTests(unittest.TestCase):
    def test_gallery_created_from_real_image(self):
        with tempfile.TemporaryDirectory() as d:
            base=Path(d)/"source";(base/"thumbnails").mkdir(parents=True)
            Image.new("RGB",(360,240),"#7799bb").save(base/"thumbnails/image.jpg")
            (base/"manifest.json").write_text(json.dumps({"request_id":"abs-001","items":[{
                "id":"brakes","preview":"thumbnails/image.jpg","frames":[],
                "license":"CC0","attribution":"artist","source_url":"https://upload.wikimedia.org/w/a.jpg"}]}))
            r=gallery(base,Path(d)/"gallery")
            self.assertEqual(r["references"],1)
            self.assertTrue((Path(d)/"gallery/media/brakes-0.jpg").stat().st_size>500)
            self.assertIn("Original source",(Path(d)/"gallery/index.html").read_text())

    def test_gallery_blocks_traversal(self):
        with tempfile.TemporaryDirectory() as d:
            base=Path(d)/"b";base.mkdir()
            (base/"manifest.json").write_text(json.dumps({"request_id":"abs-001","items":[{
                "id":"brakes","preview":"../sensitive.jpg","source_url":"https://x/a","license":"CC0"}]}))
            with self.assertRaises(ValueError):gallery(base,Path(d)/"out")

    def test_glb_mesh_and_parent_inspection(self):
        with tempfile.TemporaryDirectory() as d:
            file=Path(d)/"simple.glb";file.write_bytes(tiny_glb())
            r=inspect_glb(file,Path(d)/"result")
            self.assertEqual(r["nodes"],2)
            self.assertEqual(r["meshes"],1)
            self.assertIn("BRAKE_DISC",(Path(d)/"result/hierarchy.md").read_text())
            file.write_bytes(b"bad")
            with self.assertRaises(ValueError):inspect_glb(file,Path(d)/"bad")

    def test_wheel_lock_detection(self):
        with tempfile.TemporaryDirectory() as d:
            path=Path(d)/"trace.csv"
            path.write_text("time_s,vehicle_speed_mps,wheel_omega_rad_s,wheel_radius_m,brake_pressure\n"+
                            "\n".join(f"{i/10:.1f},18,0,0.3,0.8" for i in range(6))+"\n")
            r=audit_telemetry(path,Path(d)/"qa.json")
            self.assertEqual(r["issues"][0]["code"],"sustained_lockup")

    def test_non_increasing_time_fails(self):
        with tempfile.TemporaryDirectory() as d:
            path=Path(d)/"trace.csv"
            path.write_text("time_s,vehicle_speed_mps,wheel_omega_rad_s,wheel_radius_m,brake_pressure\n"+
                            "1,10,32,0.3,0.3\n1,10,32,0.3,0.3\n")
            with self.assertRaises(ValueError):audit_telemetry(path,Path(d)/"out.json")

    def test_model_registration_requires_provenance(self):
        with tempfile.TemporaryDirectory() as d:
            path=Path(d)/"m.glb";path.write_bytes(tiny_glb())
            meta=Path(d)/"meta.json";meta.write_text(json.dumps({
                "id":"brake-rotor","title":"Disc brake",
                "units":"millimetres","license":"Original artwork",
                "source":"Blender","verified_by":"reviewer",
                "animations":["rotation"],"connection_points":["wheel hub"]}))
            r=register_model(path,meta,Path(d)/"proposal.json")
            self.assertEqual(r["status"],"candidate-for-manual-review")
            self.assertEqual(r["node_count"],2)
            meta.write_text('{"id":"brake-rotor"}')
            with self.assertRaises(ValueError):register_model(path,meta,Path(d)/"reject.json")

    def test_word_captions_and_vtt(self):
        words=[{"start":0,"end":.35,"word":"ABS"},
               {"start":.35,"end":.9,"word":"works."},
               {"start":1.1,"end":1.4,"word":"Sensors"},
               {"start":1.4,"end":2,"word":"detect."}]
        with tempfile.TemporaryDirectory() as d:
            result=export(words,d,"test-recording.wav")
            self.assertEqual(result["words"],4)
            self.assertIn("00:00:00,000 --> 00:00:00,900",(Path(d)/"captions.srt").read_text())
            self.assertTrue((Path(d)/"words.json").exists())
        with self.assertRaises(ValueError):validate_words([{"start":2,"end":1,"word":"invalid"}])

    @unittest.skipUnless(shutil.which("ffmpeg") and shutil.which("ffprobe"),"FFmpeg optional")
    def test_actual_ffmpeg_scene_analysis(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/"clip.mp4"
            subprocess.run(["ffmpeg","-v","error","-y","-f","lavfi","-i",
                            "testsrc2=size=320x180:rate=6","-t","1.2","-c:v","libx264",
                            "-pix_fmt","yuv420p",str(p)],check=True)
            result=detect_scenes(p,Path(d)/"frames")
            self.assertGreaterEqual(result["sceneFrames"],1)
            self.assertTrue(list((Path(d)/"frames").glob("*.jpg")))
if __name__=="__main__": unittest.main()
