'use client'

import { useState } from 'react'
import PinEntryField from '@/components/kiosk/PinEntryField'
import { setOfflineMode, verifyOfflineAdminPin } from '@/lib/kiosk-offline'

type Props = {
  offlineMode: boolean
  onOfflineModeChange: (enabled: boolean) => void
}

export default function KioskAdminPanel({ offlineMode, onOfflineModeChange }: Props) {
  const [open, setOpen] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)

  const close = () => {
    setOpen(false)
    setPin('')
    setError(null)
  }

  const applyToggle = (enable: boolean) => {
    if (!verifyOfflineAdminPin(pin)) {
      setError('Incorrect PIN.')
      return
    }
    setOfflineMode(enable)
    onOfflineModeChange(enable)
    close()
  }

  return (
    <>
      <button
        type="button"
        className="kiosk-admin-btn"
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
        aria-label="Kiosk admin settings"
        title="Settings"
      >
        <span className="kiosk-admin-btn__icon" aria-hidden />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-end bg-black/60 p-6 pointer-events-auto"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-labelledby="kiosk-admin-title"
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-[#141414] border border-amber-400/30 p-6 text-white shadow-2xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="kiosk-admin-title" className="text-xl font-black text-amber-200">
              Settings
            </h2>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full mt-6 py-3 rounded-lg bg-green-700 font-bold"
            >
              Refresh screen
            </button>

            <label className="block mt-6 text-xs text-white/40 uppercase tracking-wide">PIN</label>
            <PinEntryField
              value={pin}
              onChange={(v) => {
                setPin(v)
                setError(null)
              }}
              maxLength={8}
              error={error}
            />

            <div className="mt-6 flex flex-col gap-2">
              {!offlineMode ? (
                <button
                  type="button"
                  onClick={() => applyToggle(true)}
                  className="w-full py-3 rounded-lg bg-amber-600 font-bold"
                >
                  Enable offline mode
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => applyToggle(false)}
                  className="w-full py-3 rounded-lg bg-white/15 font-bold"
                >
                  Return to hub control
                </button>
              )}
              <button
                type="button"
                onClick={close}
                className="w-full py-3 rounded-lg bg-white/10 font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
