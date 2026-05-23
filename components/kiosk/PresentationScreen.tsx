'use client'
import { useEffect, useMemo, useState } from 'react'
import { preloadKioskSlides, resolveSlideImageSrc } from '@/lib/kiosk-local-assets'
import { LAST_SLIDE_INDEX } from '@/lib/session'
import type { Participant } from '@/lib/socket-types'

export const SLIDE_NEXT_DELAY_MS = 20_000

interface Props {
  participant: Participant
  currentSlide: number
  totalSlides: number
  offlineMode?: boolean
  onAdvance?: () => void
}

export default function PresentationScreen({
  participant,
  currentSlide,
  totalSlides,
  offlineMode = false,
  onAdvance,
}: Props) {
  const [prevSlide, setPrevSlide] = useState(currentSlide)
  const [animating, setAnimating] = useState(false)
  const [showNext, setShowNext] = useState(false)
  const slideSrc = useMemo(() => resolveSlideImageSrc(currentSlide), [currentSlide])

  useEffect(() => {
    preloadKioskSlides()
  }, [])

  useEffect(() => {
    if (currentSlide !== prevSlide) {
      setAnimating(true)
      const t = setTimeout(() => {
        setPrevSlide(currentSlide)
        setAnimating(false)
      }, 400)
      return () => clearTimeout(t)
    }
  }, [currentSlide, prevSlide])

  useEffect(() => {
    if (!offlineMode) {
      setShowNext(false)
      return
    }
    setShowNext(false)
    const t = setTimeout(() => setShowNext(true), SLIDE_NEXT_DELAY_MS)
    return () => clearTimeout(t)
  }, [currentSlide, offlineMode])

  const BRAND_COLOR = { REPCO: '#E4002B', NAPA: '#003087', GPC: '#ffc836', MSP: '#2E7D8A', HEAD_OFFICE: '#ffc836' } as const
  const color = BRAND_COLOR[participant.brand]

  return (
    <div className="w-full h-full flex flex-col bg-black/80">
      {/* Slim top bar */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: color }} />
          <span className="text-white/50 text-lg">{participant.name}</span>
        </div>
        <span className="text-white/30 text-lg">
          Slide {currentSlide + 1} / {totalSlides}
        </span>
      </div>

      {/* Slide area */}
      <div className="flex-1 relative overflow-hidden">
        <div className={`w-full h-full transition-opacity duration-300 ${animating ? 'opacity-0' : 'opacity-100'}`}>
          {/* Attempt to load slide image — fallback to placeholder */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slideSrc}
            alt={`Slide ${currentSlide + 1}`}
            className="w-full h-full object-contain"
            onError={(e) => {
              // Fallback placeholder
              const el = e.currentTarget
              el.style.display = 'none'
              el.nextElementSibling?.classList.remove('hidden')
            }}
          />
          {/* Placeholder when no slide image */}
          <div className="hidden w-full h-full flex flex-col items-center justify-center gap-8 bg-[#0D0D0D]">
            <div className="text-8xl font-black text-white/10">{currentSlide + 1}</div>
            <div className="text-3xl text-white/20">Slide content loads here</div>
            <div className="text-xl text-white/10">Place exported slide images in /public/slides/</div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/10 shrink-0">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%`, background: color }}
        />
      </div>

      {offlineMode ? (
        <div className="px-8 py-6 bg-black/60 border-t border-white/10 text-center shrink-0">
          {showNext && onAdvance ? (
            <button
              type="button"
              onPointerDown={onAdvance}
              className="px-16 py-5 rounded-2xl text-2xl font-black text-white active:scale-95 transition-transform"
              style={{ background: color }}
            >
              {currentSlide >= LAST_SLIDE_INDEX ? 'Play video' : 'Next slide'}
            </button>
          ) : (
            <p className="text-white/50 text-xl">Next available in a moment…</p>
          )}
        </div>
      ) : (
        currentSlide === LAST_SLIDE_INDEX && (
          <div className="px-8 py-6 bg-black/60 border-t border-white/10 text-center shrink-0">
            <p className="text-white/60 text-xl">Waiting for presenter…</p>
          </div>
        )
      )}
    </div>
  )
}
