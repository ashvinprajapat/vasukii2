'use client'

import { CalendarX2, Inbox } from 'lucide-react'
import { useBookingRequests, useSchedule, useUpcomingBookings } from '@/lib/api/hooks'
import { BookingRow, linkAction, RequestRow } from './dashboard-widgets'
import { DataState } from './data-state'
import { Panel } from './panel'

export function BookingsOverview() {
  const bookings = useUpcomingBookings()
  const requests = useBookingRequests()
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Panel className="lg:col-span-2" title="Upcoming bookings" action={linkAction('New booking', '/bookings/new')}>
        <DataState
          query={bookings}
          pending="Your bookings will appear here once Vasukii is connected to the campus backend."
          empty={{ icon: CalendarX2, title: 'No upcoming bookings', action: linkAction('Book a venue', '/bookings/new') }}
        >
          {(items) => (
            <ul className="flex flex-col divide-y divide-border">
              {items.map((b) => (
                <BookingRow key={b.id} booking={b} />
              ))}
            </ul>
          )}
        </DataState>
      </Panel>
      <div id="requests" className="scroll-mt-24">
        <Panel title="Requests" description="Pending, approved and rejected">
          <DataState
            query={requests}
            pending="Request statuses will appear here once Vasukii is connected to the campus backend."
            empty={{ icon: Inbox, title: 'No pending requests' }}
          >
            {(items) => (
              <ul className="flex flex-col gap-1">
                {items.map((r) => (
                  <RequestRow key={r.id} request={r} />
                ))}
              </ul>
            )}
          </DataState>
        </Panel>
      </div>
    </div>
  )
}

export function ScheduleList() {
  const query = useSchedule()
  return (
    <Panel title="Upcoming approved bookings" description="Everything confirmed on your calendar">
      <DataState
        query={query}
        pending="Your schedule will appear here once Vasukii is connected to the campus backend."
        empty={{ icon: CalendarX2, title: 'Nothing scheduled', description: 'Approved bookings will show up here.' }}
      >
        {(items) => (
          <ul className="flex flex-col divide-y divide-border">
            {items.map((b) => (
              <BookingRow key={b.id} booking={b} />
            ))}
          </ul>
        )}
      </DataState>
    </Panel>
  )
}
