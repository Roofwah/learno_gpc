'use client'
import { io, Socket } from 'socket.io-client'
import { loadHubSocketUrl, isValidHubSocketUrl } from './kiosk-hub-url'
import type { ClientToServerEvents, ServerToClientEvents } from './socket-types'

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null
let connectPromise: Promise<Socket<ServerToClientEvents, ClientToServerEvents>> | null = null

function isPresenterPage(): boolean {
  return typeof window !== 'undefined' && window.location.pathname.startsWith('/presenter')
}

function isLocalKioskOrigin(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'
}

async function resolveSocketUrl(): Promise<string> {
  if (typeof window === 'undefined') return 'http://localhost:3001'
  if (isPresenterPage()) return window.location.origin
  if (isLocalKioskOrigin()) {
    const hub = await loadHubSocketUrl()
    if (hub && isValidHubSocketUrl(hub)) return hub
    throw new Error('Mac hub URL missing — run set-hub-ip.bat and enter the Mac Wi-Fi IP')
  }
  return window.location.origin
}

function createSocket(url: string): Socket<ServerToClientEvents, ClientToServerEvents> {
  return io(url, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  })
}

/** Kiosk pages: connect to Mac hub while UI is served locally. Resolves even if hub is down. */
export function connectSocket(): Promise<Socket<ServerToClientEvents, ClientToServerEvents>> {
  if (socket?.connected) return Promise.resolve(socket)
  if (connectPromise) return connectPromise

  connectPromise = resolveSocketUrl()
    .then((url) => {
      if (socket) {
        socket.removeAllListeners()
        socket.disconnect()
      }
      socket = createSocket(url)
      return socket
    })
    .finally(() => {
      connectPromise = null
    })

  return connectPromise
}

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!socket) {
    if (typeof window !== 'undefined' && isPresenterPage()) {
      socket = createSocket(window.location.origin)
      return socket
    }
    throw new Error('Socket not ready — await connectSocket() on kiosk pages')
  }
  return socket
}

export function tryGetSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
  return socket
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
  connectPromise = null
}
