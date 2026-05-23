#!/bin/bash
# Clear all scores and session state before the first live session (hub can be stopped).
set -e
cd "$(dirname "$0")"
DATA=".data"
mkdir -p "$DATA"
echo '[]' > "$DATA/scores.json"
rm -f "$DATA/session.json"
echo "Campaign reset: scores cleared, session removed."
echo "This bypasses the Master PIN (organizer-only). Start the hub when done."
