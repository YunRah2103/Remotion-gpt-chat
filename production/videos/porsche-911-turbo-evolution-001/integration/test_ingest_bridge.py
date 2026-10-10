#!/usr/bin/env python3
"""Offline native FFmpeg source smoke. Original synthetic media, NOT Porsche footage."""
import hashlib
import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from ingest_bridge import build_inventory, build_selection_template, within, GENERATIONS

class BridgeTest(unittest.TestCase):
    def test_fail_closed_empty_import(self):
        with tempfile.TemporaryDirectory() as folder:
            with self.assertRaisesRegex(ValueError, 'no yt-dlp quality report'):
                build_inventory([Path(folder)])

    def test_reject_path_traversal(self):
        with tempfile.TemporaryDirectory() as folder:
            with self.assertRaisesRegex(ValueError, 'relative'):
                within(Path(folder), '../other.mp4')

    def test_30_slots_start_unverified(self):
        template = build_selection_template(
            {'cuts':[{'slot':i+1,'generation':g} for i,g in enumerate(GENERATIONS)],
             'output':{'frames':510}}, {'importedSources':1}
        )
        self.assertEqual(len(template['shots']),30)
        self.assertEqual(template['status'],'INCOMPLETE_MANUAL_SELECTION')
        self.assertFalse(any(s['verifiedMovingVideo'] for s in template['shots']))

    def test_native_source_and_hash_tampering(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder)
            movie=root/'original-testsrc.mp4'
            subprocess.run([
                'ffmpeg','-hide_banner','-v','error','-y','-f','lavfi',
                '-i','testsrc2=size=640x360:rate=30:duration=1',
                '-c:v','libx264','-preset','ultrafast','-crf','18','-pix_fmt','yuv420p',
                str(movie)
            ], check=True,timeout=60)
            q={
                'status':'PASS','fullVideoDecode':'PASS',
                'policy':{'reencoded':False,'upscaled':False},
                'probe':{
                    'file':movie.name,'width':640,'height':360,
                    'fps':30,'bytes':movie.stat().st_size,'durationSeconds':1,
                    'videoCodec':'h264'
                },
                'sourceFileSha256':hashlib.sha256(movie.read_bytes()).hexdigest(),
                'sourceUrl':'https://www.youtube.com/watch?v=abcdefghijk'
            }
            report=root/'original-testsrc.qa.json'
            report.write_text(json.dumps(q))
            inv=build_inventory([root])
            self.assertEqual(inv['importedSources'],1)
            self.assertEqual(inv['verifiedUniquePorscheShots'],0)
            q['sourceFileSha256']='0'*64
            report.write_text(json.dumps(q))
            with self.assertRaisesRegex(ValueError,'SHA256 mismatch'):
                build_inventory([root])

if __name__=='__main__':
    unittest.main()
