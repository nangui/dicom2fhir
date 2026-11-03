#!/usr/bin/env bash
# Downloads the pydicom test fixtures from a pinned commit and verifies them
# against SHA256SUMS. The files are committed; this script documents where they
# come from and lets anyone re-fetch and check them.
# Usage: scripts/fetch-fixtures.sh
set -euo pipefail

PYDICOM_COMMIT=db6c2f5775c0b8fa8b87c0303ee6fa7d7bffc5c6
BASE="https://raw.githubusercontent.com/pydicom/pydicom/${PYDICOM_COMMIT}/src/pydicom/data/test_files"
DEST="$(cd "$(dirname "$0")/.." && pwd)/packages/core/test/fixtures/pydicom"
FILES=(CT_small.dcm MR_small.dcm MR_small_implicit.dcm MR_small_bigendian.dcm)

mkdir -p "$DEST"
for f in "${FILES[@]}"; do
  curl -sSfL --max-time 60 -o "$DEST/$f" "$BASE/$f"
  echo "fetched $f"
done

cd "$DEST"
if command -v sha256sum >/dev/null; then sha256sum -c SHA256SUMS; else shasum -a 256 -c SHA256SUMS; fi
