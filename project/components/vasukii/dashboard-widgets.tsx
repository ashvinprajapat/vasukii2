import {
  BedDouble,
  Building2,
  CalendarClock,
  CalendarPlus,
  CarFront,
  ChevronRight,
  Clock,
  MessageSquareText,
  ParkingSquare,
  Sparkles,
  UserRoundCog,
  type LucideIcon,
} from 'lucide-react'
import { DEMO_ACTIVITY, DEMO_BOOKINGS, DEMO_REQUESTS, type DemoActivity, type DemoBooking } from '@/lib/demo-data'
import { cn } from '@/lib/utils'
import { Panel } from './panel'
import { DemoTag, StatusBadge } from './status-badge'

const serviceIcon: Record<DemoBooking['service'], LucideIcon> = {
  venue: Building2,
  'guest-house': BedDouble,
  parking: CarFront,
}

const linkAction = (label: string) => (
  <a href="#" className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-primary hover:underline">
    {label}
    <ChevronRight className="size-3.5" />
  </a>
)

export function UpcomingBookings() {
  return (
    <Panel
      title="My upcoming bookings"
      description="Your confirmed and pending reservations"
      action={
        <div className="flex items-center gap-3">
          <DemoTag />
          {linkAction('View all')}
        </div>
      }
    >
      <ul className="flex flex-col divide-y divide-border">
        {DEMO_BOOKINGS.map((b) => {
          const Icon = serviceIcon[b.service]
          const [weekday, day] = b.date.split(', ')
          return (
            <li key={b.id} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
              <div className="flex w-12 shrink-0 flex-col items-center rounded-xl border border-border bg-muted/60 py-1.5">
                <span className="text-[10px] font-medium uppercase text-muted-foreground">{weekday}</span>
                <span className="text-sm font-semibold text-foreground">{day}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium text-foreground">{b.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <Icon className="size-3.5 shrink-0" />
                    <span className="truncate">{b.venue}</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {b.time}
                  </span>
                </div>
              </div>
              <StatusBadge status={b.status} className="hidden sm:inline-flex" />
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

export function RequestStatus() {
  const counts = {
    pending: DEMO_REQUESTS.filter((r) => r.status === 'pending').length,
    approved: DEMO_REQUESTS.filter((r) => r.status === 'approved').length,
    rejected: DEMO_REQUESTS.filter((r) => r.status === 'rejected').length,
  }
  const total = DEMO_REQUESTS.length
  return (
    <Panel title="Booking request status" description="Requests awaiting review" action={<DemoTag />}>
      <div className="flex h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div className="bg-success" style={{ width: `${(counts.approved / total) * 100}%` }} />
        <div className="bg-warning" style={{ width: `${(counts.pending / total) * 100}%` }} />
        <div className="bg-destructive/70" style={{ width: `${(counts.rejected / total) * 100}%` }} />
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
        {DEMO_REQUESTS.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 rounded-lg py-2">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-foreground">{r.label}</p>
              <p className="text-[11px] text-muted-foreground">
                {r.service} · {r.submitted}
              </p>
            </div>
            <StatusBadge status={r.status} />
          </li>
        ))}
      </ul>
    </Panel>
  )
}

const shortcuts: { label: string; icon: LucideIcon }[] = [
  { label: 'New classroom booking', icon: CalendarPlus },
  { label: 'Guest house request', icon: BedDouble },
  { label: 'Visitor parking pass', icon: ParkingSquare },
  { label: 'Ask Vasukii', icon: Sparkles },
  { label: 'My schedule', icon: CalendarClock },
  { label: 'Update profile', icon: UserRoundCog },
]

export function QuickShortcuts() {
  return (
    <Panel title="Quick shortcuts" description="Common tasks, one click away">
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {shortcuts.map((s) => {
          const Icon = s.icon
          return (
            <li key={s.label}>
              <a
                href="#"
                className="group flex h-full flex-col gap-3 rounded-xl border border-border p-3 transition-colors hover:border-primary/25 hover:bg-accent/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-4" />
                </span>
                <span className="text-[12.5px] leading-snug font-medium text-foreground">{s.label}</span>
              </a>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

const activityIcon: Record<DemoActivity['kind'], { icon: LucideIcon; className: string }> = {
  booking: { icon: Building2, className: 'bg-success/10 text-success' },
  assistant: { icon: MessageSquareText, className: 'bg-accent text-primary' },
  parking: { icon: CarFront, className: 'bg-brick/10 text-brick' },
  system: { icon: UserRoundCog, className: 'bg-muted text-muted-foreground' },
}

export function RecentActivity() {
  return (
    <Panel title="Recent activity" action={<DemoTag />}>
      <ol className="relative flex flex-col gap-4">
        <span className="absolute top-2 bottom-2 left-[15px] w-px bg-border" aria-hidden="true" />
        {DEMO_ACTIVITY.map((a) => {
          const { icon: Icon, className } = activityIcon[a.kind]
          return (
            <li key={a.id} className="relative flex items-start gap-3">
              <span className={cn('relative flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-card', className)}>
                <Icon className="size-3.5" />
              </span>
              <div className="min-w-0 pt-1">
                <p className="text-[13px] leading-snug text-foreground">{a.text}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{a.time}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </Panel>
  )
}
