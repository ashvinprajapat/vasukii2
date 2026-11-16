/**
 * The FastAPI backend authenticates with Supabase Auth bearer tokens returned by /api/auth/login
 * and /api/auth/signup, sent as `Authorization: Bearer <token>`. Tokens are kept in localStorage so
 * a session survives reloads; the short-lived access token is renewed via /api/auth/refresh.
 */
export const AUTH_TRANSPORT: 'cookie' | 'bearer' | null = 'bearer'

const STORAGE_KEY = 'vasukii.session'

type StoredSession = { accessToken: string; refreshToken: string | null }

let cache: StoredSession | null | undefined
const listeners = new Set<() => void>()

function readSession(): StoredSession | null {
  if (typeof window === 'undefined') return null
  if (cache !== undefined) return cache
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null')
    const value = parsed as Partial<StoredSession> | null
    cache =
      value && typeof value.accessToken === 'string'
        ? { accessToken: value.accessToken, refreshToken: typeof value.refreshToken === 'string' ? value.refreshToken : null }
        : null
  } catch {
    cache = null
  }
  return cache
}

function writeSession(session: StoredSession | null) {
  cache = session
  try {
    if (session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {}
  listeners.forEach((listener) => listener())
}

export function setSession(session: { accessToken: string; refreshToken?: string | null }) {
  writeSession({ accessToken: session.accessToken, refreshToken: session.refreshToken ?? null })
}

export function getAccessToken() {
  return readSession()?.accessToken ?? null
}

export function getRefreshToken() {
  return readSession()?.refreshToken ?? null
}

export function hasSession() {
  return readSession() !== null
}

export function clearSession() {
  if (typeof window === 'undefined') return
  writeSession(null)
}

export function subscribeSession(listener: () => void) {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return
    cache = undefined
    listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}
