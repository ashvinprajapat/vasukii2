import { z } from 'zod'
import { apiRequest } from './client'
import { ASSISTANT_TIMEOUT_MS } from './config'
import {
  activitySchema,
  assistantReplySchema,
  bookingRequestSchema,
  bookingSchema,
  emptyResponseSchema,
  guestHouseInfoSchema,
  notificationSchema,
  parkingInfoSchema,
  searchResultSchema,
  signInResultSchema,
  userSchema,
  venueSchema,
  type VenueKind,
} from './schemas'
import { clearSession, setSession } from './session'

export type SignUpInput = {
  name: string
  email: string
  password: string
  role: 'student' | 'faculty'
  department?: string
  redirect_to?: string
}

function storeSession(result: { accessToken?: string | null; refreshToken?: string | null }) {
  if (result.accessToken) setSession({ accessToken: result.accessToken, refreshToken: result.refreshToken })
}

export const authService = {
  async signIn(input: { email: string; password: string }) {
    const result = await apiRequest('auth.signIn', signInResultSchema, { input })
    storeSession(result)
    return result
  },
  async signUp(input: SignUpInput) {
    const result = await apiRequest('auth.signUp', signInResultSchema, { input })
    storeSession(result)
    return result
  },
  async signOut() {
    try {
      await apiRequest('auth.signOut', emptyResponseSchema)
    } finally {
      clearSession()
    }
  },
  me: () => apiRequest('auth.me', userSchema),
  updateProfile: (input: { name: string; department?: string }) => apiRequest('profile.update', userSchema, { input }),
}

export const bookingService = {
  upcoming: () => apiRequest('bookings.list', z.array(bookingSchema)),
  requests: () => apiRequest('requests.list', z.array(bookingRequestSchema)),
  schedule: () => apiRequest('schedule.list', z.array(bookingSchema)),
}

export const activityService = {
  recent: () => apiRequest('activity.list', z.array(activitySchema)),
  notifications: () => apiRequest('notifications.list', z.array(notificationSchema)),
  markNotificationRead: (id: string) => apiRequest('notifications.markRead', emptyResponseSchema, { params: { id } }),
}

export type VenueSearchInput = {
  kind: VenueKind
  date: string
  startTime: string
  endTime: string
  attendees?: number
}

export type VenueBookingInput = VenueSearchInput & { venueId: string; purpose: string }

export const venueService = {
  searchAvailable: (input: VenueSearchInput) => apiRequest('venues.searchAvailable', z.array(venueSchema), { input }),
  requestBooking: (input: VenueBookingInput) => apiRequest('venues.requestBooking', bookingRequestSchema, { input }),
}

export type GuestHouseRequestInput = {
  guestName: string
  guestPhone: string
  checkIn: string
  checkOut: string
  guests: number
  purpose: string
}

export const guestHouseService = {
  info: () => apiRequest('guestHouse.info', guestHouseInfoSchema),
  request: (input: GuestHouseRequestInput) => apiRequest('guestHouse.request', bookingRequestSchema, { input }),
}

export type VisitorParkingInput = {
  visitorName: string
  vehicleNumber: string
  date: string
  startTime: string
  endTime: string
  purpose: string
}

export const parkingService = {
  info: () => apiRequest('parking.info', parkingInfoSchema),
  visitorRequest: (input: VisitorParkingInput) => apiRequest('parking.visitorRequest', bookingRequestSchema, { input }),
}

export const searchService = {
  query: (q: string) => apiRequest('search.query', z.array(searchResultSchema), { input: { q } }),
}

export type ChatTurn = { role: 'user' | 'assistant'; content: string }

/** Removes any reasoning traces a model may leak into its final text. */
function sanitizeReply(text: string) {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
}

export const assistantService = {
  async send(input: { message: string; history: ChatTurn[] }, signal?: AbortSignal) {
    const { reply } = await apiRequest('assistant.send', assistantReplySchema, {
      input,
      signal,
      timeoutMs: ASSISTANT_TIMEOUT_MS,
    })
    return sanitizeReply(reply)
  },
}
