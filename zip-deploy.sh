#!/bin/bash
# Create a deploy zip of learno_gpc (no node_modules, .next, runtime data, etc.)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
PARENT="$(dirname "$ROOT")"
NAME="$(basename "$ROOT")"
STAMP="$(date +%Y%m%d-%H%M%S)"
ZIP_PREFIX="${ZIP_PREFIX:-im}"
ZIP_NAME="${ZIP_PREFIX}-${STAMP}.zip"
OUTPUT="${PARENT}/${ZIP_NAME}"
STAGING="$(mktemp -d "${TMPDIR:-/tmp}/learno-gpc-zip.XXXXXX")"
BUILT_AT="$(date '+%Y-%m-%d %H:%M:%S %Z')"

cleanup() {
  rm -rf "$STAGING"
}
trap cleanup EXIT

echo "Packaging ${NAME} → ${OUTPUT}"

rsync -a \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude '.data' \
  --exclude '.env' \
  --exclude '.env.*' \
  --exclude '.DS_Store' \
  --exclude 'Thumbs.db' \
  --exclude '*.zip' \
  --exclude 'tsconfig.tsbuildinfo' \
  --exclude '.cursor' \
  --exclude 'coverage' \
  --exclude 'campaign-reset-pin.txt' \
  "$ROOT/" "$STAGING/${NAME}/"

cat > "$STAGING/${NAME}/BUILD.txt" <<EOF
learno GPC deploy package
Built: ${BUILT_AT}
Zip file: ${ZIP_NAME}
Mac hub: run ./set-hub-ip.sh then ./start-mac.sh
Windows kiosk: delete old folder, extract this zip, install-windows.bat, create-kiosk-desktop-shortcut.bat
EOF

(
  cd "$STAGING"
  zip -r -q "$OUTPUT" "$NAME"
)

SIZE="$(du -h "$OUTPUT" | cut -f1 | xargs)"
echo ""
echo "Done: ${OUTPUT} (${SIZE})"
echo "Always use the newest im-YYYYMMDD-HHMMSS.zip — higher date/time = latest build."
echo "On each PC: delete old learno_gpc folder, unzip fresh, run install-windows.bat."
