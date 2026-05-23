'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Socket } from 'socket.io-client'
import { connectSocket, disconnectSocket, tryGetSocket } from '@/lib/socket-client'
import { loadHubSocketUrl, isValidHubSocketUrl } from '@/lib/kiosk-hub-url'
import type { ClientToServerEvents, ServerToClientEvents } from '@/lib/socket-types'
import { selectQuestions, roundScore } from '@/lib/quiz'
import { LAST_SLIDE_INDEX, QUIZ_QUESTION_COUNT } from '@/lib/session'
import type {
  KioskScreen,
  Participant,
  AnswerRecord,
  ParticipantLeaderboardEntry,
  PresenterCommand,
  GameSession,
} from '@/lib/socket-types'

import KioskShell from '@/components/kiosk/KioskShell'
import WelcomeScreen from '@/components/kiosk/WelcomeScreen'
import NameEntryScreen from '@/components/kiosk/NameEntryScreen'
import RegistrationScreen from '@/components/kiosk/RegistrationScreen'
import WaitingScreen from '@/components/kiosk/WaitingScreen'
import PresentationScreen from '@/components/kiosk/PresentationScreen'
import KioskVideoPlayer from '@/components/kiosk/KioskVideoPlayer'
import { loadKioskLocalOverrides, preloadKioskSlides } from '@/lib/kiosk-local-assets'
import { KIOSK_VIDEO_PATH, resolveKioskVideoSrc } from '@/lib/kiosk-video'
import ReadyScreen from '@/components/kiosk/ReadyScreen'
import QuizScreen from '@/components/kiosk/QuizScreen'
import LeaderboardScreen from '@/components/kiosk/LeaderboardScreen'
import ThankYouScreen from '@/components/kiosk/ThankYouScreen'
import KioskAdminPanel from '@/components/kiosk/KioskAdminPanel'
import {
  buildOfflineSessionEntry,
  getLocalEventLeaderboard,
  getPendingHubSyncScores,
  markLocalScoreHubSynced,
  saveLocalScore,
} from '@/lib/kiosk-local-scores'
import {
  getOfflineGameSession,
  isOfflineMode,
  OFFLINE_SESSION_ID,
} from '@/lib/kiosk-offline'

const KIOSK_IDS = ['kiosk-1', 'kiosk-2', 'kiosk-3', 'kiosk-4', 'kiosk-5', 'kiosk-6', 'kiosk-7', 'kiosk-8'] as const
type KioskId = (typeof KIOSK_IDS)[number]

function isValidKioskId(value: string | null): value is KioskId {
  return value !== null && KIOSK_IDS.includes(value as KioskId)
}

function getKioskIdFromUrl(): KioskId | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const kioskParam = params.get('kiosk')
  if (!kioskParam) return null
  const normalized = kioskParam.startsWith('kiosk-') ? kioskParam : `kiosk-${kioskParam}`
  return isValidKioskId(normalized) ? normalized : null
}

function kioskOverlayForScreen(screen: KioskScreen): 'home' | 'slides' | 'video' | 'main' {
  if (screen === 'welcome') return 'home'
  if (screen === 'presentation' || screen === 'thankyou') return 'slides'
  if (screen === 'video') return 'video'
  return 'main'
}

