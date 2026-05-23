'use client'

import OnscreenNumericKeypad from './OnscreenNumericKeypad'

type Props = {
  value: string
  onChange: (v: string) => void
  maxLength?: number
  error?: string | null
}

export default function PinEntryField({ value, onChange, maxLength = 8, error }: Props) {
  const digitsOnly = (raw: string) => raw.replace(/\D/g, '').slice(0, maxLength)

  return (
    <div className="w-full">
      <div
        className="mt-1 w-full rounded-lg bg-black/40 border border-white/20 px-4 py-4 flex items-center justify-center gap-3 min-h-[56px]"
        aria-label="PIN entry"
      >
        {value.length === 0 ? (
          <span className="text-white/25 text-lg font-mono tracking-widest">Enter PIN</span>
        ) : (
          Array.from({ length: value.length }).map((_, i) => (
            <span
              key={i}
              className="w-3 h-3 rounded-full bg-white/90"
              aria-hidden
            />
          ))
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-400 font-semibold">{error}</p>}
      <div className="mt-4 flex justify-center">
        <OnscreenNumericKeypad
          value={value}
          onChange={(v) => {
            onChange(digitsOnly(v))
          }}
          maxLength={maxLength}
        />
      </div>
    </div>
  )
}
