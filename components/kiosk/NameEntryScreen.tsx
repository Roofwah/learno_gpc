'use client'
import { useState } from 'react'
import { resolveKioskLocalSrc } from '@/lib/kiosk-local-assets'
import OnscreenKeyboard from './OnscreenKeyboard'

interface Props {
  onContinue: (name: string) => void
  onBack: () => void
}

export default function NameEntryScreen({ onContinue, onBack }: Props) {
  const [name, setName] = useState('')

  const canContinue = name.trim().length >= 2

  return (
    <div className="name-entry-screen">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolveKioskLocalSrc('/agreecard.png')}
        alt=""
        className="name-entry-card-art"
        draggable={false}
      />

      <div className="name-entry-foreground">
        <button
          type="button"
          onPointerDown={onBack}
          className="name-entry-back"
        >
          ← Back
        </button>

        <h2 className="name-entry-title">Enter Your Full Name</h2>

        <div className="name-entry-display">
          <span className={name ? 'name-entry-display-value' : 'name-entry-display-placeholder'}>
            {name || 'Full name'}
          </span>
        </div>

        <div className="name-entry-keyboard">
          <OnscreenKeyboard
            value={name}
            onChange={setName}
            maxLength={40}
          />
        </div>

        <button
          type="button"
          onPointerDown={() => canContinue && onContinue(name.trim())}
          disabled={!canContinue}
          className="name-entry-continue"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
