#!/usr/bin/env bash
set -euo pipefail
# Completely different HYPR:IMPS Manthey model, NOT previous Ddiaz/Carrera Tribute model.
# GitHub mirror preserves original glTF embedded author/title/license metadata.
UPSTREAM_COMMIT="afc3c19c8a29f28e253e2cee4285bbb4b2c92a1e"
BLOB_SHA1="4642ff67ba3c0570e0d36ee94bbc843b040e5346"
NAME="2024_manthey_racing_porsche_911_gt3_rs.glb"
DEST="public/porsche-manthey/manthey-992.glb"
mkdir -p "$(dirname "$DEST")" out/porsche-manthey
URL="https://raw.githubusercontent.com/Priyanshh1407/porsche-react/$UPSTREAM_COMMIT/porsche-react-master/public/$NAME"
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
sha256sum "$DEST" | tee out/porsche-manthey/source-sha256.txt
# Bundle the decoder locally rather than downloading executable JS from an unpinned CDN at render-time.
mkdir -p public/porsche-manthey/draco
cp node_modules/three/examples/jsm/libs/draco/draco_decoder.js public/porsche-manthey/draco/
cp node_modules/three/examples/jsm/libs/draco/draco_wasm_wrapper.js public/porsche-manthey/draco/
cp node_modules/three/examples/jsm/libs/draco/draco_decoder.wasm public/porsche-manthey/draco/
