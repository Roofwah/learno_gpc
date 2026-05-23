import { resolveKioskLocalSrc } from './kiosk-local-assets'

/** Path sent by Master; each kiosk resolves to a URL on this machine. */
export const KIOSK_VIDEO_PATH = '/gpcvid.mp4'

/** @deprecated Use resolveKioskVideoSrc — kept for presenter payload default */
export const DEFAULT_KIOSK_VIDEO_SRC = KIOSK_VIDEO_PATH

export { getKioskLocalPort as getKioskVideoPort } from './kiosk-local-assets'
export { loadKioskLocalOverrides as loadKioskVideoSrcOverride } from './kiosk-local-assets'

/** Minimum readyState before play (HAVE_FUTURE_DATA). */
const MIN_READY_STATE = 3

/**
 * Kiosk UI loads from the hub, but video must come from this PC (local disk / localhost).
 */
export function resolveKioskVideoSrc(commandSrc?: string | null): string {
  if (typeof window === 'undefined') {
    return commandSrc?.trim() || KIOSK_VIDEO_PATH
  }

  const envOverride = process.env.NEXT_PUBLIC_KIOSK_VIDEO_SRC?.trim()
  if (envOverride) return envOverride

  const stored = localStorage.getItem('gpc_video_src')?.trim()
  if (stored) return stored

  const raw = (commandSrc ?? KIOSK_VIDEO_PATH).trim()
  return resolveKioskLocalSrc(raw)
}

export function waitForVideoReady(
  el: HTMLVideoElement,
  timeoutMs = 12_000
): Promise<void> {
  if (el.readyState >= MIN_READY_STATE) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const done = () => {
      cleanup()
      resolve()
    }
    const fail = () => {
      cleanup()
      reject(new Error('video_ready_timeout'))
    }
    const cleanup = () => {
      clearTimeout(timer)
      el.removeEventListener('canplay', done)
      el.removeEventListener('loadeddata', done)
      el.removeEventListener('error', fail)
    }
    const timer = setTimeout(fail, timeoutMs)
    el.addEventListener('canplay', done, { once: true })
    el.addEventListener('loadeddata', done, { once: true })
    el.addEventListener('error', fail, { once: true })
  })
}

export async function playKioskVideo(el: HTMLVideoElement): Promise<void> {
  el.currentTime = 0
  el.muted = true
  try {
    await waitForVideoReady(el)
    await el.play()
    el.muted = false
  } catch {
    el.muted = false
    await el.play().catch(() => {})
  }
}
