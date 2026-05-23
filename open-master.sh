#!/bin/bash
cd "$(dirname "$0")"
PORT="${GPC_PORT:-3001}"

if [ -f hub-address.txt ]; then
  HUB_IP=$(tr -d '[:space:]' < hub-address.txt)
  open "http://${HUB_IP}:${PORT}/presenter?compact=1"
else
  open "http://localhost:${PORT}/presenter?compact=1"
fi
