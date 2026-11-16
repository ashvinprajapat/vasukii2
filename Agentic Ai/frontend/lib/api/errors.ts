import type { EndpointKey } from './endpoints'

/** The endpoint's contract (or the API base URL) has not been configured, so no request was sent. */
export class IntegrationPendingError extends Error {
  constructor(
    readonly endpoint: EndpointKey,
    readonly reason: 'base-url' | 'contract',
  ) {
    super(
      reason === 'base-url'
        ? `NEXT_PUBLIC_API_BASE_URL is not set (needed for ${endpoint}).`
        : `No backend contract is configured for ${endpoint}.`,
    )
    this.name = 'IntegrationPendingError'
  }
}

/** The backend responded with a non-2xx status. */
export class ApiError extends Error {
  constructor(
    readonly endpoint: EndpointKey,
    readonly status: number,
    readonly detail: string | null,
  ) {
    super(detail ?? `Request to ${endpoint} failed with status ${status}.`)
    this.name = 'ApiError'
  }

  get isUnauthorized() {
    return this.status === 401
  }
}

/** The request could not reach the backend (offline, DNS, CORS, timeout). */
export class NetworkError extends Error {
  constructor(
    readonly endpoint: EndpointKey,
    readonly timedOut: boolean,
  ) {
    super(timedOut ? `Request to ${endpoint} timed out.` : `Could not reach the backend for ${endpoint}.`)
    this.name = 'NetworkError'
  }
}

/** The backend responded, but the payload did not match what the UI requires. */
export class ResponseValidationError extends Error {
  constructor(
    readonly endpoint: EndpointKey,
    readonly issues: string,
  ) {
    super(`Unexpected response from ${endpoint}: ${issues}`)
    this.name = 'ResponseValidationError'
  }
}

export function isIntegrationPending(error: unknown): error is IntegrationPendingError {
  return error instanceof IntegrationPendingError
}

export function isUnauthorized(error: unknown) {
  return error instanceof ApiError && error.isUnauthorized
}

/** A short, user-facing message. Never surfaces stack traces or provider diagnostics. */
export function userMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  if (error instanceof IntegrationPendingError) {
    if (error.reason === 'base-url' && error.endpoint.startsWith('auth.'))
      return 'Sign-in is unavailable: the Vasukii backend URL (NEXT_PUBLIC_API_BASE_URL) isn’t configured.'
    return 'This feature isn’t connected to the campus backend yet.'
  }
  if (error instanceof NetworkError)
    return error.timedOut ? 'The request took too long. Please try again.' : 'Couldn’t reach Vasukii. Check your connection.'
  if (error instanceof ApiError) {
    if (error.status === 401)
      return error.endpoint === 'auth.signIn' ? (error.detail ?? 'Invalid email or password.') : 'Your session has ended. Please sign in again.'
    if (error.status === 403)
      return error.endpoint.startsWith('auth.') && error.detail ? error.detail : 'You don’t have permission to do that.'
    if (error.status >= 400 && error.status < 500 && error.detail) return error.detail
    return 'Vasukii is having trouble right now. Please try again shortly.'
  }
  if (error instanceof ResponseValidationError) return 'Vasukii returned an unexpected response.'
  return fallback
}
