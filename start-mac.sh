#!/bin/bash
cd "$(dirname "$0")"

echo ""
echo "Stopping old servers on port 3001..."
pkill -f "learno_gpc.*ts-node server.ts" 2>/dev/null
sleep 1

echo "Starting learno GPC..."
echo ""
npm run dev
