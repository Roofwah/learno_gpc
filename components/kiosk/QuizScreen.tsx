'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import type { QuizQuestion } from '@/lib/quiz'
import { calcPoints, formatScore, roundScore } from '@/lib/quiz'
import type { AnswerRecord, Participant } from '@/lib/socket-types'

const TIME_LIMIT_SEC = 20 // matches learno

interface Props {
  participant: Participant
  questions: QuizQuestion[]
  onComplete: (answers: AnswerRecord[], totalScore: number, timeTaken: number) => void
  onScoreUpdate: (score: number, currentQ: number) => void
}

export default function QuizScreen({ participant, questions, onComplete, onScoreUpdate }: Props) {
  const [qIndex, setQIndex] = useState(0)
  const [answered, setAnswered] = useState<string | null>(null) // stores the chosen option string
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [totalScore, setTotalScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SEC)
  const [phase, setPhase] = useState<'question' | 'feedback' | 'done'>('question')
  const startRef = useRef<number>(Date.now())
  const totalStartRef = useRef<number>(Date.now())
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  const BRAND_COLOR = { REPCO: '#E4002B', NAPA: '#003087', GPC: '#ffc836', MSP: '#2E7D8A', HEAD_OFFICE: '#ffc836' } as const
  const color = BRAND_COLOR[participant.brand]
  const q = questions[qIndex]

  const advance = useCallback((record: AnswerRecord, newAnswers: AnswerRecord[], newScore: number) => {
    setPhase('feedback')
    clearInterval(timerRef.current)
    setTimeout(() => {
      if (qIndex + 1 >= questions.length) {
        setPhase('done')
        const elapsed = (Date.now() - totalStartRef.current) / 1000
        onComplete(newAnswers, newScore, elapsed)
      } else {
        setQIndex(qIndex + 1)
        setAnswered(null)
        setPhase('question')
        setTimeLeft(TIME_LIMIT_SEC)
        startRef.current = Date.now()
      }
    }, 1800)
  }, [qIndex, questions, onComplete])

  // Timer
  useEffect(() => {
    if (phase !== 'question') return
    startRef.current = Date.now()
    setTimeLeft(TIME_LIMIT_SEC)

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          const record: AnswerRecord = { questionId: q.id, correct: false, timeTakenMs: TIME_LIMIT_SEC * 1000, score: 0 }
          const newAnswers = [...answers, record]
          setAnswers(newAnswers)
          setAnswered('')
          advance(record, newAnswers, totalScore)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIndex, phase])

  const handleAnswer = (option: string) => {
    if (answered !== null || phase !== 'question') return
    clearInterval(timerRef.current)

    const timeTakenMs = Date.now() - startRef.current
    const correct = option === q.correct
    const score = calcPoints(timeTakenMs, correct)
    const newScore = roundScore(totalScore + score)
    const record: AnswerRecord = { questionId: q.id, correct, timeTakenMs, score }
    const newAnswers = [...answers, record]

    setAnswered(option)
    setAnswers(newAnswers)
    setTotalScore(newScore)
    onScoreUpdate(newScore, qIndex)
    advance(record, newAnswers, newScore)
  }

  if (!q) return null

  const timerPct = (timeLeft / TIME_LIMIT_SEC) * 100
  const CIRC = 283

  const optionState = (opt: string): 'default' | 'correct' | 'wrong' | 'missed' => {
    if (answered === null) return 'default'
    if (opt === q.correct) return 'correct'
    if (opt === answered && opt !== q.correct) return 'wrong'
    return 'missed'
  }

  const stateStyle = {
    default: 'bg-white/5 border-white/15 hover:bg-white/10 hover:border-white/30',
    correct: 'bg-green-500/20 border-green-400',
    wrong: 'bg-red-500/20 border-red-400',
    missed: 'bg-white/3 border-white/5 opacity-40',
  }

  return (
    <div className="w-full h-full flex flex-col bg-black/60">
      {/* Top bar: score + Q counter */}
      <div className="quiz-top-bar flex items-center justify-between px-10 py-6 border-b border-white/10">
        <div>
          <div className="text-white/40 text-xl mb-1">Score</div>
          <div className="text-5xl font-black text-white">{formatScore(totalScore)}</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-white/40 text-xl mb-2">Question</div>
          <div className="flex gap-2">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full transition-all ${
                  i < qIndex ? 'scale-90' : i === qIndex ? 'scale-110' : 'opacity-30'
                }`}
                style={{
                  background: i < qIndex
                    ? (answers[i]?.correct ? '#22c55e' : '#ef4444')
                    : i === qIndex ? color : 'rgba(255,255,255,0.15)',
                }}
              />
            ))}
          </div>
        </div>
        <div className="text-right">
          <div className="text-white/40 text-xl mb-1">{participant.name}</div>
          <div className="text-white/60 text-xl">{participant.storeName.split(' ').slice(0,2).join(' ')}</div>
        </div>
      </div>

      {/* Timer ring */}
      <div className="flex justify-center py-8">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke={timeLeft <= 5 ? '#ef4444' : color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC - (CIRC * timerPct / 100)}
              className="transition-all duration-1000 linear"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-3xl font-black ${timeLeft <= 5 ? 'text-red-400' : 'text-white'}`}>
              {timeLeft}
            </span>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="px-10 mb-8 animate-fade-in" key={qIndex}>
        <div className="text-white/40 text-2xl mb-4 uppercase tracking-widest">
          Question {qIndex + 1} of {questions.length} · up to 20 pts
        </div>
        <h2 className="text-4xl font-bold text-white leading-tight">{q.question}</h2>
      </div>

      {/* Options + feedback (feedback always 120px below last option) */}
      <div className="flex flex-col flex-1 min-h-0 pl-10 pr-[60px]">
        <div className="flex flex-col gap-4">
          {q.options.map((opt, idx) => {
            const s = optionState(opt)
            return (
              <button
                key={idx}
                onPointerDown={() => handleAnswer(opt)}
                disabled={answered !== null}
                className={`
                  flex items-center gap-6 px-8 py-7 rounded-2xl text-left
                  border-2 transition-all duration-200 active:scale-[0.98]
                  ${stateStyle[s]}
                `}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black shrink-0"
                  style={{ background: s === 'default' ? 'rgba(255,255,255,0.08)' : 'transparent' }}
                >
                  {s === 'correct' ? '✓' : s === 'wrong' ? '✗' : String.fromCharCode(65 + idx)}
                </div>
                <span className={`text-2xl font-semibold leading-snug ${s === 'missed' ? 'text-white/30' : 'text-white'}`}>
                  {opt}
                </span>
                {s === 'correct' && answered !== null && (
                  <span className="ml-auto text-green-400 text-xl font-bold shrink-0">
                    +{formatScore(answers.at(-1)?.score ?? 0)}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {answered !== null && phase === 'feedback' && (
          <div
            className={`quiz-feedback-banner ${
              answers.at(-1)?.correct
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {answers.at(-1)?.correct ? (
              <>Correct! +{formatScore(answers.at(-1)?.score ?? 0)} points</>
            ) : (
              <>Incorrect — the answer was {q.correct}</>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