export default function KioskPage() {
  const [screen, setScreen] = useState<KioskScreen>('welcome')
  const [kioskId, setKioskId] = useState<KioskId | null>(null)
  const [playerName, setPlayerName] = useState('')
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [videoSrc, setVideoSrc] = useState(() => resolveKioskVideoSrc(KIOSK_VIDEO_PATH))
  const [quizQuestions, setQuizQuestions] = useState(() => selectQuestions())
  const [quizAnswers, setQuizAnswers] = useState<AnswerRecord[]>([])
  const [totalScore, setTotalScore] = useState(0)
  const [timeTaken, setTimeTaken] = useState(0)
  const [gameSession, setGameSession] = useState<GameSession | null>(null)
  const [sessionLeaderboard, setSessionLeaderboard] = useState<ParticipantLeaderboardEntry[]>([])
  const [eventLeaderboard, setEventLeaderboard] = useState<ParticipantLeaderboardEntry[]>([])
  const [leaderboardMode, setLeaderboardMode] = useState<'session' | 'event'>('session')
  const [connected, setConnected] = useState(false)
  const [hubLinked, setHubLinked] = useState(false)
  const [offlineMode, setOfflineModeState] = useState(false)
  const [offlineRoundEntry, setOfflineRoundEntry] = useState<ParticipantLeaderboardEntry | null>(null)
  const [registrationResume, setRegistrationResume] = useState<{
    step: 'suburb' | 'store'
    state: string
    suburb: string
  } | null>(null)
  const kioskIdRef = useRef<string>('')

  const handleOfflineModeChange = useCallback((enabled: boolean) => {
    setOfflineModeState(enabled)
    setOfflineRoundEntry(null)
    if (enabled) {
      setGameSession(getOfflineGameSession())
      setSessionLeaderboard([])
      setEventLeaderboard(getLocalEventLeaderboard())
    }
  }, [])

  const effectiveSessionId = offlineMode ? OFFLINE_SESSION_ID : gameSession?.id

  const emitKioskState = useCallback(
    (payload: { screen: KioskScreen; participant?: Participant | null }) => {
      if (offlineMode || isOfflineMode()) return
      const s = tryGetSocket()
      if (!s?.connected) return
      s.emit('kiosk_state_update', payload)
    },
    [offlineMode]
  )

  const handleReset = useCallback(() => {
    setScreen('welcome')
    setPlayerName('')
    setParticipant(null)
    setCurrentSlide(0)
    setQuizQuestions(selectQuestions())
    setQuizAnswers([])
    setTotalScore(0)
    setTimeTaken(0)
    setOfflineRoundEntry(null)
    emitKioskState({ screen: 'welcome', participant: null })
  }, [emitKioskState])

  const handleLeaderboardComplete = useCallback(() => {
    handleReset()
  }, [handleReset])

  const showSessionThankYou = useCallback(() => {
    setScreen('thankyou')
    emitKioskState({ screen: 'thankyou' })
  }, [emitKioskState])

  useEffect(() => {
    if (screen !== 'thankyou') return
    const t = setTimeout(() => {
      if (offlineMode) {
        handleReset()
        return
      }
      setLeaderboardMode('session')
      setScreen('leaderboard')
      emitKioskState({ screen: 'leaderboard' })
    }, 2000)
    return () => clearTimeout(t)
  }, [screen, offlineMode, handleReset, emitKioskState])

  useEffect(() => {
    if (isOfflineMode()) {
      setOfflineModeState(true)
      setGameSession(getOfflineGameSession())
      setOfflineRoundEntry(null)
      setSessionLeaderboard([])
    }
    void loadKioskLocalOverrides().then(() => {
      setVideoSrc(resolveKioskVideoSrc(KIOSK_VIDEO_PATH))
      preloadKioskSlides()
    })
    if (!isOfflineMode()) {
      const tryHub = () => {
        void loadHubSocketUrl().then((hub) => {
          setHubLinked(!!hub && isValidHubSocketUrl(hub))
        })
        void connectSocket()
          .then((sock) => {
            setConnected(sock.connected)
          })
          .catch(() => {
            setConnected(false)
            setHubLinked(false)
          })
      }
      tryHub()
      const retry = window.setInterval(() => {
        if (isOfflineMode()) return
        void loadHubSocketUrl().then((hub) => {
          const linked = !!hub && isValidHubSocketUrl(hub)
          if (tryGetSocket()?.connected && linked) return
          disconnectSocket()
          tryHub()
        })
      }, 5000)
      return () => window.clearInterval(retry)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const fromUrl = getKioskIdFromUrl()
    if (fromUrl) {
      localStorage.setItem('gpc_kiosk_id', fromUrl)
      setKioskId(fromUrl)
      return
    }
    const stored = localStorage.getItem('gpc_kiosk_id')
    if (isValidKioskId(stored)) {
      setKioskId(stored)
    }
  }, [])

  useEffect(() => {
    if (!kioskId) return
    kioskIdRef.current = kioskId
    let activeSocket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null
    let cancelled = false

    const syncPendingScores = (socket: Socket<ServerToClientEvents, ClientToServerEvents>) => {
      for (const row of getPendingHubSyncScores()) {
        socket.emit('submit_score', {
          kioskId: row.kioskId,
          participantName: row.participantName,
          storeName: row.storeName,
          storeId: row.storeId,
          brand: row.brand,
          score: row.score,
          timeTaken: row.timeTaken,
          answers: [],
          sessionId: row.sessionId,
          correctCount: row.correctCount,
          totalQuestions: row.totalQuestions,
        })
        markLocalScoreHubSynced(row.sessionId, row.kioskId)
      }
    }

    const bindSocket = (socket: Socket<ServerToClientEvents, ClientToServerEvents>) => {
      activeSocket = socket

      socket.on('connect', () => {
        setConnected(true)
        socket.emit('kiosk_register', { kioskId })
        if (!isOfflineMode()) syncPendingScores(socket)
      })

      socket.on('disconnect', () => setConnected(false))

      socket.on('session_state_update', (state) => {
        if (isOfflineMode()) return
        setGameSession(state.session ?? null)
        setSessionLeaderboard(state.sessionLeaderboard ?? [])
        setEventLeaderboard(state.eventLeaderboard ?? [])
      })

      socket.on('presenter_command', (cmd: PresenterCommand) => {
        if (isOfflineMode()) return
        switch (cmd.type) {
          case 'go_to_screen': {
            const next = cmd.payload?.screen as KioskScreen
            setScreen(next)
            if (next === 'presentation') {
              setCurrentSlide(0)
              setQuizQuestions(selectQuestions())
            }
            break
          }
          case 'advance_slide':
            setCurrentSlide((prev) => Math.min(prev + 1, LAST_SLIDE_INDEX))
            break
          case 'prev_slide':
            setCurrentSlide((prev) => Math.max(prev - 1, 0))
            break
          case 'set_slide':
            setCurrentSlide(Math.min(Math.max((cmd.payload?.slide as number) ?? 0, 0), LAST_SLIDE_INDEX))
            break
          case 'start_quiz':
            setScreen('quiz')
            break
          case 'play_video':
            setVideoSrc(resolveKioskVideoSrc((cmd.payload?.src as string) ?? KIOSK_VIDEO_PATH))
            setScreen('video')
            break
          case 'reset_kiosk':
            handleReset()
            break
        }
      })

      if (socket.connected) {
        setConnected(true)
        socket.emit('kiosk_register', { kioskId })
        if (!isOfflineMode()) syncPendingScores(socket)
      }
    }

    void connectSocket()
      .then(bindSocket)
      .catch(() => {
        if (!cancelled) setConnected(false)
      })

    return () => {
      cancelled = true
      if (activeSocket) {
        activeSocket.off('connect')
        activeSocket.off('disconnect')
        activeSocket.off('presenter_command')
        activeSocket.off('session_state_update')
      }
    }
  }, [kioskId, handleReset])

  const emitStateUpdate = useCallback(
    (newScreen: KioskScreen, extra?: object) => {
      emitKioskState({
        screen: newScreen,
        ...(extra as { participant?: Participant | null }),
      })
    },
    [emitKioskState]
  )

  const handleFlowAdvance = useCallback(() => {
    if (screen === 'waiting' && participant) {
      setCurrentSlide(0)
      setScreen('presentation')
      emitStateUpdate('presentation', { participant })
      return
    }
    if (screen === 'presentation') {
      if (currentSlide < LAST_SLIDE_INDEX) {
        setCurrentSlide((s) => s + 1)
        return
      }
      setScreen('video')
      emitStateUpdate('video')
      return
    }
    if (screen === 'video') {
      setScreen('ready')
      emitStateUpdate('ready')
      return
    }
    if (screen === 'ready') {
      setScreen('quiz')
      emitStateUpdate('quiz')
      return
    }
    if (screen === 'leaderboard' && leaderboardMode === 'session') {
      showSessionThankYou()
    }
  }, [screen, participant, currentSlide, leaderboardMode, showSessionThankYou, emitStateUpdate])

  const handleRegistrationComplete = (p: Participant) => {
    setRegistrationResume(null)
    setParticipant(p)
    setCurrentSlide(0)
    setQuizQuestions(selectQuestions())
    setOfflineRoundEntry(null)
    if (offlineMode) setGameSession(getOfflineGameSession())
    setScreen('waiting')
    emitStateUpdate('waiting', { participant: p })
  }

  const handleChangeStore = useCallback(() => {
    if (!participant) return
    setRegistrationResume({
      step: 'suburb',
      state: participant.state,
      suburb: participant.suburb,
    })
    setParticipant(null)
    setScreen('registration')
    emitStateUpdate('registration', { participant: null })
  }, [participant, emitStateUpdate])

  const handleBeginOfflinePresentation = useCallback(() => {
    setCurrentSlide(0)
    setOfflineRoundEntry(null)
    setScreen('presentation')
  }, [])

  const handleQuizComplete = (answers: AnswerRecord[], score: number, elapsed: number) => {
    const roundedScore = roundScore(score)
    const correctCount = answers.filter((a) => a.correct).length
    setQuizAnswers(answers)
    setTotalScore(roundedScore)
    setTimeTaken(elapsed)
    setLeaderboardMode('session')
    setScreen('leaderboard')
    emitStateUpdate('leaderboard')

    if (!participant) return

    const sessionId = offlineMode ? OFFLINE_SESSION_ID : gameSession?.id ?? OFFLINE_SESSION_ID
    const submission = {
      kioskId: kioskIdRef.current,
      participantName: participant.name,
      storeName: participant.storeName,
      storeId: participant.storeId,
      brand: participant.brand,
      score: roundedScore,
      timeTaken: elapsed,
      answers,
      sessionId,
      correctCount,
      totalQuestions: QUIZ_QUESTION_COUNT,
    }

    saveLocalScore(submission, { hubSynced: false })

    const hubSocket = tryGetSocket()
    if (!offlineMode && connected && hubSocket?.connected) {
      hubSocket.emit('submit_score', submission)
      markLocalScoreHubSynced(sessionId, kioskIdRef.current)
    }

    if (offlineMode) {
      setOfflineRoundEntry(buildOfflineSessionEntry(submission))
    }
  }

  const leaderboardEntries = useMemo(() => {
    if (offlineMode && leaderboardMode === 'session') {
      return offlineRoundEntry ? [offlineRoundEntry] : []
    }
    if (offlineMode) {
      return getLocalEventLeaderboard()
    }
    return leaderboardMode === 'session' ? sessionLeaderboard : eventLeaderboard
  }, [offlineMode, leaderboardMode, sessionLeaderboard, eventLeaderboard, offlineRoundEntry])

  if (!kioskId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8">
        <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-8">
          <h1 className="text-3xl font-black text-white mb-2">Assign this kiosk</h1>
          <p className="text-white/50 mb-6">
            Select the physical kiosk number for this device. This is saved and reused each session.
          </p>
          <div className="grid grid-cols-4 gap-3">
            {KIOSK_IDS.map((id, idx) => (
              <button
                key={id}
                onClick={() => {
                  localStorage.setItem('gpc_kiosk_id', id)
                  setKioskId(id)
                }}
                className="rounded-xl border border-white/20 bg-white/5 px-4 py-6 text-xl font-bold text-white hover:bg-white/10"
              >
                Kiosk {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden">
      <KioskShell
        overlay={kioskOverlayForScreen(screen)}
        onBackToStart={handleReset}
        onDebugAdvance={offlineMode ? undefined : handleFlowAdvance}
        staffControls={
          <KioskAdminPanel offlineMode={offlineMode} onOfflineModeChange={handleOfflineModeChange} />
        }
      >
        <div
          className={`absolute top-4 right-4 z-[60] flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            offlineMode ? 'bg-amber-500/20 text-amber-300' : 'bg-green-500/20 text-green-400'
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full animate-pulse ${
              offlineMode ? 'bg-amber-400' : 'bg-green-400'
            }`}
          />
          {offlineMode ? 'Offline' : connected && hubLinked ? 'Live' : hubLinked ? 'Connecting…' : 'No hub'}
          {effectiveSessionId && effectiveSessionId !== OFFLINE_SESSION_ID && (
            <span className="text-white/40 ml-1 font-mono">{effectiveSessionId}</span>
          )}
        </div>

        {screen === 'welcome' && (
          <WelcomeScreen
            onStart={() => {
              setScreen('name')
              emitStateUpdate('name')
            }}
            onLeaderboard={() => {
              setLeaderboardMode('event')
              if (offlineMode) setEventLeaderboard(getLocalEventLeaderboard())
              setScreen('leaderboard')
              emitStateUpdate('leaderboard')
            }}
          />
        )}

        {screen === 'name' && (
          <NameEntryScreen
            onContinue={(name) => {
              setPlayerName(name)
              setScreen('registration')
              emitStateUpdate('registration', {
                participant: {
                  name,
                  storeName: 'Choosing store…',
                  storeId: '',
                  state: '',
                  suburb: '',
                  brand: 'REPCO',
                },
              })
            }}
            onBack={() => {
              setScreen('welcome')
              emitStateUpdate('welcome')
            }}
          />
        )}

        {screen === 'registration' && (
          <RegistrationScreen
            playerName={playerName}
            onComplete={handleRegistrationComplete}
            resumeAt={registrationResume?.step}
            resumeState={registrationResume?.state}
            resumeSuburb={registrationResume?.suburb}
            onBack={() => {
              setRegistrationResume(null)
              setScreen('name')
              emitStateUpdate('name')
            }}
          />
        )}

        {screen === 'waiting' && participant && (
          <WaitingScreen
            participant={participant}
            sessionId={effectiveSessionId}
            offlineMode={offlineMode}
            onBeginPresentation={offlineMode ? handleBeginOfflinePresentation : undefined}
            onChangeStore={handleChangeStore}
          />
        )}

        {screen === 'presentation' && participant && (
          <PresentationScreen
            participant={participant}
            currentSlide={currentSlide}
            totalSlides={LAST_SLIDE_INDEX + 1}
            offlineMode={offlineMode}
            onAdvance={offlineMode ? handleFlowAdvance : undefined}
          />
        )}

        {participant &&
          (screen === 'waiting' ||
            screen === 'presentation' ||
            screen === 'ready' ||
            screen === 'video') && (
            <KioskVideoPlayer
              participant={participant}
              src={videoSrc}
              visible={screen === 'video'}
              preload={screen !== 'video'}
              onComplete={() => {
                setScreen('ready')
                emitStateUpdate('ready')
              }}
            />
          )}

        {screen === 'ready' && participant && (
          <ReadyScreen
            participant={participant}
            onNext={() => {
              setScreen('quiz')
              emitStateUpdate('quiz')
            }}
          />
        )}

        {screen === 'quiz' && participant && (
          <QuizScreen
            participant={participant}
            questions={quizQuestions}
            onComplete={handleQuizComplete}
            onScoreUpdate={(score, q) => {
              const s = tryGetSocket()
              if (offlineMode || !s?.connected) return
              s.emit('kiosk_state_update', {
                quizProgress: {
                  currentQuestion: q,
                  totalQuestions: quizQuestions.length,
                  score: roundScore(score),
                  answers: quizAnswers,
                },
              })
            }}
          />
        )}

        {screen === 'leaderboard' && (
          <LeaderboardScreen
            mode={leaderboardMode}
            sessionId={effectiveSessionId}
            entries={leaderboardEntries}
            highlightStoreId={participant?.storeId}
            offlineMode={offlineMode}
            offlineSessionBoard={offlineMode && leaderboardMode === 'session'}
            onComplete={handleLeaderboardComplete}
            onStaffSessionComplete={
              offlineMode && leaderboardMode === 'session' ? showSessionThankYou : undefined
            }
          />
        )}

        {screen === 'thankyou' && <ThankYouScreen />}
      </KioskShell>
    </div>
  )
}
