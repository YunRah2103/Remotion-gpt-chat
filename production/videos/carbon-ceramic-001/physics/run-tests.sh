#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../../../.."
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
tsc --target ES2022 --module commonjs --moduleResolution node --strict --skipLibCheck --rootDir src --outDir "$TMP" src/brakes001/motion/brakeState.ts
BRAKE_MOTION_MODULE="$TMP/brakes001/motion/brakeState.js" node --test production/videos/carbon-ceramic-001/physics/brake-motion.test.cjs
