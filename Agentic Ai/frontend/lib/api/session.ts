/**
 * How the FastAPI backend authenticates requests. Unknown until the backend contract is confirmed:
 * - 'cookie': FastAPI sets an HttpOnly session cookie; requests are sent with credentials. (Preferred.)
 * - 'bearer': the login response returns an access token, sent as `Authorization: Bearer <token>`.
 *   The token is kept in memory only, so it is never readable from storage by injected scripts.
 */
export const AUTH_TRANSPORT: 'cookie' | 'bearer' | null = null

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

export function clearSession() {
  accessToken = null
}
