/**
 * Single source of truth for every backend call the frontend makes.
 *
 * No FastAPI routes were available when this was written (the frontend contained no API calls
 * and the backend source was not accessible), so every `contract` is `null`. While a contract is
 * null the UI shows an honest "not connected yet" state and never sends a request.
 *
 * To connect an endpoint, replace `contract: null` with the real method and path and, when the
 * backend's JSON differs from the view models in ./schemas.ts, add `mapResponse` / `mapRequest`
 * adapters. Responses are validated against those view models before they reach the UI.
 * See INTEGRATION.md for the full checklist.
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type EndpointContract = {
  method: HttpMethod
  /** Path relative to NEXT_PUBLIC_API_BASE_URL. Use `{name}` for path params, e.g. `/notifications/{id}/read`. */
  path: string
  /** Convert the frontend input into the backend's request body (POST/PUT/PATCH) or query (GET). */
  mapRequest?: (input: unknown) => unknown
  /** Convert the backend's JSON into the frontend view model before validation. */
  mapResponse?: (raw: unknown) => unknown
}

type IntegrationPoint = {
  purpose: string
  needs: string[]
  contract: EndpointContract | null
}

const AUTHORIZED =
  'Must be scoped to the authenticated user on the backend (RBAC), not filtered by the frontend.'

export const INTEGRATION_POINTS = {
  'auth.signIn': {
    purpose: 'Exchange a university email + password for a session (Student or Faculty).',
    needs: [
      'Method and path of the login route',
      'Request body field names (e.g. email/password vs. form-encoded username/password for OAuth2PasswordRequestForm)',
      'Session transport: HttpOnly cookie set by FastAPI, or a bearer token returned in the body (and its field name)',
      'How the role is returned, and the response for admin accounts (the admin UI is separate)',
    ],
    contract: null,
  },
  'auth.signOut': {
    purpose: 'Invalidate the current session.',
    needs: ['Method and path, or confirmation that logout is client-side only (token discard)'],
    contract: null,
  },
  'auth.me': {
    purpose: 'Return the signed-in user: id, full name, university email, role, optional avatar.',
    needs: ['Method and path', 'Response JSON shape and the role values used (e.g. "student" | "faculty")'],
    contract: null,
  },
  'profile.update': {
    purpose: 'Update editable profile fields of the signed-in user.',
    needs: ['Method and path', 'Which fields are editable and their names', 'Response shape (updated user?)'],
    contract: null,
  },
  'bookings.list': {
    purpose: 'Upcoming bookings of the signed-in user (venue, date, time slot, status, details).',
    needs: ['Method and path', 'Response shape and status values (README mentions PENDING_APPROVAL)', 'Date/time format and timezone', AUTHORIZED],
    contract: null,
  },
  'requests.list': {
    purpose: 'Booking requests of the signed-in user with Pending / Approved / Rejected status.',
    needs: ['Method and path (or whether this is the same route as bookings.list)', 'Response shape', AUTHORIZED],
    contract: null,
  },
  'schedule.list': {
    purpose: 'Upcoming approved bookings and other schedule entries for the signed-in user.',
    needs: ['Method and path (or whether bookings.list with a status filter should be used)', 'Response shape', AUTHORIZED],
    contract: null,
  },
  'activity.list': {
    purpose: 'Recent activity of the signed-in user.',
    needs: ['Confirmation that an activity API exists', 'Method, path and response shape', AUTHORIZED],
    contract: null,
  },
  'notifications.list': {
    purpose: 'Notifications for the signed-in user.',
    needs: ['Confirmation that a notifications API exists', 'Method, path and response shape', AUTHORIZED],
    contract: null,
  },
  'notifications.markRead': {
    purpose: 'Mark a notification as read.',
    needs: ['Method and path (with notification id param)'],
    contract: null,
  },
  'venues.searchAvailable': {
    purpose: 'Find clash-free classrooms, labs or amphitheatres for a date and time window.',
    needs: [
      'Method and path (README mentions the check_availability_and_clashes tool — is it exposed over REST?)',
      'Query/body fields: venue type values, date and time formats, capacity',
      'Response shape for each available venue',
    ],
    contract: null,
  },
  'venues.requestBooking': {
    purpose: 'Submit a booking request for a venue (staged for Estate Admin approval).',
    needs: ['Method and path (README mentions create_coordinated_booking_request)', 'Request body fields', 'Response shape including the created request id and status'],
    contract: null,
  },
  'guestHouse.info': {
    purpose: 'MDC Guest House accommodation information.',
    needs: ['Whether this is served by the backend or is static content', 'Method, path and response shape'],
    contract: null,
  },
  'guestHouse.request': {
    purpose: 'Submit an MDC Guest House stay request.',
    needs: ['Method and path', 'Request body fields (guest details, dates, room type?)', 'Response shape', 'Which roles may submit (README: Faculty)'],
    contract: null,
  },
  'parking.info': {
    purpose: 'Parking zones and, if supported, live availability.',
    needs: ['Method and path', 'Response shape; whether availability counts are provided'],
    contract: null,
  },
  'parking.visitorRequest': {
    purpose: 'Submit a visitor parking request.',
    needs: ['Confirmation that visitor parking requests are supported', 'Method, path, request body fields and response shape'],
    contract: null,
  },
  'search.query': {
    purpose: 'Global search across venues and the user’s bookings.',
    needs: ['Confirmation that a search API exists', 'Method, path, query param name and response shape'],
    contract: null,
  },
  'assistant.send': {
    purpose: 'Send a message to the Vasukii AI agent and receive its reply.',
    needs: [
      'Method and path of the FastAPI agent endpoint',
      'Request body: message field name, and whether prior history or a conversation id is sent',
      'Response field holding the final answer text (internal reasoning / failover diagnostics must not be shown)',
      'Whether the response is streamed (SSE) or returned as a single JSON body',
    ],
    contract: null,
  },
} satisfies Record<string, IntegrationPoint>

export type EndpointKey = keyof typeof INTEGRATION_POINTS

export function getContract(key: EndpointKey): EndpointContract | null {
  return (INTEGRATION_POINTS[key] as IntegrationPoint).contract
}
