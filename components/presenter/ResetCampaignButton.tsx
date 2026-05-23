'use client'

import { useState } from 'react'
import PinEntryField from '@/components/kiosk/PinEntryField'

type Props = {
  compact?: boolean
  className?: string
}

export default function ResetCampaignButton({ compact, className }: Props) {
  const [open, setOpen] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const close = () => {
    setOpen(false)
    setPin('')
    setError(null)
    setBusy(false)
  }

  const submit = async () => {
    if (!pin.trim()) {
      setError('Enter the reset PIN.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(data.error === 'invalid_pin' ? 'Incorrect PIN.' : 'Reset failed. Try again.')
        setBusy(false)
        return
      }
      close()
      window.location.reload()
    } catch {
      setError('Could not reach the hub. Is the server running?')
      setBusy(false)
    }
  }

  const buttonClass =
    className ??
    (compact
      ? 'mt-auto w-full py-2.5 rounded-lg bg-red-500/15 border border-red-400/30 text-red-300 font-semibold text-xs'
      : 'px-6 py-3 rounded-xl bg-red-500/20 text-red-400 font-semibold')

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClass}>
        Reset campaign (PIN required)
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-campaign-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-[#141414] border border-red-400/30 p-6 text-white shadow-2xl max-h-[92vh] overflow-y-auto">
            <h2 id="reset-campaign-title" className="text-xl font-black text-red-300">
              Reset entire campaign
            </h2>
            <p className="mt-3 text-sm text-white/70 leading-relaxed">
              This clears the <strong className="text-white">overall leaderboard</strong> and all saved
              scores, then starts a fresh session. It is not the same as <strong className="text-white">New
              Session</strong>.
            </p>
            <p className="mt-2 text-sm text-white/50">
              Enter the organizer PIN. Only event leads should have this code.
            </p>

            <label className="block mt-4 text-xs text-white/40 uppercase tracking-wide">
              PIN
            </label>
            <PinEntryField
              value={pin}
              onChange={(v) => {
                setPin(v)
                setError(null)
              }}
              maxLength={8}
              error={error}
            />

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={close}
                disabled={busy}
                className="flex-1 py-3 rounded-lg bg-white/10 font-bold disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={busy}
                className="flex-1 py-3 rounded-lg bg-red-600 font-bold disabled:opacity-40"
              >
                {busy ? 'Resetting…' : 'Reset campaign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
