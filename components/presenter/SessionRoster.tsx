'use client'
import type { KioskState } from '@/lib/socket-types'

interface Props {
  kiosks: KioskState[]
  sessionId: string | null
}

export default function SessionRoster({ kiosks, sessionId }: Props) {
  const registered = kiosks.filter((k) => k.participant)

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-3 flex flex-col gap-2 max-h-48 overflow-y-auto">
      <div className="flex items-center justify-between gap-2 sticky top-0 bg-[#0A0A0A] pb-1">
        <span className="text-xs text-white/40 uppercase tracking-wider">This session</span>
        {sessionId && (
          <span className="text-sm font-mono font-bold text-purple-300">{sessionId}</span>
        )}
      </div>
      {registered.length === 0 && (
        <p className="text-white/30 text-sm py-2">No players registered yet</p>
      )}
      {registered.map((k) => (
        <div
          key={k.kioskId}
          className="flex items-start justify-between gap-2 text-sm py-1.5 border-b border-white/5 last:border-0"
        >
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-white truncate">{k.participant!.name}</div>
            <div className="text-white/45 text-xs truncate">{k.participant!.storeName}</div>
          </div>
          <span className="text-white/25 text-xs shrink-0">{k.kioskId.replace('kiosk-', 'K')}</span>
        </div>
      ))}
    </div>
  )
}
