"""Normalise official Ubuntu mirrors without changing suites or signature verification."""
from pathlib import Path

def configure(root=Path('/etc/apt')):
    root=Path(root)
    paths=[root/'sources.list',*(root/'sources.list.d').glob('*.sources'),*(root/'sources.list.d').glob('*.list'),*root.glob('apt-mirrors*.txt')]
    for path in paths:
        if not path.is_file():
            continue
        original=path.read_text()
        changed=original.replace('http://azure.archive.ubuntu.com/ubuntu','https://archive.ubuntu.com/ubuntu').replace('http://archive.ubuntu.com/ubuntu','https://archive.ubuntu.com/ubuntu').replace('http://security.ubuntu.com/ubuntu','https://security.ubuntu.com/ubuntu')
        if changed!=original:
            path.write_text(changed)

if __name__=='__main__':
    configure()
