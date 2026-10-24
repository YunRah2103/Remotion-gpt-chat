#!/usr/bin/env bash
set -euo pipefail
# Frozen third-party McLaren Senna model. Attribution: Black Snow, Sketchfab CC BY 4.0, mirror distribution requires rights review.
COMMIT="6c6a4875004713fe23f3a5ae1bc6c6c075214be3"
EXPECT_SHA="119a5ca46c24ff6fda34c98f0e851f22cbdfdc60"
EXPECTED_SIZE=26986852
URL="https://raw.githubusercontent.com/AuraK-7/wild-racing-models/$COMMIT/models/McLaren/mclaren_senna_free.glb"
DEST="public/senna-noir/mclaren_senna_free.glb"
mkdir -p public/senna-noir/draco out/senna-noir
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
sha256sum "$DEST" > out/senna-noir/source-sha256.txt
cp node_modules/three/examples/jsm/libs/draco/draco_decoder.js public/senna-noir/draco/
cp node_modules/three/examples/jsm/libs/draco/draco_wasm_wrapper.js public/senna-noir/draco/
cp node_modules/three/examples/jsm/libs/draco/draco_decoder.wasm public/senna-noir/draco/
