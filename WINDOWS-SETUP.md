# learno_gpc — Windows setup

**Hub = Mac.** See **[MAC-HUB.md](./MAC-HUB.md)** for starting the server on the Mac and the correct kiosk URLs. This file is for **Windows kiosk PCs** only.

## Why installs failed before

1. **Do not copy `node_modules` from Mac** — native packages break on Windows.
2. **`better-sqlite3` removed** — scores save to `.data/scores.json` (no C++ build tools needed).
3. **`npm start` used Mac/Linux syntax** — `NODE_ENV=production ts-node` fails in cmd/PowerShell. Fixed with `cross-env` and `start-windows.bat`.
4. **Tarball `npm warn` lines** — usually harmless; only stop if you see **`npm ERR!`** at the end.
5. **Use cmd for batch files** — do not run `cd /d ...` in PowerShell; double-click `.bat` or open **cmd** first.

## Kiosk desktop shortcut (Windows)

On each kiosk PC, after `install-windows.bat` and `hub-address.txt`:

1. Run **`create-kiosk-desktop-shortcut.bat`** once — adds **Start GPC Kiosk** to the desktop.
2. Double-click it, enter kiosk **1**–**8**, local server starts (minimized) and the browser opens `http://127.0.0.1:3001/?kiosk=N`.

Or run `start-kiosk.bat` directly (optional argument: `start-kiosk.bat 3`).

Mac: `chmod +x start-kiosk-mac.sh create-kiosk-desktop-shortcut-mac.sh` then run the create script.

## Deploy zip (copy to kiosk / hub PCs)

From the project folder:

```bat
zip-deploy.bat
```

Mac:

```bash
./zip-deploy.sh
# or: npm run zip-deploy
```

Creates `../learno_gpc-deploy-YYYYMMDD.zip` (no `node_modules`, `.next`, `.data`, `.git`, etc.). Unzip on each machine, then run `install-windows.bat`.

## Install (cmd, not PowerShell)

```bat
cd /d C:\learno-gpc
rd /s /q node_modules
del package-lock.json
install-windows.bat
```

Or manually:

```bat
npm install
npm run build
```

## Run server

Double-click **`start-windows.bat`** or in cmd:

```bat
start-windows.bat
```

## Kiosk media (local on each PC)

Kiosks run **connected to the Mac hub** (presenter drives slides/video/quiz). Each PC opens **`http://127.0.0.1:3001/?kiosk=1`** locally; Socket.io syncs to the Mac via **`public/hub-socket-url.txt`** (from `hub-address.txt` / `./set-hub-ip.sh` on the Mac). **Slides, video, and images** load from that kiosk’s `public\` folder at `127.0.0.1`. Staff **offline mode** (admin cog, PIN) is emergency-only if the hub drops.

Copy onto every kiosk PC:

- `public\slides\slide_01.jpg` … `slide_05.jpg`
- `public\gpcvid.mp4`, `background.mp4`, overlay PNGs, `homecard.png`, etc.

Run `start-windows.bat` on each kiosk (or another static server on port 3001) so `127.0.0.1:3001` serves that `public` folder.

Optional config in `public\`:

- `kiosk-local-url.txt` — one line, local origin (default `http://127.0.0.1:3001`)
- `kiosk-video-url.txt` — full URL to `gpcvid.mp4` if different

Master only sends slide index / “play video” — no image or video bytes over the network.

## Offline mode (staff — admin cog only)

Each kiosk: **Admin** cog (bottom-right), PIN `4321`. Full instructions are in the admin dialog.

- **Enable offline mode** — hub not required; amber **Offline** badge top-right (only public hint)
- Players see normal screens; staff use Begin slides, Next (20s per slide), Castrol EDGE logo to complete session
- Scores: `localStorage` on kiosk, sync to hub `.data/scores.json` on reconnect

## Reset campaign PIN

**New Session** only starts the next round. **Reset campaign** wipes the overall leaderboard and all scores — it requires a PIN on the Master screen.

Default PIN: `4321`. Change it before the event:

1. Copy `campaign-reset-pin.txt.example` to `campaign-reset-pin.txt`
2. Edit the file to your private PIN (one line, no spaces)
3. Restart the hub

Or set environment variable `GPC_RESET_PIN` before starting the server.

Morning wipe without Master UI (organizer PC only): run `reset-campaign.bat` — does not ask for a PIN.

## URLs

- Master: http://localhost:3001/presenter
- Kiosks (each PC): http://127.0.0.1:3001/?kiosk=1 through ?kiosk=8
- Mac hub: http://localhost:3001/presenter — kiosks do not open the Mac IP in the browser

## Mac (unchanged)

```bash
npm install
npm run dev
```
