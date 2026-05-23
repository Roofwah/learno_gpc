#!/bin/bash
cd "$(dirname "$0")"

PORT="${GPC_PORT:-3001}"
KIOSK="${1:-}"

if [ -z "$KIOSK" ]; then
  read -r -p "Kiosk number (1-8): " KIOSK
fi

KIOSK="${KIOSK// /}"
if ! [[ "$KIOSK" =~ ^[1-8]$ ]]; then
  echo "Invalid kiosk number. Use 1 through 8."
  exit 1
fi

echo "$KIOSK" > kiosk-number.txt

URL="http://127.0.0.1:${PORT}/?kiosk=${KIOSK}"

if [ -f hub-address.txt ]; then
  HUB_IP=$(tr -d '[:space:]' < hub-address.txt)
  if [ -n "$HUB_IP" ]; then
    echo "http://${HUB_IP}:${PORT}" > public/hub-socket-url.txt
    echo "Mac hub: http://${HUB_IP}:${PORT}"
  fi
else
  echo "WARNING: No hub-address.txt — copy from Mac (./set-hub-ip.sh)"
fi

if ! lsof -iTCP:"${PORT}" -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "Starting local server on port ${PORT}..."
  if [ ! -d node_modules ]; then
    echo "Run npm install first."
    exit 1
  fi
  osascript -e "tell application \"Terminal\" to do script \"cd \\\"$(pwd)\\\" && NODE_ENV=production npx ts-node server.ts\"" >/dev/null 2>&1 &
  sleep 8
else
  echo "Local server already running on port ${PORT}."
fi

echo "Opening Kiosk ${KIOSK}: ${URL}"
open "$URL"
