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
