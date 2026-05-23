'use client'

import { resolveKioskLocalSrc } from '@/lib/kiosk-local-assets'

export type KioskOverlay = 'home' | 'slides' | 'video' | 'main'

const OVERLAY_SRC: Record<KioskOverlay, string> = {
  home: '/overlay.png',
  slides: '/overlayslides.png',
  video: '/overlay.png',
  main: '/overlaymain.png',
}

interface Props {
  children: React.ReactNode
  overlay?: KioskOverlay
  /** Rendered above the frame overlay (e.g. admin cog). */
  staffControls?: React.ReactNode
  /** Hidden top-left tap zone for staff — returns kiosk to welcome */
  onBackToStart?: () => void
  /** Hidden bottom-right tap zone — debug: advance slides → video */
  onDebugAdvance?: () => void
}

export default function KioskShell({
  children,
  overlay = 'main',
  staffControls,
  onBackToStart,
  onDebugAdvance,
}: Props) {
  const overlaySrc = resolveKioskLocalSrc(OVERLAY_SRC[overlay])
  const backgroundSrc = resolveKioskLocalSrc('/background.mp4')

  return (
    <div className="relative w-[1080px] h-[1920px] overflow-hidden bg-black">
      {/* Background video loop */}
      <video
        className="bg-video"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src={backgroundSrc} type="video/mp4" />
      </video>

      {/* Screen content sits above the video */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>

      {/* Static overlay */}
      <div className="overlay-container">
        <img src={overlaySrc} alt="" className="overlay-frame" style={{ opacity: 1 }} />
      </div>

      {staffControls && <div className="kiosk-staff-controls">{staffControls}</div>}

      {onBackToStart && (
        <button
          type="button"
          className="kiosk-back-to-start"
          onPointerDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onBackToStart()
          }}
          aria-label="Back to start"
          tabIndex={-1}
        />
      )}

      {onDebugAdvance && (
        <button
          type="button"
          className="kiosk-debug-advance"
          onPointerDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onDebugAdvance()
          }}
          aria-label="Debug advance"
          tabIndex={-1}
        />
      )}
    </div>
  )
}
