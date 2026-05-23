'use client'
import { formatScore } from '@/lib/quiz'
import type { KioskState } from '@/lib/socket-types'

interface Props {
  kiosks: KioskState[]
  onReset: (kioskId: string) => void
}

const SCREEN_LABELS: Record<string, string> = {
  welcome: 'Welcome', name: 'Name', registration: 'Registering', waiting: 'Waiting',
  presentation: 'Presentation', video: 'Video', ready: 'Ready', quiz: 'Quiz', results: 'Results',   leaderboard: 'Leaderboard',
  thankyou: 'Thank you',
}
const SCREEN_COLOR: Record<string, string> = {
  welcome: '#6B7280', name: '#10B981', registration: '#F59E0B', waiting: '#3B82F6',
  presentation: '#8B5CF6', video: '#14B8A6', ready: '#F97316', quiz: '#E4002B', results: '#22C55E',   leaderboard: '#FFD700',
  thankyou: '#A855F7',
}
const BRAND_COLOR = { REPCO: '#E4002B', NAPA: '#003087', GPC: '#ffc836', MSP: '#2E7D8A', HEAD_OFFICE: '#ffc836' } as const

// 8 physical kiosks arranged 2 rows × 4
const KIOSK_SLOTS = ['kiosk-1','kiosk-2','kiosk-3','kiosk-4','kiosk-5','kiosk-6','kiosk-7','kiosk-8']

export default function KioskGrid({ kiosks, onReset }: Props) {
  const kioskMap = new Map(kiosks.map(k => [k.kioskId, k]))
  const completed = kiosks
    .filter(k => (k.screen === 'results' || k.screen === 'leaderboard') && typeof k.quizProgress?.score === 'number')
    .sort((a, b) => (b.quizProgress?.score ?? 0) - (a.quizProgress?.score ?? 0))

  const top3Map = new Map<string, number>()
  completed.slice(0, 3).forEach((k, idx) => {
    top3Map.set(k.kioskId, idx + 1)
  })

  return (
    <div className="grid grid-cols-4 gap-4">
      {KIOSK_SLOTS.map((id, i) => {
        const k = kioskMap.get(id)
        const color = k?.screen ? SCREEN_COLOR[k.screen] : '#374151'
        const brand = k?.participant?.brand
        const bColor = brand ? BRAND_COLOR[brand] : undefined
        const winnerRank = top3Map.get(id)

        return (
          <div
            key={id}
            className={`rounded-2xl border p-5 flex flex-col gap-3 transition-all ${
              k?.connected ? 'border-white/20 bg-white/5' : 'border-white/5 bg-white/2 opacity-50'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <div
                  className="w-20 h-20 rounded-full border-2 flex items-center justify-center text-white font-black text-sm"
                  style={{
                    background: bColor ?? 'rgba(255,255,255,0.08)',
                    borderColor: bColor ?? 'rgba(255,255,255,0.2)',
                  }}
                >
                  KIOSK {i + 1}
                </div>
                {winnerRank && (
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-yellow-400 text-black text-sm font-black flex items-center justify-center border-2 border-black">
                    {winnerRank}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${k?.connected ? 'bg-green-400 animate-pulse' : 'bg-red-400/50'}`} />
                  <span className="text-xs text-white/30">{k?.connected ? 'online' : 'offline'}</span>
                </div>
                <div className="text-white font-semibold text-base truncate mt-1">
                  {k?.participant?.name ?? 'Awaiting player'}
                </div>
                <div className="text-white/45 text-xs truncate">
                  {k?.participant?.storeName ?? 'No store selected'}
                </div>
                {typeof k?.quizProgress?.score === 'number' && (
                  <div className="text-white/70 text-xs mt-1 font-semibold">
                    Score: {formatScore(k.quizProgress.score)}
                  </div>
                )}
              </div>
            </div>

            {/* Screen state */}
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <span className="text-sm font-semibold" style={{ color }}>
                {k ? SCREEN_LABELS[k.screen] : 'Idle'}
              </span>
            </div>

            {/* Quiz progress */}
            {k?.quizProgress && (
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Q{k.quizProgress.currentQuestion + 1}/{k.quizProgress.totalQuestions}</span>
                  <span className="text-white/60 font-bold">{formatScore(k.quizProgress.score)} pts</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${((k.quizProgress.currentQuestion + 1) / k.quizProgress.totalQuestions) * 100}%`,
                      background: color,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Reset button */}
            {k?.connected && (
              <button
                onClick={() => onReset(id)}
                className="mt-1 text-xs text-white/20 hover:text-red-400 transition-colors text-left"
              >
                ↺ Reset kiosk
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
