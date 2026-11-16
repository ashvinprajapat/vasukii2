'use client'

import { useSyncExternalStore } from 'react'

let now = Date.now()
const listeners = new Set<() => void>()
let timer: ReturnType<typeof setInterval> | null = null

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (!timer) {
    now = Date.now()
    timer = setInterval(() => {
      now = Date.now()
      listeners.forEach((l) => l())
    }, 60_000)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && timer) {
      clearInterval(timer)
      timer = null
    }
  }
}

/** The user's local time, refreshed every minute. `null` during server render to avoid hydration mismatches. */
export function useNow(): Date | null {
  const value = useSyncExternalStore(
    subscribe,
    () => now,
    () => null,
  )
  return value === null ? null : new Date(value)
}
