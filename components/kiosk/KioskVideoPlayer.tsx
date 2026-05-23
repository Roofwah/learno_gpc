'use client'

import { useEffect, useRef } from 'react'
import type { Participant } from '@/lib/socket-types'
import { playKioskVideo } from '@/lib/kiosk-video'

interface Props {
  participant: Participant
  src: string
  /** True on the video screen — starts playback from the beginning. */
  visible: boolean
  /** Keep downloading while hidden (waiting / slides / ready). */
  preload: boolean
  onComplete: () => void
}

export default function KioskVideoPlayer({
  participant,
  src,
  visible,
  preload,
  onComplete,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const playGenRef = useRef(0)

  useEffect(() => {
    const el = videoRef.current
    if (!el || !preload) return
    el.preload = 'auto'
    el.src = src
    el.load()
  }, [src, preload])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return

    if (!visible) {
      el.pause()
      return
    }

    const gen = ++playGenRef.current
    void (async () => {
      try {
        await playKioskVideo(el)
        if (playGenRef.current !== gen) return
      } catch {
        if (playGenRef.current !== gen) return
      }
    })()

    return () => {
      playGenRef.current += 1
      el.pause()
    }
  }, [visible, src])

  if (!preload && !visible) return null

  return (
    <div
      className={visible ? 'video-screen-portrait' : 'kiosk-video-preload'}
      aria-hidden={!visible}
    >
      <video
        ref={videoRef}
        src={src}
        className={visible ? 'video-screen-portrait__player' : undefined}
        controls={false}
        playsInline
        preload="auto"
        muted={false}
        onEnded={visible ? onComplete : undefined}
        onError={visible ? onComplete : undefined}
      />
      {visible && (
        <div className="video-screen-portrait__caption">
          <span>{participant.name}</span>
        </div>
      )}
    </div>
  )
}
