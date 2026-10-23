#!/usr/bin/env bash
# Pin GLB and CC0 license to an immutable upstream git commit and verify blobs.
set -euo pipefail
COMMIT='34499c501908818a2b08e589a7aecf963343cee7'
EXPECTED_GLTF_BLOB='f5b814848453a6c75a48f5047fdadaa7bdc78969'
EXPECTED_LICENSE_BLOB='8f40c549094ff25ff1e2a8cdc597f29f78195b9a'
BASE="https://raw.githubusercontent.com/JaronKBragg7337/spectral-gt-rs/${COMMIT}"
DEST="${1:-public/ep005-agent6}"
mkdir -p "$DEST"
curl --fail --location --retry 4 --retry-all-errors --silent --show-error "${BASE}/spectral_gt_rs_game_ready.glb" --output "${DEST}/spectral_gt_rs_game_ready.glb"
curl --fail --location --retry 4 --retry-all-errors --silent --show-error "${BASE}/LICENSE" --output "${DEST}/UPSTREAM_LICENSE.txt"
GOT_GLTF_BLOB="$(git hash-object "${DEST}/spectral_gt_rs_game_ready.glb")"
GOT_LICENSE_BLOB="$(git hash-object "${DEST}/UPSTREAM_LICENSE.txt")"
[[ "$GOT_GLTF_BLOB" == "$EXPECTED_GLTF_BLOB" ]] || { echo "GLB provenance mismatch: $GOT_GLTF_BLOB" >&2; exit 1; }
[[ "$GOT_LICENSE_BLOB" == "$EXPECTED_LICENSE_BLOB" ]] || { echo "License provenance mismatch: $GOT_LICENSE_BLOB" >&2; exit 1; }
sha256sum "${DEST}/spectral_gt_rs_game_ready.glb" "${DEST}/UPSTREAM_LICENSE.txt" | tee "${DEST}/UPSTREAM_SHA256SUMS.txt"
echo 'CC0 asset and license verified against immutable upstream git blobs.'
