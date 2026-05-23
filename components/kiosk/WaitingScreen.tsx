'use client'
import { BrandPill, BRAND_ACCENT } from '@/components/kiosk/BrandLogo'
import type { Participant } from '@/lib/socket-types'

interface Props {
  participant: Participant
  sessionId?: string | null
  offlineMode?: boolean
  onBeginPresentation?: () => void
  onChangeStore?: () => void
}

export default function WaitingScreen({
  participant,
  sessionId,
  offlineMode = false,
  onBeginPresentation,
  onChangeStore,
}: Props) {
  const color = BRAND_ACCENT[participant.brand] ?? '#555'

  return (
    <div className="w-full h-full flex flex-col items-center justify-between py-20 px-12 bg-black/50">
      {/* Store badge */}
      <div className="flex flex-col items-center gap-6 mt-12">
        <BrandPill
          brand={participant.brand}
          size="lg"
          imgClassName="h-14 w-auto max-w-[200px] object-contain"
        />
        <div className="text-white/60 text-2xl text-center">{participant.storeName}</div>
      </div>

      {/* Main waiting area */}
      <div className="flex flex-col items-center gap-12 text-center">
        {/* Animated pulse rings */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          {[0,1,2].map(i => (
            <div
              key={i}
              className="absolute rounded-full border-2 w-full h-full"
              style={{
                borderColor: color,
                opacity: 0.15 + i * 0.1,
                animation: `waitPulse ${2 + i * 0.4}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
          <div
            className="w-32 h-32 rounded-full flex items-center justify-center"
            style={{ background: `${color}22`, border: `3px solid ${color}` }}
          >
            <div className="w-8 h-8 rounded-full" style={{ background: color }} />
          </div>
        </div>

        <div>
          <p className="text-white/50 text-3xl mb-4">Ready to go,</p>
          <h2 className="text-7xl font-black text-white mb-6">{participant.name}!</h2>
          {!offlineMode && (
            <p className="text-white/50 text-2xl leading-relaxed max-w-md">
              The presenter will start the session shortly.
              {sessionId && sessionId !== 'offline' && (
                <>
                  <br />
                  <span className="text-white/35 font-mono text-xl">Session {sessionId}</span>
                </>
              )}
            </p>
          )}
        </div>

        {!offlineMode && (
          <div className="flex items-center gap-4 px-8 py-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/70 text-xl">Connected · Waiting for presenter</span>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-4 mb-8">
        {onChangeStore && (
          <button
            type="button"
            onPointerDown={onChangeStore}
            className="px-12 py-5 rounded-2xl text-xl font-bold text-white/80 bg-white/10 border border-white/20 active:scale-95"
          >
            Change store
          </button>
        )}
        {offlineMode && onBeginPresentation ? (
          <button
            type="button"
            onPointerDown={onBeginPresentation}
            className="px-16 py-6 rounded-2xl text-2xl font-black text-white active:scale-95"
            style={{ background: color }}
          >
            Begin slides
          </button>
        ) : (
          !offlineMode && (
            <div className="text-white/20 text-lg text-center">Please wait for the presenter to begin</div>
          )
        )}
      </div>
    </div>
  )
}
