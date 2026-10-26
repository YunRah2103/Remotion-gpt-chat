#!/usr/bin/env bash
set -euo pipefail
# Frozen third-party Ferrari F40 model. Attribution: Black Snow, CC BY 4.0.
COMMIT="fd7e851a96cd144ee5e72e217e2a83a9480bfe2f"
EXPECT_SHA="ba7883f03490b2f3e5820d0c0a2f6b0b489b91e9"
EXPECTED_SIZE=8058920
URL="https://raw.githubusercontent.com/sceneview/sceneview.github.io/$COMMIT/models/platforms/ferrari_f40.glb"
DEST="public/f40-noir/ferrari_f40.glb"
mkdir -p public/f40-noir/draco out/f40-noir
curl --fail --location --retry 4 --retry-all-errors --connect-timeout 30 --max-time 300 --silent --show-error "$URL" -o "$DEST"
python3 - "$DEST" "$EXPECT_SHA" "$EXPECTED_SIZE" <<'PY'
from pathlib import Path
import hashlib,struct,sys
data=Path(sys.argv[1]).read_bytes()
assert len(data)==int(sys.argv[3]),(len(data),sys.argv[3])
assert data[:4]==b'glTF', 'Downloaded car is not a GLB'
version,size=struct.unpack_from('<II',data,4)
assert version==2 and size==len(data), 'Invalid glTF 2.0 structure'
gitblob=hashlib.sha1(b'blob '+str(len(data)).encode()+b'\x00'+data).hexdigest()
assert gitblob==sys.argv[2],('Unexpected binary/model source',gitblob)
print('VERIFIED SOURCE GLB',len(data),'bytes, Git blob',gitblob)
PY
sha256sum "$DEST" > out/f40-noir/source-sha256.txt
cp node_modules/three/examples/jsm/libs/draco/draco_decoder.js public/f40-noir/draco/
cp node_modules/three/examples/jsm/libs/draco/draco_wasm_wrapper.js public/f40-noir/draco/
cp node_modules/three/examples/jsm/libs/draco/draco_decoder.wasm public/f40-noir/draco/
