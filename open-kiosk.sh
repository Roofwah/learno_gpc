#!/bin/bash
cd "$(dirname "$0")"

KIOSK="${1:-}"
PORT="${GPC_PORT:-3001}"

if [ -z "$KIOSK" ]; then
  read -r -p "Kiosk number (1-8): " KIOSK
fi

URL="http://127.0.0.1:${PORT}/?kiosk=${KIOSK}"
if [ -f hub-address.txt ]; then
  HUB_IP=$(tr -d '[:space:]' < hub-address.txt)
  [ -n "$HUB_IP" ] && echo "http://${HUB_IP}:${PORT}" > public/hub-socket-url.txt
fi
echo "Opening $URL"
open "$URL"
