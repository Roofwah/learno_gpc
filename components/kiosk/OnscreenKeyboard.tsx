'use client'
import { useState } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  maxLength?: number
}

const ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M'],
]

export default function OnscreenKeyboard({ value, onChange, maxLength = 30 }: Props) {
  const [caps, setCaps] = useState(true)

  const press = (char: string) => {
    if (value.length >= maxLength) return
    onChange(value + (caps ? char.toUpperCase() : char.toLowerCase()))
  }

  const backspace = () => onChange(value.slice(0, -1))
  const space = () => { if (value.length < maxLength) onChange(value + ' ') }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex flex-col items-center gap-3 w-full">
        {ROWS.map((row, ri) => (
          <div key={ri} className="flex gap-2 justify-center">
            {row.map((k) => (
              <button
                key={k}
                onPointerDown={(e) => { e.preventDefault(); press(k) }}
                className="kb-key w-[88px] h-[88px] text-2xl"
              >
                {caps ? k : k.toLowerCase()}
              </button>
            ))}
          </div>
        ))}

        {/* Bottom row */}
        <div className="flex gap-2 justify-center">
          <button
            onPointerDown={(e) => { e.preventDefault(); setCaps(!caps) }}
            className={`kb-key w-[110px] h-[88px] text-xl ${caps ? 'bg-white/20 border-white/40' : ''}`}
          >
            ⇧ Caps
          </button>
          <button
            onPointerDown={(e) => { e.preventDefault(); space() }}
            className="kb-key w-[340px] h-[88px] text-xl tracking-widest"
          >
            SPACE
          </button>
          <button
            onPointerDown={(e) => { e.preventDefault(); backspace() }}
            className="kb-key w-[140px] h-[88px] text-xl"
          >
            ⌫ Del
          </button>
        </div>
      </div>
    </div>
  )
}
