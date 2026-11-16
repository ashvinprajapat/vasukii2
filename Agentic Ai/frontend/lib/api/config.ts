const DEPLOYED_BACKEND_URL = 'https://vasukii-backend.onrender.com'

/**
 * Base URL of the Vasukii FastAPI backend. NEXT_PUBLIC_API_BASE_URL overrides the deployed default
 * (e.g. a local backend); Next.js inlines it at dev-server start / build time.
 * Never put secrets (Supabase service-role keys, provider API keys) in NEXT_PUBLIC_ variables.
 */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || DEPLOYED_BACKEND_URL).replace(/\/+$/, '')

export const REQUEST_TIMEOUT_MS = 20_000

/** Assistant responses can involve several tool calls on the backend. */
export const ASSISTANT_TIMEOUT_MS = 90_000
