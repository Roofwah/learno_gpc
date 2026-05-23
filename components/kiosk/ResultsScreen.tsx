'use client'
import { BrandPill, BRAND_ACCENT } from '@/components/kiosk/BrandLogo'
import { formatScore } from '@/lib/quiz'
import type { AnswerRecord, Participant } from '@/lib/socket-types'

interface Props {
  participant: Participant
  answers: AnswerRecord[]
  totalScore: number
  timeTaken: number
  maxScore: number
  onNext: () => void
}

export default function ResultsScreen({
  participant,
  answers,
  totalScore,
  timeTaken,
  maxScore,
  onNext,
}: Props) {
  const pct = Math.round((totalScore / maxScore) * 100)
  const correct = answers.filter((a) => a.correct).length
  const accent = BRAND_ACCENT[participant.brand] ?? '#555'

  return (
    <div className="w-full h-full flex flex-col items-center justify-between py-16 px-12 bg-black/50">
      <div className="flex flex-col items-center gap-3 mt-8">
        <BrandPill
          brand={participant.brand}
          size="lg"
          imgClassName="h-12 w-auto max-w-[220px] object-contain"
        />
        <div className="text-white/50 text-xl">{participant.storeName}</div>
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="relative w-72 h-72">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke={accent}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="276"
              strokeDashoffset={276 - (276 * pct / 100)}
              style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.34,1.56,0.64,1)' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-7xl font-black text-white">{formatScore(totalScore)}</div>
            <div className="text-white/40 text-xl">of {maxScore}</div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-5xl font-black text-white">Thank you for playing!</h2>
          <p className="text-white/60 text-2xl mt-3">{participant.name}</p>
        </div>
      </div>

      <div className="w-full grid grid-cols-3 gap-4">
        <div className="flex flex-col items-center py-6 px-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="text-4xl font-black text-white mb-1">
            {correct}/{answers.length}
          </div>
          <div className="text-white/40 text-lg">Correct</div>
        </div>
        <div className="flex flex-col items-center py-6 px-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="text-4xl font-black text-white mb-1">{pct}%</div>
          <div className="text-white/40 text-lg">Accuracy</div>
        </div>
        <div className="flex flex-col items-center py-6 px-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="text-4xl font-black text-white mb-1">{Math.round(timeTaken)}s</div>
          <div className="text-white/40 text-lg">Total Time</div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 text-center mb-8">
        <p className="text-white/40 text-xl">Your score has been submitted</p>
        <button
          type="button"
          onPointerDown={onNext}
          className="px-20 py-8 rounded-[40px] text-4xl font-black text-white active:scale-95 transition-transform"
          style={{ background: accent, boxShadow: `0 8px 32px ${accent}66` }}
        >
          Next
        </button>
      </div>
    </div>
  )
}
