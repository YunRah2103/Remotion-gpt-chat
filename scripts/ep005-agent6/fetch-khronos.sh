#!/usr/bin/env bash
set -euo pipefail
# Superior replacement source candidate; explicitly CC-BY 4.0, with immutable file and license.
REV='15cd02d304e54cb42a4db4eefe719f76190f4b68'
REPO='https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets'
PATH_PREFIX='Models/CarConcept'
ASSET_BLOB='391795d5e3f7daa5519ec2e077e8def16bcecdd7'
# LICENSE.md must be fetched and kept with every build for attribution.
DEST='public/ep005-agent6-khronos'
mkdir -p "$DEST"
curl --fail --location --retry 4 --retry-all-errors --silent --show-error "$REPO/$REV/$PATH_PREFIX/GLB/CarConcept.glb" -o "$DEST/CarConcept.glb"
curl --fail --location --retry 4 --retry-all-errors --silent --show-error "$REPO/$REV/$PATH_PREFIX/LICENSE.md" -o "$DEST/LICENSE.md"
test "$(git hash-object "$DEST/CarConcept.glb")" = "$ASSET_BLOB" || { echo 'The Khronos asset source blob has changed unexpectedly'; exit 1; }
grep -q 'Creative Commons Attribution 4.0' "$DEST/LICENSE.md" || { echo 'Expected CC-BY license absent'; exit 1; }
sha256sum "$DEST/CarConcept.glb" "$DEST/LICENSE.md" > "$DEST/SHA256SUMS.txt"
echo 'Fetched independently reviewed KhronosGroup CC-BY asset at immutable git commit.'
