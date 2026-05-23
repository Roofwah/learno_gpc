# Mac hub + Windows kiosks

**The hub is this Mac.** Windows PCs are kiosks only — do not run `start-windows.bat` as the event hub.

## Start the hub (this Mac)

```bash
cd /path/to/learno_gpc
./start-mac.sh
```

Leave that terminal open. You should see:

```text
🚀 learno_gpc running (listening on 0.0.0.0:3001)
   Kiosk 1:   http://192.168.x.x:3001/?kiosk=1
```

Master on this Mac: http://localhost:3001/presenter?compact=1

## Kiosk URLs use **this Mac’s Wi‑Fi IP**

Whenever the Mac’s IP changes (DHCP, different network), run:

```bash
./set-hub-ip.sh
```

Copy `hub-address.txt` to every Windows kiosk folder (or re-run `set-hub-ip.bat` on each kiosk and enter the Mac’s IP).

Kiosk browser URL (each Windows kiosk):

```text
http://127.0.0.1:3001/?kiosk=1
```

Normal operation: kiosks sync to this Mac over Wi‑Fi (`public/hub-socket-url.txt`). The kiosk UI is served on each PC at `127.0.0.1` so the app still opens if the hub IP changes; control stays with the Mac presenter. Offline mode is staff-only backup.

## Windows kiosk (each player PC)

1. Unzip deploy zip → `install-windows.bat`
2. `hub-address.txt` = one line, **Mac hub IP** from `set-hub-ip.sh`
3. `start-kiosk.bat` or desktop shortcut — starts local media server + opens `http://MAC_IP:3001/?kiosk=N`
4. `allow-firewall-port-3001.bat` on **kiosks** only if needed for local `127.0.0.1:3001` — **not** a substitute for the Mac hub

## Mac firewall

If kiosks cannot reach the Mac but `http://localhost:3001` works on the Mac:

**System Settings → Network → Firewall** — allow incoming connections for **Node** / **ts-node**, or temporarily turn firewall off to test.

## Quick checks

| Test | Where | Expected |
|------|--------|----------|
| `http://localhost:3001/?kiosk=1` | This Mac | Works if hub is running |
| `http://127.0.0.1:3001/?kiosk=1` | Windows kiosk | Works offline; needs local server (`start-kiosk.bat`) |
| `http://<Mac-IP>:3001/?kiosk=1` | Optional | Not used for kiosk UI — only `hub-socket-url.txt` needs Mac IP |

On the Mac:

```bash
ipconfig getifaddr en0
cat hub-address.txt
lsof -iTCP:3001 -sTCP:LISTEN
```

Those three should agree while `./start-mac.sh` is running.
