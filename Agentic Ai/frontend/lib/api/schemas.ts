import { z } from 'zod'

/**
 * Frontend view models: the data each screen needs. These describe UI requirements, not the
 * backend's wire format — map backend JSON into these with `mapResponse` in ./endpoints.ts.
 * Dates are ISO 8601 strings.
 */

export const userRoleSchema = z.enum(['student', 'faculty'])
export type UserRole = z.infer<typeof userRoleSchema>

export const userSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
  role: userRoleSchema,
  avatarUrl: z.string().url().nullish(),
  department: z.string().nullish(),
})
export type User = z.infer<typeof userSchema>

export const signInResultSchema = z.object({
  accessToken: z.string().nullish(),
  refreshToken: z.string().nullish(),
  user: userSchema.nullish(),
  /** True when Supabase requires the email to be confirmed before a session is issued. */
  requiresEmailConfirmation: z.boolean().default(false),
})
export type SignInResult = z.infer<typeof signInResultSchema>

export const bookingStatusSchema = z.enum(['pending', 'approved', 'rejected', 'cancelled'])
export type BookingStatus = z.infer<typeof bookingStatusSchema>

export const serviceKindSchema = z.enum(['classroom', 'lab', 'amphitheatre', 'guest-house', 'parking'])
export type ServiceKind = z.infer<typeof serviceKindSchema>

export const venueKindSchema = z.enum(['classroom', 'lab', 'amphitheatre'])
export type VenueKind = z.infer<typeof venueKindSchema>

export const bookingSchema = z.object({
  id: z.string(),
  title: z.string(),
  venueName: z.string(),
  service: serviceKindSchema,
  start: z.string(),
  end: z.string().nullish(),
  status: bookingStatusSchema,
  details: z.string().nullish(),
})
export type Booking = z.infer<typeof bookingSchema>

export const bookingRequestSchema = z.object({
  id: z.string(),
  label: z.string(),
  service: serviceKindSchema,
  submittedAt: z.string(),
  status: bookingStatusSchema,
})
export type BookingRequest = z.infer<typeof bookingRequestSchema>

export const activitySchema = z.object({
  id: z.string(),
  text: z.string(),
  occurredAt: z.string(),
  kind: z.enum(['booking', 'assistant', 'parking', 'system']),
})
export type Activity = z.infer<typeof activitySchema>

export const notificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  createdAt: z.string(),
  read: z.boolean(),
})
export type Notification = z.infer<typeof notificationSchema>

export const venueSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: venueKindSchema,
  building: z.string().nullish(),
  capacity: z.number().int().nonnegative().nullish(),
})
export type Venue = z.infer<typeof venueSchema>

export const guestHouseInfoSchema = z.object({
  sections: z.array(z.object({ title: z.string(), body: z.string() })),
})
export type GuestHouseInfo = z.infer<typeof guestHouseInfoSchema>

export const parkingZoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  /** null when the backend does not report live availability */
  available: z.number().int().nonnegative().nullish(),
  capacity: z.number().int().nonnegative().nullish(),
})
export const parkingInfoSchema = z.object({ zones: z.array(parkingZoneSchema) })
export type ParkingZone = z.infer<typeof parkingZoneSchema>
export type ParkingInfo = z.infer<typeof parkingInfoSchema>

export const searchResultSchema = z.object({
  id: z.string(),
  type: z.enum(['venue', 'booking']),
  title: z.string(),
  subtitle: z.string().nullish(),
  href: z.string().startsWith('/').nullish(),
})
export type SearchResult = z.infer<typeof searchResultSchema>

export const assistantReplySchema = z.object({ reply: z.string().min(1) })
export type AssistantReply = z.infer<typeof assistantReplySchema>

export const emptyResponseSchema = z.unknown()
