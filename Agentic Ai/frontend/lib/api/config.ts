/**
 * Base URL of the Vasukii FastAPI backend, e.g. https://api.vasukii.jklu.edu.in
 *
 * This app runs on Next.js, which only exposes variables prefixed with NEXT_PUBLIC_
 * to the browser, so the Vite-style VITE_API_BASE_URL is read as NEXT_PUBLIC_API_BASE_URL.
 * Never put secrets (Supabase service-role keys, provider API keys) in NEXT_PUBLIC_ variables.
 */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').trim().replace(/\/+$/, '')

export const REQUEST_TIMEOUT_MS = 20_000

/** Assistant responses can involve several tool calls on the backend. */
export const ASSISTANT_TIMEOUT_MS = 90_000
