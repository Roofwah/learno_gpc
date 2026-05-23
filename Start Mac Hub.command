#!/bin/bash
cd "$(dirname "$0")"

clear
echo ""
echo "========================================"
echo "  LEARNO GPC — MAC HUB"
echo "========================================"
echo ""
echo "  Leave this window OPEN all day."
echo "  To stop the hub: close this window."
echo ""
echo "  Master screen opens in your browser shortly."
echo ""

(sleep 12 && open "http://localhost:3001/presenter?compact=1" 2>/dev/null) &

exec caffeinate -dims ./start-mac.sh
