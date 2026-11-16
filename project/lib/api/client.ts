import type { z } from 'zod'
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './config'
import { getContract, type EndpointKey } from './endpoints'
import { ApiError, IntegrationPendingError, NetworkError, ResponseValidationError } from './errors'
import { AUTH_TRANSPORT, clearSession, getAccessToken } from './session'

type RequestOptions = {
  params?: Record<string, string>
  input?: unknown
  signal?: AbortSignal
  timeoutMs?: number
}

function buildUrl(path: string, params: Record<string, string> = {}) {
  const resolved = path.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = params[name]
    if (value === undefined) throw new Error(`Missing path param "${name}" for ${path}`)
    return encodeURIComponent(value)
  })
  return new URL(`${API_BASE_URL}${resolved.startsWith('/') ? '' : '/'}${resolved}`)
}

function toQuery(url: URL, input: unknown) {
  if (!input || typeof input !== 'object') return
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  }
}

async function readDetail(res: Response): Promise<string | null> {
  try {
    const body: unknown = await res.json()
    if (body && typeof body === 'object' && 'detail' in body && typeof body.detail === 'string') return body.detail
  } catch {}
  return null
}

/**
 * Calls a configured backend endpoint and validates the response against a view-model schema.
 * Throws IntegrationPendingError without sending anything when the endpoint is not configured.
 */
export async function apiRequest<S extends z.ZodTypeAny>(
  key: EndpointKey,
  schema: S,
  { params, input, signal, timeoutMs = REQUEST_TIMEOUT_MS }: RequestOptions = {},
): Promise<z.infer<S>> {
  if (!API_BASE_URL) throw new IntegrationPendingError(key, 'base-url')
  const contract = getContract(key)
  if (!contract) throw new IntegrationPendingError(key, 'contract')

  const url = buildUrl(contract.path, params)
  const payload = contract.mapRequest ? contract.mapRequest(input) : input
  const hasBody = contract.method !== 'GET' && contract.method !== 'DELETE' && payload !== undefined
  if (!hasBody) toQuery(url, payload)

  const headers = new Headers({ Accept: 'application/json' })
  if (hasBody) headers.set('Content-Type', 'application/json')
  const token = AUTH_TRANSPORT === 'bearer' ? getAccessToken() : null
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const timeout = AbortSignal.timeout(timeoutMs)
  let res: Response
  try {
    res = await fetch(url, {
      method: contract.method,
      headers,
      body: hasBody ? JSON.stringify(payload) : undefined,
      credentials: AUTH_TRANSPORT === 'cookie' ? 'include' : 'same-origin',
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new NetworkError(key, timeout.aborted)
  }

  if (!res.ok) {
    if (res.status === 401) clearSession()
    throw new ApiError(key, res.status, await readDetail(res))
  }

  let raw: unknown = null
  if (res.status !== 204) {
    try {
      raw = await res.json()
    } catch {
      throw new ResponseValidationError(key, 'response body is not valid JSON')
    }
  }

  const parsed = schema.safeParse(contract.mapResponse ? contract.mapResponse(raw) : raw)
  if (!parsed.success) throw new ResponseValidationError(key, parsed.error.message)
  return parsed.data
}
