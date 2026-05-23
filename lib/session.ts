/** Total slide images in /public/slides (slide_01 … slide_05) */
export const TOTAL_SLIDES = 5

/** Last slide (1-based) shown before master presses Play Video */
export const LAST_SLIDE_BEFORE_VIDEO = 4

/** 0-based index for slide 4 */
export const LAST_SLIDE_INDEX = LAST_SLIDE_BEFORE_VIDEO - 1

/** Questions per quiz round (5/5 = perfect) */
export const QUIZ_QUESTION_COUNT = 5

/** Session ID from wall-clock time, e.g. "10:42" */
export function formatSessionId(date = new Date()): string {
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

export function formatTimeTaken(seconds: number | null | undefined): string {
  const n = typeof seconds === 'number' ? seconds : Number(seconds)
  if (!Number.isFinite(n) || n < 0) return '0.0s'
  const s = Math.round(n * 10) / 10
  const whole = Math.floor(s)
  const frac = Math.round((s - whole) * 10)
  return `${whole}.${frac}s`
}
