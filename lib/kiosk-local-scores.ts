import { roundScore } from './quiz'
import { OFFLINE_SESSION_ID } from './kiosk-offline'
import { QUIZ_QUESTION_COUNT } from './session'
import type { ParticipantLeaderboardEntry, ScoreSubmission } from './socket-types'

const STORAGE_KEY = 'gpc_kiosk_local_scores'

export interface LocalStoredScore {
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
  /** False until hub accepts submit_score (when online). */
  hubSynced: boolean
}

function finiteNum(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

function readAll(): LocalStoredScore[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw) as Partial<LocalStoredScore>[]
    if (!Array.isArray(data)) return []
    return data.map((row, i) => ({
      id: finiteNum(row.id, i + 1),
      sessionId: row.sessionId ?? OFFLINE_SESSION_ID,
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
      hubSynced: row.hubSynced === true,
    }))
  } catch {
    return []
  }
}

function writeAll(scores: LocalStoredScore[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores))
}

function isPerfect(row: LocalStoredScore): boolean {
  return row.correctCount >= row.totalQuestions && row.totalQuestions > 0
}

function toEntry(row: LocalStoredScore, rank: number, prizeRank?: number | null): ParticipantLeaderboardEntry {
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

function buildLeaderboard(rows: LocalStoredScore[]): ParticipantLeaderboardEntry[] {
  const perfect = rows.filter(isPerfect).sort((a, b) => a.timeTaken - b.timeTaken)
  const rest = rows
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
    return toEntry(row, i + 1, prizeRank)
  })
}

/** Save on this kiosk; upsert per sessionId + kioskId. */
export function saveLocalScore(
  data: ScoreSubmission & { sessionId: string },
  options?: { hubSynced?: boolean }
): boolean {
  if (!data.kioskId || !data.sessionId) return false

  const scores = readAll()
  const nextId = scores.reduce((m, s) => Math.max(m, s.id), 0) + 1
  const row: LocalStoredScore = {
    id: nextId,
    sessionId: data.sessionId,
    kioskId: data.kioskId,
    participantName: data.participantName,
    storeId: data.storeId,
    storeName: data.storeName,
    brand: data.brand,
    score: roundScore(data.score),
    timeTaken: finiteNum(data.timeTaken, 0),
    correctCount: Math.max(0, Math.floor(finiteNum(data.correctCount, 0))),
    totalQuestions: Math.max(1, Math.floor(finiteNum(data.totalQuestions, QUIZ_QUESTION_COUNT))),
    createdAt: new Date().toISOString(),
    hubSynced: options?.hubSynced === true,
  }

  const idx = scores.findIndex((s) => s.sessionId === data.sessionId && s.kioskId === data.kioskId)
  if (idx >= 0) scores[idx] = { ...row, id: scores[idx].id, createdAt: scores[idx].createdAt }
  else scores.push(row)

  writeAll(scores)
  return true
}

export function markLocalScoreHubSynced(sessionId: string, kioskId: string): void {
  const scores = readAll()
  const idx = scores.findIndex((s) => s.sessionId === sessionId && s.kioskId === kioskId)
  if (idx < 0) return
  scores[idx] = { ...scores[idx], hubSynced: true }
  writeAll(scores)
}

export function getPendingHubSyncScores(): LocalStoredScore[] {
  return readAll().filter((s) => !s.hubSynced)
}

export function getLocalSessionLeaderboard(sessionId: string): ParticipantLeaderboardEntry[] {
  return buildLeaderboard(readAll().filter((r) => r.sessionId === sessionId))
}

/** Single row for insurance-mode session board — no prizes, not a verified winner. */
export function buildOfflineSessionEntry(
  data: ScoreSubmission & { sessionId: string }
): ParticipantLeaderboardEntry {
  const row: LocalStoredScore = {
    id: 1,
    sessionId: data.sessionId,
    kioskId: data.kioskId,
    participantName: data.participantName,
    storeId: data.storeId,
    storeName: data.storeName,
    brand: data.brand,
    score: roundScore(data.score),
    timeTaken: finiteNum(data.timeTaken, 0),
    correctCount: Math.max(0, Math.floor(finiteNum(data.correctCount, 0))),
    totalQuestions: Math.max(1, Math.floor(finiteNum(data.totalQuestions, QUIZ_QUESTION_COUNT))),
    createdAt: new Date().toISOString(),
    hubSynced: false,
  }
  return { ...toEntry(row, 1, null), prizeRank: null }
}

export function getLocalEventLeaderboard(): ParticipantLeaderboardEntry[] {
  return buildLeaderboard(readAll())
}

export function clearLocalScores(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
