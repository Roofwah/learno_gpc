'use client'
import { useEffect, useState, useRef } from 'react'
import { getSocket } from '@/lib/socket-client'
import type {
  KioskState,
  ParticipantLeaderboardEntry,
  PresenterCommand,
  GameSession,
} from '@/lib/socket-types'
import KioskGrid from '@/components/presenter/KioskGrid'
import ResetCampaignButton from '@/components/presenter/ResetCampaignButton'
import SessionRoster from '@/components/presenter/SessionRoster'
import { formatTimeTaken } from '@/lib/session'
import { LAST_SLIDE_INDEX, LAST_SLIDE_BEFORE_VIDEO } from '@/lib/session'

export default function PresenterPage() {
  const [kiosks, setKiosks] = useState<KioskState[]>([])
  const [gameSession, setGameSession] = useState<GameSession | null>(null)
  const [sessionPrizeWinners, setSessionPrizeWinners] = useState<ParticipantLeaderboardEntry[]>([])
  const [connected, setConnected] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [compactMode, setCompactMode] = useState(false)
  const slideRef = useRef(0)

  useEffect(() => {
    const socket = getSocket()

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('presenter_register')
    })
    socket.on('disconnect', () => setConnected(false))
    socket.on('kiosk_status_update', setKiosks)
    socket.on('session_state_update', (state) => {
      setGameSession(state.session ?? null)
      setSessionPrizeWinners(state.sessionPrizeWinners ?? [])
    })

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('kiosk_status_update')
      socket.off('session_state_update')
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const compact = params.get('compact')
    const mode = params.get('mode')
    setCompactMode(compact === '1' || compact === 'true' || mode === 'dialog')
  }, [])

  const send = (cmd: PresenterCommand) => {
    getSocket().emit('presenter_command', cmd)
  }

  const broadcast = (type: PresenterCommand['type'], payload?: Record<string, unknown>, kioskId = 'all') => {
    send({ type, kioskId, payload })
  }

  const startNewSession = () => {
    if (!confirm('Start a NEW session? All kiosks reset — players register again.')) return
    setCurrentSlide(0)
    slideRef.current = 0
    broadcast('start_new_session')
  }

  const beginPresentation = () => {
    setCurrentSlide(0)
    slideRef.current = 0
    broadcast('begin_presentation')
    broadcast('set_slide', { slide: 0 })
  }

  const advanceSlide = () => {
    const next = Math.min(currentSlide + 1, LAST_SLIDE_INDEX)
    setCurrentSlide(next)
    slideRef.current = next
    broadcast('set_slide', { slide: next })
  }

  const prevSlide = () => {
    const prev = Math.max(currentSlide - 1, 0)
    setCurrentSlide(prev)
    slideRef.current = prev
    broadcast('set_slide', { slide: prev })
  }

  const onlineCount = kiosks.filter((k) => k.connected).length
  const registeredCount = kiosks.filter((k) => k.participant !== null).length
  const waitingCount = kiosks.filter((k) => k.screen === 'waiting' && k.participant).length
  const presentationCount = kiosks.filter((k) => k.screen === 'presentation' && k.participant).length
  const quizCompleteCount = kiosks.filter((k) => k.screen === 'results' || k.screen === 'leaderboard').length
  const slidesNotStarted = waitingCount > 0 && presentationCount === 0

  const sessionWinners = sessionPrizeWinners ?? []

  if (compactMode) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-black">Master</h1>
            {gameSession?.id && (
              <p className="text-purple-300 font-mono text-sm">Session {gameSession.id}</p>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            <span className={connected ? 'text-green-400' : 'text-red-400'}>
              {connected ? 'Live' : 'Off'}
            </span>
          </div>
        </div>

        <SessionRoster kiosks={kiosks} sessionId={gameSession?.id ?? null} />

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-lg bg-white/5 border border-white/10 px-2 py-2">
            <div className="text-white/40">Online</div>
            <div className="text-lg font-bold">{onlineCount}/8</div>
          </div>
          <div className="rounded-lg bg-white/5 border border-white/10 px-2 py-2">
            <div className="text-white/40">Ready</div>
            <div className="text-lg font-bold text-purple-300">{waitingCount}</div>
          </div>
          <div className="rounded-lg bg-white/5 border border-white/10 px-2 py-2">
            <div className="text-white/40">Done</div>
            <div className="text-lg font-bold text-green-400">{quizCompleteCount}</div>
          </div>
        </div>

        <button
          onClick={startNewSession}
          className="w-full py-3 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-200 font-bold text-sm"
        >
          New Session
        </button>

        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
          <div className="text-xs text-white/40 mb-2">Kiosk slides (after PPT)</div>
          <div className="text-3xl font-black mb-2">
            {currentSlide + 1}
            <span className="text-white/30 text-base">/{LAST_SLIDE_BEFORE_VIDEO}</span>
          </div>
          {slidesNotStarted && (
            <p className="text-amber-300/90 text-xs mb-2">Waiting players — press Begin or Next for slide 1</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="flex-1 py-2 rounded-lg bg-white/10 font-bold disabled:opacity-30"
            >
              Prev
            </button>
            <button
              onClick={advanceSlide}
              disabled={currentSlide >= LAST_SLIDE_INDEX}
              className="flex-1 py-2 rounded-lg bg-purple-600 font-bold disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={beginPresentation}
            className="px-3 py-3 rounded-lg text-left bg-purple-600/25 border border-purple-400/40 font-semibold text-sm"
          >
            Begin — show slide 1 on kiosks
          </button>
          <button
            onClick={() => broadcast('play_video', { src: '/gpcvid.mp4' })}
            className="px-3 py-3 rounded-lg text-left bg-teal-500/20 border border-teal-400/30 text-sm"
          >
            Play Video
          </button>
        </div>
        <p className="text-white/25 text-xs">
          Session leaderboard appears on kiosks after each quiz. Overall leaderboard is on the welcome screen.
        </p>

        {sessionWinners.length > 0 && (
          <div className="rounded-xl bg-white/5 border border-white/10 p-3">
            <div className="text-xs text-white/40 mb-2">Prizes — fastest 5/5</div>
            {sessionWinners.map((e, i) => (
              <div key={e.id ?? `compact-prize-${i}`} className="flex justify-between text-sm py-1">
                <span>
                  {i + 1}. {e.participantName}
                </span>
                <span className="text-white/50">{formatTimeTaken(e.timeTaken)}</span>
              </div>
            ))}
          </div>
        )}

        <ResetCampaignButton compact />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <img src="/flogo25.png" alt="" className="h-10 w-auto mb-2 object-contain object-left" />
          <h1 className="text-3xl font-black">Master</h1>
          {gameSession?.id && (
            <p className="text-purple-300 font-mono text-lg mt-1">Active session: {gameSession.id}</p>
          )}
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <span className={connected ? 'text-green-400' : 'text-red-400'}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
          <span>
            <span className="text-white font-bold">{onlineCount}</span>/8 online
          </span>
          <span>
            <span className="text-white font-bold">{registeredCount}</span> registered
          </span>
          <span>
            <span className="text-purple-300 font-bold">{waitingCount}</span> waiting
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4">Session</h2>
          <SessionRoster kiosks={kiosks} sessionId={gameSession?.id ?? null} />
          <button
            onClick={startNewSession}
            className="mt-4 w-full py-4 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-100 font-bold"
          >
            New Session (reset kiosks)
          </button>
          <p className="text-white/25 text-xs mt-2">
            Generates session ID (e.g. 10:42). Players register, then you begin slides.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-3">
          <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest">Flow</h2>
          {[
            { label: 'Begin — slide 1 on kiosks', action: beginPresentation, color: '#8B5CF6' },
            { label: 'Play Video', action: () => broadcast('play_video', { src: '/gpcvid.mp4' }), color: '#14B8A6' },
          ].map(({ label, action, color }) => (
            <button
              key={label}
              onClick={action}
              className="flex items-center gap-4 px-5 py-4 rounded-xl text-left hover:opacity-90"
              style={{ background: `${color}18`, border: `1px solid ${color}40` }}
            >
              <div className="w-2 h-8 rounded-full" style={{ background: color }} />
              <span className="font-semibold" style={{ color }}>
                {label}
              </span>
            </button>
          ))}
          <p className="text-white/25 text-xs mt-2">
            Leaderboards are automatic on kiosks (session after quiz; overall on welcome).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4">Slide control</h2>
          <div className="text-6xl font-black text-center">{currentSlide + 1}</div>
          <p className="text-center text-white/30 text-sm mb-4">of {LAST_SLIDE_BEFORE_VIDEO} (then video)</p>
          {slidesNotStarted && (
            <p className="text-center text-amber-300/90 text-sm mb-4">
              {waitingCount} player(s) waiting — press <strong>Begin</strong> or <strong>Next</strong> to show slide 1 on kiosks
            </p>
          )}
          <div className="flex gap-3">
            <button onClick={prevSlide} disabled={currentSlide === 0} className="flex-1 py-3 rounded-xl bg-white/10 font-bold disabled:opacity-30">
              ← Prev
            </button>
            <button
              onClick={advanceSlide}
              disabled={currentSlide >= LAST_SLIDE_INDEX}
              className="flex-1 py-3 rounded-xl bg-purple-600 font-bold disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4">
            Prize winners — fastest 5/5 only
          </h2>
          {sessionWinners.length === 0 && <p className="text-white/30">No perfect scores this session yet</p>}
            {sessionWinners.map((e, i) => (
              <div key={e.id ?? `prize-${e.kioskId}-${i}`} className="flex items-center gap-4 py-3 border-b border-white/5">
              <span className="text-2xl w-8">{['🥇', '🥈', '🥉'][i]}</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{e.participantName}</div>
                <div className="text-white/40 text-sm truncate">{e.storeName}</div>
              </div>
              <div className="font-mono font-bold">{formatTimeTaken(e.timeTaken)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <KioskGrid kiosks={kiosks} onReset={(kioskId) => send({ type: 'reset_kiosk', kioskId })} />
      </div>

      <div className="flex justify-end">
        <ResetCampaignButton />
      </div>
    </div>
  )
}
