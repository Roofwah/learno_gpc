'use client'

import { useState } from 'react'
import { getSocket } from '@/lib/socket-client'

type Props = {
  compact?: boolean
  className?: string
}

export default function RefreshMasterButton({ compact, className }: Props) {
  const [busy, setBusy] = useState(false)

  const refresh = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/master-refresh', { method: 'POST' })
      if (!res.ok) throw new Error('refresh failed')
      const socket = getSocket()
      if (socket.connected) {
        socket.emit('presenter_register')
      } else {
        throw new Error('socket down')
      }
    } catch {
      window.location.reload()
      return
    } finally {
      setBusy(false)
    }
  }

  const buttonClass =
    className ??
    (compact
      ? 'w-full py-2.5 rounded-lg bg-green-700/30 border border-green-500/40 text-green-200 font-bold text-sm disabled:opacity-50'
      : 'px-6 py-3 rounded-xl bg-green-700/30 border border-green-500/40 text-green-200 font-bold disabled:opacity-50')

  return (
    <div className={compact ? 'flex flex-col gap-1' : 'flex flex-col items-end gap-1'}>
      <button type="button" onClick={() => void refresh()} disabled={busy} className={buttonClass}>
        {busy ? 'Refreshing…' : 'Refresh master'}
      </button>
      <p className={`text-white/35 ${compact ? 'text-xs' : 'text-sm text-right max-w-xs'}`}>
        Use if kiosks show offline. No PIN. If this does not help, restart the Mac hub app.
      </p>
    </div>
  )
}
