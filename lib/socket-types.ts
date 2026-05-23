export type KioskScreen =
  | 'welcome'
  | 'name'
  | 'registration'
  | 'waiting'
  | 'presentation'
  | 'video'
  | 'ready'
  | 'quiz'
  | 'results'
  | 'leaderboard'
  | 'thankyou'

export interface Participant {
  name: string
  storeName: string
  storeId: string
  state: string
  suburb: string
  brand: 'REPCO' | 'NAPA' | 'GPC' | 'MSP'
}

export interface QuizProgress {
  currentQuestion: number
  totalQuestions: number
  score: number
  answers: AnswerRecord[]
}

export interface AnswerRecord {
  questionId: number
  correct: boolean
  timeTakenMs: number
  score: number
}

export interface KioskState {
  kioskId: string
  socketId: string
  screen: KioskScreen
  participant: Participant | null
  quizProgress: QuizProgress | null
  connected: boolean
}

/** Active timed session (multiple per event day) */
export interface GameSession {
  id: string
  startedAt: string
  status: 'registration' | 'running' | 'complete'
}

/** Per-player row on session / event leaderboards */
export interface ParticipantLeaderboardEntry {
  id: number
  rank: number
  kioskId: string
  participantName: string
  storeName: string
  storeId: string
  brand: string
  sessionId: string
  correctCount: number
  totalQuestions: number
  timeTaken: number
  score: number
  isPerfect: boolean
  /** 1–3 = prize (fastest perfect 5/5 only); omitted for other players */
  prizeRank?: number | null
}

/** Legacy store-average board (kept for API compat) */
export interface LeaderboardEntry {
  rank: number
  storeId: string
  storeName: string
  brand: string
  avgScore: number
  participantCount: number
  totalScore: number
}

export interface SessionStatePayload {
  session: GameSession | null
  /** Everyone who finished this session */
  sessionLeaderboard: ParticipantLeaderboardEntry[]
  /** Top 3 fastest perfect 5/5 (prizes) */
  sessionPrizeWinners: ParticipantLeaderboardEntry[]
  /** All players across the day */
  eventLeaderboard: ParticipantLeaderboardEntry[]
}

export interface PresenterCommand {
  type:
    | 'go_to_screen'
    | 'advance_slide'
    | 'prev_slide'
    | 'play_video'
    | 'start_quiz'
    | 'end_quiz'
    | 'reset_kiosk'
    | 'reset_all'
    | 'set_slide'
    | 'start_new_session'
    | 'begin_presentation'
  kioskId?: string
  payload?: Record<string, unknown>
}

export interface ScoreSubmission {
  kioskId: string
  participantName: string
  storeName: string
  storeId: string
  brand: string
  score: number
  timeTaken: number
  answers: AnswerRecord[]
  sessionId?: string
  correctCount?: number
  totalQuestions?: number
}

export interface ServerToClientEvents {
  presenter_command: (cmd: PresenterCommand) => void
  kiosk_status_update: (kiosks: KioskState[]) => void
  leaderboard_update: (entries: LeaderboardEntry[]) => void
  session_state_update: (state: SessionStatePayload) => void
}

export interface ClientToServerEvents {
  kiosk_register: (data: { kioskId: string }) => void
  presenter_register: () => void
  presenter_command: (cmd: PresenterCommand) => void
  kiosk_state_update: (state: Partial<KioskState>) => void
  submit_score: (data: ScoreSubmission) => void
}

export interface InterServerEvents {}

export interface SocketData {
  role: 'kiosk' | 'presenter'
  kioskId?: string
}
