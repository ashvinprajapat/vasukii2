'use client'

import { useSyncExternalStore } from 'react'
import useSWR, { type SWRConfiguration } from 'swr'
import { hasSession, subscribeSession } from './session'
import { ApiError, isIntegrationPending } from './errors'
import { activityService, authService, bookingService, guestHouseService, parkingService, searchService } from './services'

const config: SWRConfiguration = {
  revalidateOnFocus: false,
  onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
    if (isIntegrationPending(error)) return
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) return
    if (retryCount >= 3) return
    setTimeout(() => revalidate({ retryCount }), 2000 * 2 ** retryCount)
  },
}

export const swrKeys = {
  me: 'auth.me',
  bookings: 'bookings.list',
  requests: 'requests.list',
  schedule: 'schedule.list',
  activity: 'activity.list',
  notifications: 'notifications.list',
  guestHouse: 'guestHouse.info',
  parking: 'parking.info',
} as const

export type SessionStatus = 'unknown' | 'signed-in' | 'signed-out'

/** 'unknown' during server render and hydration, then reflects the stored session. */
export function useSessionStatus(): SessionStatus {
  return useSyncExternalStore<SessionStatus>(
    subscribeSession,
    () => (hasSession() ? 'signed-in' : 'signed-out'),
    () => 'unknown',
  )
}

export function useCurrentUser() {
  const status = useSessionStatus()
  const query = useSWR(status === 'signed-in' ? swrKeys.me : null, authService.me, config)
  return { ...query, isLoading: query.isLoading || status === 'unknown', status }
}
export const useUpcomingBookings = () => useSWR(swrKeys.bookings, bookingService.upcoming, config)
export const useBookingRequests = () => useSWR(swrKeys.requests, bookingService.requests, config)
export const useSchedule = () => useSWR(swrKeys.schedule, bookingService.schedule, config)
export const useRecentActivity = () => useSWR(swrKeys.activity, activityService.recent, config)
export const useNotifications = () => useSWR(swrKeys.notifications, activityService.notifications, config)
export const useGuestHouseInfo = () => useSWR(swrKeys.guestHouse, guestHouseService.info, config)
export const useParkingInfo = () => useSWR(swrKeys.parking, parkingService.info, config)
export const useSearch = (q: string) =>
  useSWR(q ? ['search.query', q] : null, ([, query]: [string, string]) => searchService.query(query), config)
