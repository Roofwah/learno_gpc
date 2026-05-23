import { createServer } from 'http'
import os from 'os'
import { parse } from 'url'
import next from 'next'
import { Server as SocketServer } from 'socket.io'
import express from 'express'
import { initDb, getLeaderboard, getSessionLeaderboard, getEventLeaderboard, resetScores } from './lib/db'
import { verifyCampaignResetPin } from './lib/campaign-reset-pin'
import {
  emitSessionState,
  buildSessionStatePayload,
  applySlideToKiosks,
  ensureActiveSession,
  getCurrentSession,
  handlePresenterCommand,
  handleScoreSubmit,
  resetAllScores,
} from './lib/game-session'
import type {
  KioskState,
  PresenterCommand,
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from './lib/socket-types'

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = parseInt(process.env.PORT || '3001', 10)

const app = next({ dev, hostname: 'localhost', port })
const handle = app.getRequestHandler()

const kioskRegistry = new Map<string, KioskState>()

function getLanAddresses(): string[] {
  const addrs: string[] = []
  for (const ifaces of Object.values(os.networkInterfaces())) {
    if (!ifaces) continue
    for (const iface of ifaces) {
      if (String(iface.family) !== 'IPv4') continue
      if (iface.internal) continue
      if (iface.address.startsWith('169.254.')) continue
      addrs.push(iface.address)
    }
  }
  return [...new Set(addrs)]
}

app.prepare().then(() => {
  const expressApp = express()
  expressApp.use(express.json())

  const httpServer = createServer(expressApp)

  const io = new SocketServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    httpServer,
    {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    }
  )

  initDb()

  expressApp.get('/api/leaderboard', (req, res) => {
    const scope = req.query.scope as string | undefined
    const sessionId = req.query.sessionId as string | undefined
    if (scope === 'session' && sessionId) {
      res.json(getSessionLeaderboard(sessionId))
      return
    }
    if (scope === 'event') {
      res.json(getEventLeaderboard())
      return
    }
    res.json(getLeaderboard())
  })

  expressApp.get('/api/session', (_req, res) => {
    res.json(buildSessionStatePayload())
  })

  expressApp.post('/api/master-refresh', (_req, res) => {
    const kiosks = Array.from(kioskRegistry.values())
    io.to('presenters').emit('kiosk_status_update', kiosks)
    io.to('presenters').emit('session_state_update', buildSessionStatePayload())
    res.json({
      ok: true,
      online: kiosks.filter((k) => k.connected).length,
    })
  })

  expressApp.post('/api/reset', async (req, res) => {
    const pin = typeof req.body?.pin === 'string' ? req.body.pin : ''
    if (!verifyCampaignResetPin(pin)) {
      res.status(403).json({ ok: false, error: 'invalid_pin' })
      return
    }
    await resetAllScores(io, kioskRegistry)
    res.json({ ok: true })
  })

  io.on('connection', (socket) => {
    console.log(`[socket] connected: ${socket.id}`)

    socket.on('kiosk_register', (data) => {
      socket.join('kiosks')
      socket.data.role = 'kiosk'
      socket.data.kioskId = data.kioskId

      kioskRegistry.set(data.kioskId, {
        kioskId: data.kioskId,
        socketId: socket.id,
        screen: 'welcome',
        participant: null,
        quizProgress: null,
        connected: true,
      })

      console.log(`[kiosk] registered: ${data.kioskId}`)
      socket.emit('session_state_update', buildSessionStatePayload())
      io.to('presenters').emit('kiosk_status_update', Array.from(kioskRegistry.values()))
    })

    socket.on('presenter_register', () => {
      socket.join('presenters')
      socket.data.role = 'presenter'
      console.log('[presenter] registered')
      socket.emit('kiosk_status_update', Array.from(kioskRegistry.values()))
      socket.emit('leaderboard_update', getLeaderboard())
      socket.emit('session_state_update', buildSessionStatePayload())
    })

    socket.on('presenter_command', (cmd: PresenterCommand) => {
      if (socket.data.role !== 'presenter') return
      console.log(`[presenter] command: ${cmd.type}`, cmd.payload)

      if (handlePresenterCommand(io, cmd, kioskRegistry)) return

      if (cmd.type === 'set_slide') {
        const slide = (cmd.payload?.slide as number) ?? 0
        applySlideToKiosks(io, kioskRegistry, slide)
        return
      }

      if (cmd.kioskId && cmd.kioskId !== 'all') {
        const kiosk = kioskRegistry.get(cmd.kioskId)
        if (kiosk) io.to(kiosk.socketId).emit('presenter_command', cmd)
      } else {
        io.to('kiosks').emit('presenter_command', cmd)
      }
    })

    socket.on('kiosk_state_update', (state: Partial<KioskState>) => {
      const kioskId = socket.data.kioskId
      if (!kioskId) return
      const existing =
        kioskRegistry.get(kioskId) ??
        ({ kioskId, socketId: socket.id, connected: true } as KioskState)
      const updated = { ...existing, ...state, socketId: socket.id }
      kioskRegistry.set(kioskId, updated)
      if (updated.screen === 'waiting' && updated.participant && !getCurrentSession()) {
        ensureActiveSession(io, 'registration')
      }
      io.to('presenters').emit('kiosk_status_update', Array.from(kioskRegistry.values()))
    })

    socket.on('submit_score', (data) => {
      handleScoreSubmit(io, data)
    })

    socket.on('disconnect', () => {
      const kioskId = socket.data.kioskId
      if (kioskId && kioskRegistry.has(kioskId)) {
        const entry = kioskRegistry.get(kioskId)!
        kioskRegistry.set(kioskId, { ...entry, connected: false })
        io.to('presenters').emit('kiosk_status_update', Array.from(kioskRegistry.values()))
      }
      console.log(`[socket] disconnected: ${socket.id}`)
    })
  })

  expressApp.use((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  httpServer.listen(port, hostname, () => {
    const lan = getLanAddresses()
    console.log(`\n🚀 learno_gpc running (listening on 0.0.0.0:${port})`)
    console.log(`   Hub only:  http://localhost:${port}/presenter?compact=1`)
    if (lan.length === 0) {
      console.log(`   Kiosk UI:  http://127.0.0.1:${port}/?kiosk=1  (local server on this PC)`)
    } else {
      for (const ip of lan) {
        console.log(`   Kiosk 1:   http://${ip}:${port}/?kiosk=1`)
        console.log(`   Kiosk 2:   http://${ip}:${port}/?kiosk=2`)
        console.log(`   Master:    http://${ip}:${port}/presenter?compact=1`)
      }
    }
    console.log('')
  })
})
