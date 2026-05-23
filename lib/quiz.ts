export interface QuizQuestion {
  id: number
  question: string
  options: string[]
  correct: string
  audioTrack?: string
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

/** Round and format scores to exactly 3 decimal places */
export function roundScore(score: number): number {
  return Math.round(toFiniteNumber(score) * 1000) / 1000
}

export function formatScore(score: number | null | undefined): string {
  return roundScore(toFiniteNumber(score)).toFixed(3)
}

// Matches learno scoring: max 20pts, linear decay over 20s window
export function calcPoints(timeTakenMs: number, correct: boolean): number {
  if (!correct) return 0
  const elapsedSec = timeTakenMs / 1000
  return roundScore(Math.max(0, 20 - Math.min(elapsedSec, 20)))
}

// Exact question pool from learno (UserForm.tsx mcqQuestionPool)
export const QUIZ_QUESTION_POOL: Record<number, QuizQuestion> = {
  1: {
    id: 1,
    question: 'What does the Audi Revolut F1 Team use to enhance performance?',
    options: [
      'Racing Simulators',
      'Refractometers',
      'Gran Turismo 7',
      'Rotary Variable Differential Transformers (RVDT)',
    ],
    correct: 'Racing Simulators',
  },
  2: {
    id: 2,
    question: 'How many unique motorsport tracks were used to develop the Ultimate Performance Demo?',
    options: ['7', '8', '32', '4'],
    correct: '8',
  },
  3: {
    id: 3,
    question: 'What total distance was the drive cycle developed for in the Ultimate Performance Demo?',
    options: ['228kms', '240kms', '250kms', '350kms'],
    correct: '250kms',
  },
  4: {
    id: 4,
    question: 'During laboratory testing, how long did Castrol EDGE run continuously in the ISP lab?',
    options: ['4 days', '1 week', '2 weeks', '1 month'],
    correct: '2 weeks',
  },
  5: {
    id: 5,
    question: 'What total non-stop distance was covered during engine testing for the Ultimate Performance Demo?',
    options: ['10,000kms', '15,000kms', '20,000kms', '30,000kms'],
    correct: '30,000kms',
  },
  6: {
    id: 6,
    question: 'In Australia, which lubricant brand holds more OEM approvals than any other?',
    options: ['Castrol', 'Any other brand'],
    correct: 'Castrol',
  },
  7: {
    id: 7,
    question: 'How much data was analysed to evaluate Castrol EDGE performance in the Ultimate Performance Demo?',
    options: ['Thousands', 'Tens of thousands', 'Hundreds of thousands', 'Millions'],
    correct: 'Millions',
  },
  8: {
    id: 8,
    question: 'Which of the following does NOT impact vehicle performance?',
    options: ['Colour', 'Endurance', 'Cleanliness', 'High temperature performance'],
    correct: 'Colour',
  },
  9: {
    id: 9,
    question: 'Which driver partnered with Castrol’s UK Technology Team on the Ultimate Performance Demo?',
    options: ['Nico Hulkenberg', 'Carlos Sainz', 'Thomas Randle', 'Gabriel Bortoleto'],
    correct: 'Thomas Randle',
  },
  10: {
    id: 10,
    question: 'Which oil range is trusted by experts to unlock the very EDGE of performance?',
    options: ['Castrol GTX', 'Castrol EDGE', 'Castrol MAGNATEC', 'Castrol RX'],
    correct: 'Castrol EDGE',
  },
}

// Mirrors learno block selection exactly:
// Block 1: pick 1 of [1, 2]
// Block 2: pick 1 of [3, 4, 5]
// Block 3: always Q6 (fixed anchor)
// Block 4: pick 1 of [7, 8]
// Block 5: pick 1 of [9, 10]
export function selectQuestions(): QuizQuestion[] {
  function pickRandom(arr: number[]): number {
    return arr[Math.floor(Math.random() * arr.length)]
  }
  const ids = [
    pickRandom([1, 2]),
    pickRandom([3, 4, 5]),
    6,
    pickRandom([7, 8]),
    pickRandom([9, 10]),
  ]
  return ids.map(id => QUIZ_QUESTION_POOL[id])
}
