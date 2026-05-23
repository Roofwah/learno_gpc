#!/bin/bash
cd "$(dirname "$0")"

IP=$(ipconfig getifaddr en0 2>/dev/null)
if [ -z "$IP" ]; then
  IP=$(ipconfig getifaddr en1 2>/dev/null)
fi
if [ -z "$IP" ]; then
  IP=$(ifconfig | awk '/inet / && $2 != "127.0.0.1" && $2 !~ /^169\.254\./ {print $2; exit}')
fi

if [ -z "$IP" ]; then
  echo "Could not detect IP. Enter this Mac's Wi-Fi IPv4 address:"
  read -r IP
fi

echo "$IP" > hub-address.txt
PORT="${GPC_PORT:-3001}"
echo "http://${IP}:${PORT}" > public/hub-socket-url.txt
echo ""
echo "Saved hub-address.txt: $IP"
echo "Saved public/hub-socket-url.txt (for kiosk Socket.io)"
echo ""
echo "Kiosk 1: http://${IP}:3001/?kiosk=1"
echo "Kiosk 2: http://${IP}:3001/?kiosk=2"
echo "Master:  http://${IP}:3001/presenter?compact=1"
echo ""
