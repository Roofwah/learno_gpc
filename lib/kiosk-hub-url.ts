import { getKioskLocalOrigin, getKioskLocalPort } from './kiosk-local-assets'

const HUB_SOCKET_STORAGE_KEY = 'gpc_hub_socket_url'

export function isValidHubSocketUrl(url: string): boolean {
  try {
    const u = new URL(url)
    const host = u.hostname.toLowerCase()
    return host !== '127.0.0.1' && host !== 'localhost' && host !== '::1'
  } catch {
    return false
  }
}

export function normalizeHubSocketUrl(line: string, port = getKioskLocalPort()): string {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/$/, '')
  const host = trimmed.split('/')[0]?.split(':')[0] ?? trimmed
  return `http://${host}:${port}`
}

/** Hub Socket.io URL (Mac). Kiosk UI loads from 127.0.0.1; sync uses this — never localhost. */
export async function loadHubSocketUrl(): Promise<string | null> {
  if (typeof window === 'undefined') return null

  const origin = getKioskLocalOrigin()
  try {
    const res = await fetch(`${origin}/hub-socket-url.txt`, { cache: 'no-store' })
    if (res.ok) {
      const line = (await res.text()).trim().split(/\r?\n/)[0]?.trim()
      if (line) {
        const url = normalizeHubSocketUrl(line)
        if (isValidHubSocketUrl(url)) {
          localStorage.setItem(HUB_SOCKET_STORAGE_KEY, url)
          return url
        }
      }
    }
  } catch {
    /* fall through */
  }

  const stored = localStorage.getItem(HUB_SOCKET_STORAGE_KEY)?.trim()
  if (stored && isValidHubSocketUrl(stored)) return stored.replace(/\/$/, '')

  if (stored) localStorage.removeItem(HUB_SOCKET_STORAGE_KEY)
  return null
}

export function clearHubSocketUrlCache(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(HUB_SOCKET_STORAGE_KEY)
}
