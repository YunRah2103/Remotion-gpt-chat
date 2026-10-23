import importlib.util,tempfile,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('native_media_sources',Path(__file__).parents[2]/'scripts/modelling-kit/native_media_sources.py')
class NativeMediaSources(unittest.TestCase):
 def test_indirect_mirror_lists_and_signed_sources_keep_security_configuration(self):
  module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);(root/'sources.list.d').mkdir()
   mirror=root/'apt-mirrors.txt';mirror.write_text('http://azure.archive.ubuntu.com/ubuntu\nhttps://archive.ubuntu.com/ubuntu\n')
   source=root/'sources.list.d/ubuntu.sources';source.write_text('URIs: mirror+file:/etc/apt/apt-mirrors.txt\nSuites: noble noble-security\nSigned-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg\n')
   original=source.read_text();module.configure(root)
   self.assertNotIn('http://',mirror.read_text());self.assertEqual(source.read_text(),original)
   before=mirror.read_bytes();module.configure(root);self.assertEqual(mirror.read_bytes(),before)

class NativeMediaRetry(unittest.TestCase):
 def test_transient_failures_retry_but_exhaustion_still_fails(self):
  import subprocess
  script=Path(__file__).parents[2]/'scripts/modelling-kit/install-native-media.sh'
  with tempfile.TemporaryDirectory() as tmp:
   state=Path(tmp)/'count';worker=Path(tmp)/'worker'
   worker.write_text('#!/bin/bash\nn=0; [ ! -f "$1" ] || read -r n < "$1"\nn=$((n+1)); echo "$n" > "$1"\n[ "$n" -ge 2 ]\n');worker.chmod(0o755)
   result=subprocess.run(['bash','-c',f'source "{script}"; retry_native_media 2 "{worker}" "{state}"'],capture_output=True,text=True)
   self.assertEqual(result.returncode,0,result.stderr);self.assertEqual(state.read_text().strip(),'2')
   result=subprocess.run(['bash','-c',f'source "{script}"; retry_native_media 2 false'],capture_output=True,text=True)
   self.assertNotEqual(result.returncode,0)
