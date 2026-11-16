'use client'

import {
  BedDouble,
  Building2,
  CalendarClock,
  CalendarPlus,
  CalendarX2,
  CarFront,
  ChevronRight,
  Clock,
  History,
  Inbox,
  MessageSquareText,
  ParkingSquare,
  Sparkles,
  UserRoundCog,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useBookingRequests, useRecentActivity, useUpcomingBookings } from '@/lib/api/hooks'
import type { Activity, Booking, BookingRequest, ServiceKind } from '@/lib/api/schemas'
import { dayParts, relativeTime, serviceLabel, timeRange } from '@/lib/format'
import { cn } from '@/lib/utils'
import { DataState } from './data-state'
import { Panel } from './panel'
import { StatusBadge } from './status-badge'

export const serviceIcon: Record<ServiceKind, LucideIcon> = {
  classroom: Building2,
  lab: Building2,
  amphitheatre: Building2,
  'guest-house': BedDouble,
  parking: CarFront,
}

export const linkAction = (label: string, href: string) => (
  <Link href={href} className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-primary hover:underline">
    {label}
    <ChevronRight className="size-3.5" />
  </Link>
)

export function BookingRow({ booking }: { booking: Booking }) {
  const Icon = serviceIcon[booking.service]
  const { weekday, day } = dayParts(booking.start)
  return (
    <li className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
      <div className="flex w-14 shrink-0 flex-col items-center rounded-xl border border-border bg-muted/60 py-1.5">
        <span className="text-[10px] font-medium uppercase text-muted-foreground">{weekday}</span>
        <span className="text-[13px] font-semibold whitespace-nowrap text-foreground">{day}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-medium text-foreground">{booking.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex min-w-0 items-center gap-1">
            <Icon className="size-3.5 shrink-0" />
            <span className="truncate">{booking.venueName}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {timeRange(booking.start, booking.end)}
          </span>
        </div>
        {booking.details && <p className="mt-1 truncate text-xs text-muted-foreground">{booking.details}</p>}
      </div>
      <StatusBadge status={booking.status} className="hidden sm:inline-flex" />
    </li>
  )
}

export function UpcomingBookings() {
  const query = useUpcomingBookings()
  return (
    <Panel
      title="My upcoming bookings"
      description="Your confirmed and pending reservations"
      action={linkAction('View all', '/bookings')}
    >
      <DataState
        query={query}
        pending="Your bookings will appear here once Vasukii is connected to the campus backend."
        empty={{
          icon: CalendarX2,
          title: 'No upcoming bookings',
          description: 'Reserve a classroom, lab or amphitheatre to see it here.',
          action: linkAction('Book a venue', '/bookings/new'),
        }}
      >
        {(bookings) => (
          <ul className="flex flex-col divide-y divide-border">
            {bookings.slice(0, 4).map((b) => (
              <BookingRow key={b.id} booking={b} />
            ))}
          </ul>
        )}
      </DataState>
    </Panel>
  )
}

export function RequestRow({ request }: { request: BookingRequest }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg py-2">
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-foreground">{request.label}</p>
        <p className="text-[11px] text-muted-foreground">
          {serviceLabel[request.service]} · {relativeTime(request.submittedAt)}
        </p>
      </div>
      <StatusBadge status={request.status} />
    </li>
  )
}

function RequestSummary({ requests }: { requests: BookingRequest[] }) {
  const counts = {
    approved: requests.filter((r) => r.status === 'approved').length,
    pending: requests.filter((r) => r.status === 'pending').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  }
  const total = requests.length
  const pct = (n: number) => `${total ? (n / total) * 100 : 0}%`
  return (
    <>
      <div className="flex h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div className="bg-success" style={{ width: pct(counts.approved) }} />
        <div className="bg-warning" style={{ width: pct(counts.pending) }} />
        <div className="bg-destructive/70" style={{ width: pct(counts.rejected) }} />
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2">
        {[
          { label: 'Approved', value: counts.approved },
          { label: 'Pending', value: counts.pending },
          { label: 'Declined', value: counts.rejected },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-muted/60 px-3 py-2">
            <dt className="text-[11px] text-muted-foreground">{s.label}</dt>
            <dd className="text-lg font-semibold text-foreground">{s.value}</dd>
          </div>
        ))}
      </dl>
      <ul className="mt-4 flex flex-col gap-1">
        {requests.slice(0, 4).map((r) => (
          <RequestRow key={r.id} request={r} />
        ))}
      </ul>
    </>
  )
}

export function RequestStatus() {
  const query = useBookingRequests()
  return (
    <Panel title="Booking request status" description="Your requests and their review status" action={linkAction('All', '/bookings#requests')}>
      <DataState
        query={query}
        pending="Request statuses will appear here once Vasukii is connected to the campus backend."
        empty={{ icon: Inbox, title: 'No requests yet', description: 'Requests you submit will be tracked here.' }}
      >
        {(requests) => <RequestSummary requests={requests} />}
      </DataState>
    </Panel>
  )
}

const shortcuts: { label: string; icon: LucideIcon; href: string }[] = [
  { label: 'New classroom booking', icon: CalendarPlus, href: '/bookings/new?type=classroom' },
  { label: 'Guest house request', icon: BedDouble, href: '/guest-house#request' },
  { label: 'Visitor parking pass', icon: ParkingSquare, href: '/parking#visitor-request' },
  { label: 'Ask Vasukii', icon: Sparkles, href: '/assistant' },
  { label: 'My schedule', icon: CalendarClock, href: '/schedule' },
  { label: 'Update profile', icon: UserRoundCog, href: '/profile#edit' },
]

export function QuickShortcuts() {
  return (
    <Panel title="Quick shortcuts" description="Common tasks, one click away">
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {shortcuts.map((s) => {
          const Icon = s.icon
          return (
            <li key={s.label}>
              <Link
                href={s.href}
                className="group flex h-full flex-col gap-3 rounded-xl border border-border p-3 transition-colors hover:border-primary/25 hover:bg-accent/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-4" />
                </span>
                <span className="text-[12.5px] leading-snug font-medium text-foreground">{s.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

const activityIcon: Record<Activity['kind'], { icon: LucideIcon; className: string }> = {
  booking: { icon: Building2, className: 'bg-success/10 text-success' },
  assistant: { icon: MessageSquareText, className: 'bg-accent text-primary' },
  parking: { icon: CarFront, className: 'bg-brick/10 text-brick' },
  system: { icon: UserRoundCog, className: 'bg-muted text-muted-foreground' },
}

export function RecentActivity() {
  const query = useRecentActivity()
  return (
    <Panel title="Recent activity">
      <DataState
        query={query}
        pending="Your recent activity will appear here once Vasukii is connected to the campus backend."
        empty={{ icon: History, title: 'No recent activity' }}
      >
        {(items) => (
          <ol className="relative flex flex-col gap-4">
            <span className="absolute top-2 bottom-2 left-[15px] w-px bg-border" aria-hidden="true" />
            {items.slice(0, 6).map((a) => {
              const { icon: Icon, className } = activityIcon[a.kind]
              return (
                <li key={a.id} className="relative flex items-start gap-3">
                  <span className={cn('relative flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-card', className)}>
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0 pt-1">
                    <p className="text-[13px] leading-snug text-foreground">{a.text}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{relativeTime(a.occurredAt)}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </DataState>
    </Panel>
  )
}
