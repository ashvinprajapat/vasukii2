'use client'

import useSWR, { type SWRConfiguration } from 'swr'
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

export const useCurrentUser = () => useSWR(swrKeys.me, authService.me, config)
export const useUpcomingBookings = () => useSWR(swrKeys.bookings, bookingService.upcoming, config)
export const useBookingRequests = () => useSWR(swrKeys.requests, bookingService.requests, config)
export const useSchedule = () => useSWR(swrKeys.schedule, bookingService.schedule, config)
export const useRecentActivity = () => useSWR(swrKeys.activity, activityService.recent, config)
export const useNotifications = () => useSWR(swrKeys.notifications, activityService.notifications, config)
export const useGuestHouseInfo = () => useSWR(swrKeys.guestHouse, guestHouseService.info, config)
export const useParkingInfo = () => useSWR(swrKeys.parking, parkingService.info, config)
export const useSearch = (q: string) =>
  useSWR(q ? ['search.query', q] : null, ([, query]: [string, string]) => searchService.query(query), config)
