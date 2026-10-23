#!/usr/bin/env bash
set -euo pipefail
# Pinned review-only third-party distribution. Not approved for Premium Car Library.
UPSTREAM_COMMIT="00f08b282d6b2c0f6834f91c582f9d539dcc02fd"
BLOB_SHA1="2d2229e5c9207498ca30f78f85294ccb675b8e59"
NAME="2023_porsche_911_gt3_rs_2.7_carrera_tribute_992.glb"
DEST="public/porsche-photorealism/911-gt3-rs-992.glb"
mkdir -p "$(dirname "$DEST")" out/porsche-photorealism
URL="https://raw.githubusercontent.com/Nissmo89/Supercar-Vault-3D/$UPSTREAM_COMMIT/models/$NAME"
curl --fail --location --retry 3 --retry-all-errors --connect-timeout 30 --max-time 300 --silent --show-error "$URL" -o "$DEST"
python3 - "$DEST" "$BLOB_SHA1" <<'PY'
import hashlib, pathlib, struct, sys
data=pathlib.Path(sys.argv[1]).read_bytes()
assert len(data)>100000 and data[:4]==b"glTF", "Not a genuine nonempty GLB"
version,size=struct.unpack_from("<II", data,4)
assert version==2 and size==len(data), "Invalid GLB header length/version"
git_sha=hashlib.sha1(b"blob "+str(len(data)).encode()+b"\x00"+data).hexdigest()
assert git_sha==sys.argv[2], f"Git blob checksum mismatch: {git_sha}"
print("Pinned source GLB verified",len(data),"bytes",git_sha)
PY
sha256sum "$DEST" | tee out/porsche-photorealism/source-sha256.txt
# Bundle the decoder locally rather than downloading executable JS from an unpinned CDN at render-time.
mkdir -p public/porsche-photorealism/draco
cp node_modules/three/examples/jsm/libs/draco/draco_decoder.js public/porsche-photorealism/draco/
cp node_modules/three/examples/jsm/libs/draco/draco_wasm_wrapper.js public/porsche-photorealism/draco/
cp node_modules/three/examples/jsm/libs/draco/draco_decoder.wasm public/porsche-photorealism/draco/
