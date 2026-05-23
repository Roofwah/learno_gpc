import { TOTAL_SLIDES } from './session'

/**
 * Static assets (slides, images, video, background) load from this machine.
 * Kiosk UI may be served from the hub; paths like /slides/… resolve to 127.0.0.1.
 */
export function getKioskLocalPort(): string {
  if (typeof window !== 'undefined' && window.location.port) return window.location.port
  return process.env.NEXT_PUBLIC_GPC_PORT || '3001'
}

export function getKioskLocalOrigin(): string {
  if (typeof window === 'undefined') return `http://127.0.0.1:${getKioskLocalPort()}`

  const envOrigin = process.env.NEXT_PUBLIC_KIOSK_LOCAL_ORIGIN?.trim()
  if (envOrigin) return envOrigin.replace(/\/$/, '')

  const stored = localStorage.getItem('gpc_local_origin')?.trim()
  if (stored) return stored.replace(/\/$/, '')

  return `http://127.0.0.1:${getKioskLocalPort()}`
}

export function resolveKioskLocalSrc(path: string): string {
  const raw = path.trim()
  if (/^https?:\/\//i.test(raw) || /^file:\/\//i.test(raw)) return raw

  const origin = getKioskLocalOrigin()
  const p = raw.startsWith('/') ? raw : `/${raw}`
  return `${origin}${p}`
}

export function slideImagePath(slideIndex: number): string {
  return `/slides/slide_${String(slideIndex + 1).padStart(2, '0')}.jpg`
}

export function resolveSlideImageSrc(slideIndex: number): string {
  return resolveKioskLocalSrc(slideImagePath(slideIndex))
}

/** Preload all slide JPGs from this kiosk's public folder. */
export function preloadKioskSlides(): void {
  if (typeof window === 'undefined') return
  for (let i = 0; i < TOTAL_SLIDES; i++) {
    const img = new Image()
    img.src = resolveSlideImageSrc(i)
  }
}

/** Read optional public/kiosk-local-url.txt (origin) and kiosk-video-url.txt (video file). */
export async function loadKioskLocalOverrides(): Promise<void> {
  if (typeof window === 'undefined') return
  const port = getKioskLocalPort()
  const base = `http://127.0.0.1:${port}`

  try {
    const res = await fetch(`${base}/kiosk-local-url.txt`, { cache: 'no-store' })
    if (res.ok) {
      const line = (await res.text()).trim().split(/\r?\n/)[0]?.trim()
      if (line) localStorage.setItem('gpc_local_origin', line.replace(/\/$/, ''))
    }
  } catch {
    /* optional file */
  }

  try {
    const res = await fetch(`${base}/kiosk-video-url.txt`, { cache: 'no-store' })
    if (res.ok) {
      const line = (await res.text()).trim().split(/\r?\n/)[0]?.trim()
      if (line) localStorage.setItem('gpc_video_src', line)
    }
  } catch {
    /* optional file */
  }
}
