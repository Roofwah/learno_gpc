import fs from 'fs'
import path from 'path'
import type {
  GameSession,
  LeaderboardEntry,
  ParticipantLeaderboardEntry,
  ScoreSubmission,
} from './socket-types'
import { QUIZ_QUESTION_COUNT } from './session'
import { roundScore } from './quiz'

const DB_DIR = path.join(process.cwd(), '.data')
const SCORES_PATH = path.join(DB_DIR, 'scores.json')
const SESSION_PATH = path.join(DB_DIR, 'session.json')

interface StoredScore {
  id: number
  sessionId: string
  kioskId: string
  participantName: string
  storeId: string
  storeName: string
  brand: string
  score: number
  timeTaken: number
  correctCount: number
  totalQuestions: number
  createdAt: string
}

function ensureDbDir() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })
}

function finiteNum(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

function normalizeStoredRow(row: Partial<StoredScore>, fallbackId: number): StoredScore {
  return {
    id: finiteNum(row.id, fallbackId),
    sessionId: row.sessionId ?? 'legacy',
    kioskId: row.kioskId ?? '',
    participantName: row.participantName ?? '',
    storeId: row.storeId ?? '',
    storeName: row.storeName ?? '',
    brand: row.brand ?? 'REPCO',
    score: roundScore(finiteNum(row.score, 0)),
    timeTaken: finiteNum(row.timeTaken, 0),
    correctCount: Math.max(0, Math.floor(finiteNum(row.correctCount, 0))),
    totalQuestions: Math.max(1, Math.floor(finiteNum(row.totalQuestions, QUIZ_QUESTION_COUNT))),
    createdAt: row.createdAt ?? new Date().toISOString(),
  }
}

/** Atomic write: temp file + optional fsync + rename (fsync skipped on Windows EPERM) */
function writeJsonFile(filePath: string, data: unknown) {
  ensureDbDir()
  const tmp = `${filePath}.tmp`
  const payload = JSON.stringify(data, null, 2)
  fs.writeFileSync(tmp, payload, 'utf8')
  try {
    const fd = fs.openSync(tmp, 'r+')
    try {
      fs.fsyncSync(fd)
    } finally {
      fs.closeSync(fd)
    }
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    if (code !== 'EPERM' && code !== 'ENOTSUP' && code !== 'EINVAL') throw err
    console.warn('[db] fsync skipped:', code)
  }
  fs.renameSync(tmp, filePath)
}

function readScores(): StoredScore[] {
  if (!fs.existsSync(SCORES_PATH)) return []
  try {
    const raw = fs.readFileSync(SCORES_PATH, 'utf8')
    const data = JSON.parse(raw) as Partial<StoredScore>[]
    if (!Array.isArray(data)) return []
    return data.map((row, i) => normalizeStoredRow(row, i + 1))
  } catch (err) {
    console.error('[db] failed to read scores:', err)
    return []
  }
}

function writeScores(scores: StoredScore[]) {
  writeJsonFile(SCORES_PATH, scores)
}

export function initDb() {
  ensureDbDir()
  if (!fs.existsSync(SCORES_PATH)) writeScores([])
  console.log('[db] scores file at', SCORES_PATH)
  console.log('[db] session file at', SESSION_PATH)
}

export function loadStoredSession(): GameSession | null {
  if (!fs.existsSync(SESSION_PATH)) return null
  try {
    const raw = fs.readFileSync(SESSION_PATH, 'utf8')
    const data = JSON.parse(raw) as GameSession
    if (!data?.id) return null
    return data
  } catch (err) {
    console.error('[db] failed to read session:', err)
    return null
  }
}

export function saveStoredSession(session: GameSession | null) {
  if (session === null) {
    if (fs.existsSync(SESSION_PATH)) {
      try {
        fs.unlinkSync(SESSION_PATH)
      } catch (err) {
        console.error('[db] failed to clear session file:', err)
      }
    }
    return
  }
  writeJsonFile(SESSION_PATH, session)
}

export function saveScore(data: ScoreSubmission & { sessionId: string }): boolean {
  if (!data.kioskId || !data.sessionId) {
    console.error('[db] saveScore rejected: missing kioskId or sessionId')
    return false
  }

  try {
    const scores = readScores()
    const correctCount =
      data.correctCount ?? data.answers.filter((a) => a.correct).length
    const totalQuestions = data.totalQuestions ?? QUIZ_QUESTION_COUNT
    const row: StoredScore = normalizeStoredRow(
      {
        sessionId: data.sessionId,
        kioskId: data.kioskId,
        participantName: data.participantName,
        storeId: data.storeId,
        storeName: data.storeName,
        brand: data.brand,
        score: data.score,
        timeTaken: data.timeTaken,
        correctCount,
        totalQuestions,
        createdAt: new Date().toISOString(),
      },
      0
    )

    const existingIdx = scores.findIndex(
      (s) => s.sessionId === data.sessionId && s.kioskId === data.kioskId
    )
    if (existingIdx >= 0) {
      row.id = scores[existingIdx].id
      row.createdAt = scores[existingIdx].createdAt
      scores[existingIdx] = row
      console.log(`[db] updated score kiosk=${data.kioskId} session=${data.sessionId}`)
    } else {
      row.id = scores.reduce((max, s) => Math.max(max, s.id), 0) + 1
      scores.push(row)
      console.log(`[db] saved score kiosk=${data.kioskId} session=${data.sessionId}`)
    }

    writeScores(scores)
    return true
  } catch (err) {
    console.error('[db] saveScore failed:', err)
    return false
  }
}

function isPerfect(row: StoredScore): boolean {
  return row.correctCount >= row.totalQuestions && row.totalQuestions > 0
}

function toParticipantEntry(
  row: StoredScore,
  rank: number,
  prizeRank?: number | null
): ParticipantLeaderboardEntry {
  return {
    id: row.id,
    rank,
    kioskId: row.kioskId,
    participantName: row.participantName,
    storeName: row.storeName,
    storeId: row.storeId,
    brand: row.brand,
    sessionId: row.sessionId,
    correctCount: row.correctCount,
    totalQuestions: row.totalQuestions,
    timeTaken: row.timeTaken,
    score: row.score,
    isPerfect: isPerfect(row),
    prizeRank: prizeRank ?? null,
  }
}

/** Everyone in this session; perfect fastest first, then rest. prizeRank 1–3 on fastest perfect only. */
export function getSessionLeaderboard(sessionId: string): ParticipantLeaderboardEntry[] {
  const sessionRows = readScores().filter((r) => r.sessionId === sessionId)
  const perfect = sessionRows.filter(isPerfect).sort((a, b) => a.timeTaken - b.timeTaken)
  const rest = sessionRows
    .filter((r) => !isPerfect(r))
    .sort(
      (a, b) =>
        b.correctCount - a.correctCount ||
        b.score - a.score ||
        a.timeTaken - b.timeTaken
    )

  let prizeSlot = 0
  return [...perfect, ...rest].map((row, i) => {
    let prizeRank: number | undefined
    if (isPerfect(row) && prizeSlot < 3) {
      prizeSlot += 1
      prizeRank = prizeSlot
    }
    return toParticipantEntry(row, i + 1, prizeRank)
  })
}

/** Top 3 prize winners (fastest perfect 5/5) */
export function getSessionPrizeWinners(sessionId: string): ParticipantLeaderboardEntry[] {
  return getSessionLeaderboard(sessionId).filter((e) => e.prizeRank != null && e.prizeRank <= 3)
}

/** All players across every session today; same ordering as session board */
export function getEventLeaderboard(): ParticipantLeaderboardEntry[] {
  const allRows = readScores()
  const perfect = allRows.filter(isPerfect).sort((a, b) => a.timeTaken - b.timeTaken)
  const rest = allRows
    .filter((r) => !isPerfect(r))
    .sort(
      (a, b) =>
        b.correctCount - a.correctCount ||
        b.score - a.score ||
        a.timeTaken - b.timeTaken
    )

  let prizeSlot = 0
  return [...perfect, ...rest].map((row, i) => {
    let prizeRank: number | undefined
    if (isPerfect(row) && prizeSlot < 3) {
      prizeSlot += 1
      prizeRank = prizeSlot
    }
    return toParticipantEntry(row, i + 1, prizeRank)
  })
}

/** Legacy store-average leaderboard */
export function getLeaderboard(): LeaderboardEntry[] {
  const scores = readScores()
  const byStore = new Map<
    string,
    { storeId: string; storeName: string; brand: string; scores: number[] }
  >()

  for (const row of scores) {
    const existing = byStore.get(row.storeId)
    if (existing) {
      existing.scores.push(row.score)
    } else {
      byStore.set(row.storeId, {
        storeId: row.storeId,
        storeName: row.storeName,
        brand: row.brand,
        scores: [row.score],
      })
    }
  }

  const rows = Array.from(byStore.values())
    .map((store) => {
      const sum = store.scores.reduce((a, b) => a + b, 0)
      const avg = sum / store.scores.length
      return {
        storeId: store.storeId,
        storeName: store.storeName,
        brand: store.brand,
        participantCount: store.scores.length,
        avgScore: roundScore(avg),
        totalScore: roundScore(sum),
      }
    })
    .sort((a, b) => b.avgScore - a.avgScore || b.participantCount - a.participantCount)

  return rows.map((row, i) => ({
    rank: i + 1,
    storeId: row.storeId,
    storeName: row.storeName,
    brand: row.brand,
    avgScore: row.avgScore,
    participantCount: row.participantCount,
    totalScore: row.totalScore,
  }))
}

export function resetScores() {
  writeScores([])
}
