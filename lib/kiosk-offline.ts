import type { GameSession } from './socket-types'

export const OFFLINE_SESSION_ID = 'offline'
export const OFFLINE_ADMIN_PIN = '4321'
const OFFLINE_MODE_KEY = 'gpc_offline_mode'

export function isOfflineMode(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(OFFLINE_MODE_KEY) === '1'
}

export function setOfflineMode(enabled: boolean): void {
  if (typeof window === 'undefined') return
  if (enabled) localStorage.setItem(OFFLINE_MODE_KEY, '1')
  else localStorage.removeItem(OFFLINE_MODE_KEY)
}

export function getOfflineGameSession(): GameSession {
  return {
    id: OFFLINE_SESSION_ID,
    startedAt: new Date().toISOString(),
    status: 'running',
  }
}

export function verifyOfflineAdminPin(pin: string): boolean {
  return pin.trim() === OFFLINE_ADMIN_PIN
}
