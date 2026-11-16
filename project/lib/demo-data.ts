/**
 * DEMO CONTENT — visual placeholders only.
 * Nothing in this file comes from the Vasukii FastAPI backend or Supabase.
 * Replace each export with real API data when integrating into the production frontend.
 */

export type BookingStatus = 'approved' | 'pending' | 'rejected' | 'cancelled'

export type DemoBooking = {
  id: string
  title: string
  venue: string
  service: 'venue' | 'guest-house' | 'parking'
  date: string
  time: string
  status: BookingStatus
}

export type DemoRequest = {
  id: string
  label: string
  service: string
  submitted: string
  status: BookingStatus
}

export type DemoActivity = {
  id: string
  text: string
  time: string
  kind: 'booking' | 'assistant' | 'parking' | 'system'
}

export type DemoNotification = {
  id: string
  title: string
  body: string
  time: string
  unread: boolean
}

export const DEMO_USER = {
  name: 'Aarav Sharma',
  firstName: 'Aarav',
  email: 'aarav.sharma@jklu.edu.in',
  role: 'Student' as 'Student' | 'Faculty',
  programme: 'B.Tech, Computer Science',
  initials: 'AS',
}

export const DEMO_BOOKINGS: DemoBooking[] = [
  {
    id: 'b1',
    title: 'Coding Club Weekly Meetup',
    venue: 'Seminar Hall 2, Academic Block',
    service: 'venue',
    date: 'Thu, 19 Nov',
    time: '4:00 – 6:00 PM',
    status: 'approved',
  },
  {
    id: 'b2',
    title: 'Parent visit accommodation',
    venue: 'MDC Guest House · Room 104',
    service: 'guest-house',
    date: 'Sat, 21 Nov',
    time: 'Check-in 12:00 PM',
    status: 'pending',
  },
  {
    id: 'b3',
    title: 'Visitor parking pass',
    venue: 'Parking Zone B, Main Gate',
    service: 'parking',
    date: 'Sat, 21 Nov',
    time: '10:00 AM – 6:00 PM',
    status: 'approved',
  },
]

export const DEMO_REQUESTS: DemoRequest[] = [
  { id: 'r1', label: 'Auditorium · Tech Fest rehearsal', service: 'Classroom Booking', submitted: '2h ago', status: 'pending' },
  { id: 'r2', label: 'MDC Room 104 · 2 nights', service: 'Guest House', submitted: 'Yesterday', status: 'pending' },
  { id: 'r3', label: 'Seminar Hall 2 · Club meetup', service: 'Classroom Booking', submitted: '3 days ago', status: 'approved' },
  { id: 'r4', label: 'Lecture Theatre 1 · Workshop', service: 'Classroom Booking', submitted: 'Last week', status: 'rejected' },
]

export const DEMO_ACTIVITY: DemoActivity[] = [
  { id: 'a1', text: 'Seminar Hall 2 booking was approved', time: '12 min ago', kind: 'booking' },
  { id: 'a2', text: 'You asked Vasukii about library timings', time: '1h ago', kind: 'assistant' },
  { id: 'a3', text: 'Visitor parking pass generated for Zone B', time: 'Yesterday', kind: 'parking' },
  { id: 'a4', text: 'Profile details updated', time: '2 days ago', kind: 'system' },
]

export const DEMO_NOTIFICATIONS: DemoNotification[] = [
  { id: 'n1', title: 'Booking approved', body: 'Seminar Hall 2 is confirmed for Thursday, 4:00 PM.', time: '12m', unread: true },
  { id: 'n2', title: 'Guest house request received', body: 'MDC office will review your request within 24 hours.', time: '3h', unread: true },
  { id: 'n3', title: 'Campus notice', body: 'Parking Zone A closed for maintenance this weekend.', time: '1d', unread: false },
]
