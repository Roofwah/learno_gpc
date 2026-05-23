'use client'
import { BrandPill, BRAND_ACCENT } from '@/components/kiosk/BrandLogo'
import type { Participant } from '@/lib/socket-types'

interface Props {
  participant: Participant
  onNext: () => void
}

export default function ReadyScreen({ participant, onNext }: Props) {
  const accent = BRAND_ACCENT[participant.brand] ?? '#555'

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-12 bg-black/70 text-center">
      <BrandPill
        brand={participant.brand}
        size="lg"
        className="mb-8"
        imgClassName="h-14 w-auto max-w-[240px] object-contain"
      />

      <h2 className="text-white text-5xl font-black mb-4 leading-tight max-w-4xl">
        {participant.storeName}
      </h2>
      <p className="text-white/70 text-4xl font-bold mb-12">Are you ready?</p>
      <p className="text-white/40 text-xl mb-10 max-w-2xl">
        {participant.name} — tap Next when you are ready for the quiz.
      </p>

      <button
        type="button"
        onPointerDown={onNext}
        className="px-20 py-8 rounded-[40px] text-4xl font-black text-white active:scale-95 transition-transform"
        style={{ background: accent, boxShadow: `0 8px 32px ${accent}66` }}
      >
        Next
      </button>
    </div>
  )
}
