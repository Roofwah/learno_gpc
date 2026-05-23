#!/bin/bash
cd "$(dirname "$0")"

APP_NAME="Start GPC Kiosk"
SCRIPT_DIR="$(pwd)"
LAUNCHER="${SCRIPT_DIR}/start-kiosk-mac.sh"
APP_DIR="${HOME}/Applications/${APP_NAME}.app/Contents/MacOS"
PLIST="${HOME}/Applications/${APP_NAME}.app/Contents/Info.plist"

mkdir -p "$APP_DIR"

cat > "${APP_DIR}/${APP_NAME}" <<EOF
#!/bin/bash
exec "${LAUNCHER}"
EOF
chmod +x "${APP_DIR}/${APP_NAME}"
chmod +x "${LAUNCHER}"

mkdir -p "$(dirname "$PLIST")"
cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleExecutable</key>
  <string>${APP_NAME}</string>
  <key>CFBundleIdentifier</key>
  <string>com.learno.gpc.kiosk</string>
  <key>CFBundleName</key>
  <string>${APP_NAME}</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
</dict>
</plist>
EOF

echo "Created ${HOME}/Applications/${APP_NAME}.app"
echo "Drag it to the Dock or Desktop."
