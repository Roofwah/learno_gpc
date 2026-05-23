'use client'

import { resolveKioskLocalSrc } from '@/lib/kiosk-local-assets'

interface Props {
  onStart: () => void
  onLeaderboard?: () => void
}

export default function WelcomeScreen({ onStart, onLeaderboard }: Props) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      gap: 0,
      padding: 0,
      boxSizing: 'border-box',
    }}>
      <img
        src={resolveKioskLocalSrc('/homecard.png')}
        alt=""
        draggable={false}
        style={{
          display: 'block',
          width: 'auto',
          height: 'auto',
          maxWidth: 'min(920px, 88vw)',
          maxHeight: 'min(72vh, 780px)',
          objectFit: 'contain',
          margin: '0 auto',
          userSelect: 'none',
          pointerEvents: 'none',
          position: 'relative',
          zIndex: 10,
        }}
      />

      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        marginTop: -122,
        position: 'relative',
        zIndex: 11,
        flexShrink: 0,
      }}>
        <button
          onPointerDown={onLeaderboard}
          style={{
            padding: '16px 64px',
            borderRadius: 40,
            fontSize: '1.2rem',
            fontWeight: 700,
            background: '#000',
            color: '#fff',
            border: '3px solid #b4a66b',
            cursor: 'pointer',
          }}
        >
          View Leaderboard
        </button>

        <button
          onPointerDown={onStart}
          style={{
            padding: '16px 64px',
            borderRadius: 40,
            fontSize: '1.2rem',
            fontWeight: 700,
            background: '#009343',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Get Started
        </button>
      </div>
    </div>
  )
}
