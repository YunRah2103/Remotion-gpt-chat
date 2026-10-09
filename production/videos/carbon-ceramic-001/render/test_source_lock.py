#!/usr/bin/env python3
"""Actual Git history/diff tests for render source lock, using temporary fixtures."""
import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import source_lock

APPROVAL = "https://github.com/YunRah2103/Remotion-gpt-chat/pull/16"

class SourceLockTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.run_git("init", "-q")
        self.run_git("config", "user.name", "Render Test")
        self.run_git("config", "user.email", "render@example.invalid")
        f = self.root / "src/brakes001/film.tsx"
        f.parent.mkdir(parents=True)
        f.write_text("export const film = 1;\n")
        p = self.root / "public/brake.glb"
        p.parent.mkdir(parents=True)
        p.write_bytes(b"synthetic-asset-not-a-real-glb")
        self.run_git("add", ".")
        self.run_git("commit", "-qm", "approved integration fixture")
        self.approved = self.run_git("rev-parse", "HEAD")
        self.lock = self.root / "lock.json"
        self.save("approved", self.approved)
        self.patcher = patch.object(source_lock, "REPO", self.root)
        self.patcher.start()

    def tearDown(self):
        self.patcher.stop()
        self.temp.cleanup()

    def run_git(self, *args):
        return subprocess.run(["git", *args], cwd=self.root, text=True,
                              capture_output=True, check=True).stdout.strip()

    def save(self, status, sha):
        self.lock.write_text(json.dumps({
            "status": status, "integrationSourceSha": sha,
            "masterApprovalUrl": APPROVAL
        }))

    def test_matching_approved_source_passes(self):
        result = source_lock.inspect(self.lock)
        self.assertTrue(result["ok"], result["errors"])

    def test_pending_status_fails_closed(self):
        self.save("pending", self.approved)
        self.assertFalse(source_lock.inspect(self.lock)["ok"])

    def test_changed_film_source_fails(self):
        f = self.root / "src/brakes001/film.tsx"
        f.write_text("export const film = 2;\n")
        self.run_git("add", ".")
        self.run_git("commit", "-qm", "tamper film")
        self.assertFalse(source_lock.inspect(self.lock)["ok"])

    def test_changed_public_asset_fails(self):
        f = self.root / "public/brake.glb"
        f.write_bytes(b"altered synthetic asset")
        self.run_git("add", ".")
        self.run_git("commit", "-qm", "tamper asset")
        result = source_lock.inspect(self.lock)
        self.assertFalse(result["ok"], result["errors"])

    def test_wrong_ancestry_fails(self):
        self.save("approved", "1" * 40)
        self.assertFalse(source_lock.inspect(self.lock)["ok"])

if __name__ == "__main__":
    unittest.main()
