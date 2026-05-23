#!/bin/bash
cd "$(dirname "$0")"

DESKTOP="$HOME/Desktop"
SRC="$PWD/Start Mac Hub.command"
DEST="$DESKTOP/Start Mac Hub.command"

chmod +x "$SRC"
chmod +x "./start-mac.sh" 2>/dev/null
chmod +x "./set-hub-ip.sh" 2>/dev/null

cp -f "$SRC" "$DEST"
chmod +x "$DEST"

echo ""
echo "Installed on Desktop:"
echo "  Start Mac Hub.command"
echo ""
echo "=== IF THE HUB IS DEAD (novice / lead away) ==="
echo "  1. Double-click \"Start Mac Hub\" on the Mac Desktop"
echo "  2. Wait until the browser opens the Master screen"
echo "  3. On each kiosk: Settings (cog) → Refresh screen"
echo ""
echo "=== FIRST TIME ON THIS MAC ==="
echo "  Run ./set-hub-ip.sh once (enter this Mac Wi-Fi IP)"
echo ""
read -r -p "Press Enter to close…"
