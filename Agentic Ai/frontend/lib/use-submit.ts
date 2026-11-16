'use client'

import { useState } from 'react'

/** Tracks one async submission. `result` is only set after the backend confirms success. */
export function useSubmit<I, R>(action: (input: I) => Promise<R>) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [result, setResult] = useState<R | null>(null)

  async function submit(input: I) {
    setPending(true)
    setError(null)
    setResult(null)
    try {
      const value = await action(input)
      setResult(value)
      return value
    } catch (e) {
      setError(e)
      return null
    } finally {
      setPending(false)
    }
  }

  return { submit, pending, error, result, reset: () => (setError(null), setResult(null)) }
}
