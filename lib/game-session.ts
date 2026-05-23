import type { Server } from 'socket.io'
import type {
  GameSession,
  KioskState,
  PresenterCommand,
  SessionStatePayload,
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from './socket-types'
import { formatSessionId, LAST_SLIDE_INDEX } from './session'
import {
  getEventLeaderboard,
  getSessionLeaderboard,
  getSessionPrizeWinners,
  getLeaderboard,
  loadStoredSession,
  saveStoredSession,
  saveScore,
  resetScores,
} from './db'
import type { ScoreSubmission } from './socket-types'

type Io = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>

let currentSession: GameSession | null = loadStoredSession()
if (currentSession) {
  console.log(`[session] restored active session ${currentSession.id}`)
}

export function getCurrentSession(): GameSession | null {
  return currentSession
}

export function buildSessionStatePayload(): SessionStatePayload {
  const sessionId = currentSession?.id ?? ''
  return {
    session: currentSession,
    sessionLeaderboard: sessionId ? getSessionLeaderboard(sessionId) : [],
    sessionPrizeWinners: sessionId ? getSessionPrizeWinners(sessionId) : [],
    eventLeaderboard: getEventLeaderboard(),
  }
}

export function emitSessionState(io: Io) {
  const payload = buildSessionStatePayload()
  io.to('presenters').emit('session_state_update', payload)
  io.to('kiosks').emit('session_state_update', payload)
}

/** Creates a session when missing (e.g. debug flow without master New Session). */
export function ensureActiveSession(
  io: Io,
  status: GameSession['status'] = 'running'
): GameSession {
  if (currentSession) return currentSession
  currentSession = {
    id: formatSessionId(),
    startedAt: new Date().toISOString(),
    status,
  }
  saveStoredSession(currentSession)
  console.warn(
    `[session] auto-created session ${currentSession.id} — use master New Session for live events`
  )
  emitSessionState(io)
  return currentSession
}

export function startNewSession(
  io: Io,
  kioskRegistry: Map<string, KioskState>
): GameSession {
  const session: GameSession = {
    id: formatSessionId(),
    startedAt: new Date().toISOString(),
    status: 'registration',
  }
  currentSession = session
  saveStoredSession(session)

  for (const [kioskId, kiosk] of kioskRegistry.entries()) {
    kioskRegistry.set(kioskId, {
      ...kiosk,
      screen: 'welcome',
      participant: null,
      quizProgress: null,
    })
  }

  const resetCmd: PresenterCommand = { type: 'reset_kiosk', kioskId: 'all' }
  io.to('kiosks').emit('presenter_command', resetCmd)
  io.to('presenters').emit('kiosk_status_update', Array.from(kioskRegistry.values()))
  emitSessionState(io)

  console.log(`[session] new session ${session.id}`)
  return session
}

/** Push slide to registered kiosks on waiting or presentation (auto-starts slides from wait). */
export function applySlideToKiosks(
  io: Io,
  kioskRegistry: Map<string, KioskState>,
  slide: number
): number {
  const clamped = Math.min(Math.max(Math.floor(slide), 0), LAST_SLIDE_INDEX)
  let touched = 0

  for (const kiosk of kioskRegistry.values()) {
    if (!kiosk.connected || !kiosk.participant) continue
    if (kiosk.screen !== 'waiting' && kiosk.screen !== 'presentation') continue

    if (kiosk.screen === 'waiting') {
      io.to(kiosk.socketId).emit('presenter_command', {
        type: 'go_to_screen',
        kioskId: kiosk.kioskId,
        payload: { screen: 'presentation', sessionId: currentSession?.id },
      })
    }
    io.to(kiosk.socketId).emit('presenter_command', {
      type: 'set_slide',
      kioskId: kiosk.kioskId,
      payload: { slide: clamped },
    })
    kioskRegistry.set(kiosk.kioskId, { ...kiosk, screen: 'presentation' })
    touched++
  }

  if (touched > 0) {
    io.to('presenters').emit('kiosk_status_update', Array.from(kioskRegistry.values()))
  }
  return clamped
}

export function beginPresentation(io: Io, kioskRegistry: Map<string, KioskState>) {
  ensureActiveSession(io, 'running')
  if (!currentSession) return
  currentSession = { ...currentSession, status: 'running' }
  saveStoredSession(currentSession)
  const count = applySlideToKiosks(io, kioskRegistry, 0)
  emitSessionState(io)
  console.log(`[session] presentation begun for ${currentSession.id} (${count} kiosk(s))`)
}

export function handleScoreSubmit(io: Io, data: ScoreSubmission) {
  const sessionId = data.sessionId?.trim() || 'offline'
  if (sessionId !== 'offline') {
    const session = ensureActiveSession(io, 'running')
    const ok = saveScore({ ...data, sessionId: session.id })
    if (!ok) return
    currentSession = { ...session, status: 'complete' }
    saveStoredSession(currentSession)
    io.emit('leaderboard_update', getLeaderboard())
    emitSessionState(io)
    return
  }

  const ok = saveScore({ ...data, sessionId: 'offline' })
  if (!ok) return
  io.emit('leaderboard_update', getLeaderboard())
  emitSessionState(io)
}

export function handlePresenterCommand(
  io: Io,
  cmd: PresenterCommand,
  kioskRegistry: Map<string, KioskState>
) {
  if (cmd.type === 'start_new_session') {
    startNewSession(io, kioskRegistry)
    return true
  }
  if (cmd.type === 'begin_presentation') {
    beginPresentation(io, kioskRegistry)
    return true
  }
  return false
}

export async function resetAllScores(io: Io, kioskRegistry: Map<string, KioskState>) {
  resetScores()
  saveStoredSession(null)
  currentSession = null
  startNewSession(io, kioskRegistry)
  io.emit('leaderboard_update', [])
  emitSessionState(io)
}
