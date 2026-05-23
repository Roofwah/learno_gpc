'use client'
import { useEffect, useState } from 'react'
import { BrandPill } from '@/components/kiosk/BrandLogo'
import { resolveKioskLocalSrc } from '@/lib/kiosk-local-assets'
import { formatScore } from '@/lib/quiz'
import { formatTimeTaken, QUIZ_QUESTION_COUNT } from '@/lib/session'
import type { ParticipantLeaderboardEntry } from '@/lib/socket-types'

const AUTO_COMPLETE_SEC = 12

interface Props {
  mode: 'session' | 'event'
  sessionId?: string
  entries: ParticipantLeaderboardEntry[]
  highlightStoreId?: string
  offlineMode?: boolean
  onComplete: () => void
  onStaffSessionComplete?: () => void
  offlineSessionBoard?: boolean
}

export default function LeaderboardScreen({
  mode,
  sessionId,
  entries,
  highlightStoreId,
  offlineMode = false,
  offlineSessionBoard = false,
  onComplete,
  onStaffSessionComplete,
}: Props) {
  const isSessionBoard = mode === 'session'
  const staffLogoComplete = offlineMode && isSessionBoard && onStaffSessionComplete
  const unverifiedSession = offlineSessionBoard && isSessionBoard
  const [secondsLeft, setSecondsLeft] = useState(AUTO_COMPLETE_SEC)

  useEffect(() => {
    if (isSessionBoard || offlineMode) return
    setSecondsLeft(AUTO_COMPLETE_SEC)
    const completeTimer = setTimeout(onComplete, AUTO_COMPLETE_SEC * 1000)
    const countdown = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1))
    }, 1000)
    return () => {
      clearTimeout(completeTimer)
      clearInterval(countdown)
    }
  }, [onComplete, isSessionBoard, offlineMode, mode, sessionId])

  const rawSessionId = sessionId ?? entries[0]?.sessionId
  const displaySessionId =
    mode === 'session' && rawSessionId && rawSessionId !== 'offline' ? rawSessionId : undefined
  const title = mode === 'session' ? 'Session Leaderboard' : 'Overall Leaderboard'

  return (
    <div className="w-full h-full flex flex-col bg-black/50">
      <div className="relative px-10 pt-12 pb-8 border-b border-white/10">
        {staffLogoComplete ? (
          <button
            type="button"
            className="kiosk-lb-staff-complete"
            onClick={(e) => {
              e.stopPropagation()
              onStaffSessionComplete()
            }}
            aria-label="Complete session (staff)"
            title="Staff only"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveKioskLocalSrc('/flogo25.png')}
              alt=""
              className="h-12 w-auto mb-4 object-contain object-left pointer-events-none"
              draggable={false}
            />
          </button>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={resolveKioskLocalSrc('/flogo25.png')}
            alt=""
            className="h-12 w-auto mb-4 object-contain object-left"
          />
        )}
        <h1 className="text-6xl font-black text-white">{title}</h1>
        {displaySessionId && (
          <p className="text-5xl font-black font-mono text-purple-300 mt-3 tracking-wide">
            Session {displaySessionId}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-10 py-8 flex flex-col gap-4">
        {entries.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-8">
            <p className="text-white/40 text-3xl">No scores yet</p>
          </div>
        )}

        {entries.map((entry, index) => {
          const isHighlighted = !unverifiedSession && entry.storeId === highlightStoreId
          const rankLabel = unverifiedSession ? '—' : String(entry.rank)

          return (
            <div
              key={entry.id != null ? `score-${entry.id}` : `lb-${index}-${entry.kioskId}-${entry.storeId}`}
              className={`lb-row ${
                isHighlighted ? 'ring-2 ring-yellow-400/80 ring-offset-2 ring-offset-black' : ''
              } animate-leaderboard-in`}
            >
              <div className="w-20 text-center shrink-0 text-3xl font-black text-white/30">
                {rankLabel}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-3xl font-black text-white truncate">{entry.participantName}</div>
                <div className="text-xl text-white/50 truncate mt-1">{entry.storeName}</div>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <BrandPill
                    brand={entry.brand}
                    size="sm"
                    className="!min-h-0 !min-w-0"
                    imgClassName="h-5 w-auto max-w-[90px] object-contain"
                  />
                  <span
                    className={`font-bold text-lg ${
                      !unverifiedSession && entry.isPerfect ? 'text-green-400' : 'text-white/50'
                    }`}
                  >
                    {Number.isFinite(entry.correctCount) ? entry.correctCount : 0}/
                    {Number.isFinite(entry.totalQuestions) ? entry.totalQuestions : QUIZ_QUESTION_COUNT}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-3xl font-black text-white">{formatScore(entry.score)}</div>
                <div className="text-white/30 text-base">{formatTimeTaken(entry.timeTaken)}</div>
              </div>
            </div>
          )
        })}
      </div>

      {(isSessionBoard && !unverifiedSession) || (!isSessionBoard && !offlineMode) ? (
        <div className="px-10 py-8 border-t border-white/10 flex flex-col items-center gap-5">
          {isSessionBoard && !unverifiedSession && (
            <p className="text-white/40 text-xl text-center">
              Scores update as players finish. Stays until the host starts a new session.
            </p>
          )}
          {!isSessionBoard && !offlineMode && (
            <>
              <p className="text-white/40 text-xl">
                Returning to start in <span className="text-white font-bold">{secondsLeft}</span>s
              </p>
              <button
                type="button"
                onPointerDown={onComplete}
                className="px-16 py-6 rounded-[40px] text-2xl font-bold text-white bg-[#009343] hover:bg-[#007a38] active:scale-[0.98] transition-all"
              >
                Complete
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
